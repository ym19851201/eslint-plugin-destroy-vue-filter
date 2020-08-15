<template>
<p>{{ x.y.z | filter}}</p>
<p>{{ id[0] | filter}}</p>
<p>{{ $options.filters.filterA(prop) }}</p>
</template>
<script>
import Vue from 'vue';
export default Vue.extend({
	computed: {
      test() {
        return this.x && this.y ? this.$options.filters.yen(this.x) : '-';
      },
      test2() {
        return this.$options.filters.yen(this.x);
      },
    },
  methods: {
    methodA() {
    },
  },
})
</script>

