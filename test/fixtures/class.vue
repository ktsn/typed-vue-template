<template>
  <div>
    <p>{{ message }}</p>
    <div>
      <p>This is static</p>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
export default class MyComp extends Vue {
  message = 'Hi'
}
</script>
