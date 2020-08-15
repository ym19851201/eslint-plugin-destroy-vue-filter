<template>
<p>{{ filter(x.y.z) }}</p>
<p>{{ filter(id[0]) }}</p>
<p>{{ filterA(prop) }}</p>
</template>
<script>
import Vue from 'vue';
import { filter, filterA, yen } from 'path/to/filters.ts';
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
    filter,
    filterA,
    yen,
  },
})
</script>

