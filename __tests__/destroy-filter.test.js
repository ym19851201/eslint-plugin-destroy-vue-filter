"use strict";

const rule = require("../rules/destroy-filter");

const eslint = require("eslint");
const RuleTester = eslint.RuleTester;

const parserOptions = {
  ecmaVersion: 11,
//  parser: "@typescript-eslint/parser",
  sourceType: "module"
};

const settings = {
  env: { browser: true, es2020: true },
  parser: require.resolve('vue-eslint-parser'),
  parserOptions,
  plugins: ['vue'],
};
const ruleTester = new RuleTester(settings);

//const ruleTester = new RuleTester(config);

const valid = [
  {
    code: `
  <template>
    <div>{{ xxxx }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `,
  },
];

const errors = [{ message: "Vue2 style filters are deprecated" }];

const multiFilter = {
  code: `
  <template>
    <div>{{ xxxx | filterA | filterB }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `,
  errors,
  output: `
  <template>
    <div>{{ $options.filters.filterB($options.filters.filterA(xxxx)) }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `

};

const filterWithArg = {
  code: `
  <template>
    <div>{{ xxxx | filterA('arg1', arg2) }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `,
  errors,
  output: `
  <template>
    <div>{{ $options.filters.filterA(xxxx, 'arg1', arg2) }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `
};

const filterInAttr = {
  code: `
  <template>
    <div v-bind:id="rawId | filter">{{ xxxx }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `,
  errors,
  output: `
  <template>
    <div v-bind:id="$options.filters.filter(rawId)">{{ xxxx }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `

};

const invalid = [
  multiFilter,
  filterWithArg,
  filterInAttr,
];

ruleTester.run("destroy-filter", rule, { valid, invalid });
