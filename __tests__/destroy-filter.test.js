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
  parser: require.resolve("vue-eslint-parser"),
  parserOptions,
  plugins: ["vue"]
};
const ruleTester = new RuleTester(settings);

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
  `
  }
];

const errors = (n = 1) =>
  [...Array(n).keys()].map(() => ({ message: "Vue2 style filters are deprecated" }));

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
  errors: errors(),
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
  errors: errors(),
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
    <div v-bind:id="rawId | filter" disabled :class="computedClass">{{ xxxx }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `,
  errors: errors(),
  output: `
  <template>
    <div v-bind:id="$options.filters.filter(rawId)" disabled :class="computedClass">{{ xxxx }}</div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `
};

const deluxePattern = {
  code: `
  <template>
    <div
      v-bind:id="rawId | filterX | filterY"
      disabled
      :class="computedClass"
      :key="rawKey | filterK"
    >
      {{ xxxx | filterA | filterB }}
      <div>{{ yyyy | filterC(arg1, 'arg2') | filterD }}</div>
    </div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `,
  errors: errors(4),
  output: `
  <template>
    <div
      v-bind:id="$options.filters.filterY($options.filters.filterX(rawId))"
      disabled
      :class="computedClass"
      :key="$options.filters.filterK(rawKey)"
    >
      {{ $options.filters.filterB($options.filters.filterA(xxxx)) }}
      <div>{{ $options.filters.filterD($options.filters.filterC(yyyy, arg1, 'arg2')) }}</div>
    </div>
  </template>
  <script>
  import Vue from 'vue';
  export default Vue.extend({});
  </script>
  `
};

const invalid = [multiFilter, filterWithArg, filterInAttr, deluxePattern];

ruleTester.run("destroy-filter", rule, { valid, invalid });
