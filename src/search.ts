import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FunctionInfo, SearchHistory, SearchOptions } from './types';

export class SearchService {
  private db: Database.Database;
  private functionsIndex: FunctionInfo[] = [];

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
        .map(line => JSON.parse(line));
    }
  }

  search(options: SearchOptions): FunctionInfo[] {
    const { query, context, saveHistory = true, limit = 20 } = options;
    
    const keywords = this.extractKeywords(query);
    const searchCriteria = this.parseSearchCriteria(query);
    
    let results = this.functionsIndex.filter(func => {
      const score = this.calculateRelevance(func, keywords, searchCriteria);
      return score > 0;
    });

    results.sort((a, b) => {
      const scoreA = this.calculateRelevance(a, keywords, searchCriteria);
      const scoreB = this.calculateRelevance(b, keywords, searchCriteria);
      return scoreB - scoreA;
    });

    results = results.slice(0, limit);

    if (saveHistory && results.length > 0) {
      this.saveSearchHistory({
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        query,
        context: context || '',
        resolvedFunctions: results.map(f => `${f.file}:${f.identifier}`),
        searchCriteria: {
          keywords,
          returnType: searchCriteria.returnType,
          async: searchCriteria.async,
          domain: searchCriteria.domain
        },
        confidence: this.calculateConfidence(results, keywords),
        usage: 'successful'
      });
    }

    return results;
  }

  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const stopWords = new Set(['the', 'and', 'for', 'that', 'with', 'from', 'this']);
    return words.filter(word => !stopWords.has(word));
  }

  private parseSearchCriteria(query: string): any {
    const criteria: any = {};
    
    if (query.includes('async') || query.includes('asynchronous')) {
      criteria.async = true;
    }
    
    const returnTypeMatch = query.match(/returns?\s+(\w+)/i);
    if (returnTypeMatch) {
      criteria.returnType = returnTypeMatch[1];
    }
    
    return criteria;
  }

  private calculateRelevance(func: FunctionInfo, keywords: string[], criteria: any): number {
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
    const relevance = this.calculateRelevance(topResult, keywords, {});
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
      return stmt.all(`%${query}%`).map(this.mapRowToHistory);
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM search_history 
        ORDER BY timestamp DESC 
        LIMIT 100
      `);
      return stmt.all().map(this.mapRowToHistory);
    }
  }

  private mapRowToHistory(row: any): SearchHistory {
    return {
      id: row.id,
      timestamp: row.timestamp,
      query: row.query,
      context: row.context,
      resolvedFunctions: JSON.parse(row.resolved_functions),
      searchCriteria: {
        keywords: JSON.parse(row.keywords),
        returnType: row.return_type,
        async: row.is_async === 1,
        domain: row.domain
      },
      confidence: row.confidence,
      usage: row.usage
    };
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  close(): void {
    this.db.close();
  }
}