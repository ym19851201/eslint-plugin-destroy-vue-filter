'use strict';

const resolveCallee = (context, node) => {
  const [root] = context.getAncestors();
  const imports = root.body.filter((n) => n.type === 'ImportDeclaration');

  const { callee } = node;
  const { name: calleeName } = callee;
  const found = imports
    .map((i) => i.specifiers)
    .flat()
    .find((sp) => sp.local.name === `_${calleeName}`);
  if (!found) return;

  context.report({
    node: callee,
    message: 'Vue2 style filters are deprecated',
    fix: (fixer) => fixer.replaceText(callee, `_${calleeName}`),
  });
};

module.exports = {
  meta: { fixable: true },
  create(context) {
    return {
      'CallExpression[callee.object.name!="Vue"][callee.property.name!="filter"][callee.type="Identifier"]': (
        node,
      ) => {
        resolveCallee(context, node);
      },
    };
  },
};
