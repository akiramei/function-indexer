import { ProjectDetector } from '../utils/project-detector';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ProjectDetector', () => {
  let tempDir: string;
  let projectDir: string;

  beforeEach(() => {
    // Create temporary directory for test projects
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'function-indexer-test-'));
    projectDir = path.join(tempDir, 'test-project');
    fs.mkdirSync(projectDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('detectProject', () => {
    it('should detect TypeScript project with tsconfig.json', () => {
      // Create tsconfig.json
      fs.writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: { target: 'ES2020' } })
      );

      // Create src directory
      const srcDir = path.join(projectDir, 'src');
      fs.mkdirSync(srcDir);

      const result = ProjectDetector.detectProject(projectDir);

      expect(result.root).toBe(projectDir);
      expect(result.type).toBe('typescript');
      expect(result.hasTsConfig).toBe(true);
      expect(result.srcDirs).toContain('src');
      expect(result.suggestedRoot).toBe(srcDir);
    });

    it('should detect JavaScript project with package.json only', () => {
      // Create package.json
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' })
      );

      const result = ProjectDetector.detectProject(projectDir);

      expect(result.root).toBe(projectDir);
      expect(result.type).toBe('javascript');
      expect(result.hasPackageJson).toBe(true);
      expect(result.hasTsConfig).toBe(false);
    });

    it('should find multiple source directories', () => {
      // Create package.json
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      // Create multiple source directories
      fs.mkdirSync(path.join(projectDir, 'src'));
      fs.mkdirSync(path.join(projectDir, 'lib'));
      fs.mkdirSync(path.join(projectDir, 'app'));

      const result = ProjectDetector.detectProject(projectDir);

      expect(result.srcDirs).toEqual(expect.arrayContaining(['src', 'lib', 'app']));
      expect(result.suggestedRoot).toBe(path.join(projectDir, 'src'));
    });

    it('should default to project root when no source directories found', () => {
      // Create package.json
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      // Create TypeScript files in root
      fs.writeFileSync(path.join(projectDir, 'index.ts'), 'export {}');

      const result = ProjectDetector.detectProject(projectDir);

      expect(result.srcDirs).toContain('.');
      expect(result.suggestedRoot).toBe(projectDir);
    });

    it('should find project root by traversing up directories', () => {
      // Create package.json in parent directory
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      // Create nested directory
      const nestedDir = path.join(projectDir, 'src', 'components');
      fs.mkdirSync(nestedDir, { recursive: true });

      const result = ProjectDetector.detectProject(nestedDir);

      expect(result.root).toBe(projectDir);
    });

    it('should detect unknown project type when no markers found', () => {
      const result = ProjectDetector.detectProject(projectDir);

      expect(result.type).toBe('unknown');
      expect(result.hasPackageJson).toBe(false);
      expect(result.hasTsConfig).toBe(false);
    });
  });

  describe('loadGitignorePatterns', () => {
    it('should return default patterns when .gitignore does not exist', () => {
      const patterns = ProjectDetector.loadGitignorePatterns(projectDir);

      expect(patterns).toEqual(expect.arrayContaining([
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**'
      ]));
    });

    it('should parse .gitignore file and convert to glob patterns', () => {
      const gitignoreContent = `
# Comments should be ignored
node_modules/
dist
*.log
temp/
.env
      `.trim();

      fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignoreContent);

      const patterns = ProjectDetector.loadGitignorePatterns(projectDir);

      expect(patterns).toEqual(expect.arrayContaining([
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/node_modules/**',
        '**/dist',
        '**/*.log',
        '**/temp/**',
        '**/.env'
      ]));
    });

    it('should handle empty lines and comments in .gitignore', () => {
      const gitignoreContent = `
# This is a comment

node_modules/

# Another comment
*.log

      `;

      fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignoreContent);

      const patterns = ProjectDetector.loadGitignorePatterns(projectDir);

      // Should not include empty lines or comments
      expect(patterns.filter(p => p.includes('#'))).toHaveLength(0);
      expect(patterns).toEqual(expect.arrayContaining([
        '**/node_modules/**',
        '**/*.log'
      ]));
    });

    it('should handle read errors gracefully', () => {
      // Create a directory with the name .gitignore (not a file)
      fs.mkdirSync(path.join(projectDir, '.gitignore'));

      const patterns = ProjectDetector.loadGitignorePatterns(projectDir);

      // Should return default patterns when read fails
      expect(patterns).toEqual(expect.arrayContaining([
        '**/node_modules/**',
        '**/.git/**'
      ]));
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent directory', () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');

      const result = ProjectDetector.detectProject(nonExistentDir);

      // Should return the resolved path even if directory doesn't exist
      expect(result.root).toBe(path.resolve(nonExistentDir));
      expect(result.type).toBe('unknown');
    });

    it('should prefer src directory over other source directories', () => {
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      // Create multiple directories with src last (alphabetically)
      fs.mkdirSync(path.join(projectDir, 'app'));
      fs.mkdirSync(path.join(projectDir, 'lib'));
      fs.mkdirSync(path.join(projectDir, 'src'));

      const result = ProjectDetector.detectProject(projectDir);

      expect(result.suggestedRoot).toBe(path.join(projectDir, 'src'));
    });

    it('should handle git repository without package.json', () => {
      // Create .git directory
      fs.mkdirSync(path.join(projectDir, '.git'));

      const result = ProjectDetector.detectProject(projectDir);

      expect(result.root).toBe(projectDir);
      expect(result.type).toBe('unknown');
    });
  });
});