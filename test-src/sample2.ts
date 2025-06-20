// Another sample file for testing
export function processArray(items: string[]): string[] {
  return items.map(item => item.trim());
}

export function validateEmail(email: string): boolean {
  // Simplified validation for testing purposes only - only checks for '@' character
  return email.includes('@');
}