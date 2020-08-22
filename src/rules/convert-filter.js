'use strict';

const replaceFix = (context, node, result) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: (fixer) => fixer.replaceText(node, result),
  });
};

const replaceRangeFix = (context, replace, ...nodes) => {
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const range = [first.range[0], last.range[1]];
  context.report({
    node: first,
    message: 'Vue2 style filters are deprecated',
    fix: (fixer) => fixer.replaceTextRange(range, replace),
  });
};

const transformFilter = (sourceCode, name, filter) => {
  if (filter.type === 'Identifier') {
    return name.value === filter.name
      ? `export { ${name.value} }`
      : `export const ${name.value} = ${filter.name}`;
  }

  if (filter.type === 'ArrowFunctionExpression') {
    const func = sourceCode.getText(filter);
    return `export const ${name.value} = ${func}`;
  }

  if (filter.type === 'FunctionExpression') {
    const func = sourceCode.getText(filter).replace(/^function\s*/, '');
    return `export function ${name.value}${func}`;
  }
};

const convertFilter = (context, node) => {
  const [name, filter] = node.arguments;
  const src = context.getSourceCode();
  const replace = transformFilter(src, name, filter);
  const token = src.getTokenAfter(node);

  if (
    filter.type === 'FunctionExpression' &&
    token.type === 'Punctuator' &&
    token.value === ';'
  ) {
    replaceRangeFix(context, replace, node, token);
    return;
  }

  replaceFix(context, node, replace);

  if (['ArrowFunctionExpression', 'FunctionExpression'].includes(filter.type)) {
    resolveImports(context, name.value);
  }
};

const resolveImports = (context, name) => {
  const [root] = context.getAncestors();
  const imports = root.body.filter((n) => n.type === 'ImportDeclaration');

  const vueImport = imports.find(
    (i) => i.source.type === 'Literal' && i.source.value === 'vue',
  );
  if (vueImport) {
    const token = context.getSourceCode().getTokenAfter(vueImport);
    context.report({
      node: vueImport,
      message: 'Vue2 style filters are deprecated',
      fix: (fixer) => fixer.removeRange([vueImport.range[0], token.range[0]]),
    });
  }

  const found = imports.find((i) =>
    i.specifiers.some((sp) => sp.local.name === name),
  );
  if (!found) return;

  const { specifiers } = found;
  const spec = specifiers.find((sp) => sp.local.name === name);
  if (!spec) return;
  const replace =
    spec.type === 'ImportDefaultSpecifier' ? `_${name}` : `${name} as _${name}`;

  context.report({
    node: spec,
    message: 'Vue2 style filters are deprecated',
    fix: (fixer) => fixer.replaceText(spec, replace),
  });
};

module.exports = {
  meta: { fixable: true },
  create(context) {
    return {
      'CallExpression[callee.object.name="Vue"][callee.property.name="filter"]:exit': (
        node,
      ) => {
        convertFilter(context, node);
      },
    };
  },
};
