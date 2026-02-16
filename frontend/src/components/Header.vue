<script setup lang="ts">
import { computed, ref } from 'vue'
import { LogInIcon, UserIcon } from '../assets'
import { authClient } from '../auth-client'
import UserMenu from './UserMenu.vue'
import '../styles/components/Header.scss'

const session = authClient.useSession()
const menuOpen = ref(false)
const show_user_icon = computed(() =>
  !session.value?.isPending && !!session.value?.data,
)

function toggleUserMenu() {
  menuOpen.value = !menuOpen.value
}

function closeUserMenu() {
  menuOpen.value = false
}

function goToLogin() {
  window.location.href = '/login'
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
