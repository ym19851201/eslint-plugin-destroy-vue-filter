const extractPropName = property => {
  if (property.type === 'Identifier') {
    return `.${property.name}`;
  }

  if (property.type === 'Literal') {
    return `[${property.raw}]`;
  }
};

const extractMemberExpression = memberExp => {
  if (memberExp.type === 'Identifier') {
    return memberExp.name;
  }
  const { object, property } = memberExp;

  return extractMemberExpression(object) + extractPropName(property);
};

const extractExpressionName = expression => {
  const { type } = expression;
  if (type === 'Identifier') {
    return expression.name;
  }

  if (type === 'Literal') {
    return expression.raw;
  }

  if (type === 'MemberExpression') {
    return extractMemberExpression(expression);
  }

  if (type === 'CallExpression') {
    return transformCallExpression(expression);
  }
};

const transformPipeExpression = expression => {
  const expressionArg = extractExpressionName(expression.expression);

  const result = expression.filters.reduce((acc, f) => {
    const callee = f.callee.name;
    const args = f.arguments.map(a => {
      return extractExpressionName(a);
    });

    return args.length === 0
      ? `${callee}(${acc})`
      : `${callee}(${acc}, ${args.join(', ')})`;
  }, expressionArg);

  return result;
};

const findThisOptionFilters = node => {
  if (node.type !== 'MemberExpression') {
    return false;
  }

  if (node.object.type !== 'MemberExpression') {
    return false;
  }

  if (node.object.object.type !== 'MemberExpression') {
    return false;
  }

  if (node.object.object.object.type !== 'ThisExpression') {
    return false;
  }

  if (node.object.object.property.name !== '$options') {
    return false;
  }

  if (node.object.property.name !== 'filters') {
    return false;
  }

  return node.property.name;
};

const findOptionFilters = memberExp => {
  if (!memberExp) {
    return false;
  }

  if (memberExp.type !== 'MemberExpression') {
    return false;
  }

  if (memberExp.object.type !== 'MemberExpression') {
    return false;
  }

  if (memberExp.object.object.type !== 'Identifier') {
    return false;
  }

  if (memberExp.object.object.name !== '$options') {
    return false;
  }

  if (memberExp.object.property.name !== 'filters') {
    return false;
  }

  return memberExp.property.name;
};

const transformCallExpression = expression => {
  const callee = findOptionFilters(expression.callee);
  if (!callee) {
    return;
  }

  const args = expression.arguments.map(a => {
    const name = extractExpressionName(a);
    if (name) {
      return name;
    }

    return transformCallExpression(a);
  });

  return `${callee}(${args.join(', ')})`;
};

const extractFilterNamesInCallExpression = expression => {
  const filterName = findOptionFilters(expression.callee);
  const optionFilters = expression.arguments.filter(
    arg => arg.type === 'CallExpression' && findOptionFilters(arg.callee),
  );
  return optionFilters.reduce(
    (acc, f) => {
      const name = findOptionFilters(f.callee);
      if (name) {
        acc.push(...extractFilterNamesInCallExpression(f));
      }
      return acc;
    },
    [filterName],
  );
};

const isNode = nodeLike => {
  return nodeLike && nodeLike.type && nodeLike.loc && nodeLike.range;
};

const findVueProps = (rootNode, key) => {
  const vueNode = rootNode.body.find(
    n =>
      n.type === 'ExportDefaultDeclaration' &&
      n.declaration.callee.object.name === 'Vue',
  );
  const innerVue = vueNode.declaration.arguments[0].properties;

  return innerVue.find(prop => prop.key.name === key);
}

const isType = (attr, type) => {
  const { value } = attr;
  if (!value) return false;

  const { expression } = value;
  if (!expression) return false;

  return expression.type === type;
}

module.exports = {
  transformPipeExpression,
  transformCallExpression,
  findThisOptionFilters,
  findOptionFilters,
  extractFilterNamesInCallExpression,
  isNode,
  findVueProps,
  isType,
};
