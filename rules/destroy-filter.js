"use strict";


const filters = [];

const transformFilter = (expression) => {
  const result = expression.filters.reduce((acc, f) => {
    const callee = f.callee.name;
    const args = f.arguments.map(a => {
      if (a.type === 'Literal') {
        return a.raw;
      } else if (a.type === 'Identifier') {
        return a.name;
      }
    });

    return args.length === 0 ? `${callee}(${acc})` 
      : `${callee}(${acc}, ${args.join(', ')})`;
  }, expression.expression.name);

  return result;
}

const fix = (context, node, result) => {
  context.report({ 
    node,
    message: "Vue2 style filters are deprecated",
    fix: (fixer) => fixer.replaceText(node, result),
  });
}

const traverseInner = (context, node) => {
  if (!node) return;
  if (node.type !== 'VExpressionContainer') {
    node.children && node.children.forEach(c => traverseInner(context, c));
    return;
  }

  const { expression } = node;
  if (!expression) {
    return;
  }

  if (expression.type !== 'VFilterSequenceExpression') {
    expression.children && expression.children.forEach(c => traverseInner(context, c));
    return;
  }

  const transformed = transformFilter(expression);
  expression.filters.forEach(f => filters.push(f.callee.name));
  fix(context, node, `{{ ${transformed} }}`);
  node.children && node.children.forEach(c => traverseInner(context, c));
};

const traverseAttr = (context, node) => {
  if (!node) return;

  if (node.type === 'VElement' && node.startTag) {
    const attrFilters = node.startTag.attributes.filter(attr => {
      const { value } = attr;
      if (!value) return false;

      const { expression } = value;
      if (!expression) return false;

      return expression.type === 'VFilterSequenceExpression';
    });

    attrFilters.forEach(f => {
      const boundArg = f.key.argument.name;
      const name = f.key.name;
      const bindName = name.rawName === ':' ? '' : `v-${name.rawName}`
      const expression = f.value.expression;
      const transformed = transformFilter(expression);
      expression.filters.forEach(f => filters.push(f.callee.name));

      fix(context, f, `${bindName}:${boundArg}="${transformed}"`);
    });
  }

  node.children && node.children.forEach(c => traverseAttr(context, c));
}

const traverseImports = (context, node) => {
  if (filters.length === 0) {
    return;
  }

  const imports = node.body.filter(n => n.type === 'ImportDeclaration');
  const last = imports[imports.length - 1];
  const uniq = [...new Set(filters)].sort();
  const source = context.options[0] || 'path/to/filters.ts';
  const replace = `
  import { ${uniq.join(', ')} } from '${source}';`;

  context.report({ 
    node,
    message: "Vue2 style filters are deprecated",
    fix: (fixer) => fixer.insertTextAfter(last, replace),
  });
}

const traverse = (context, node) => {
  traverseInner(context, node.templateBody);
  traverseAttr(context, node.templateBody);
  traverseImports(context, node);
}

module.exports = {
  meta: { fixable: true, },
  create(context) {
    filters.splice(0);
    return {
      Program: node => {
        traverse(context, node);
      },
    };
  },
}
