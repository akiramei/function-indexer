import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { CoreConfigService, CoreConfig } from './core-config-service';
import { MetricsConfigService, MetricsConfig } from './metrics-config-service';

/**
 * Legacy configuration interface (for migration purposes)
 */
interface LegacyFunctionIndexerConfig {
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

/**
 * Migration result interface
 */
export interface MigrationResult {
  migrated: boolean;
  coreConfig: CoreConfig;
  metricsConfig: MetricsConfig;
  backupCreated: string | null;
  warnings: string[];
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(projectRoot?: string): boolean {
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  const legacyConfigPath = path.join(configDir, 'config.json');
  
  // No config file means no migration needed
  if (!fs.existsSync(legacyConfigPath)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(legacyConfigPath, 'utf-8');
    const config = JSON.parse(content);
    
    // If it has metrics property, it's legacy format
    return 'metrics' in config;
  } catch {
    return false;
  }
}

/**
 * Perform configuration migration from legacy format to separated configs
 */
export function migrateConfiguration(projectRoot?: string, options: {
  createBackup?: boolean;
  verbose?: boolean;
} = {}): MigrationResult {
  const { createBackup = true, verbose = false } = options;
  const warnings: string[] = [];
  let backupCreated: string | null = null;
  
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  const legacyConfigPath = path.join(configDir, 'config.json');
  
  if (verbose) {
    console.log(chalk.blue('🔄 Starting configuration migration...'));
  }
  
  // Check if migration is actually needed
  if (!isMigrationNeeded(projectRoot)) {
    if (verbose) {
      console.log(chalk.yellow('⚠️  No migration needed or legacy config not found'));
    }
    
    // Return current configs (may auto-initialize)
    return {
      migrated: false,
      coreConfig: CoreConfigService.loadConfig(projectRoot),
      metricsConfig: MetricsConfigService.loadConfig(projectRoot),
      backupCreated: null,
      warnings: ['No migration needed']
    };
  }
  
  try {
    // Load legacy configuration
    const legacyContent = fs.readFileSync(legacyConfigPath, 'utf-8');
    const legacyConfig: LegacyFunctionIndexerConfig = JSON.parse(legacyContent);
    
    if (verbose) {
      console.log(chalk.gray(`📁 Found legacy config version: ${legacyConfig.version}`));
    }
    
    // Create backup if requested
    if (createBackup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupCreated = `${legacyConfigPath}.backup-${timestamp}`;
      fs.copyFileSync(legacyConfigPath, backupCreated);
      
      if (verbose) {
        console.log(chalk.gray(`💾 Created backup: ${path.basename(backupCreated)}`));
      }
    }
    
    // Extract core configuration
    const coreConfig: CoreConfig = {
      version: '1.1.0', // Bump version for separated config
      root: legacyConfig.root,
      output: legacyConfig.output,
      domain: legacyConfig.domain,
      include: legacyConfig.include,
      exclude: legacyConfig.exclude
    };
    
    // Extract metrics configuration
    const metricsConfig = MetricsConfigService.migrateLegacyConfig(legacyConfig, projectRoot);
    
    // Save separated configurations
    CoreConfigService.saveConfig(coreConfig, projectRoot);
    MetricsConfigService.saveConfig(metricsConfig, projectRoot);
    
    if (verbose) {
      console.log(chalk.green('✅ Separated configurations created:'));
      console.log(chalk.gray(`   - Core: ${path.join(configDir, 'config.json')}`));
      console.log(chalk.gray(`   - Metrics: ${path.join(configDir, 'metrics-config.json')}`));
    }
    
    // Handle potential index file migration (Issue #3 compatibility)
    migrateIndexFileIfNeeded(coreConfig, projectRoot, verbose);
    
    if (verbose) {
      console.log(chalk.green('🎉 Migration completed successfully!'));
    }
    
    return {
      migrated: true,
      coreConfig,
      metricsConfig,
      backupCreated,
      warnings
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Configuration migration failed: ${errorMessage}`);
  }
}

/**
 * Handle index file migration if needed (Issue #3 compatibility)
 */
function migrateIndexFileIfNeeded(
  coreConfig: CoreConfig, 
  projectRoot?: string, 
  verbose?: boolean
): void {
  const root = projectRoot || process.cwd();
  const oldIndexPath = path.join(CoreConfigService.getConfigDir(projectRoot), 'index.jsonl');
  const newIndexPath = path.resolve(root, 'function-index.jsonl');
  
  // Check if old index exists and new doesn't
  if (fs.existsSync(oldIndexPath) && !fs.existsSync(newIndexPath)) {
    if (verbose) {
      console.log(chalk.blue('📁 Migrating index file to project root...'));
    }
    
    try {
      // Copy old index to new location
      fs.copyFileSync(oldIndexPath, newIndexPath);
      
      // Update core config to point to new location
      coreConfig.output = newIndexPath;
      CoreConfigService.saveConfig(coreConfig, projectRoot);
      
      if (verbose) {
        console.log(chalk.green(`✅ Index file migrated to: ${path.basename(newIndexPath)}`));
      }
    } catch (error) {
      if (verbose) {
        console.warn(chalk.yellow(`⚠️  Index migration warning: ${error}`));
      }
    }
  }
}

/**
 * Rollback migration (restore from backup)
 */
export function rollbackMigration(backupPath: string, projectRoot?: string): void {
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  const configPath = path.join(configDir, 'config.json');
  const metricsConfigPath = MetricsConfigService.getMetricsConfigPath(projectRoot);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  
  try {
    // Restore legacy config
    fs.copyFileSync(backupPath, configPath);
    
    // Remove separated metrics config
    if (fs.existsSync(metricsConfigPath)) {
      fs.unlinkSync(metricsConfigPath);
    }
    
    console.log(chalk.green('✅ Migration rollback completed'));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Rollback failed: ${errorMessage}`);
  }
}

/**
 * Get migration status information
 */
export function getMigrationStatus(projectRoot?: string): {
  needsMigration: boolean;
  hasBackups: string[];
  currentConfigFormat: 'legacy' | 'separated' | 'none';
} {
  const configDir = CoreConfigService.getConfigDir(projectRoot);
  
  const needsMigration = isMigrationNeeded(projectRoot);
  
  // Find backup files
  const hasBackups = fs.existsSync(configDir) 
    ? fs.readdirSync(configDir)
        .filter(file => file.startsWith('config.json.backup-'))
        .map(file => path.join(configDir, file))
    : [];
  
  // Determine current format
  let currentConfigFormat: 'legacy' | 'separated' | 'none' = 'none';
  
  if (CoreConfigService.isInitialized(projectRoot) && MetricsConfigService.isInitialized(projectRoot)) {
    currentConfigFormat = 'separated';
  } else if (needsMigration) {
    currentConfigFormat = 'legacy';
  }
  
  return {
    needsMigration,
    hasBackups,
    currentConfigFormat
  };
}

/**
 * Configuration migration service interface
 */
export const ConfigMigrationService = {
  isMigrationNeeded,
  migrateConfiguration,
  rollbackMigration,
  getMigrationStatus
};