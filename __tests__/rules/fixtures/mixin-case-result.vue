<template>
  <div :id="idFilter(id)">
    <p>{{ filterA(prop) }}</p>
  </div>
</template>
<script lang="ts">
import mixins from 'vue-typed-mixins';
import Mixin from 'mixin';
import { filterA, idFilter } from 'path/to/filters.ts';

export default mixins(Mixin).extend({
  methods: {
    filterA,
    idFilter,
  },
});
</script>
