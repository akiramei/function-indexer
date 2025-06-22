import * as fs from 'fs';
import * as path from 'path';

export interface ProjectInfo {
  root: string;
  type: 'typescript' | 'javascript' | 'unknown';
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  srcDirs: string[];
  suggestedRoot: string;
}

/**
 * Detect project root and configuration
 */
export function detectProject(startPath: string = process.cwd()): ProjectInfo {
  const projectRoot = findProjectRoot(startPath);
  const hasPackageJson = fs.existsSync(path.join(projectRoot, 'package.json'));
  const hasTsConfig = fs.existsSync(path.join(projectRoot, 'tsconfig.json'));
  
  // Determine project type
  let type: 'typescript' | 'javascript' | 'unknown' = 'unknown';
  if (hasTsConfig) {
    type = 'typescript';
  } else if (hasPackageJson) {
    type = 'javascript';
  }
  
  // Find source directories
  const srcDirs = findSourceDirectories(projectRoot);
  const suggestedRoot = suggestRootDirectory(projectRoot, srcDirs);
  
  return {
    root: projectRoot,
    type,
    hasPackageJson,
    hasTsConfig,
    srcDirs,
    suggestedRoot
  };
}

/**
 * Find the project root by looking for package.json or .git
 */
function findProjectRoot(startPath: string): string {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;
  
  while (currentPath !== root) {
    // Check for project markers
    if (
      fs.existsSync(path.join(currentPath, 'package.json')) ||
      fs.existsSync(path.join(currentPath, '.git')) ||
      fs.existsSync(path.join(currentPath, 'tsconfig.json'))
    ) {
      return currentPath;
    }
    
    currentPath = path.dirname(currentPath);
  }
  
  // If no project root found, return the starting path
  return path.resolve(startPath);
}

/**
 * Find common source directories with enhanced detection
 */
function findSourceDirectories(projectRoot: string): string[] {
  const foundDirs: string[] = [];
  
  // 1. First, try to detect from tsconfig.json
  const tsconfigDirs = detectFromTsConfig(projectRoot);
  if (tsconfigDirs.length > 0) {
    foundDirs.push(...tsconfigDirs);
  }
  
  // 2. Try to detect from package.json
  if (foundDirs.length === 0) {
    const packageDirs = detectFromPackageJson(projectRoot);
    if (packageDirs.length > 0) {
      foundDirs.push(...packageDirs);
    }
  }
  
  // 3. Fallback to common directory patterns
  if (foundDirs.length === 0) {
    const commonDirs = ['src', 'lib', 'app', 'source', 'sources'];
    
    for (const dir of commonDirs) {
      const fullPath = path.join(projectRoot, dir);
      try {
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
          foundDirs.push(dir);
        }
      } catch {
        // Handle potential filesystem errors gracefully
        continue;
      }
    }
  }
  
  // 4. If still no directories found, check for TypeScript files in root
  if (foundDirs.length === 0) {
    try {
      const hasRootTsFiles = fs.readdirSync(projectRoot)
        .some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
      
      if (hasRootTsFiles) {
        foundDirs.push('.');
      }
    } catch {
      // Directory doesn't exist or can't be read, return empty array
    }
  }
  
  return foundDirs;
}

/**
 * Detect source directories from tsconfig.json
 */
function detectFromTsConfig(projectRoot: string): string[] {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    // Remove comments and parse JSON
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    const tsconfig = JSON.parse(cleanContent);
    
    const includePaths = tsconfig.include || [];
    const srcDirs: string[] = [];
    
    for (const includePath of includePaths) {
      // Extract directory from patterns like "src/**/*", "lib/**/*.ts"
      const match = includePath.match(/^([^*]+)/);
      if (match) {
        let dir = match[1].replace(/\/$/, ''); // Remove trailing slash
        if (dir && dir !== '.' && !srcDirs.includes(dir)) {
          // Verify directory exists
          const fullPath = path.join(projectRoot, dir);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            srcDirs.push(dir);
          }
        }
      }
    }
    
    return srcDirs;
  } catch {
    // Failed to parse tsconfig.json
    return [];
  }
}

/**
 * Detect source directories from package.json
 */
function detectFromPackageJson(projectRoot: string): string[] {
  const packagePath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    const srcDirs: string[] = [];
    
    // Check files field
    if (pkg.files && Array.isArray(pkg.files)) {
      for (const file of pkg.files) {
        if (typeof file === 'string') {
          // Extract directory from patterns like "src/", "lib/**"
          const match = file.match(/^([^*]+)/);
          if (match) {
            let dir = match[1].replace(/\/$/, ''); // Remove trailing slash
            if (dir && dir !== '.' && dir !== 'dist' && dir !== 'build' && !srcDirs.includes(dir)) {
              // Verify directory exists
              const fullPath = path.join(projectRoot, dir);
              if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                srcDirs.push(dir);
              }
            }
          }
        }
      }
    }
    
    // Check main field for additional hints
    if (pkg.main && typeof pkg.main === 'string') {
      const mainDir = path.dirname(pkg.main);
      if (mainDir !== '.' && mainDir !== 'dist' && mainDir !== 'build') {
        const fullPath = path.join(projectRoot, mainDir);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && !srcDirs.includes(mainDir)) {
          srcDirs.push(mainDir);
        }
      }
    }
    
    return srcDirs;
  } catch {
    // Failed to parse package.json
    return [];
  }
}

/**
 * Suggest the best root directory for scanning
 */
function suggestRootDirectory(projectRoot: string, srcDirs: string[]): string {
  // Prefer 'src' if it exists
  if (srcDirs.includes('src')) {
    return path.join(projectRoot, 'src');
  }
  
  // Otherwise use the first found directory
  if (srcDirs.length > 0 && srcDirs[0] !== '.') {
    return path.join(projectRoot, srcDirs[0]);
  }
  
  // Default to project root
  return projectRoot;
}

/**
 * Load .gitignore patterns if available
 */
export function loadGitignorePatterns(projectRoot: string): string[] {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const defaultPatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/.cache/**'
  ];
  
  if (!fs.existsSync(gitignorePath)) {
    return defaultPatterns;
  }
  
  try {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    const patterns = gitignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => {
        // Improve gitignore pattern conversion logic
        if (pattern.endsWith('/')) {
          // Directory pattern: foo/ becomes **/foo/**
          return `**/${pattern.slice(0, -1)}/**`;
        }
        // File or glob pattern: foo becomes **/foo
        return `**/${pattern}`;
      });
    
    return [...defaultPatterns, ...patterns];
  } catch {
    return defaultPatterns;
  }
}

// Maintain backward compatibility
export const ProjectDetector = {
  detectProject,
  loadGitignorePatterns
};