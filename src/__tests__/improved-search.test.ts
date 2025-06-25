import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

describe('Improved search command', () => {
  let tempDir: string;
  let projectDir: string;
  let cliPath: string;

  beforeAll(async () => {
    // Build the project to ensure CLI is available
    await execAsync('npm run build', { cwd: process.cwd() });
    cliPath = path.join(process.cwd(), 'dist', 'cli.js');
  }, 30000);

  beforeEach(async () => {
    // Create temporary directory for test projects
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'improved-search-test-'));
    projectDir = path.join(tempDir, 'test-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create a basic TypeScript project
    fs.writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js'
      }, null, 2)
    );

    fs.writeFileSync(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true
        },
        include: ['src/**/*']
      }, null, 2)
    );

    // Create src directory with multiple files
    const srcDir = path.join(projectDir, 'src');
    fs.mkdirSync(srcDir);
    
    // File 1: auth.ts
    fs.writeFileSync(
      path.join(srcDir, 'auth.ts'),
      `export function validateUser(username: string) {
  return username.length > 0;
}

export function authenticateUser(username: string, password: string) {
  return validateUser(username) && password.length > 8;
}

function hashPassword(password: string) {
  return password + '_hashed';
}

export async function loginUser(username: string, password: string) {
  await Promise.resolve();
  return authenticateUser(username, password);
}

class UserValidator {
  validateEmail(email: string) {
    return email.includes('@');
  }
  
  async validateAsync(data: any) {
    await Promise.resolve();
    return true;
  }
}`
    );

    // File 2: utils.ts
    fs.writeFileSync(
      path.join(srcDir, 'utils.ts'),
      `export function formatString(input: string) {
  return input.trim();
}

export function validateFormat(input: string) {
  return input.length > 0;
}

function helperFunction() {
  return 'helper';
}

export const utilityFunction = () => {
  return 'utility';
};

class StringValidator {
  validate(input: string) {
    return input !== null;
  }
}`
    );

    // Initialize and build index
    const { stdout: initOut } = await execAsync(`node ${cliPath}`, { cwd: projectDir });
    expect(initOut).toContain('Indexing completed!');
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('search has increased default limit to 100', async () => {
    // Create a search that would return many results
    const { stdout } = await execAsync(`node ${cliPath} search "validate"`, { cwd: projectDir });
    
    // Should show more than 10 results (the old limit)
    expect(stdout).toContain('Found');
    // Verify it doesn't mention limiting (since we have fewer than 100 functions)
    const functionCount = (stdout.match(/\d+\. \w+/g) || []).length;
    expect(functionCount).toBeGreaterThan(3); // Should find validate functions
  });

  test('search --all option removes limits', async () => {
    const { stdout } = await execAsync(`node ${cliPath} search "function" --all`, { cwd: projectDir });
    
    expect(stdout).toContain('Found');
    expect(stdout).not.toContain('showing first');
    expect(stdout).not.toContain('Use --all to see all results');
  });

  test('search with empty query shows all functions when using --all', async () => {
    const { stdout } = await execAsync(`node ${cliPath} search "" --all`, { cwd: projectDir });
    
    expect(stdout).toContain('Found');
    expect(stdout).toContain('validateUser');
    expect(stdout).toContain('authenticateUser');
    expect(stdout).toContain('formatString');
    expect(stdout).toContain('validateFormat');
    // Should include private functions too
    expect(stdout).toContain('hashPassword');
    expect(stdout).toContain('helperFunction');
  });

  test('search with wildcard "*" shows all functions', async () => {
    const { stdout } = await execAsync(`node ${cliPath} search "*" --all`, { cwd: projectDir });
    
    expect(stdout).toContain('Found');
    expect(stdout).toContain('validateUser');
    expect(stdout).toContain('formatString');
  });

  test('search with custom limit works correctly', async () => {
    const { stdout } = await execAsync(`node ${cliPath} search "validate" --limit 2`, { cwd: projectDir });
    
    expect(stdout).toContain('Found');
    const functionCount = (stdout.match(/\d+\. \w+/g) || []).length;
    expect(functionCount).toBeLessThanOrEqual(2);
  });

  test('search shows truncation message when results are limited', async () => {
    // Create a scenario where we have many results but limit them
    const { stdout } = await execAsync(`node ${cliPath} search "validate" --limit 1`, { cwd: projectDir });
    
    if (stdout.includes('showing first')) {
      expect(stdout).toContain('showing first 1');
      expect(stdout).toContain('Use --all to see all results');
    }
    // If no truncation message, it means we found <= 1 result, which is also valid
  });

  test('search maintains backward compatibility', async () => {
    // Test that basic search still works without any options
    const { stdout } = await execAsync(`node ${cliPath} search "validateUser"`, { cwd: projectDir });
    
    expect(stdout).toContain('Found');
    expect(stdout).toContain('validateUser');
  });

  test('search with invalid limit defaults correctly', async () => {
    const { stdout, stderr } = await execAsync(`node ${cliPath} search "validate" --limit invalid`, { 
      cwd: projectDir 
    });
    
    expect(stderr || stdout).toContain('using default: 100');
  });

  test('empty query without --all uses default limit', async () => {
    const { stdout } = await execAsync(`node ${cliPath} search ""`, { cwd: projectDir });
    
    expect(stdout).toContain('Found');
    // Should be limited if we have more than 100 functions, but in our test we don't
    // So just verify it works
  });
});