<template>
  <p>{{ x.y.z | filter }}</p>
  <p>{{ id[0] | filter }}</p>
  <p>{{ $options.filters.filterA(prop) }}</p>
  <p>{{ prop | filterA | filterB | filterC(arg1.x, 1) }}</p>
  <div>
    <p>{{ $options.filters.filterX($options.filters.filterY(prop, arg1)) }}</p>
  </div>
  <p>{{ methodFilter(x.y.z) }}</p>
  <div>
    {{ $options.filters.truncate($options.filters.truncate($options.filters.yen(value), 5), list[2],) | truncate(1) }}
  </div>
</template>
<script lang="ts">
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
    methodFilter(x: string): string {
      return this.$options.filters.importedFilter(x);
    },
  },
})
</script>

