"use strict";


const transformFilter = (expression) => {
  const result = expression.filters.reduce((acc, f) => {
    const callee = `$options.filters.${f.callee.name}`;
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
  fix(context, node, `{{ ${transformed} }}`);
  node.children && node.children.forEach(c => traverseInner(context, c));
};

const traverseAttr = (context, node) => {
  if (!node) return;

  if (node.type === 'VElement' && node.startTag) {
    const filters = node.startTag.attributes.filter(attr => {
      const { value } = attr;
      if (!value) return false;

      const { expression } = value;
      if (!expression) return false;

      return expression.type === 'VFilterSequenceExpression';
    });

    filters.forEach(f => {
      const boundArg = f.key.argument.name;
      const name = f.key.name;
      const bindName = name.rawName === ':' ? '' : `v-${name.rawName}`
      const expression = f.value.expression;
      const filter = transformFilter(expression);

      fix(context, f, `${bindName}:${boundArg}="${filter}"`);
    });
  }

  node.children && node.children.forEach(c => traverseAttr(context, c));
}

const traverse = (context, node) => {
  traverseInner(context, node);
  traverseAttr(context, node);
}

module.exports = {
  meta: { fixable: true, },
  create(context) {
    return {
      Program: node => {
        traverse(context, node.templateBody);
      },
    };
  },
}
