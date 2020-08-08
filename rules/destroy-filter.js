"use strict";


const traverse = (context, node) => {
  if (node.type !== 'VExpressionContainer') {
    node.children && node.children.forEach(c => traverse(context, c));
    return;
  }

  const { expression } = node;
  if (!expression) {
    return;
  }

  if (expression.type !== 'VFilterSequenceExpression') {
    expression.children && expression.children.forEach(c => traverse(context, c));
    return;
  }

  const filters = expression.filters;
  const result = filters.reduce((acc, f) => {
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

  context.report({ 
    node,
    message: "Vue2 style filters are deprecated",
    fix: (fixer) => fixer.replaceText(node, `{{ ${result} }}`),
  });
};

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
