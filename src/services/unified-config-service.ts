import * as path from 'path';
import * as fs from 'fs';
import { CoreConfigService, CoreConfig } from './core-config-service';
import { MetricsConfigService, MetricsConfig } from './metrics-config-service';
import { ConfigMigrationService } from './config-migration-service';
import chalk from 'chalk';

/**
 * Unified configuration interface for backward compatibility
 */
export interface UnifiedConfig extends CoreConfig {
  metrics?: MetricsConfig;
}

/**
 * Check if the project is initialized (either legacy or separated format)
 */
export function isInitialized(projectRoot?: string): boolean {
  return CoreConfigService.isInitialized(projectRoot) || 
         ConfigMigrationService.isMigrationNeeded(projectRoot);
}

/**
 * Initialize project with separated configurations
 */
export function initialize(projectRoot?: string): UnifiedConfig {
  // Check if migration is needed first
  if (ConfigMigrationService.isMigrationNeeded(projectRoot)) {
    console.log(chalk.blue('🔄 Migrating to separated configuration format...'));
    
    const migrationResult = ConfigMigrationService.migrateConfiguration(projectRoot, {
      createBackup: true,
      verbose: true
    });
    
    return {
      ...migrationResult.coreConfig,
      metrics: migrationResult.metricsConfig
    };
  }
  
  // Initialize new separated configs
  const coreConfig = CoreConfigService.initialize(projectRoot);
  const metricsConfig = MetricsConfigService.initialize(projectRoot);
  
  return {
    ...coreConfig,
    metrics: metricsConfig
  };
}

/**
 * Load unified configuration (handles both legacy and separated formats)
 */
export function loadConfig(projectRoot?: string): UnifiedConfig {
  // Check if migration is needed
  if (ConfigMigrationService.isMigrationNeeded(projectRoot)) {
    console.log(chalk.yellow('⚠️  Legacy configuration detected. Please run initialization to migrate.'));
    
    // Auto-migrate for seamless experience
    const migrationResult = ConfigMigrationService.migrateConfiguration(projectRoot, {
      createBackup: true,
      verbose: false
    });
    
    return {
      ...migrationResult.coreConfig,
      metrics: migrationResult.metricsConfig
    };
  }
  
  // Load separated configs
  const coreConfig = CoreConfigService.loadConfig(projectRoot);
  const metricsConfig = MetricsConfigService.loadConfig(projectRoot);
  
  return {
    ...coreConfig,
    metrics: metricsConfig
  };
}

/**
 * Save unified configuration (saves to separated files)
 */
export function saveConfig(config: UnifiedConfig, projectRoot?: string): void {
  // Extract core config using destructuring for better maintainability
  const { metrics, ...coreConfig } = config;
  
  // Save core config
  CoreConfigService.saveConfig(coreConfig, projectRoot);
  
  // Save metrics config if provided
  if (metrics) {
    MetricsConfigService.saveConfig(metrics, projectRoot);
  }
}

/**
 * Update unified configuration
 */
export function updateConfig(
  updates: Partial<UnifiedConfig>, 
  projectRoot?: string
): UnifiedConfig {
  // Separate core and metrics updates
  const { metrics, ...coreUpdates } = updates;
  
  // Update core config
  const updatedCoreConfig = CoreConfigService.updateConfig(coreUpdates, projectRoot);
  
  // Update metrics config if provided
  let updatedMetricsConfig: MetricsConfig;
  if (metrics) {
    updatedMetricsConfig = MetricsConfigService.updateConfig(metrics, projectRoot);
  } else {
    updatedMetricsConfig = MetricsConfigService.loadConfig(projectRoot);
  }
  
  return {
    ...updatedCoreConfig,
    metrics: updatedMetricsConfig
  };
}

/**
 * Check if index exists
 */
export function indexExists(projectRoot?: string): boolean {
  return CoreConfigService.indexExists(projectRoot);
}

/**
 * Get configuration directory
 */
export function getConfigDir(projectRoot?: string): string {
  return CoreConfigService.getConfigDir(projectRoot);
}

/**
 * Get default index path
 */
export function getDefaultIndexPath(projectRoot?: string): string {
  return CoreConfigService.getDefaultIndexPath(projectRoot);
}

/**
 * Get metrics thresholds (convenience method)
 */
export function getMetricsThresholds(projectRoot?: string): MetricsConfig['thresholds'] {
  return MetricsConfigService.getThresholds(projectRoot);
}

/**
 * Update metrics thresholds (convenience method)
 */
export function updateMetricsThresholds(
  thresholds: Partial<MetricsConfig['thresholds']>,
  projectRoot?: string
): UnifiedConfig {
  const updatedMetricsConfig = MetricsConfigService.updateThresholds(thresholds, projectRoot);
  const coreConfig = CoreConfigService.loadConfig(projectRoot);
  
  return {
    ...coreConfig,
    metrics: updatedMetricsConfig
  };
}

/**
 * Check migration status
 */
export function getMigrationStatus(projectRoot?: string) {
  return ConfigMigrationService.getMigrationStatus(projectRoot);
}

/**
 * Force migration (for manual migration)
 */
export function migrate(projectRoot?: string, verbose: boolean = true) {
  return ConfigMigrationService.migrateConfiguration(projectRoot, {
    createBackup: true,
    verbose
  });
}

/**
 * Check if migration is needed (checks both config format and index file migration)
 */
export function needsMigration(projectRoot?: string): boolean {
  // Check for config format migration
  const needsConfigMigration = ConfigMigrationService.isMigrationNeeded(projectRoot);
  
  // Check for index file migration (legacy index exists but new doesn't)
  const legacyIndexPath = getLegacyIndexPath(projectRoot);
  const newIndexPath = getDefaultIndexPath(projectRoot);
  const needsIndexMigration = fs.existsSync(legacyIndexPath) && !fs.existsSync(newIndexPath);
  
  return needsConfigMigration || needsIndexMigration;
}

/**
 * Migrate index file if needed (handles both config and index file migration)
 */
export function migrateIndexFile(projectRoot?: string): boolean {
  // Check for config format migration first
  if (ConfigMigrationService.isMigrationNeeded(projectRoot)) {
    const result = migrate(projectRoot, false);
    return result.migrated;
  }
  
  // Handle pure index file migration (no config format change needed)
  const legacyIndexPath = getLegacyIndexPath(projectRoot);
  const newIndexPath = getDefaultIndexPath(projectRoot);
  
  if (fs.existsSync(legacyIndexPath) && !fs.existsSync(newIndexPath)) {
    try {
      console.log('📦 Migrating index file to project root...');
      fs.copyFileSync(legacyIndexPath, newIndexPath);
      
      // Remove the legacy file
      fs.unlinkSync(legacyIndexPath);
      
      console.log('✅ Index file migrated to', path.basename(newIndexPath));
      console.log('📝 Index metadata will be regenerated automatically');
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }
  
  return false;
}

/**
 * Get legacy index path for migration purposes
 */
export function getLegacyIndexPath(projectRoot?: string): string {
  const configDir = getConfigDir(projectRoot);
  return path.join(configDir, 'index.jsonl');
}

/**
 * Unified configuration service object for backward compatibility
 * Provides the same API as the previous class-based implementation
 */
export const UnifiedConfigService = {
  isInitialized,
  initialize,
  loadConfig,
  saveConfig,
  updateConfig,
  indexExists,
  getConfigDir,
  getDefaultIndexPath,
  getMetricsThresholds,
  updateMetricsThresholds,
  getMigrationStatus,
  migrate,
  needsMigration,
  migrateIndexFile,
  getLegacyIndexPath
};

/**
 * Backward compatibility export (maintains existing API)
 */
export const ConfigService = UnifiedConfigService;