<template>
  <p>{{ message }}</p>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      message: 'Hi'
    }
  }
})
</script>
