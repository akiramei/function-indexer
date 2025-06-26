import { Command } from 'commander';

/**
 * Define command aliases for better user experience
 */
export const commandAliases = {
  // Single letter aliases for most common commands
  's': 'search',
  'd': 'diff',
  'r': 'report',
  'm': 'metrics',
  'u': 'update',
  
  // Two letter aliases for compound commands
  'ls': 'list',
  'sh': 'show-history',
  'gd': 'generate-descriptions',
  
  // Validation commands
  'v': 'validate',
  'rp': 'repair',
  'b': 'backup',
  'rs': 'restore',
  
  // Update commands
  'ua': 'update-all',
} as const;

export type AliasKey = keyof typeof commandAliases;
export type CommandName = typeof commandAliases[AliasKey];

/**
 * Apply command aliases to the program
 */
export function applyCommandAliases(program: Command): void {
  // Check if any of the command line arguments are aliases and replace them
  const args = process.argv.slice(2); // Remove 'node' and script name
  
  if (args.length > 0) {
    const firstArg = args[0];
    
    // Check if the first argument is an alias
    if (firstArg in commandAliases) {
      const actualCommand = commandAliases[firstArg as AliasKey];
      
      // Create a new array instead of modifying process.argv directly
      const newArgs = [...process.argv];
      newArgs[2] = actualCommand;
      
      // Safely replace process.argv with the new array
      process.argv.splice(0, process.argv.length, ...newArgs);
    }
  }
}

/**
 * Get help text for command aliases
 */
export function getAliasHelpText(): string {
  const lines = [
    'Command Aliases:',
    '',
    '  Common Commands:',
    '    s   → search         Search for functions',
    '    ls  → list           List all functions',
    '    m   → metrics        Show code quality metrics',
    '    d   → diff           Compare branches/commits',
    '    r   → report         Generate HTML report',
    '    u   → update         Update function index',
    '',
    '  Other Commands:',
    '    sh  → show-history      Show search history',
    '    gd  → generate-descriptions  Generate AI descriptions',
    '    v   → validate          Validate index integrity',
    '    ua  → update-all        Update all indexes',
    '',
    '  New Structure Examples:',
    '    fx                      # Initialize or update index',
    '    fx s "parse json"       # Search for JSON parsing functions',
    '    fx ls                   # List all functions',
    '    fx m                    # Show metrics overview',
    '    fx metrics collect      # Collect metrics data',
    '    fx metrics show         # Show function metrics',
    '    fx metrics trends       # Analyze trends',
    '    fx metrics pr 123       # Show PR metrics',
  ];
  
  return lines.join('\n');
}