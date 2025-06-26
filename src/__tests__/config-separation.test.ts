import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CoreConfigService } from '../services/core-config-service';
import { MetricsConfigService } from '../services/metrics-config-service';
import { ConfigMigrationService } from '../services/config-migration-service';
import { UnifiedConfigService } from '../services/unified-config-service';

describe('Configuration Separation', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'function-indexer-config-test-'));
    process.chdir(testDir);

    // Create a minimal project structure
    const packageJson = {
      name: 'test-project',
      version: '1.0.0'
    };
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    fs.mkdirSync('src', { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Core Configuration Service', () => {
    test('should initialize core configuration with defaults', () => {
      const config = CoreConfigService.initialize();
      
      expect(config.version).toBe('1.1.0');
      expect(config.domain).toBe('main');
      expect(config.include).toContain('**/*.ts');
      expect(config.include).toContain('**/*.tsx');
      expect(config.exclude).toContain('**/*.test.ts');
      expect(config.exclude).toContain('**/*.spec.ts');
      expect(path.basename(config.output)).toBe('function-index.jsonl');
    });

    test('should save and load core configuration', () => {
      const originalConfig = CoreConfigService.createDefaultConfig();
      CoreConfigService.saveConfig(originalConfig);
      
      const loadedConfig = CoreConfigService.loadConfig();
      
      expect(loadedConfig.version).toBe(originalConfig.version);
      expect(loadedConfig.domain).toBe(originalConfig.domain);
      expect(loadedConfig.include).toEqual(originalConfig.include);
      expect(loadedConfig.exclude).toEqual(originalConfig.exclude);
    });

    test('should update core configuration', () => {
      CoreConfigService.initialize();
      
      const updatedConfig = CoreConfigService.updateConfig({
        domain: 'updated-domain',
        include: ['**/*.ts']
      });
      
      expect(updatedConfig.domain).toBe('updated-domain');
      expect(updatedConfig.include).toEqual(['**/*.ts']);
      
      // Verify persistence
      const reloadedConfig = CoreConfigService.loadConfig();
      expect(reloadedConfig.domain).toBe('updated-domain');
      expect(reloadedConfig.include).toEqual(['**/*.ts']);
    });

    test('should check if core configuration is initialized', () => {
      expect(CoreConfigService.isInitialized()).toBe(false);
      
      CoreConfigService.initialize();
      
      expect(CoreConfigService.isInitialized()).toBe(true);
    });
  });

  describe('Metrics Configuration Service', () => {
    test('should initialize metrics configuration with defaults', () => {
      const config = MetricsConfigService.initialize();
      
      expect(config.version).toBe('1.1.0');
      expect(config.enabled).toBe(true);
      expect(config.thresholds.cyclomaticComplexity).toBe(10);
      expect(config.thresholds.cognitiveComplexity).toBe(15);
      expect(config.thresholds.linesOfCode).toBe(50);
      expect(config.thresholds.nestingDepth).toBe(4);
      expect(config.thresholds.parameterCount).toBe(4);
      expect(config.collection.trackTrends).toBe(true);
      expect(config.reporting.defaultFormat).toBe('summary');
    });

    test('should save and load metrics configuration', () => {
      const originalConfig = MetricsConfigService.createDefaultConfig();
      MetricsConfigService.saveConfig(originalConfig);
      
      const loadedConfig = MetricsConfigService.loadConfig();
      
      expect(loadedConfig.version).toBe(originalConfig.version);
      expect(loadedConfig.enabled).toBe(originalConfig.enabled);
      expect(loadedConfig.thresholds).toEqual(originalConfig.thresholds);
      expect(loadedConfig.collection).toEqual(originalConfig.collection);
      expect(loadedConfig.reporting).toEqual(originalConfig.reporting);
    });

    test('should update metrics thresholds', () => {
      MetricsConfigService.initialize();
      
      const updatedConfig = MetricsConfigService.updateThresholds({
        cyclomaticComplexity: 15,
        linesOfCode: 100
      });
      
      expect(updatedConfig.thresholds.cyclomaticComplexity).toBe(15);
      expect(updatedConfig.thresholds.linesOfCode).toBe(100);
      expect(updatedConfig.thresholds.cognitiveComplexity).toBe(15); // unchanged
      
      // Verify persistence
      const reloadedThresholds = MetricsConfigService.getThresholds();
      expect(reloadedThresholds.cyclomaticComplexity).toBe(15);
      expect(reloadedThresholds.linesOfCode).toBe(100);
    });

    test('should check if metrics is enabled', () => {
      expect(MetricsConfigService.isEnabled()).toBe(false); // No config exists
      
      MetricsConfigService.initialize();
      
      expect(MetricsConfigService.isEnabled()).toBe(true);
      
      MetricsConfigService.updateConfig({ enabled: false });
      
      expect(MetricsConfigService.isEnabled()).toBe(false);
    });
  });

  describe('Configuration Migration', () => {
    test('should detect when migration is needed', () => {
      // No config exists
      expect(ConfigMigrationService.isMigrationNeeded()).toBe(false);
      
      // Create legacy config
      const configDir = CoreConfigService.getConfigDir();
      fs.mkdirSync(configDir, { recursive: true });
      
      const legacyConfig = {
        version: '1.0.0',
        root: './src',
        output: 'function-index.jsonl',
        domain: 'main',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts'],
        metrics: {
          thresholds: {
            cyclomaticComplexity: 8,
            cognitiveComplexity: 12
          }
        }
      };
      
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(legacyConfig, null, 2)
      );
      
      expect(ConfigMigrationService.isMigrationNeeded()).toBe(true);
    });

    test('should migrate legacy configuration successfully', () => {
      // Create legacy config
      const configDir = CoreConfigService.getConfigDir();
      fs.mkdirSync(configDir, { recursive: true });
      
      const legacyConfig = {
        version: '1.0.0',
        root: './src',
        output: 'function-index.jsonl',
        domain: 'test-domain',
        include: ['**/*.ts', '**/*.tsx'],
        exclude: ['**/*.test.ts'],
        metrics: {
          thresholds: {
            cyclomaticComplexity: 8,
            cognitiveComplexity: 12,
            linesOfCode: 60
          }
        }
      };
      
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(legacyConfig, null, 2)
      );
      
      // Perform migration
      const migrationResult = ConfigMigrationService.migrateConfiguration(undefined, {
        createBackup: true,
        verbose: false
      });
      
      expect(migrationResult.migrated).toBe(true);
      expect(migrationResult.backupCreated).toBeTruthy();
      expect(fs.existsSync(migrationResult.backupCreated!)).toBe(true);
      
      // Check core config migration
      expect(migrationResult.coreConfig.version).toBe('1.1.0');
      expect(migrationResult.coreConfig.domain).toBe('test-domain');
      expect(migrationResult.coreConfig.include).toEqual(['**/*.ts', '**/*.tsx']);
      expect(migrationResult.coreConfig.exclude).toEqual(['**/*.test.ts']);
      
      // Check metrics config migration
      expect(migrationResult.metricsConfig.thresholds.cyclomaticComplexity).toBe(8);
      expect(migrationResult.metricsConfig.thresholds.cognitiveComplexity).toBe(12);
      expect(migrationResult.metricsConfig.thresholds.linesOfCode).toBe(60);
      
      // Verify files exist
      expect(fs.existsSync(path.join(configDir, 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(configDir, 'metrics-config.json'))).toBe(true);
      
      // Verify configs can be loaded
      const coreConfig = CoreConfigService.loadConfig();
      const metricsConfig = MetricsConfigService.loadConfig();
      
      expect(coreConfig.domain).toBe('test-domain');
      expect(metricsConfig.thresholds.cyclomaticComplexity).toBe(8);
    });

    test('should get migration status correctly', () => {
      // No config
      let status = ConfigMigrationService.getMigrationStatus();
      expect(status.needsMigration).toBe(false);
      expect(status.currentConfigFormat).toBe('none');
      expect(status.hasBackups).toEqual([]);
      
      // Legacy config
      const configDir = CoreConfigService.getConfigDir();
      fs.mkdirSync(configDir, { recursive: true });
      
      const legacyConfig = {
        version: '1.0.0',
        root: './src',
        output: 'function-index.jsonl',
        domain: 'main',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts'],
        metrics: { thresholds: { cyclomaticComplexity: 10 } }
      };
      
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(legacyConfig, null, 2)
      );
      
      status = ConfigMigrationService.getMigrationStatus();
      expect(status.needsMigration).toBe(true);
      expect(status.currentConfigFormat).toBe('legacy');
      
      // Migrate and check separated format
      ConfigMigrationService.migrateConfiguration();
      
      status = ConfigMigrationService.getMigrationStatus();
      expect(status.needsMigration).toBe(false);
      expect(status.currentConfigFormat).toBe('separated');
      expect(status.hasBackups.length).toBeGreaterThan(0);
    });
  });

  describe('Unified Configuration Service', () => {
    test('should handle initialization with migration', () => {
      // Create legacy config
      const configDir = CoreConfigService.getConfigDir();
      fs.mkdirSync(configDir, { recursive: true });
      
      const legacyConfig = {
        version: '1.0.0',
        root: './src',
        output: 'function-index.jsonl',
        domain: 'unified-test',
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts'],
        metrics: {
          thresholds: {
            cyclomaticComplexity: 12
          }
        }
      };
      
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify(legacyConfig, null, 2)
      );
      
      // Initialize should trigger migration
      const unifiedConfig = UnifiedConfigService.initialize();
      
      expect(unifiedConfig.domain).toBe('unified-test');
      expect(unifiedConfig.metrics?.thresholds.cyclomaticComplexity).toBe(12);
      
      // Verify separated files exist
      expect(fs.existsSync(path.join(configDir, 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(configDir, 'metrics-config.json'))).toBe(true);
    });

    test('should load unified configuration seamlessly', () => {
      // Initialize with new format
      const initialConfig = UnifiedConfigService.initialize();
      expect(initialConfig.metrics).toBeDefined();
      
      // Load should work seamlessly
      const loadedConfig = UnifiedConfigService.loadConfig();
      expect(loadedConfig.version).toBe(initialConfig.version);
      expect(loadedConfig.metrics?.enabled).toBe(true);
    });

    test('should update unified configuration', () => {
      UnifiedConfigService.initialize();
      
      const updatedConfig = UnifiedConfigService.updateConfig({
        domain: 'updated-unified',
        metrics: {
          enabled: false,
          thresholds: {
            cyclomaticComplexity: 20,
            cognitiveComplexity: 25,
            linesOfCode: 100,
            nestingDepth: 5,
            parameterCount: 6
          }
        } as any
      });
      
      expect(updatedConfig.domain).toBe('updated-unified');
      expect(updatedConfig.metrics?.enabled).toBe(false);
      expect(updatedConfig.metrics?.thresholds.cyclomaticComplexity).toBe(20);
      
      // Verify persistence
      const reloadedConfig = UnifiedConfigService.loadConfig();
      expect(reloadedConfig.domain).toBe('updated-unified');
      expect(reloadedConfig.metrics?.enabled).toBe(false);
    });

    test('should provide backward compatibility', () => {
      // Should work with existing ConfigService interface
      expect(UnifiedConfigService.isInitialized()).toBe(false);
      
      const config = UnifiedConfigService.initialize();
      expect(config).toBeDefined();
      
      expect(UnifiedConfigService.isInitialized()).toBe(true);
      expect(UnifiedConfigService.indexExists()).toBe(false); // No actual index file
      
      const configDir = UnifiedConfigService.getConfigDir();
      expect(fs.existsSync(configDir)).toBe(true);
      
      const defaultIndexPath = UnifiedConfigService.getDefaultIndexPath();
      expect(path.basename(defaultIndexPath)).toBe('function-index.jsonl');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain existing API interface', () => {
      // Test that existing code using ConfigService still works
      const { ConfigService } = require('../services/unified-config-service');
      
      expect(typeof ConfigService.isInitialized).toBe('function');
      expect(typeof ConfigService.initialize).toBe('function');
      expect(typeof ConfigService.loadConfig).toBe('function');
      expect(typeof ConfigService.saveConfig).toBe('function');
      expect(typeof ConfigService.updateConfig).toBe('function');
      expect(typeof ConfigService.indexExists).toBe('function');
      expect(typeof ConfigService.getConfigDir).toBe('function');
      expect(typeof ConfigService.getDefaultIndexPath).toBe('function');
    });

    test('should handle metrics thresholds access', () => {
      UnifiedConfigService.initialize();
      
      const thresholds = UnifiedConfigService.getMetricsThresholds();
      expect(thresholds.cyclomaticComplexity).toBe(10);
      expect(thresholds.cognitiveComplexity).toBe(15);
      
      const updatedConfig = UnifiedConfigService.updateMetricsThresholds({
        cyclomaticComplexity: 8,
        linesOfCode: 40
      });
      
      expect(updatedConfig.metrics?.thresholds.cyclomaticComplexity).toBe(8);
      expect(updatedConfig.metrics?.thresholds.linesOfCode).toBe(40);
      expect(updatedConfig.metrics?.thresholds.cognitiveComplexity).toBe(15); // unchanged
    });
  });
});