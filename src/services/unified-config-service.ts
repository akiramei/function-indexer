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
 * Unified configuration service that combines core and metrics configurations
 * Provides backward compatibility while supporting the new separated structure
 */
export class UnifiedConfigService {
  /**
   * Check if the project is initialized (either legacy or separated format)
   */
  static isInitialized(projectRoot?: string): boolean {
    return CoreConfigService.isInitialized(projectRoot) || 
           ConfigMigrationService.isMigrationNeeded(projectRoot);
  }

  /**
   * Initialize project with separated configurations
   */
  static initialize(projectRoot?: string): UnifiedConfig {
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
  static loadConfig(projectRoot?: string): UnifiedConfig {
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
  static saveConfig(config: UnifiedConfig, projectRoot?: string): void {
    // Extract core config
    const coreConfig: CoreConfig = {
      version: config.version,
      root: config.root,
      output: config.output,
      domain: config.domain,
      include: config.include,
      exclude: config.exclude
    };
    
    // Save core config
    CoreConfigService.saveConfig(coreConfig, projectRoot);
    
    // Save metrics config if provided
    if (config.metrics) {
      MetricsConfigService.saveConfig(config.metrics, projectRoot);
    }
  }

  /**
   * Update unified configuration
   */
  static updateConfig(
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
  static indexExists(projectRoot?: string): boolean {
    return CoreConfigService.indexExists(projectRoot);
  }

  /**
   * Get configuration directory
   */
  static getConfigDir(projectRoot?: string): string {
    return CoreConfigService.getConfigDir(projectRoot);
  }

  /**
   * Get default index path
   */
  static getDefaultIndexPath(projectRoot?: string): string {
    return CoreConfigService.getDefaultIndexPath(projectRoot);
  }

  /**
   * Get metrics thresholds (convenience method)
   */
  static getMetricsThresholds(projectRoot?: string): MetricsConfig['thresholds'] {
    return MetricsConfigService.getThresholds(projectRoot);
  }

  /**
   * Update metrics thresholds (convenience method)
   */
  static updateMetricsThresholds(
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
  static getMigrationStatus(projectRoot?: string) {
    return ConfigMigrationService.getMigrationStatus(projectRoot);
  }

  /**
   * Force migration (for manual migration)
   */
  static migrate(projectRoot?: string, verbose: boolean = true) {
    return ConfigMigrationService.migrateConfiguration(projectRoot, {
      createBackup: true,
      verbose
    });
  }
}

/**
 * Backward compatibility export (maintains existing API)
 */
export const ConfigService = UnifiedConfigService;