import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetector } from '../utils/project-detector';

export interface FunctionIndexerConfig {
  version: string;
  root: string;
  output: string;
  domain: string;
  include: string[];
  exclude: string[];
  metrics?: {
    thresholds?: {
      cyclomaticComplexity?: number;
      cognitiveComplexity?: number;
      linesOfCode?: number;
      nestingDepth?: number;
      parameterCount?: number;
    };
  };
}

export class ConfigService {
  private static readonly CONFIG_DIR = '.function-indexer';
  private static readonly CONFIG_FILE = 'config.json';
  private static readonly INDEX_FILE = 'index.jsonl';
  private static readonly DEFAULT_VERSION = '1.0.0';
  
  /**
   * Get the configuration directory path
   */
  static getConfigDir(projectRoot?: string): string {
    const root = projectRoot || process.cwd();
    return path.join(root, this.CONFIG_DIR);
  }
  
  /**
   * Get the default index file path
   */
  static getDefaultIndexPath(projectRoot?: string): string {
    return path.join(this.getConfigDir(projectRoot), this.INDEX_FILE);
  }
  
  /**
   * Check if the project is initialized
   */
  static isInitialized(projectRoot?: string): boolean {
    const configDir = this.getConfigDir(projectRoot);
    const configPath = path.join(configDir, this.CONFIG_FILE);
    return fs.existsSync(configPath);
  }
  
  /**
   * Initialize the configuration directory and files
   */
  static initialize(projectRoot?: string): FunctionIndexerConfig {
    const configDir = this.getConfigDir(projectRoot);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Create or load configuration
    const configPath = path.join(configDir, this.CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
      const config = this.createDefaultConfig(projectRoot);
      this.saveConfig(config, projectRoot);
      return config;
    }
    
    return this.loadConfig(projectRoot);
  }
  
  /**
   * Create default configuration based on project detection
   */
  static createDefaultConfig(projectRoot?: string): FunctionIndexerConfig {
    const projectInfo = ProjectDetector.detectProject(projectRoot);
    const gitignorePatterns = ProjectDetector.loadGitignorePatterns(projectInfo.root);
    
    // Build exclude patterns
    const excludePatterns = [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.test.tsx',
      '**/*.spec.tsx',
      ...gitignorePatterns
    ];
    
    return {
      version: this.DEFAULT_VERSION,
      root: path.relative(projectInfo.root, projectInfo.suggestedRoot) || '.',
      output: path.relative(projectInfo.root, this.getDefaultIndexPath(projectInfo.root)),
      domain: 'main',
      include: ['**/*.ts', '**/*.tsx'],
      exclude: excludePatterns,
      metrics: {
        thresholds: {
          cyclomaticComplexity: 10,
          cognitiveComplexity: 15,
          linesOfCode: 50,
          nestingDepth: 4,
          parameterCount: 4
        }
      }
    };
  }
  
  /**
   * Load configuration from file
   */
  static loadConfig(projectRoot?: string): FunctionIndexerConfig {
    const configPath = path.join(this.getConfigDir(projectRoot), this.CONFIG_FILE);
    
    if (!fs.existsSync(configPath)) {
      throw new Error('Configuration file not found. Run function-indexer to initialize.');
    }
    
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as FunctionIndexerConfig;
      
      // Ensure absolute paths
      const root = projectRoot || process.cwd();
      config.root = path.resolve(root, config.root);
      config.output = path.resolve(root, config.output);
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
  
  /**
   * Save configuration to file
   */
  static saveConfig(config: FunctionIndexerConfig, projectRoot?: string): void {
    const configPath = path.join(this.getConfigDir(projectRoot), this.CONFIG_FILE);
    
    // Convert to relative paths for storage
    const root = projectRoot || process.cwd();
    const configToSave = {
      ...config,
      root: path.relative(root, config.root) || '.',
      output: path.relative(root, config.output)
    };
    
    try {
      fs.writeFileSync(
        configPath,
        JSON.stringify(configToSave, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }
  
  /**
   * Update configuration
   */
  static updateConfig(
    updates: Partial<FunctionIndexerConfig>,
    projectRoot?: string
  ): FunctionIndexerConfig {
    const currentConfig = this.loadConfig(projectRoot);
    const updatedConfig = { ...currentConfig, ...updates };
    this.saveConfig(updatedConfig, projectRoot);
    return updatedConfig;
  }
  
  /**
   * Check if index exists
   */
  static indexExists(projectRoot?: string): boolean {
    const config = this.loadConfig(projectRoot);
    return fs.existsSync(config.output);
  }
}