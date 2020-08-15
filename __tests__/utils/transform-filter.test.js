const {
  transformPipeExpression,
  transformCallExpression,
} = require('../../utils/transform-filter.js');

const pipeExpression = require('./pipe.json');
//const mixedExpresstion = require('./mixed.json');
const callExpresstion = require('./call.json');
const callComplicatedExpresstion = require('./call-complicated.json');

describe('transformPipeExpression', () => {
  test('Pipe case', () => {
    expect(transformPipeExpression(pipeExpression)).toEqual(
      "filterC(filterB(filterA(x.y.z), arg1, 'arg2'))",
    );
  });

  //  test('Mixed case', () => {
  //    expect(transformFilter(mixedExpresstion)).toEqual("filterB(filterA(x))");
  //  });
});

describe('transformCallExpression', () => {
  test('Call case', () => {
    expect(transformCallExpression(callExpresstion)).toEqual(
      "filterA(filterB(prop, arg1, 'arg2'))",
    );
  });

  test('Comlicated call case', () => {
    expect(transformCallExpression(callComplicatedExpresstion)).toEqual(
      "filterA(filterB(x.y.z), arg1, 'arg2', a.b.c)",
    );
  });
});
