import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App)
app.mount('#app')

document.getElementById("year")!.textContent = new Date()
  .getFullYear()
  .toString();
