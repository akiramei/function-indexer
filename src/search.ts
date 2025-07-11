import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FunctionInfo, SearchHistory, SearchOptions } from './types';

interface SearchCriteria {
  keywords: string[];
  async?: boolean;
  returnType?: string;
  domain?: string;
}

export class SearchService {
  private db: Database.Database;
  private functionsIndex: FunctionInfo[] = [];
  private lastSearchTotalCount: number = 0;

  constructor(private dbPath: string = '.function-indexer/search-history.db') {
    this.ensureDbDirectory();
    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  private ensureDbDirectory(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        query TEXT NOT NULL,
        context TEXT,
        resolved_functions TEXT NOT NULL,
        keywords TEXT NOT NULL,
        return_type TEXT,
        is_async INTEGER,
        domain TEXT,
        confidence REAL NOT NULL,
        usage TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp);
      CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
    `);
  }

  loadFunctionIndex(indexPath: string): void {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      this.functionsIndex = content
        .trim()
        .split('\n')
        .filter(line => line)
        .map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (error) {
            console.error(`Warning: Invalid JSON at line ${index + 1} in ${indexPath}, skipping...`);
            return null;
          }
        })
        .filter(func => func !== null) as FunctionInfo[];
    }
  }

  search(options: SearchOptions): FunctionInfo[] {
    const { query, context, saveHistory = true, limit } = options;
    
    if (this.isGlobalQuery(query)) {
      return this.performGlobalSearch(query, context, saveHistory, limit);
    }
    
    return this.performKeywordSearch(query, context, saveHistory, limit);
  }

  private performGlobalSearch(
    query: string, 
    context: string | undefined, 
    saveHistory: boolean, 
    limit: number | undefined
  ): FunctionInfo[] {
    const allResults = this.functionsIndex.slice(); // shallow copy
    this.lastSearchTotalCount = allResults.length;
    
    // Apply sorting by file and line for consistent ordering
    allResults.sort((a, b) => {
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      return a.startLine - b.startLine;
    });
    
    const results = limit ? allResults.slice(0, limit) : allResults;
    
    if (saveHistory && results.length > 0) {
      this.saveSearchEntry(query, context, results, [], {
        keywords: [],
        returnType: undefined,
        async: undefined,
        domain: undefined
      }, 1.0);
    }
    
    return results;
  }

  private performKeywordSearch(
    query: string, 
    context: string | undefined, 
    saveHistory: boolean, 
    limit: number | undefined
  ): FunctionInfo[] {
    const keywords = this.extractKeywords(query);
    const searchCriteria = this.parseSearchCriteria(query);
    
    // Calculate scores once and store them
    const scoredResults = this.functionsIndex
      .map(func => ({
        func,
        score: this.calculateRelevance(func, keywords, searchCriteria)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Store total count before applying limit
    this.lastSearchTotalCount = scoredResults.length;
    
    // Apply limit if specified
    const limitedResults = limit ? scoredResults.slice(0, limit) : scoredResults;
    const results = limitedResults.map(item => item.func);

    if (saveHistory && results.length > 0) {
      this.saveSearchEntry(query, context, results, keywords, {
        keywords,
        returnType: searchCriteria.returnType,
        async: searchCriteria.async,
        domain: searchCriteria.domain
      }, this.calculateConfidence(results, keywords));
    }

    return results;
  }

  private saveSearchEntry(
    query: string,
    context: string | undefined,
    results: FunctionInfo[],
    keywords: string[],
    searchCriteria: SearchCriteria,
    confidence: number
  ): void {
    this.saveSearchHistory({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      query,
      context: context || '',
      resolvedFunctions: results.map(f => `${f.file}:${f.identifier}`),
      searchCriteria,
      confidence,
      usage: 'successful'
    });
  }

  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const stopWords = new Set(['the', 'and', 'for', 'that', 'with', 'from', 'this']);
    return words.filter(word => !stopWords.has(word));
  }

  private parseSearchCriteria(query: string): SearchCriteria {
    const criteria: SearchCriteria = {
      keywords: []
    };
    
    if (query.includes('async') || query.includes('asynchronous')) {
      criteria.async = true;
    }
    
    const returnTypeMatch = query.match(/returns?\s+(\w+)/i);
    if (returnTypeMatch) {
      criteria.returnType = returnTypeMatch[1];
    }
    
    return criteria;
  }

  private calculateRelevance(func: FunctionInfo, keywords: string[], criteria: SearchCriteria): number {
    let score = 0;
    
    const searchableText = `${func.identifier} ${func.signature} ${func.file}`.toLowerCase();
    
    for (const keyword of keywords) {
      if (searchableText.includes(keyword)) {
        score += 10;
        if (func.identifier.toLowerCase().includes(keyword)) {
          score += 20;
        }
      }
    }
    
    if (criteria.async !== undefined && func.async === criteria.async) {
      score += 15;
    }
    
    if (criteria.returnType && func.signature.toLowerCase().includes(criteria.returnType.toLowerCase())) {
      score += 15;
    }
    
    if (func.exported) {
      score += 5;
    }
    
    return score;
  }

  private calculateConfidence(results: FunctionInfo[], keywords: string[]): number {
    if (results.length === 0) return 0;
    
    const topResult = results[0];
    const relevance = this.calculateRelevance(topResult, keywords, { keywords });
    const maxPossibleScore = keywords.length * 30 + 20;
    
    return Math.min(relevance / maxPossibleScore, 1.0);
  }

  private saveSearchHistory(history: SearchHistory): void {
    const stmt = this.db.prepare(`
      INSERT INTO search_history (
        id, timestamp, query, context, resolved_functions,
        keywords, return_type, is_async, domain, confidence, usage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      history.id,
      history.timestamp,
      history.query,
      history.context,
      JSON.stringify(history.resolvedFunctions),
      JSON.stringify(history.searchCriteria.keywords),
      history.searchCriteria.returnType || null,
      history.searchCriteria.async ? 1 : 0,
      history.searchCriteria.domain || null,
      history.confidence,
      history.usage
    );
  }

  getSearchHistory(query?: string): SearchHistory[] {
    let stmt;
    if (query) {
      stmt = this.db.prepare(`
        SELECT * FROM search_history 
        WHERE query LIKE ? 
        ORDER BY timestamp DESC 
        LIMIT 100
      `);
      return stmt.all(`%${query}%`).map(row => this.mapRowToHistory(row as Record<string, unknown>));
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM search_history 
        ORDER BY timestamp DESC 
        LIMIT 100
      `);
      return stmt.all().map(row => this.mapRowToHistory(row as Record<string, unknown>));
    }
  }

  private mapRowToHistory = (row: Record<string, unknown>): SearchHistory => {
    try {
      return {
        id: String(row.id),
        timestamp: String(row.timestamp),
        query: String(row.query),
        context: String(row.context),
        resolvedFunctions: JSON.parse(String(row.resolved_functions)),
        searchCriteria: {
          keywords: JSON.parse(String(row.keywords)),
          returnType: row.return_type ? String(row.return_type) : undefined,
          async: row.is_async === 1,
          domain: row.domain ? String(row.domain) : undefined
        },
        confidence: Number(row.confidence),
        usage: String(row.usage) as 'successful' | 'rejected' | 'modified'
      };
    } catch (error) {
      console.error(`Warning: Failed to parse search history entry ${row.id}:`, error);
      // Return a minimal valid object to prevent crashes
      return {
        id: String(row.id),
        timestamp: String(row.timestamp),
        query: String(row.query),
        context: String(row.context || ''),
        resolvedFunctions: [],
        searchCriteria: {
          keywords: [],
          returnType: row.return_type ? String(row.return_type) : undefined,
          async: row.is_async === 1,
          domain: row.domain ? String(row.domain) : undefined
        },
        confidence: Number(row.confidence) || 0,
        usage: 'successful' as const
      };
    }
  }

  private isGlobalQuery(query: string): boolean {
    // Handle empty queries, wildcards, and common "show all" patterns
    return query === '' || query === '*' || query === '**' || query.trim() === '';
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  getLastSearchTotalCount(): number {
    return this.lastSearchTotalCount;
  }

  close(): void {
    this.db.close();
  }
}