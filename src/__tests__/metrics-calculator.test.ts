import { Project, FunctionDeclaration, MethodDeclaration } from 'ts-morph';
import { MetricsCalculator } from '../utils/metrics-calculator';

describe('MetricsCalculator', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: true
    });
  });

  afterEach(() => {
    project.getSourceFiles().forEach(sf => project.removeSourceFile(sf));
  });

  describe('Basic Metrics', () => {
    test('should calculate basic metrics for simple function', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function simpleFunction(a: number, b: string): number {
          return a + b.length;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.linesOfCode).toBe(1); // Only the return statement
      expect(metrics.parameterCount).toBe(2);
      expect(metrics.hasReturnType).toBe(true);
      expect(metrics.cyclomaticComplexity).toBe(1); // Base complexity
      expect(metrics.cognitiveComplexity).toBe(0); // No nested control structures
      expect(metrics.nestingDepth).toBe(0); // No nesting
    });

    test('should calculate metrics for function with no parameters', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function noParams() {
          const x = 5;
          console.log(x);
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.parameterCount).toBe(0);
      expect(metrics.hasReturnType).toBe(false);
      expect(metrics.linesOfCode).toBe(2);
    });
  });

  describe('Cyclomatic Complexity', () => {
    test('should calculate complexity for if statement', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function withIf(x: number): number {
          if (x > 0) {
            return x * 2;
          }
          return x;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.cyclomaticComplexity).toBe(2); // Base + if
    });

    test('should calculate complexity for multiple control structures', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function complex(x: number): number {
          if (x > 0) {
            for (let i = 0; i < x; i++) {
              if (i % 2 === 0) {
                continue;
              }
            }
          } else if (x < 0) {
            while (x < -10) {
              x++;
            }
          }
          return x;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      // Base(1) + if(1) + for(1) + if(1) + else if(1) + while(1) = 6
      expect(metrics.cyclomaticComplexity).toBe(6);
    });

    test('should calculate complexity for logical operators', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function withLogicalOps(a: boolean, b: boolean, c: boolean): boolean {
          return a && b || c;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      // Base(1) + &&(1) + ||(1) = 3
      expect(metrics.cyclomaticComplexity).toBe(3);
    });

    test('should calculate complexity for switch statement', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function withSwitch(x: number): string {
          switch (x) {
            case 1:
              return 'one';
            case 2:
              return 'two';
            case 3:
              return 'three';
            default:
              return 'other';
          }
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      // Base(1) + case1(1) + case2(1) + case3(1) = 4 (default doesn't add complexity)
      expect(metrics.cyclomaticComplexity).toBe(4);
    });
  });

  describe('Cognitive Complexity', () => {
    test('should calculate cognitive complexity for nested structures', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function nested(x: number): number {
          if (x > 0) {           // +1
            if (x > 10) {        // +2 (nested)
              for (let i = 0; i < x; i++) {  // +3 (nested)
                if (i % 2 === 0) {           // +4 (nested)
                  continue;
                }
              }
            }
          }
          return x;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      // 1 + 2 + 3 + 4 = 10
      expect(metrics.cognitiveComplexity).toBe(10);
    });

    test('should calculate cognitive complexity for sequential structures', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function sequential(x: number): number {
          if (x > 0) {     // +1
            return x * 2;
          }
          if (x < 0) {     // +1
            return x * -1;
          }
          return x;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      // 1 + 1 = 2 (no nesting penalty)
      expect(metrics.cognitiveComplexity).toBe(2);
    });
  });

  describe('Nesting Depth', () => {
    test('should calculate nesting depth for nested blocks', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function deeplyNested(x: number): number {
          if (x > 0) {
            if (x > 10) {
              if (x > 100) {
                return x * 3;
              }
              return x * 2;
            }
            return x;
          }
          return 0;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.nestingDepth).toBe(3); // Three levels of nesting
    });

    test('should calculate nesting depth for mixed structures', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function mixedNesting(x: number): number {
          try {
            if (x > 0) {
              for (let i = 0; i < x; i++) {
                if (i % 2 === 0) {
                  console.log(i);
                }
              }
            }
          } catch (error) {
            console.error(error);
          }
          return x;
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.nestingDepth).toBe(4); // try > if > for > if
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty function body', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function empty(): void {
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.linesOfCode).toBe(0);
      expect(metrics.cyclomaticComplexity).toBe(1);
      expect(metrics.cognitiveComplexity).toBe(0);
      expect(metrics.nestingDepth).toBe(0);
    });

    test('should handle function with only comments', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function onlyComments(): void {
          // This is a comment
          /* This is a block comment */
        }
      `);

      const func = sourceFile.getFunctions()[0];
      const functionBody = func.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(func, functionBody);

      expect(metrics.linesOfCode).toBe(2); // Comment lines are counted
      expect(metrics.cyclomaticComplexity).toBe(1);
      expect(metrics.cognitiveComplexity).toBe(0);
      expect(metrics.nestingDepth).toBe(0);
    });

    test('should handle method in class', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        class TestClass {
          public testMethod(x: number): number {
            if (x > 0) {
              return x * 2;
            }
            return x;
          }
        }
      `);

      const method = sourceFile.getClasses()[0].getMethods()[0];
      const methodBody = method.getBody()?.getFullText() || '';
      const metrics = MetricsCalculator.calculateMetrics(method, methodBody);

      expect(metrics.linesOfCode).toBe(3);
      expect(metrics.cyclomaticComplexity).toBe(2);
      expect(metrics.parameterCount).toBe(1);
      expect(metrics.hasReturnType).toBe(true);
    });
  });
});