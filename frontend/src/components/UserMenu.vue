<script setup lang="ts">
import { CloseIcon, LogOutIcon } from '../assets'
import { authClient } from '../auth-client'
import '../styles/components/UserMenu.scss'

defineProps<{
  isOpen: boolean
  user: {
    name: string
    email: string
  }
}>()

const emit = defineEmits<{
  close: []
}>()

async function handleSignOut() {
  try {
    await authClient.signOut()
  }
  catch (err) {
    console.error('Sign Out Error:', err)
  }
}
</script>

<template>
  <Transition name="slide">
    <div v-if="isOpen" class="overlay" @click="emit('close')" />
  </Transition>
  <Transition name="slide">
    <aside v-if="isOpen" class="menu-container">
      <div class="btn-container">
        <button class="menu-btn" @click="emit('close')">
          <CloseIcon />
        </button>
        <button class="menu-btn" @click="handleSignOut">
          <LogOutIcon />
        </button>
      </div>
      <p>{{ user.name }}</p>
      <p>{{ user.email }}</p>
    </aside>
  </Transition>
</template>
