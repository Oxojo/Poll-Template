<script setup>
  import AppHeader from './component/AppHeader.vue';
</script>
<template>
  <div class="apps">
    <AppHeader />
    <router-view />
  </div>
</template>
<style>
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap');
* {
  font-family: "Zen Maru Gothic", serif;
}
.apps {
  justify-content: center;
  align-items: center;
}
</style>