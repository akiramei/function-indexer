import * as fs from 'fs';
import * as path from 'path';
import { detectProject, loadGitignorePatterns } from '../utils/project-detector';

/**
 * Core configuration for function indexing
 * Separated from metrics configuration for better modularity
 */
export interface CoreConfig {
  version: string;
  root: string;
  output: string;
  domain: string;
  include: string[];
  exclude: string[];
}

const CONFIG_DIR = '.function-indexer';
const CORE_CONFIG_FILE = 'config.json';
const INDEX_FILE = 'index.jsonl';
const DEFAULT_VERSION = '1.1.0'; // Bumped for config separation

/**
 * Get the configuration directory path
 */
export function getConfigDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  return path.join(root, CONFIG_DIR);
}

/**
 * Get the default index file path
 */
export function getDefaultIndexPath(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  return path.join(root, 'function-index.jsonl'); // Move to project root as per Issue #3
}

/**
 * Check if the core configuration is initialized
 */
export function isInitialized(projectRoot?: string): boolean {
  const configDir = getConfigDir(projectRoot);
  const configPath = path.join(configDir, CORE_CONFIG_FILE);
  return fs.existsSync(configPath);
}

/**
 * Initialize the core configuration directory and files
 */
export function initialize(projectRoot?: string): CoreConfig {
  const configDir = getConfigDir(projectRoot);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Create or load configuration
  const configPath = path.join(configDir, CORE_CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    const config = createDefaultConfig(projectRoot);
    saveConfig(config, projectRoot);
    return config;
  }
  
  return loadConfig(projectRoot);
}

/**
 * Create default core configuration based on project detection
 */
export function createDefaultConfig(projectRoot?: string): CoreConfig {
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
    exclude: excludePatterns
  };
}

/**
 * Load core configuration from file
 */
export function loadConfig(projectRoot?: string): CoreConfig {
  const configPath = path.join(getConfigDir(projectRoot), CORE_CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    throw new Error('Core configuration file not found. Run `function-indexer` in your project root to initialize.');
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as CoreConfig;
    
    // Ensure absolute paths
    const root = projectRoot || process.cwd();
    config.root = path.resolve(root, config.root);
    config.output = path.resolve(root, config.output);
    
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load core configuration: ${errorMessage}`);
  }
}

/**
 * Save core configuration to file
 */
export function saveConfig(config: CoreConfig, projectRoot?: string): void {
  const configDir = getConfigDir(projectRoot);
  
  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const configPath = path.join(configDir, CORE_CONFIG_FILE);
  
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
    throw new Error(`Failed to save core configuration: ${errorMessage}`);
  }
}

/**
 * Update core configuration
 */
export function updateConfig(
  updates: Partial<CoreConfig>,
  projectRoot?: string
): CoreConfig {
  const currentConfig = loadConfig(projectRoot);
  const updatedConfig = { ...currentConfig, ...updates };
  saveConfig(updatedConfig, projectRoot);
  return updatedConfig;
}

/**
 * Check if index exists
 */
export function indexExists(projectRoot?: string): boolean {
  try {
    const config = loadConfig(projectRoot);
    return fs.existsSync(config.output);
  } catch {
    return false;
  }
}

/**
 * Migration helper: detect if legacy config exists and needs migration
 */
export function hasLegacyConfig(projectRoot?: string): boolean {
  const configPath = path.join(getConfigDir(projectRoot), CORE_CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    // Check if it has metrics property (legacy format)
    return 'metrics' in config;
  } catch {
    return false;
  }
}

/**
 * Core configuration service interface
 */
export const CoreConfigService = {
  getConfigDir,
  getDefaultIndexPath,
  isInitialized,
  initialize,
  createDefaultConfig,
  loadConfig,
  saveConfig,
  updateConfig,
  indexExists,
  hasLegacyConfig
};