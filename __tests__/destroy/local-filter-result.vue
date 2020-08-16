<template>
  <div>
    <p>{{ localFilterA(x.y.z) }}</p>
    <p>{{ localFilterB(id[0]) }}</p>
    <p>{{ localFilterC(filterA(prop)) }}</p>
    <p>{{ filterB(localFilterA(prop)) }}</p>
    <p>{{ methodFilter(prop) }}</p>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { filterA, filterB, importedFilter } from 'path/to/filters.ts';
export default Vue.extend({
  
  methods: {
    methodFilter(x: string): string {
      return this.importedFilter(x);
    },
    filterA,
    filterB,
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
  },
})
</script>

