"use strict";


const filters = [];

const extractMemberExpression = (memberExp) => {
  if (memberExp.type === 'Identifier') {
//    return `${memberExp.name}.`;
    return memberExp.name;
  }
  const { object, property } = memberExp;
  return extractMemberExpression(object) + '.' + property.name;
}

const extractExpressionArg = (expression) => {
  const { type } = expression;
  if (type === 'Identifier') {
    return expression.name
  }

  if (type === 'Literal') {
    return expression.raw;
  }

  if (type === 'MemberExpression') {
    return extractMemberExpression(expression);
  }
}

const transformFilter = (expression) => {
  const expressionArg = extractExpressionArg(expression.expression);

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
  }, expressionArg);

  return result;
}

const fix = (context, node, result) => {
  context.report({ 
    node,
    message: "Vue2 style filters are deprecated",
    fix: (fixer) => fixer.replaceText(node, result),
  });
}

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

const traverseVue = (context, node) => {
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
    ${methods.join(',\n    ')},`
    insertFix(context, node, range, replace);
  } else {
    const methodBlock = 
`  methods: {
    ${methods.join(',\n    ')},
  },
`;
    const range = [node.range[1] - 1, node.range[1]];
    insertFix(context, node, range, methodBlock);
  }
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
      ObjectExpression: node => {
        traverseVue(context, node);
      },
    };
  },
}
