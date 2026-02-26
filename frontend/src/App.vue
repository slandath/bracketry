<script setup lang="ts">
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
import Toast from './components/Toast.vue'
import './styles/components/App.scss'
</script>

<template>
  <div id="app-container" class="app-container">
    <Header />
    <router-view />
    <Footer />
    <Toast />
  </div>
</template>
