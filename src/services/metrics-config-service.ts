import * as fs from 'fs';
import * as path from 'path';
import { CoreConfigService } from './core-config-service';

/**
 * Metrics configuration separated from core functionality
 * Handles code quality thresholds and metrics tracking settings
 */
export interface MetricsConfig {
  version: string;
  enabled: boolean;
  database: {
    path: string;
    autoCleanup: boolean;
    maxHistoryDays: number;
  };
  thresholds: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
    nestingDepth: number;
    parameterCount: number;
  };
  collection: {
    autoCollectOnCommit: boolean;
    includeUncommitted: boolean;
    trackTrends: boolean;
  };
  reporting: {
    defaultFormat: 'summary' | 'detailed' | 'json';
    showTrends: boolean;
    highlightViolations: boolean;
  };
}

const METRICS_CONFIG_FILE = 'metrics-config.json';
const DEFAULT_METRICS_VERSION = '1.1.0';

/**
 * Get the metrics configuration file path
 */
export function getMetricsConfigPath(projectRoot?: string): string {
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  return path.join(configDir, METRICS_CONFIG_FILE);
}

/**
 * Check if metrics configuration is initialized
 */
export function isInitialized(projectRoot?: string): boolean {
  const configPath = getMetricsConfigPath(projectRoot);
  return fs.existsSync(configPath);
}

/**
 * Initialize metrics configuration with defaults
 */
export function initialize(projectRoot?: string): MetricsConfig {
  const configPath = getMetricsConfigPath(projectRoot);
  
  // Ensure core config directory exists
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  if (!fs.existsSync(configPath)) {
    const config = createDefaultConfig(projectRoot);
    saveConfig(config, projectRoot);
    return config;
  }
  
  return loadConfig(projectRoot);
}

/**
 * Create default metrics configuration
 */
export function createDefaultConfig(projectRoot?: string): MetricsConfig {
  const root = projectRoot || process.cwd();
  
  return {
    version: DEFAULT_METRICS_VERSION,
    enabled: true,
    database: {
      path: '.function-metrics/metrics.db',
      autoCleanup: false,
      maxHistoryDays: 365
    },
    thresholds: {
      cyclomaticComplexity: 10,
      cognitiveComplexity: 15,
      linesOfCode: 50,
      nestingDepth: 3,
      parameterCount: 4
    },
    collection: {
      autoCollectOnCommit: false,
      includeUncommitted: true,
      trackTrends: true
    },
    reporting: {
      defaultFormat: 'summary',
      showTrends: true,
      highlightViolations: true
    }
  };
}

/**
 * Load metrics configuration from file
 */
export function loadConfig(projectRoot?: string): MetricsConfig {
  const configPath = getMetricsConfigPath(projectRoot);
  
  if (!fs.existsSync(configPath)) {
    // Auto-initialize if not exists
    return initialize(projectRoot);
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as MetricsConfig;
    
    // Ensure absolute paths for database
    const root = projectRoot || process.cwd();
    config.database.path = path.resolve(root, config.database.path);
    
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load metrics configuration: ${errorMessage}`);
  }
}

/**
 * Save metrics configuration to file
 */
export function saveConfig(config: MetricsConfig, projectRoot?: string): void {
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  
  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const configPath = getMetricsConfigPath(projectRoot);
  
  // Convert database path to relative for storage
  const root = projectRoot || process.cwd();
  const configToSave = {
    ...config,
    database: {
      ...config.database,
      path: path.relative(root, config.database.path)
    }
  };
  
  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(configToSave, null, 2),
      'utf-8'
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save metrics configuration: ${errorMessage}`);
  }
}

/**
 * Update metrics configuration
 */
export function updateConfig(
  updates: Partial<MetricsConfig>,
  projectRoot?: string
): MetricsConfig {
  const currentConfig = loadConfig(projectRoot);
  
  // Deep merge for nested objects
  const updatedConfig: MetricsConfig = {
    ...currentConfig,
    ...updates,
    database: { ...currentConfig.database, ...(updates.database || {}) },
    thresholds: { ...currentConfig.thresholds, ...(updates.thresholds || {}) },
    collection: { ...currentConfig.collection, ...(updates.collection || {}) },
    reporting: { ...currentConfig.reporting, ...(updates.reporting || {}) }
  };
  
  saveConfig(updatedConfig, projectRoot);
  return updatedConfig;
}

/**
 * Get metrics thresholds (commonly used)
 */
export function getThresholds(projectRoot?: string): MetricsConfig['thresholds'] {
  const config = loadConfig(projectRoot);
  return config.thresholds;
}

/**
 * Update metrics thresholds
 */
export function updateThresholds(
  thresholds: Partial<MetricsConfig['thresholds']>,
  projectRoot?: string
): MetricsConfig {
  const currentConfig = loadConfig(projectRoot);
  const updatedThresholds = { ...currentConfig.thresholds, ...thresholds };
  return updateConfig({ thresholds: updatedThresholds }, projectRoot);
}

/**
 * Check if metrics collection is enabled
 */
export function isEnabled(projectRoot?: string): boolean {
  try {
    if (!isInitialized(projectRoot)) {
      return false;
    }
    const config = loadConfig(projectRoot);
    return config.enabled;
  } catch {
    return false; // Default to disabled if config can't be loaded
  }
}

/**
 * Migration helper: extract metrics config from legacy config
 */
export function migrateLegacyConfig(legacyConfig: Record<string, unknown>, projectRoot?: string): MetricsConfig {
  const defaultConfig = createDefaultConfig(projectRoot);
  
  // Extract metrics settings from legacy config
  const metrics = legacyConfig.metrics as Record<string, unknown> | undefined;
  if (metrics?.thresholds && typeof metrics.thresholds === 'object' && metrics.thresholds !== null) {
    defaultConfig.thresholds = {
      ...defaultConfig.thresholds,
      ...(metrics.thresholds as Record<string, unknown>)
    };
  }
  
  return defaultConfig;
}

/**
 * Metrics configuration service interface
 */
export const MetricsConfigService = {
  getMetricsConfigPath,
  isInitialized,
  initialize,
  createDefaultConfig,
  loadConfig,
  saveConfig,
  updateConfig,
  getThresholds,
  updateThresholds,
  isEnabled,
  migrateLegacyConfig
};