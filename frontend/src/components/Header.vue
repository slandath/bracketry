<script setup lang="ts">
import { Button } from 'primevue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authClient } from '../auth-client'
import { useCurrentBracketOnLogin } from '../composables'
import UserMenu from './UserMenu.vue'
import '../styles/components/Header.scss'

const session = authClient.useSession()
const menuOpen = ref(false)
const route = useRoute()
const router = useRouter()
const show_user_icon = computed(() =>
  !session.value?.isPending && !!session.value?.data?.user,
)
const { data: currentBracketData } = useCurrentBracketOnLogin()
const hasBracket = computed(() => !!currentBracketData.value?.bracket)
const currentYear = computed(() => new Date().getFullYear())

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
      <h1>{{ currentYear }} March Madness Bracket</h1>
      <div v-if="!show_user_icon" class="btn-container">
        <Button icon="pi pi-sign-in" title="Log In" text @click="goToLogin" />
      </div>
      <div v-else class="btn-container">
        <Button icon="pi pi-user" title="User menu" variant="outlined" size="large" @click="toggleUserMenu" />
      </div>
      <UserMenu
        v-if="session.data?.user"
        :is-open="menuOpen"
        :user="session.data.user"
        :has-bracket="hasBracket"
        @close="closeUserMenu"
        @update:is-open="menuOpen = $event"
      />
    </div>
  </header>
</template>
