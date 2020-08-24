<template>
  <div :id="id | idFilter">
    <p>{{ prop | filterA }}</p>
  </div>
</template>
<script lang="ts">
import mixins from 'vue-typed-mixins';
import Mixin from 'mixin';

export default mixins(Mixin).extend({
});
</script>
