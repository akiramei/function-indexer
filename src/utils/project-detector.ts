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
 * Find common source directories
 */
function findSourceDirectories(projectRoot: string): string[] {
  const commonDirs = ['src', 'lib', 'app', 'source', 'sources'];
  const foundDirs: string[] = [];
  
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
  
  // If no common directories found, check for TypeScript files in root
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