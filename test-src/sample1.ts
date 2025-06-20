// Sample TypeScript file for testing
export function calculateSum(a: number, b: number): number {
  return a + b;
}

export async function fetchData(url: string): Promise<string> {
  return `Data from ${url}`;
}

export class Calculator {
  multiply(x: number, y: number): number {
    return x * y;
  }
  
  divide(x: number, y: number): number {
    return x / y;
  }
}

export const arrowFunction = (value: string) => value.toUpperCase();