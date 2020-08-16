'use strict';

const {
  transformPipeExpression,
  transformCallExpression,
  isThisOptionFilters,
  isOptionFilters,
  extractFilterNamesInCallExpression,
} = require('../../utils/transform-filter.js');

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

const traverseInner = (context, node, filters) => {
  if (!node) return;
  if (node.type !== 'VExpressionContainer') {
    node.children &&
      node.children.forEach(c => traverseInner(context, c, filters));
    return;
  }

  const { expression } = node;
  if (!expression) {
    return;
  }

  switch (expression.type) {
    case 'VFilterSequenceExpression':
      if (expression.expression.type === 'CallExpression') {
        filters.push(...extractFilterNamesInCallExpression(expression.expression));
      }
      filters.push(...expression.filters.map(f => f.callee.name));
      const transformed = transformPipeExpression(expression);
      fix(context, node, `{{ ${transformed} }}`);
      break;
    case 'CallExpression':
      const filterName = isOptionFilters(expression.callee);
      if (filterName) {
        filters.push(...extractFilterNamesInCallExpression(expression));
        const transformed = transformCallExpression(expression);
        fix(context, node, `{{ ${transformed} }}`);
      }
      break;
    default:
      break;
  }

  node.children &&
    node.children.forEach(c => traverseInner(context, c, filters));
};

const traverseAttr = (context, node, filters) => {
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
      filters.push(...expression.filters.map(f => f.callee.name));

      fix(context, f, `${bindName}:${boundArg}="${transformed}"`);
    });
  }

  node.children &&
    node.children.forEach(c => traverseAttr(context, c, filters));
};

const resolveImports = (context, node, filters, localFilters) => {
  if (filters.length === 0) {
    return;
  }

  const imports = node.body.filter(n => n.type === 'ImportDeclaration');
  const last = imports[imports.length - 1];

  const withoutLocal = filters.filter(
    f => !localFilters.find(lf => lf.key.name === f),
  );

  const uniq = [...new Set(withoutLocal)].sort();
  const source = context.options[0] || 'path/to/filters.ts';
  const replace = `
import { ${uniq.join(', ')} } from '${source}';`;

  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.insertTextAfter(last, replace),
  });
};

const addMethods = (context, node, filters, localFilters) => {
  if (filters.length === 0 && localFilters.length === 0) {
    return;
  }

  if (node.parent.parent.type !== 'ExportDefaultDeclaration') {
    return;
  }

  const withoutLocal = filters.filter(
    f => !localFilters.find(lf => lf.key.name === f),
  );
  const methods = [...new Set(withoutLocal)].sort();
  const sourceCode = context.getSourceCode();
  const localFilterTexts = localFilters.map(lf => sourceCode.getText(lf));
  methods.push(...localFilterTexts);

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

const fixOptions = (context, node, filters) => {
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
      value
        .filter(v => isNode(v))
        .forEach(n => fixOptions(context, n, filters));
    } else if (isNode(value)) {
      fixOptions(context, value, filters);
    }
  });
};

const cutLocalFilters = (context, localFilter) => {
  if (!localFilter) {
    return [];
  }

  const localfilters = localFilter.value.properties;
  const sourceCode = context.getSourceCode();
  const commaLike = sourceCode.getTokenAfter(localFilter);
  const tmp = sourceCode.getTokenAfter(commaLike);
  const isComma = commaLike.type === 'Punctuator' && commaLike.value === ',';
  const range = [
    localFilter.range[0],
    isComma ? commaLike.range[1] : localFilter.range[1],
  ];

  context.report({
    node: localFilter,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.removeRange(range),
  });

  return localfilters;
};

const findFiltersProps = rootNode => {
  const vueNode = rootNode.body.find(
    n =>
      n.type === 'ExportDefaultDeclaration' &&
      n.declaration.callee.object.name === 'Vue',
  );
  const innerVue = vueNode.declaration.arguments[0].properties;

  return innerVue.find(prop => prop.key.name === 'filters');
}

const fixPipes = (context, node, filters, localFilters) => {
  traverseInner(context, node.templateBody, filters);
  traverseAttr(context, node.templateBody, filters);
  node.body.forEach(n => fixOptions(context, n, filters));

  const filtersProps = findFiltersProps(node);
  localFilters.push(...cutLocalFilters(context, filtersProps));
  resolveImports(context, node, filters, localFilters);
};

module.exports = {
  meta: { fixable: true },
  create(context) {
    const filters = [];
    const localFilters = [];
    return {
      Program: node => {
        fixPipes(context, node, filters, localFilters);
      },
      ObjectExpression: node => {
        addMethods(context, node, filters, localFilters);
      },
    };
  },
};
