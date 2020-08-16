<template>
  <div>
    <p>{{ x.y.z | localFilterA }}</p>
    <p>{{ id[0] | localFilterB }}</p>
    <p>{{ $options.filters.filterA(prop) | localFilterC }}</p>
    <p>{{ prop | localFilterA | filterB }}</p>
    <p>{{ methodFilter(prop) }}</p>
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
  },
  methods: {
    methodFilter(x: string): string {
      return this.$options.filters.importedFilter(x);
    },
  },
})
</script>

