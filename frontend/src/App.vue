<script setup lang="ts">
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <div id="app-container">
    <Header />
    <router-view />
    <Footer />
    <Toast />
  </div>
</template>

<style>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
