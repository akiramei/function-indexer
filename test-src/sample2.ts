// Another sample file for testing
export function processArray(items: string[]): string[] {
  return items.map(item => item.trim());
}

export function validateEmail(email: string): boolean {
  return email.includes('@');
}