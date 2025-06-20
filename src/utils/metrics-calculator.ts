import { Node, SyntaxKind, FunctionDeclaration, MethodDeclaration, ArrowFunction, FunctionExpression } from 'ts-morph';
import { FunctionMetrics } from '../types';

export class MetricsCalculator {
  static calculateMetrics(node: FunctionDeclaration | MethodDeclaration | ArrowFunction | FunctionExpression, functionBody: string): FunctionMetrics {
    // More precise LOC calculation - exclude braces and empty lines
    const bodyWithoutBraces = functionBody.replace(/^\s*{\s*/, '').replace(/\s*}\s*$/, '');
    const lines = bodyWithoutBraces.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\s*[{}]\s*$/));
    
    // Combine all metrics calculation in a single AST traversal
    const combinedMetrics = MetricsCalculator.calculateAllMetricsInSinglePass(node);
    
    return {
      linesOfCode: lines.length,
      cyclomaticComplexity: combinedMetrics.cyclomaticComplexity,
      cognitiveComplexity: combinedMetrics.cognitiveComplexity,
      nestingDepth: combinedMetrics.nestingDepth,
      parameterCount: node.getParameters ? node.getParameters().length : 0,
      hasReturnType: !!node.getReturnTypeNode?.()
    };
  }

  /**
   * Calculate all metrics in a single AST traversal for better performance
   */
  private static calculateAllMetricsInSinglePass(node: Node): {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    nestingDepth: number;
  } {
    let cyclomaticComplexity = 1; // Base path
    let cognitiveComplexity = 0;
    let maxNestingDepth = 0;

    const traverseNode = (currentNode: Node, nestingLevel: number) => {
      const kind = currentNode.getKind();
      let newNestingLevel = nestingLevel;
      let addCognitiveComplexity = 0;

      // Handle control flow structures
      switch (kind) {
        case SyntaxKind.IfStatement:
          cyclomaticComplexity++;
          addCognitiveComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;

        case SyntaxKind.WhileStatement:
        case SyntaxKind.ForStatement:
        case SyntaxKind.ForInStatement:
        case SyntaxKind.ForOfStatement:
        case SyntaxKind.DoStatement:
          cyclomaticComplexity++;
          addCognitiveComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;

        case SyntaxKind.SwitchStatement:
          addCognitiveComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;

        case SyntaxKind.CaseClause:
          cyclomaticComplexity++;
          break;

        case SyntaxKind.CatchClause:
          cyclomaticComplexity++;
          addCognitiveComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;

        case SyntaxKind.ConditionalExpression:
          cyclomaticComplexity++;
          addCognitiveComplexity = 1 + nestingLevel;
          break;

        case SyntaxKind.TryStatement:
          newNestingLevel++;
          break;

        case SyntaxKind.BinaryExpression: {
          const binaryExpr = currentNode as any;
          const operatorToken = binaryExpr.getOperatorToken();
          if (operatorToken.getKind() === SyntaxKind.AmpersandAmpersandToken || 
              operatorToken.getKind() === SyntaxKind.BarBarToken) {
            cyclomaticComplexity++;
            addCognitiveComplexity = 1;
          }
          break;
        }
      }

      cognitiveComplexity += addCognitiveComplexity;
      maxNestingDepth = Math.max(maxNestingDepth, newNestingLevel);

      // Traverse children
      currentNode.forEachChild(child => traverseNode(child, newNestingLevel));
    };

    node.forEachChild(child => traverseNode(child, 0));

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepth: maxNestingDepth
    };
  }

}