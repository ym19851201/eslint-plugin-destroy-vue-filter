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
}

const transformCallExpression = (expression) => {
  const callee = extractExpressionName(expression.callee).replace('$options.filters.', '');
  const args = expression.arguments.map(a => {
    const name =  extractExpressionName(a);
    if (name) return name;

    return transformCallExpression(a);
  });

  return `${callee}(${args.join(', ')})`;
}

const transformFilter = expression => {
  if (expression.type === 'VFilterSequenceExpression') {
    return transformPipeExpression(expression);
  } else if (expression.type === 'CallExpression') {
    return transformCallExpression(expression);
  }
}

module.exports = {
  transformFilter,
  extractExpressionName,
};
