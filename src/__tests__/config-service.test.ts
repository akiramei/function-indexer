import { ConfigService, FunctionIndexerConfig } from '../services/config-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock ProjectDetector
jest.mock('../utils/project-detector', () => ({
  detectProject: jest.fn(),
  loadGitignorePatterns: jest.fn().mockReturnValue([
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**'
  ]),
  ProjectDetector: {
    detectProject: jest.fn(),
    loadGitignorePatterns: jest.fn().mockReturnValue([
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**'
    ])
  }
}));

import { ProjectDetector, detectProject, loadGitignorePatterns } from '../utils/project-detector';

describe('ConfigService', () => {
  let tempDir: string;
  let projectDir: string;

  beforeEach(() => {
    // Create temporary directory for test projects
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-service-test-'));
    projectDir = path.join(tempDir, 'test-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Setup ProjectDetector mock
    (detectProject as jest.Mock).mockReturnValue({
      root: projectDir,
      type: 'typescript',
      hasPackageJson: true,
      hasTsConfig: true,
      srcDirs: ['src'],
      suggestedRoot: path.join(projectDir, 'src')
    });
    (ProjectDetector.detectProject as jest.Mock).mockReturnValue({
      root: projectDir,
      type: 'typescript',
      hasPackageJson: true,
      hasTsConfig: true,
      srcDirs: ['src'],
      suggestedRoot: path.join(projectDir, 'src')
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getConfigDir', () => {
    it('should return correct config directory path', () => {
      const configDir = ConfigService.getConfigDir(projectDir);
      expect(configDir).toBe(path.join(projectDir, '.function-indexer'));
    });

    it('should use current directory when no path provided', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(projectDir);
        const configDir = ConfigService.getConfigDir();
        expect(configDir).toBe(path.join(projectDir, '.function-indexer'));
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('getDefaultIndexPath', () => {
    it('should return correct default index path', () => {
      const indexPath = ConfigService.getDefaultIndexPath(projectDir);
      expect(indexPath).toBe(path.join(projectDir, '.function-indexer', 'index.jsonl'));
    });
  });

  describe('isInitialized', () => {
    it('should return false when config does not exist', () => {
      expect(ConfigService.isInitialized(projectDir)).toBe(false);
    });

    it('should return true when config exists', () => {
      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(ConfigService.isInitialized(projectDir)).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should create config directory and default config', () => {
      const config = ConfigService.initialize(projectDir);

      const configDir = ConfigService.getConfigDir(projectDir);
      expect(fs.existsSync(configDir)).toBe(true);
      expect(fs.existsSync(path.join(configDir, 'config.json'))).toBe(true);

      expect(config).toMatchObject({
        version: '1.0.0',
        root: 'src', // Relative path when newly created
        domain: 'main',
        include: ['**/*.ts', '**/*.tsx']
      });
    });

    it('should load existing config if already exists', () => {
      const existingConfig: FunctionIndexerConfig = {
        version: '1.0.0',
        root: './custom',
        output: 'custom.jsonl',
        domain: 'custom',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(existingConfig)
      );

      const config = ConfigService.initialize(projectDir);

      expect(config.domain).toBe('custom');
      expect(config.root).toBe(path.join(projectDir, 'custom'));
    });
  });

  describe('createDefaultConfig', () => {
    it('should create config with default values', () => {
      const config = ConfigService.createDefaultConfig(projectDir);

      expect(config).toMatchObject({
        version: '1.0.0',
        root: 'src', // Relative path in stored config
        domain: 'main',
        include: ['**/*.ts', '**/*.tsx'],
        metrics: {
          thresholds: {
            cyclomaticComplexity: 10,
            cognitiveComplexity: 15,
            linesOfCode: 50,
            nestingDepth: 4,
            parameterCount: 4
          }
        }
      });

      expect(config.exclude).toEqual(expect.arrayContaining([
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**'
      ]));
    });
  });

  describe('loadConfig', () => {
    it('should load config from file', () => {
      const testConfig: FunctionIndexerConfig = {
        version: '1.0.0',
        root: './src',
        output: '.function-indexer/index.jsonl',
        domain: 'test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(testConfig)
      );

      const config = ConfigService.loadConfig(projectDir);

      expect(config.domain).toBe('test');
      expect(config.root).toBe(path.join(projectDir, 'src'));
      expect(config.output).toBe(path.join(projectDir, '.function-indexer', 'index.jsonl'));
    });

    it('should throw error when config file does not exist', () => {
      expect(() => {
        ConfigService.loadConfig(projectDir);
      }).toThrow('Configuration file not found');
    });

    it('should throw error when config file is invalid JSON', () => {
      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        'invalid json content'
      );

      expect(() => {
        ConfigService.loadConfig(projectDir);
      }).toThrow('Failed to load configuration');
    });
  });

  describe('saveConfig', () => {
    it('should save config with relative paths', () => {
      const config: FunctionIndexerConfig = {
        version: '1.0.0',
        root: path.join(projectDir, 'src'),
        output: path.join(projectDir, '.function-indexer', 'index.jsonl'),
        domain: 'test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      // Create config directory first
      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });

      ConfigService.saveConfig(config, projectDir);

      const savedContent = fs.readFileSync(path.join(configDir, 'config.json'), 'utf-8');
      const savedConfig = JSON.parse(savedContent);

      expect(savedConfig.root).toBe('src');
      expect(savedConfig.output).toBe('.function-indexer/index.jsonl');
    });

    it('should handle root directory as current directory', () => {
      const config: FunctionIndexerConfig = {
        version: '1.0.0',
        root: projectDir,
        output: path.join(projectDir, '.function-indexer', 'index.jsonl'),
        domain: 'test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      // Create config directory first
      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });

      ConfigService.saveConfig(config, projectDir);

      const savedContent = fs.readFileSync(path.join(configDir, 'config.json'), 'utf-8');
      const savedConfig = JSON.parse(savedContent);

      expect(savedConfig.root).toBe('.');
    });

    it('should throw error when save fails', () => {
      const config: FunctionIndexerConfig = {
        version: '1.0.0',
        root: projectDir,
        output: path.join(projectDir, '.function-indexer', 'index.jsonl'),
        domain: 'test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      // Create config directory as a file instead of directory to cause error
      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(path.dirname(configDir), { recursive: true });
      fs.writeFileSync(configDir, 'file');

      expect(() => {
        ConfigService.saveConfig(config, projectDir);
      }).toThrow('Failed to save configuration');
    });
  });

  describe('updateConfig', () => {
    it('should update existing config with new values', () => {
      // Create initial config
      const initialConfig: FunctionIndexerConfig = {
        version: '1.0.0',
        root: './src',
        output: '.function-indexer/index.jsonl',
        domain: 'initial',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(initialConfig)
      );

      // Update config
      const updates = {
        domain: 'updated',
        include: ['**/*.ts', '**/*.tsx']
      };

      const updatedConfig = ConfigService.updateConfig(updates, projectDir);

      expect(updatedConfig.domain).toBe('updated');
      expect(updatedConfig.include).toEqual(['**/*.ts', '**/*.tsx']);
      expect(updatedConfig.root).toBe(path.join(projectDir, 'src')); // Should preserve existing values
    });
  });

  describe('indexExists', () => {
    it('should return false when index file does not exist', () => {
      // Create config but no index file
      const config: FunctionIndexerConfig = {
        version: '1.0.0',
        root: './src',
        output: '.function-indexer/index.jsonl',
        domain: 'test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(config)
      );

      expect(ConfigService.indexExists(projectDir)).toBe(false);
    });

    it('should return true when index file exists', () => {
      // Create config and index file
      const config: FunctionIndexerConfig = {
        version: '1.0.0',
        root: './src',
        output: '.function-indexer/index.jsonl',
        domain: 'test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts']
      };

      const configDir = ConfigService.getConfigDir(projectDir);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(config)
      );
      fs.writeFileSync(
        path.join(configDir, 'index.jsonl'),
        '{"test": "data"}'
      );

      expect(ConfigService.indexExists(projectDir)).toBe(true);
    });
  });
});