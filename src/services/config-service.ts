import * as fs from 'fs';
import * as path from 'path';
import { detectProject, loadGitignorePatterns } from '../utils/project-detector';

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

const CONFIG_DIR = '.function-indexer';
const CONFIG_FILE = 'config.json';
const INDEX_FILE = 'index.jsonl';
const NEW_INDEX_FILE = 'function-index.jsonl'; // New: index file in project root
const DEFAULT_VERSION = '1.0.0';

/**
 * Get the configuration directory path
 */
export function getConfigDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  return path.join(root, CONFIG_DIR);
}

/**
 * Get the default index file path (new location in project root)
 */
export function getDefaultIndexPath(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  return path.join(root, NEW_INDEX_FILE);
}

/**
 * Get the old index file path (legacy location)
 */
export function getLegacyIndexPath(projectRoot?: string): string {
  return path.join(getConfigDir(projectRoot), INDEX_FILE);
}

/**
 * Check if migration from legacy index location is needed
 */
export function needsMigration(projectRoot?: string): boolean {
  const legacyPath = getLegacyIndexPath(projectRoot);
  const newPath = getDefaultIndexPath(projectRoot);
  
  return fs.existsSync(legacyPath) && !fs.existsSync(newPath);
}

/**
 * Migrate index file from legacy location to new project root location
 */
export function migrateIndexFile(projectRoot?: string): boolean {
  const legacyPath = getLegacyIndexPath(projectRoot);
  const newPath = getDefaultIndexPath(projectRoot);
  
  try {
    if (fs.existsSync(legacyPath) && !fs.existsSync(newPath)) {
      console.log('📦 Migrating index file to project root...');
      fs.copyFileSync(legacyPath, newPath);
      
      // Remove the legacy file
      fs.unlinkSync(legacyPath);
      
      // For legacy indexes that might not have proper metadata,
      // we'll let the normal update process recreate the metadata
      console.log('✅ Index file migrated to', path.basename(newPath));
      console.log('📝 Index metadata will be regenerated automatically');
      return true;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    return false;
  }
  
  return false;
}

/**
 * Check if the project is initialized
 */
export function isInitialized(projectRoot?: string): boolean {
  const configDir = getConfigDir(projectRoot);
  const configPath = path.join(configDir, CONFIG_FILE);
  return fs.existsSync(configPath);
}

/**
 * Initialize the configuration directory and files
 */
export function initialize(projectRoot?: string): FunctionIndexerConfig {
  const configDir = getConfigDir(projectRoot);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Create or load configuration
  const configPath = path.join(configDir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    const config = createDefaultConfig(projectRoot);
    saveConfig(config, projectRoot);
    return config;
  }
  
  return loadConfig(projectRoot);
}

/**
 * Create default configuration based on project detection
 */
export function createDefaultConfig(projectRoot?: string): FunctionIndexerConfig {
  const projectInfo = detectProject(projectRoot);
  const gitignorePatterns = loadGitignorePatterns(projectInfo.root);
  
  // Build exclude patterns
  const excludePatterns = [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.test.tsx',
    '**/*.spec.tsx',
    ...gitignorePatterns
  ];
  
  return {
    version: DEFAULT_VERSION,
    root: projectInfo.suggestedRoot,
    output: getDefaultIndexPath(projectInfo.root),
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
export function loadConfig(projectRoot?: string): FunctionIndexerConfig {
  const configPath = path.join(getConfigDir(projectRoot), CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    throw new Error('Configuration file not found. Run `function-indexer` in your project root to initialize.');
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load configuration: ${errorMessage}`);
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: FunctionIndexerConfig, projectRoot?: string): void {
  const configPath = path.join(getConfigDir(projectRoot), CONFIG_FILE);
  
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save configuration: ${errorMessage}`);
  }
}

/**
 * Update configuration
 */
export function updateConfig(
  updates: Partial<FunctionIndexerConfig>,
  projectRoot?: string
): FunctionIndexerConfig {
  const currentConfig = loadConfig(projectRoot);
  const updatedConfig = { ...currentConfig, ...updates };
  saveConfig(updatedConfig, projectRoot);
  return updatedConfig;
}

/**
 * Check if index exists - checks both new and legacy locations
 */
export function indexExists(projectRoot?: string): boolean {
  try {
    const configPath = path.join(getConfigDir(projectRoot), CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
      // Check if either index location exists without config
      const newPath = getDefaultIndexPath(projectRoot);
      const legacyPath = getLegacyIndexPath(projectRoot);
      return fs.existsSync(newPath) || fs.existsSync(legacyPath);
    }
    
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    const root = projectRoot || process.cwd();
    const outputPath = path.resolve(root, config.output);
    
    if (fs.existsSync(outputPath)) {
      return true;
    }
    
    // Check legacy location as fallback
    const legacyPath = getLegacyIndexPath(projectRoot);
    return fs.existsSync(legacyPath);
  } catch {
    return false;
  }
}

/**
 * Get the actual index path (prefers new location, falls back to legacy)
 */
export function getActualIndexPath(projectRoot?: string): string | null {
  try {
    const configPath = path.join(getConfigDir(projectRoot), CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      const root = projectRoot || process.cwd();
      const outputPath = path.resolve(root, config.output);
      
      if (fs.existsSync(outputPath)) {
        return outputPath;
      }
    }
    
    // Check new default location
    const newPath = getDefaultIndexPath(projectRoot);
    if (fs.existsSync(newPath)) {
      return newPath;
    }
    
    // Check legacy location
    const legacyPath = getLegacyIndexPath(projectRoot);
    if (fs.existsSync(legacyPath)) {
      return legacyPath;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Maintain backward compatibility
export const ConfigService = {
  getConfigDir,
  getDefaultIndexPath,
  getLegacyIndexPath,
  needsMigration,
  migrateIndexFile,
  getActualIndexPath,
  isInitialized,
  initialize,
  createDefaultConfig,
  loadConfig,
  saveConfig,
  updateConfig,
  indexExists
};