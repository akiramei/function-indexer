import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

describe('list command', () => {
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'list-command-test-'));
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

    // Create src directory with sample files
    const srcDir = path.join(projectDir, 'src');
    fs.mkdirSync(srcDir);
    
    // Test TypeScript file with various functions
    fs.writeFileSync(
      path.join(srcDir, 'test.ts'),
      `export function publicFunction() {
  console.log('public');
}

function privateFunction() {
  console.log('private');
}

export async function asyncFunction() {
  await Promise.resolve();
}

export const arrowFunction = () => {
  console.log('arrow');
};

class TestClass {
  method() {
    console.log('method');
  }
  
  async asyncMethod() {
    await Promise.resolve();
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

  test('list command shows all functions without limit', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list`, { cwd: projectDir });
    
    expect(stdout).toContain('Found 6 functions');
    expect(stdout).toContain('publicFunction');
    expect(stdout).toContain('privateFunction');
    expect(stdout).toContain('asyncFunction');
    expect(stdout).toContain('arrowFunction');
    expect(stdout).toContain('TestClass.method');
    expect(stdout).toContain('TestClass.asyncMethod');
  });

  test('list command with --exported filter', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list --exported`, { cwd: projectDir });
    
    expect(stdout).toContain('Found 3 functions');
    expect(stdout).toContain('publicFunction');
    expect(stdout).toContain('asyncFunction');
    expect(stdout).toContain('arrowFunction');
    expect(stdout).not.toContain('privateFunction');
  });

  test('list command with --async filter', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list --async`, { cwd: projectDir });
    
    expect(stdout).toContain('Found 2 functions');
    expect(stdout).toContain('asyncFunction');
    expect(stdout).toContain('TestClass.asyncMethod');
  });

  test('list command with --format simple', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list --format simple`, { cwd: projectDir });
    
    const lines = stdout.trim().split('\n');
    expect(lines.length).toBe(6);
    expect(lines[0]).toMatch(/^src\/test\.ts:\d+:publicFunction$/);
  });

  test('list command with --format json', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list --format json`, { cwd: projectDir });
    
    const functions = JSON.parse(stdout);
    expect(Array.isArray(functions)).toBe(true);
    expect(functions.length).toBe(6);
    expect(functions[0]).toHaveProperty('file');
    expect(functions[0]).toHaveProperty('identifier');
    expect(functions[0]).toHaveProperty('startLine');
  });

  test('list command with --file filter', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list --file "src/test.ts"`, { cwd: projectDir });
    
    expect(stdout).toContain('Found 6 functions');
    expect(stdout).toContain('src/test.ts');
  });

  test('list command with --sort name', async () => {
    const { stdout } = await execAsync(`node ${cliPath} list --format simple --sort name`, { cwd: projectDir });
    
    const lines = stdout.trim().split('\n');
    const functionNames = lines.map(line => line.split(':')[2]);
    
    // Check that the list is sorted (case-insensitive by default)
    for (let i = 1; i < functionNames.length; i++) {
      const comparison = functionNames[i - 1].localeCompare(functionNames[i]);
      expect(comparison).toBeLessThanOrEqual(0);
    }
  });
});