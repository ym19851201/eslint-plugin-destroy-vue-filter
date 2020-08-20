const {
  transformPipeExpression,
  transformCallExpression,
  extractFilterNamesInCallExpression,
  findVueProps,
  isType,
} = require('../../src/utils/transform-filter.js');

const pipeExpression = require('./fixtures/pipe.json');
const mixedExpresstion = require('./fixtures/mixed.json');
const callExpresstion = require('./fixtures/call.json');
const callComplicatedExpresstion = require('./fixtures/call-complicated.json');

const filter = require('./fixtures/filter-names.json');

describe('transformPipeExpression', () => {
  test('Pipe case', () => {
    expect(transformPipeExpression(pipeExpression)).toEqual(
      "filterC(filterB(filterA(x.y.z), arg1, 'arg2'))",
    );
  });

    test('Mixed case', () => {
      expect(transformPipeExpression(mixedExpresstion)).toEqual("filterC(filterB(filterA(arg1)), arg2, 1)");
    });
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

describe('extractFilterNamesInCallExpression', () => {
  test('case', () => {
    expect(extractFilterNamesInCallExpression(filter)).toEqual(
      ['filterName', 'truncate', 'yen'],
    );
  });
});
