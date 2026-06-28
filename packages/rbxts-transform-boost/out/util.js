"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainKey = chainKey;
exports.walk = walk;
exports.walkShallow = walkShallow;
exports.isAssignmentTarget = isAssignmentTarget;
function chainKey(ts, node) {
    if (ts.isIdentifier(node))
        return node.text;
    if (ts.isPropertyAccessExpression(node)) {
        const left = chainKey(ts, node.expression);
        if (left === undefined)
            return undefined;
        return `${left}.${node.name.text}`;
    }
    return undefined;
}
function walk(ts, node, visitor) {
    if (!node)
        return;
    visitor(node);
    ts.forEachChild(node, child => { if (child)
        walk(ts, child, visitor); });
}
function walkShallow(ts, node, visitor) {
    if (!node)
        return;
    visitor(node);
    ts.forEachChild(node, child => {
        if (!child)
            return;
        if (ts.isFunctionDeclaration(child) ||
            ts.isFunctionExpression(child) ||
            ts.isArrowFunction(child) ||
            ts.isMethodDeclaration(child))
            return;
        walkShallow(ts, child, visitor);
    });
}
function isAssignmentTarget(ts, node) {
    const parent = node.parent;
    if (!parent)
        return false;
    if (ts.isBinaryExpression(parent)) {
        return parent.left === node &&
            parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    }
    if (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent))
        return true;
    return false;
}
