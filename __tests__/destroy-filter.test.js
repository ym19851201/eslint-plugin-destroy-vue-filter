"use strict";

const rule = require("../rules/destroy/destroy-filter");

const eslint = require("eslint");
const RuleTester = eslint.RuleTester;
const fs = require('fs');

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
export default Vue.extend({
  methods: {
    methodA(arg: string) {
      return arg;
    },
  },
});
</script>
`,
  errors: errors(3),
  output: `
<template>
  <div>{{ filterB(filterA(xxxx)) }}</div>
</template>
<script>
import Vue from 'vue';
import { filterA, filterB } from 'path/to/filters.ts';
export default Vue.extend({
  methods: {
    methodA(arg: string) {
      return arg;
    },
    filterA,
    filterB,
  },
});
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
export default Vue.extend({
});
</script>
`,
  errors: errors(3),
  output: `
<template>
  <div>{{ filterA(xxxx, 'arg1', arg2) }}</div>
</template>
<script>
import Vue from 'vue';
import { filterA } from 'path/to/filters.ts';
export default Vue.extend({
  methods: {
    filterA,
  },
});
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
  methods: {
    methodA(arg1: string, arg2: number) {
      return arg1.repeat(arg2);
    },
  },
});
</script>
`,
  errors: errors(6),
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
  methods: {
    methodA(arg1: string, arg2: number) {
      return arg1.repeat(arg2);
    },
    filterA,
    filterB,
    filterC,
    filterD,
    filterK,
    filterX,
    filterY,
  },
});
</script>
`
};

const optionsCode = fs.readFileSync('./__tests__/destroy/options.vue', 'utf8').toString();
const optionsOutput = fs.readFileSync('./__tests__/destroy/options-result.vue', 'utf8').toString();

const optionsCase = {
  code: optionsCode,
  output: optionsOutput,
  errors: errors(7),
}

const invalid = [multiFilter, filterWithArg, deluxePattern, optionsCase];

ruleTester.run("destroy-filter", rule, { valid, invalid });
