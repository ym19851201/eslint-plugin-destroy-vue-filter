'use strict';

const fix = (context, node, result) => {
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    fix: fixer => fixer.replaceText(node, result),
  });
};

const fix2 = (context, node) => {
  const range = [node.range[0], node.range[1] + 1];
  context.report({
    node,
    message: 'Vue2 style filters are deprecated',
    //    fix: (fixer) => fixer.remove(node),
    fix: fixer => fixer.removeRange(range),
  });
};

const imports = [];
const transform = (src, { name, func }) => {
  if (['ArrowFunctionExpression'].includes(func.type)) {
    return `export const ${name} = ${src.getText(func)}`;
  } else if (func.type === 'FunctionExpression') {
    return `export function ${name} {${src.getText(src, func.body.body)}}`;
  }
};

const partition = (array, f) => {
  return array.reduce(
    (acc, e) => {
      const [left, right] = acc;
      const toPush = f(e) ? left : right;
      toPush.push(e);
      return acc;
    },
    [[], []],
  );
};

const transformImport = (defaultSpec, specs, source) => {
  if (!specs || specs.length === 0) {
    const def = imports.includes(defaultSpec) ? `_${defaultSpec}` : defaultSpec;
    return `import ${def} from '${source}';`;
  }

  const names = specs.map(name =>
    imports.includes(name) ? `${name} as _${name}` : name,
  );
  const named = `{ ${names.join(', ')} }`;
  if (!defaultSpec) {
    return `import ${named} from '${source}';`;
  }

  const def = imports.includes(defaultSpec) ? `_${defaultSpec}` : defaultSpec;

  return `import ${def}, ${named} from '${source}';`;
};

const traverseFilters = (vueName = 'Vue') => (context, node) => {
  const { body } = node;
  if (!body) {
    return;
  }

  body.forEach(n => {
    if (n.type !== 'ExpressionStatement') {
      traverseFilters(vueName)(context, n);
      return;
    }

    const { expression } = n;
    if (expression.type !== 'CallExpression') {
      traverseFilters(vueName)(context, n);
      return;
    }

    const { callee } = expression;
    if (callee.object.name !== vueName || callee.property.name !== 'filter') {
      traverseFilters(vueName)(context, n);
      return;
    }

    const [filterName, func] = expression.arguments;

    if (['ArrowFunctionExpression', 'FunctionExpression'].includes(func.type)) {
      const filter = { name: filterName.value, func };
      fix(context, expression, transform(context.getSourceCode(), filter));
    } else if (func.type === 'Identifier') {
      const { name } = func;

      let replace;
      if (filterName.value === name) {
        imports.push(name);
        replace = `export const ${name} = _${name}`;
      } else {
        replace = `export const ${filterName.value} = ${name}`;
      }

      fix(context, expression, replace);
    }

    traverseFilters(vueName)(context, n);
  });
};

const traverseImports = (context, node) => {
  const importDeclarations = node.body.filter(
    n => n.type === 'ImportDeclaration',
  );

  importDeclarations.forEach(dec => {
    const { specifiers } = dec;
    if (specifiers.every(sp => !imports.includes(sp.local.name))) {
      return;
    }

    const [defaultSpecs, specs] = partition(
      specifiers,
      sp => sp.type === 'ImportDefaultSpecifier',
    );
    const defaultSpec = !defaultSpecs[0] ? null : defaultSpecs[0].local.name;
    const names = specs.map(sp => sp.local.name);
    const transformed = transformImport(defaultSpec, names, dec.source.value);

    fix(context, dec, transformed);
  });
};

module.exports = {
  meta: { fixable: true },
  create(context) {
    return {
      Program: node => {
        traverseFilters()(context, node);
        traverseImports(context, node);
      },
    };
  },
};
