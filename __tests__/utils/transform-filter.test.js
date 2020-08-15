const { transformFilter } = require('../../utils/transform-filter.js');

const pipeExpression = require('./pipe.json');
//const mixedExpresstion = require('./mixed.json');
const callExpresstion = require('./call.json');
const callComplicatedExpresstion = require('./call-complicated.json');

describe('transformFilter', () => {
  test('Pipe case', () => {
    expect(transformFilter(pipeExpression)).toEqual("filterC(filterB(filterA(x.y.z), arg1, 'arg2'))");
  });
  //
//  test('Mixed case', () => {
//    expect(transformFilter(mixedExpresstion)).toEqual("filterB(filterA(x))");
//  });

  test('Call case', () => {
    expect(transformFilter(callExpresstion)).toEqual("filterA(filterB(prop, arg1, 'arg2'))");
  });

  test('Comlicated call case', () => {
    expect(transformFilter(callComplicatedExpresstion)).toEqual("filterA(filterB(x.y.z), arg1, 'arg2', a.b.c)");
  });
});
