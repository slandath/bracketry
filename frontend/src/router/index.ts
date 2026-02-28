import { createRouter, createWebHistory } from 'vue-router'
import { authClient } from '../auth-client'
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

router.beforeEach((to) => {
  const session = authClient.useSession()
  const sessionData = session.value?.data
  const isAuthenticated = !!sessionData?.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }

  if (to.meta.role === 'admin' && sessionData?.user?.role !== 'admin') {
    return '/'
  }
})

export default router
