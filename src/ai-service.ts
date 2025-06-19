import OpenAI from 'openai';
import { FunctionInfo, EnhancedFunctionInfo } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class AIService {
  private openai: OpenAI;
  private cacheDir: string = '.function-indexer/ai-cache';

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.ensureCacheDirectory();
  }

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async generateDescriptions(functions: FunctionInfo[], batchSize: number = 10): Promise<EnhancedFunctionInfo[]> {
    const enhanced: EnhancedFunctionInfo[] = [];
    
    for (let i = 0; i < functions.length; i += batchSize) {
      const batch = functions.slice(i, i + batchSize);
      const batchEnhanced = await Promise.all(
        batch.map(func => this.enhanceFunction(func))
      );
      enhanced.push(...batchEnhanced);
      
      if (i + batchSize < functions.length) {
        await this.delay(1000);
      }
    }
    
    return enhanced;
  }

  private async enhanceFunction(func: FunctionInfo): Promise<EnhancedFunctionInfo> {
    const cacheKey = `${func.hash_function}.json`;
    const cachePath = path.join(this.cacheDir, cacheKey);
    
    if (fs.existsSync(cachePath)) {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      return { ...func, ...cached };
    }
    
    try {
      const sourceCode = await this.getSourceCode(func);
      const prompt = this.buildPrompt(func, sourceCode);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a code documentation expert. Generate concise descriptions, relevant tags, and identify the purpose of TypeScript functions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });
      
      const result = this.parseAIResponse(response.choices[0].message.content || '{}');
      
      fs.writeFileSync(cachePath, JSON.stringify(result));
      
      return {
        ...func,
        description: result.description || '',
        tags: result.tags || [],
        purpose: result.purpose || 'unknown',
        dependencies: result.dependencies || []
      };
    } catch (error) {
      console.error(`Error enhancing function ${func.identifier}:`, error);
      return {
        ...func,
        description: '',
        tags: [],
        purpose: 'unknown',
        dependencies: []
      };
    }
  }

  private async getSourceCode(func: FunctionInfo): Promise<string> {
    try {
      const content = fs.readFileSync(func.file, 'utf-8');
      const lines = content.split('\n');
      return lines.slice(func.startLine - 1, func.endLine).join('\n');
    } catch {
      return func.signature;
    }
  }

  private buildPrompt(func: FunctionInfo, sourceCode: string): string {
    return `Analyze this TypeScript function and provide:
1. A concise description (max 100 chars)
2. Relevant tags (3-5 tags)
3. The main purpose/category
4. Key dependencies (imported modules/functions it uses)

Function: ${func.identifier}
File: ${func.file}
Signature: ${func.signature}

Source:
${sourceCode}

Respond in JSON format:
{
  "description": "...",
  "tags": ["tag1", "tag2"],
  "purpose": "category",
  "dependencies": ["dep1", "dep2"]
}`;
  }

  private parseAIResponse(response: string): Partial<EnhancedFunctionInfo> {
    try {
      const parsed = JSON.parse(response);
      return {
        description: parsed.description || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        purpose: parsed.purpose || 'unknown',
        dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : []
      };
    } catch {
      return {
        description: '',
        tags: [],
        purpose: 'unknown',
        dependencies: []
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}