import { Node, SyntaxKind, FunctionDeclaration, MethodDeclaration, ArrowFunction, FunctionExpression } from 'ts-morph';
import { FunctionMetrics } from '../types';

export class MetricsCalculator {
  static calculateMetrics(node: FunctionDeclaration | MethodDeclaration | ArrowFunction | FunctionExpression, functionBody: string): FunctionMetrics {
    // More precise LOC calculation - exclude braces and empty lines
    const bodyWithoutBraces = functionBody.replace(/^\s*{\s*/, '').replace(/\s*}\s*$/, '');
    const lines = bodyWithoutBraces.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\s*[{}]\s*$/));
    
    return {
      linesOfCode: lines.length,
      cyclomaticComplexity: this.calculateCyclomaticComplexity(node),
      cognitiveComplexity: this.calculateCognitiveComplexity(node),
      nestingDepth: this.calculateNestingDepth(node),
      parameterCount: node.getParameters ? node.getParameters().length : 0,
      hasReturnType: !!node.getReturnTypeNode?.()
    };
  }

  /**
   * サイクロマティック複雑度を計算
   * 各判定ポイント（if, while, for, case, catch, &&, ||など）に+1
   */
  private static calculateCyclomaticComplexity(node: Node): number {
    let complexity = 1; // 基本パス

    const countComplexityNodes = (currentNode: Node) => {
      // 条件分岐
      if (currentNode.getKind() === SyntaxKind.IfStatement) {
        complexity++;
      }
      
      // ループ
      if ([SyntaxKind.WhileStatement, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.DoStatement].includes(currentNode.getKind())) {
        complexity++;
      }
      
      // Switch case
      if (currentNode.getKind() === SyntaxKind.CaseClause) {
        complexity++;
      }
      
      // Try-catch
      if (currentNode.getKind() === SyntaxKind.CatchClause) {
        complexity++;
      }
      
      // 条件演算子
      if (currentNode.getKind() === SyntaxKind.ConditionalExpression) {
        complexity++;
      }
      
      // 論理演算子 (&&, ||)
      if (currentNode.getKind() === SyntaxKind.BinaryExpression) {
        const binaryExpr = currentNode as any;
        const operatorToken = binaryExpr.getOperatorToken();
        if (operatorToken.getKind() === SyntaxKind.AmpersandAmpersandToken || 
            operatorToken.getKind() === SyntaxKind.BarBarToken) {
          complexity++;
        }
      }

      // 子ノードを再帰的に処理
      currentNode.forEachChild(countComplexityNodes);
    };

    node.forEachChild(countComplexityNodes);
    return complexity;
  }

  /**
   * 認知的複雑度を計算
   * ネストレベルとコントロール構造の複雑さを考慮
   */
  private static calculateCognitiveComplexity(node: Node): number {
    let complexity = 0;

    const calculateRecursive = (currentNode: Node, nestingLevel: number) => {
      const kind = currentNode.getKind();
      
      // ネストレベルを増加させる構造
      let newNestingLevel = nestingLevel;
      let addComplexity = 0;

      switch (kind) {
        case SyntaxKind.IfStatement:
          addComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;
          
        case SyntaxKind.WhileStatement:
        case SyntaxKind.ForStatement:
        case SyntaxKind.ForInStatement:
        case SyntaxKind.ForOfStatement:
        case SyntaxKind.DoStatement:
          addComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;
          
        case SyntaxKind.SwitchStatement:
          addComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;
          
        case SyntaxKind.CatchClause:
          addComplexity = 1 + nestingLevel;
          newNestingLevel++;
          break;
          
        case SyntaxKind.ConditionalExpression:
          addComplexity = 1 + nestingLevel;
          break;
          
        case SyntaxKind.BinaryExpression:
          const binaryExpr = currentNode as any;
          const operatorToken = binaryExpr.getOperatorToken();
          if (operatorToken.getKind() === SyntaxKind.AmpersandAmpersandToken || 
              operatorToken.getKind() === SyntaxKind.BarBarToken) {
            addComplexity = 1;
          }
          break;
      }

      complexity += addComplexity;

      // 子ノードを再帰的に処理
      currentNode.forEachChild(child => calculateRecursive(child, newNestingLevel));
    };

    node.forEachChild(child => calculateRecursive(child, 0));
    return complexity;
  }

  /**
   * ネストの深さを計算
   * 最大のネストレベルを返す（制御構造のみカウント）
   */
  private static calculateNestingDepth(node: Node): number {
    let maxDepth = 0;

    const calculateDepth = (currentNode: Node, currentDepth: number) => {
      const kind = currentNode.getKind();
      
      // ネストレベルを増加させる構造（制御構造のみ）
      let newDepth = currentDepth;
      
      if ([
        SyntaxKind.IfStatement,
        SyntaxKind.WhileStatement,
        SyntaxKind.ForStatement,
        SyntaxKind.ForInStatement,
        SyntaxKind.ForOfStatement,
        SyntaxKind.DoStatement,
        SyntaxKind.SwitchStatement,
        SyntaxKind.TryStatement,
        SyntaxKind.CatchClause
      ].includes(kind)) {
        newDepth++;
        maxDepth = Math.max(maxDepth, newDepth);
      }

      // 子ノードを再帰的に処理
      currentNode.forEachChild(child => calculateDepth(child, newDepth));
    };

    node.forEachChild(child => calculateDepth(child, 0));
    return maxDepth;
  }
}