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
  if (node.type !== 'VElement') {
    node.children && node.children.forEach(c => traverseAttr(context, c));
    return;
  }

  const { attributes } = node.startTag;
  attributes.forEach(attr => {
    if (!attr.value) return;

    const { expression } = attr.value;
    if (!expression || expression.type !== 'VFilterSequenceExpression') {
      return;
    }
    const name = attr.key.name;
    const boundArg = attr.key.argument.name;
    const bindName = name.rawName === ':' ? '' : `v-${name.rawName}`

    const transformed = transformFilter(expression);
    fix(context, node.startTag, `<div ${bindName}:${boundArg}="${transformed}">`);
  });

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
