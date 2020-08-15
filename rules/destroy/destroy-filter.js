'use strict';

const {
  transformPipeExpression,
  transformCallExpression,
  isThisOptionFilters,
  isOptionFilters,
} = require('../../utils/transform-filter.js');

const filters = [];

const fix = (context, node, result) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.replaceText(node, result),
  });
};

const insertFix = (context, node, range, result) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.insertTextBeforeRange(range, result),
  });
};

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

  switch (expression.type) {
    case 'VFilterSequenceExpression':
      expression.filters.forEach(f => filters.push(f.callee.name));
      const transformed = transformPipeExpression(expression);
      fix(context, node, `{{ ${transformed} }}`);
      break;
    case 'CallExpression':
      const filterName = isOptionFilters(expression.callee);
      if (filterName) {
        filters.push(filterName);
        const transformed = transformCallExpression(expression);
        fix(context, node, `{{ ${transformed} }}`);
      }
      break;
    default:
      break;
  }

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
      const bindName = name.rawName === ':' ? '' : `v-${name.rawName}`;
      const expression = f.value.expression;
      const transformed = transformPipeExpression(expression);
      expression.filters.forEach(f => filters.push(f.callee.name));

      fix(context, f, `${bindName}:${boundArg}="${transformed}"`);
    });
  }

  node.children && node.children.forEach(c => traverseAttr(context, c));
};

const resolveImports = (context, node) => {
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
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.insertTextAfter(last, replace),
  });
};

const addMethods = (context, node) => {
  if (filters.length === 0) {
    return;
  }

  if (node.parent.parent.type !== 'ExportDefaultDeclaration') {
    return;
  }

  const methods = [...new Set(filters)].sort();

  const methodsKey = node.properties.find(prop => prop.key.name === 'methods');
  if (methodsKey) {
    const currentMethods = methodsKey.value.properties;
    const lastMethod = currentMethods[currentMethods.length - 1];
    const range = [lastMethod.range[1] + 1, lastMethod.range[1] + 1];
    const replace = `
    ${methods.join(',\n    ')},`;
    insertFix(context, node, range, replace);
  } else {
    const methodBlock = `  methods: {
    ${methods.join(',\n    ')},
  },
`;
    const range = [node.range[1] - 1, node.range[1]];
    insertFix(context, node, range, methodBlock);
  }
};

const isNode = nodeLike => {
  return nodeLike && nodeLike.type && nodeLike.loc && nodeLike.range;
};

const fixOptions = (context, node) => {
  if (node.type === 'MemberExpression' && isThisOptionFilters(node)) {
    const filterName = node.property.name;
    filters.push(filterName);
    fix(context, node, `this.${filterName}`);
  }

  Object.entries(node).forEach(([key, value]) => {
    if (key === 'parent') {
      return;
    }
    if (Array.isArray(value)) {
      value.filter(v => isNode(v)).forEach(n => fixOptions(context, n));
    } else if (isNode(value)) {
      fixOptions(context, value);
    }
  });
};

const fixPipes = (context, node) => {
  traverseInner(context, node.templateBody);
  traverseAttr(context, node.templateBody);
  node.body.forEach(n => fixOptions(context, n));
  resolveImports(context, node);
};

module.exports = {
  meta: { fixable: true },
  create(context) {
    filters.splice(0);
    return {
      Program: node => {
        fixPipes(context, node);
      },
      ObjectExpression: node => {
        addMethods(context, node);
      },
    };
  },
};
