const { transformFilter } = require('../../utils/transform-filter.js');

const pipeExpression = require('./pipe.json');
//const mixedExpresstion = require('./mixed.json');
const callExpresstion = require('./call.json');

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
});
