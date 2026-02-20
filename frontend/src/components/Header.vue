<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogInIcon, UserIcon } from '../assets'
import { authClient } from '../auth-client'
import UserMenu from './UserMenu.vue'

const session = authClient.useSession()
const menuOpen = ref(false)
const route = useRoute()
const router = useRouter()
const show_user_icon = computed(() =>
  !session.value?.isPending && !!session.value?.data?.user,
)

function toggleUserMenu() {
  menuOpen.value = !menuOpen.value
}

function closeUserMenu() {
  menuOpen.value = false
}

function goToLogin() {
  sessionStorage.setItem('post_login_redirect', route.fullPath)
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}
</script>

<template>
  <header>
    <div class="header">
      <h1>Basketball</h1>
      <div v-if="!show_user_icon" class="btn-container">
        <button class="header-btn icon" title="Log In" @click="goToLogin">
          <LogInIcon />
        </button>
      </div>
      <div v-else class="btn-container">
        <button class="header-btn icon" title="User menu" @click="toggleUserMenu">
          <UserIcon />
        </button>
      </div>
      <UserMenu
        v-if="session.data?.user"
        :is-open="menuOpen"
        :user="session.data.user"
        @close="closeUserMenu"
      />
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.icon {
  display: flex;
  align-items: center;
  color: hsl(198 100% 44%);
}

.header-btn {
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  background-color: transparent;
  color: white;
}

.header-btn:hover {
  opacity: 0.9;
}

.btn-container {
  display: flex;
  gap: 1rem;
}
</style>
