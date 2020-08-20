<template>
  <p>{{ filter(x.y.z) }}</p>
  <p>{{ filter(id[0]) }}</p>
  <p>{{ filterA(prop) }}</p>
  <p>{{ filterC(filterB(filterA(prop)), arg1.x, 1) }}</p>
  <div>
    <p>{{ filterX(filterY(prop, arg1)) }}</p>
  </div>
  <p>{{ methodFilter(x.y.z) }}</p>
  <div>
    {{ truncate(truncate(truncate(yen(value), 5), list[2]), 1) }}
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { filter, filterA, filterB, filterC, filterX, filterY, importedFilter, truncate, yen } from 'path/to/filters.ts';
export default Vue.extend({
  computed: {
    test() {
      return this.x && this.y ? this.yen(this.x) : '-';
    },
    test2() {
      return this.yen(this.x);
    },
  },
  methods: {
    methodA() {
    },
    methodFilter(x: string): string {
      return this.importedFilter(x);
    },
    filter,
    filterA,
    filterB,
    filterC,
    filterX,
    filterY,
    importedFilter,
    truncate,
    yen,
  },
})
</script>

