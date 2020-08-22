'use strict';

const {
  transformPipeExpression,
  transformCallExpression,
  findThisOptionFilters,
  findOptionFilters,
  extractFilterNamesInCallExpression,
  isNode,
  attrHasType,
  attrHasOptionFilters,
} = require('../utils/transform-filter.js');

const replaceFix = (context, node, replace) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.replaceText(node, replace),
  });
};

const insertFix = (context, node, range, insert) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.insertTextBeforeRange(range, insert),
  });
};

const removeRangeFix = (context, node, range) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.removeRange(range),
  });
}

const insertAfterFix = (context, node, prev, insert) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.insertTextAfter(prev, insert),
  });
}

const processFilterSequence = (context, expression, filters) => {
  replaceFix(context, expression, transformPipeExpression(expression));

  filters.push(...expression.filters.map(f => f.callee.name));
  if (expression.expression.type === 'CallExpression') {
    filters.push(...extractFilterNamesInCallExpression(expression.expression));
  }
};

const processCallExpression = (context, expression, filters) => {
  replaceFix(context, expression, transformCallExpression(expression));
  filters.push(...extractFilterNamesInCallExpression(expression));
};

const fixExpressions = (context, node, filters) => {
  if (!node) return;
  if (node.type !== 'VExpressionContainer') {
    node.children &&
      node.children.forEach(c => fixExpressions(context, c, filters));
    return;
  }

  const { expression } = node;
  if (!expression) {
    return;
  }

  switch (expression.type) {
    case 'VFilterSequenceExpression':
      processFilterSequence(context, expression, filters);
      break;
    case 'CallExpression':
      const filterName = findOptionFilters(expression.callee);
      if (filterName) {
        processCallExpression(context, expression, filters);
      }
      break;
    default:
      break;
  }

  node.children &&
    node.children.forEach(c => fixExpressions(context, c, filters));
};

const fixAttrs = (context, node, filters) => {
  if (!node) return;

  if (node.type === 'VElement' && node.startTag) {
    const filterExpressions = node.startTag.attributes.filter(attr =>
      attrHasType(attr, 'VFilterSequenceExpression'),
    );

    filterExpressions.forEach(f => {
      processFilterSequence(context, f.value.expression, filters);
    });

    const callExpressions = node.startTag.attributes.filter(attr =>
      attrHasType(attr, 'CallExpression') && attrHasOptionFilters(attr),
    );

    callExpressions.forEach(f => {
      processCallExpression(context, f.value.expression, filters);
    });
  }

  node.children &&
    node.children.forEach(c => fixAttrs(context, c, filters));
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

  insertAfterFix(context, node, last, replace);
};

const addMethods = (context, node, filters, localFilters) => {
  const sourceCode = context.getSourceCode();
  const methods = methodsTexts(filters, localFilters, sourceCode);

  const methodsKey = node.properties.find(prop => prop.key.name === 'methods');
  if (methodsKey) {
    const currentMethods = methodsKey.value.properties;
    const lastMethod = currentMethods[currentMethods.length - 1];
    const range = rangeWithTrailingComma(lastMethod, sourceCode);
    const insert = `
    ${methods.join(',\n    ')},`;
    context.report({
      node,
      message: 'Vue2 style filters are deprecated',
      fix: fixer => fixer.insertTextAfterRange(range, insert),
    });
  } else {
    const methodBlock = `  methods: {
    ${methods.join(',\n    ')},
  },
`;
    const lastToken = context.getSourceCode().getLastToken(node);
    insertFix(context, node, lastToken.range, methodBlock);
  }
};

const methodsTexts = (filters, localFilters, sourceCode) => {
  const localRemoved = filters.filter(
    f => !localFilters.find(lf => lf.key.name === f),
  );
  const methods = [...new Set(localRemoved)].sort();
  const localFilterTexts = localFilters.map(lf => sourceCode.getText(lf));
  methods.push(...localFilterTexts);

  return methods;
}

const fixOptions = (context, node, filters) => {
  const optionFilterName = findThisOptionFilters(node);
  if (optionFilterName) {
    filters.push(optionFilterName);
    replaceFix(context, node, `this.${optionFilterName}`);
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

const rangeWithTrailingComma = (node, sourceCode) => {
  const commaLike = sourceCode.getTokenAfter(node);
  const isComma = commaLike.type === 'Punctuator' && commaLike.value === ',';

  return [
    node.range[0],
    isComma ? commaLike.range[1] : node.range[1],
  ];
}

const fixFilters = (context, node, filters) => {
  fixExpressions(context, node.templateBody, filters);
  fixAttrs(context, node.templateBody, filters);
  node.body.forEach(n => fixOptions(context, n, filters));
};

const cutLocalFilters = (context, node) => {
  const localFilters = node.value.properties;
  const sourceCode = context.getSourceCode();

  const range = rangeWithTrailingComma(node, sourceCode);
  removeRangeFix(context, node, range);

  return localFilters;
};

module.exports = {
  meta: { fixable: true },
  create(context) {
    const filters = [];
    const localFilters = [];
    const vueSelector = 'CallExpression[callee.object.name="Vue"][callee.property.name="extend"]';
    const innerVue = 'ObjectExpression';
    const methodsSelector = 'Property[key.name="methods"]'
    const filtersSelector = 'Property[key.name="filters"]'

    const props = `${[vueSelector, innerVue].join('>')}:exit`;
    const methods = [vueSelector, innerVue, methodsSelector].join('>');
    const filtersKey = [vueSelector, innerVue, filtersSelector].join('>');

    return {
      Program: node => {
        fixFilters(context, node, filters);
      },
      'Program:exit': node => {
        resolveImports(context, node, filters, localFilters);
      },
      [props]: node => {
        if (filters.length === 0 && localFilters.length === 0) {
          return;
        }
        addMethods(context, node, filters, localFilters);
      },
      [filtersKey]: node => {
        localFilters.push(...cutLocalFilters(context, node));
      },
    };
  },
};
