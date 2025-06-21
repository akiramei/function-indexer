import chalk from 'chalk';

export interface ErrorContext {
  command: string;
  action: string;
  verbose?: boolean;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public configPath?: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class GitError extends Error {
  constructor(message: string, public gitCommand?: string) {
    super(message);
    this.name = 'GitError';
  }
}

export class IndexError extends Error {
  constructor(message: string, public filePath?: string) {
    super(message);
    this.name = 'IndexError';
  }
}

/**
 * Enhanced error handler for function-indexer commands
 */
export function handle(error: Error, context: ErrorContext): never {
  const { command, action, verbose = false } = context;

  // Log the action that failed
  console.error(chalk.red(`❌ ${action} failed`));

  // Handle specific error types
  if (error instanceof ValidationError) {
    handleValidationError(error);
  } else if (error instanceof ConfigurationError) {
    handleConfigurationError(error);
  } else if (error instanceof GitError) {
    handleGitError(error);
  } else if (error instanceof IndexError) {
    handleIndexError(error);
  } else {
    handleGenericError(error, verbose);
  }

  // Provide helpful suggestions based on command
  provideSuggestions(command, error);

  process.exit(1);
}

function handleValidationError(error: ValidationError): void {
    console.error(chalk.yellow('📝 Input validation failed:'));
    console.error(chalk.gray(`   ${error.message}`));
    
    if (error.field) {
      console.error(chalk.gray(`   Field: ${error.field}`));
    }
  }

function handleConfigurationError(error: ConfigurationError): void {
    console.error(chalk.yellow('⚙️ Configuration error:'));
    console.error(chalk.gray(`   ${error.message}`));
    
    if (error.configPath) {
      console.error(chalk.gray(`   Config file: ${error.configPath}`));
    }
  }

function handleGitError(error: GitError): void {
    console.error(chalk.yellow('🔄 Git operation failed:'));
    console.error(chalk.gray(`   ${error.message}`));
    
    if (error.gitCommand) {
      console.error(chalk.gray(`   Command: ${error.gitCommand}`));
    }
    
    console.error(chalk.gray('\n   Common solutions:'));
    console.error(chalk.gray('   • Ensure you are in a git repository'));
    console.error(chalk.gray('   • Check if the branch exists: git branch -a'));
    console.error(chalk.gray('   • Fetch all branches: git fetch --all'));
  }

function handleIndexError(error: IndexError): void {
    console.error(chalk.yellow('📊 Index operation failed:'));
    console.error(chalk.gray(`   ${error.message}`));
    
    if (error.filePath) {
      console.error(chalk.gray(`   File: ${error.filePath}`));
    }
    
    console.error(chalk.gray('\n   Common solutions:'));
    console.error(chalk.gray('   • Run `function-indexer` to create/update the index'));
    console.error(chalk.gray('   • Check file permissions'));
    console.error(chalk.gray('   • Verify the file exists and is readable'));
  }

function handleGenericError(error: Error, verbose: boolean): void {
    if (verbose) {
      console.error(chalk.red('\n💥 Full error details:'));
      console.error(chalk.gray(error.stack || error.message));
    } else {
      console.error(chalk.gray(`   ${error.message}`));
      console.error(chalk.gray('\n   💡 Run with --verbose for detailed error information'));
    }
  }

function provideSuggestions(command: string, error: Error): void {
    console.error(chalk.blue('\n🆘 Getting help:'));
    
    switch (command) {
      case 'diff':
        console.error(chalk.gray('   • Check the diff documentation: function-indexer diff --help'));
        console.error(chalk.gray('   • Ensure both branches exist and are accessible'));
        console.error(chalk.gray('   • Try a simpler comparison: function-indexer diff main'));
        break;
        
      case 'report':
        console.error(chalk.gray('   • Check the report documentation: function-indexer report --help'));
        console.error(chalk.gray('   • Ensure the function index exists: ls .function-indexer/'));
        console.error(chalk.gray('   • Try regenerating the index: function-indexer'));
        break;
        
      case 'ci':
        console.error(chalk.gray('   • Check the CI documentation: function-indexer ci --help'));
        console.error(chalk.gray('   • Verify your CI environment setup'));
        console.error(chalk.gray('   • Test locally first: function-indexer ci --no-fail-on-violation'));
        break;
        
      default:
        console.error(chalk.gray('   • Check the general documentation: function-indexer --help'));
        console.error(chalk.gray('   • Visit: https://github.com/akiramei/function-indexer'));
    }
    
    console.error(chalk.gray('   • Open an issue: https://github.com/akiramei/function-indexer/issues'));
  }

/**
 * Validate common inputs and throw ValidationError if invalid
 */
export function validateInput(value: any, fieldName: string, validator: (val: any) => boolean, message?: string): void {
    if (!validator(value)) {
      throw new ValidationError(
        message || `Invalid value for ${fieldName}: ${value}`,
        fieldName
      );
    }
  }

/**
 * Validate that a path exists and is accessible
 */
export async function validatePath(path: string, type: 'file' | 'directory' = 'file'): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const stat = await fs.stat(path);
      
      if (type === 'file' && !stat.isFile()) {
        throw new ValidationError(`Path is not a file: ${path}`);
      }
      if (type === 'directory' && !stat.isDirectory()) {
        throw new ValidationError(`Path is not a directory: ${path}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Path does not exist or is not accessible: ${path}`);
    }
  }

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string, fieldName: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new ValidationError(
        `Invalid JSON in ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fieldName
      );
    }
  }

/**
 * Wrap async functions with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handle(error instanceof Error ? error : new Error(String(error)), context);
  }
}

/**
 * Create a user-friendly error message for file operations
 */
export function createFileError(operation: string, filePath: string, originalError?: Error): IndexError {
    let message = `Failed to ${operation} file: ${filePath}`;
    
    if (originalError) {
      if (originalError.message.includes('ENOENT')) {
        message += ' (file not found)';
      } else if (originalError.message.includes('EACCES')) {
        message += ' (permission denied)';
      } else if (originalError.message.includes('EISDIR')) {
        message += ' (is a directory)';
      } else {
        message += ` (${originalError.message})`;
      }
    }
    
    return new IndexError(message, filePath);
  }

/**
 * Create a user-friendly error message for Git operations
 */
export function createGitError(operation: string, details?: string): GitError {
  let message = `Git ${operation} failed`;
  
  if (details) {
    message += `: ${details}`;
  }
  
  return new GitError(message, operation);
}