import { createRouter, createWebHistory } from 'vue-router'
import Admin from '../views/Admin.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/admin', component: Admin, meta: {
      requiresAuth: true,
      role: 'admin',
    } },
  ],
})

export default router
