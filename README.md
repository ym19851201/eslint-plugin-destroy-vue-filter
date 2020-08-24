# eslint-plugin-destroy-vue-filter

This plugin consisted of 3 rules converts Vue global filter settings into exports.

## Target
- Those who want to automatically migrate pre-Vue2 code using filters to Vue3 as a transition period to the composition API
- Code written in options API
- Those who have registered global filters in one file

## Unsupported case
Sorry, this plugin won't work if you use filters like below

- `const { filterX } = this.$options.filters`
- `const { filters } = this.$options`
- `const { $options } = this`

## Phase 1.
Convert global filter 

### Before conversion
```vue
import Vue from 'vue';
import def, { numeric } from '~/utils/Strings';
import dollar, { yen, euro } from '~/utils/Money';

Vue.filter('stringDefaultFilter', def);

Vue.filter('percent', (value: string) => `${value}%`);

Vue.filter(
  'numeric',
  (value: string) => `${numeric(value)}`,
);
Vue.filter('dollar', dollar);
Vue.filter('yen', yen);
Vue.filter('eur', euro);

Vue.filter('func', function(xxx: string) {
  return `xxx${xxx}xxx`;
});
```

### After conversion
```vue
import def, { numeric as _numeric } from '~/utils/Strings';
import dollar, { yen, euro } from '~/utils/Money';

export const stringDefaultFilter = def;

export const percent = (value: string) => `${value}%`;

export const numeric = (value: string) => `${_numeric(value)}`;
export { dollar };
export { yen };
export const eur = euro;

export function func(xxx: string) {
  return `xxx${xxx}xxx`;
}
```

## Phase 2.
Convert filters in vue files.
- convert pipe to function call
- convert this.$options.filters to this
- move local filters to methods
- import used filters as functions from path to filters

### Before conversion
```vue
<template>
  <div>
    <p>{{ x.y.z | localFilterA }}</p>
    <p>{{ id[0] | localFilterB }}</p>
    <p>{{ $options.filters.filterA(prop) | localFilterC }}</p>
    <p>{{ prop | localFilterA | filterB }}</p>
    <p>{{ methodFilter(prop) }}</p>
    <p :id="id | idFilter">XXX</p>
    <p :id="$options.filters.idFilter2(id) | localIdFilter">XXX</p>
    <p :id="$options.filters.idFilter3(id)">XXX</p>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  filters: {
    localFilterA(value: string): string {
      return value.toUpperCase();
    },
    localFilterB(value: number): string {
      return value.toString();
    },
    localFilterC(obj: { [key: string]: string }): string {
      const texts = Object.entries(obj).reduce((acc: string[], [k, v]) => {
        acc.push(`${k}: ${v}`);
        return acc;
      }, []);
      return texts.join('\n');
    },
    localIdFilter(id: string): string {
      return id.slice(0, 5);
    },
  },
  methods: {
    methodFilter(x: string): string {
      return this.$options.filters.importedFilter(x);
    },
  },
})
</script>


```

### After conversion
```vue
<template>
  <div>
    <p>{{ localFilterA(x.y.z) }}</p>
    <p>{{ localFilterB(id[0]) }}</p>
    <p>{{ localFilterC(filterA(prop)) }}</p>
    <p>{{ filterB(localFilterA(prop)) }}</p>
    <p>{{ methodFilter(prop) }}</p>
    <p :id="idFilter(id)">XXX</p>
    <p :id="localIdFilter(idFilter2(id))">XXX</p>
    <p :id="idFilter3(id)">XXX</p>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { filterA, filterB, idFilter, idFilter2, idFilter3, importedFilter } from 'path/to/filters.ts';
export default Vue.extend({
  
  methods: {
    methodFilter(x: string): string {
      return this.importedFilter(x);
    },
    filterA,
    filterB,
    idFilter,
    idFilter2,
    idFilter3,
    importedFilter,
    localFilterA(value: string): string {
      return value.toUpperCase();
    },
    localFilterB(value: number): string {
      return value.toString();
    },
    localFilterC(obj: { [key: string]: string }): string {
      const texts = Object.entries(obj).reduce((acc: string[], [k, v]) => {
        acc.push(`${k}: ${v}`);
        return acc;
      }, []);
      return texts.join('\n');
    },
    localIdFilter(id: string): string {
      return id.slice(0, 5);
    },
  },
})
</script>


```

## Installation

Install `Eslint` at first.
```shell
npm install -D eslint
```

Next, intall this plugin.
```shell
npm install -D eslint-plugin-destroy-vue-filter
```

## Usage
Make 2 rc files (one is for Phase 1, the other is for Phase2) and write settings below

### Phase 1 (.eslintrc.convert-filter)

```json
{
  "plugins": ["destroy-vue-filter"],
  "rules": {
    "destroy-vue-filter/convert-filter": 1,
    "destroy-vue-filter/resolve-callee": 1
  }
}
```

### Phase 2 (.eslintrc.destroy-filter)
```
{
  "plugins": ["destroy-vue-filter"],
  "rules": {
    "destroy-vue-filter/destroy-filter": ["error", "<file where global filters registered>"]
  }
}
```

Add script to your `package.json`, if you need.
```json
  "scripts": {
    "convert-filter": "eslint -c <rc file for Phase 1> --fix",
    "destroy-filter": "eslint -c <rc file for Phase 2> --fix **/*.vue"
  },
```

Run this plugin
```shell
$ npm run convert-filter -- <vue file where global filters registered>
$ npm run destroy-filter
```
