import { AIService } from '../ai-service';
import { FunctionInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('openai');

describe('AIService', () => {
  let aiService: AIService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    process.env.OPENAI_API_KEY = mockApiKey;
    if (fs.existsSync('.function-indexer/ai-cache')) {
      fs.rmSync('.function-indexer/ai-cache', { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync('.function-indexer')) {
      fs.rmSync('.function-indexer', { recursive: true });
    }
  });

  describe('constructor', () => {
    test('should throw error if no API key provided', () => {
      process.env.OPENAI_API_KEY = undefined;
      expect(() => new AIService()).toThrow('OpenAI API key is required');
    });

    test('should create instance with API key', () => {
      expect(() => new AIService(mockApiKey)).not.toThrow();
    });
  });

  describe('caching', () => {
    test('should create cache directory', () => {
      aiService = new AIService(mockApiKey);
      expect(fs.existsSync('.function-indexer/ai-cache')).toBe(true);
    });
  });

  describe('generateDescriptions', () => {
    test('should handle empty function list', async () => {
      aiService = new AIService(mockApiKey);
      const result = await aiService.generateDescriptions([]);
      expect(result).toEqual([]);
    });
  });
});