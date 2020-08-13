"use strict";

const rule = require("../rules/destroy-filter");

const eslint = require("eslint");
const RuleTester = eslint.RuleTester;

const parserOptions = {
  ecmaVersion: 11,
  parser: "@typescript-eslint/parser",
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
  errors: errors(2),
  output: `
  <template>
    <div>{{ filterB(filterA(xxxx)) }}</div>
  </template>
  <script>
  import Vue from 'vue';
  import { filterA, filterB } from 'path/to/filters.ts';
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
  errors: errors(2),
  output: `
  <template>
    <div>{{ filterA(xxxx, 'arg1', arg2) }}</div>
  </template>
  <script>
  import Vue from 'vue';
  import { filterA } from 'path/to/filters.ts';
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
  errors: errors(2),
  output: `
  <template>
    <div v-bind:id="filter(rawId)" disabled :class="computedClass">{{ xxxx }}</div>
  </template>
  <script>
  import Vue from 'vue';
  import { filter } from 'path/to/filters.ts';
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
  <script lang="ts">
  import Vue from 'vue';
  export default Vue.extend({
    computed: {
      compute(): string{
        return 'string';
      },
    },
  });
  </script>
  `,
  errors: errors(5),
  output: `
  <template>
    <div
      v-bind:id="filterY(filterX(rawId))"
      disabled
      :class="computedClass"
      :key="filterK(rawKey)"
    >
      {{ filterB(filterA(xxxx)) }}
      <div>{{ filterD(filterC(yyyy, arg1, 'arg2')) }}</div>
    </div>
  </template>
  <script lang="ts">
  import Vue from 'vue';
  import { filterA, filterB, filterC, filterD, filterK, filterX, filterY } from 'path/to/filters.ts';
  export default Vue.extend({
    computed: {
      compute(): string{
        return 'string';
      },
    },
  });
  </script>
  `
};

const invalid = [multiFilter, filterWithArg, filterInAttr, deluxePattern];

ruleTester.run("destroy-filter", rule, { valid, invalid });
