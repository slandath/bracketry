<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CloseIcon, LogOutIcon } from '../assets'
import { authClient } from '../auth-client'
import '../styles/components/UserMenu.scss'

interface User {
  name: string
  email: string
}

interface Props {
  isOpen: boolean
  user?: User
}
const props = withDefaults(defineProps<Props>(), { user: undefined })
const emit = defineEmits<{
  close: []
}>()

const router = useRouter()

async function handleSignOut() {
  try {
    await authClient.signOut()
    emit('close')
    router.push('/')
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
      <p>{{ props.user?.name }}</p>
      <p>{{ props.user?.email }}</p>
    </aside>
  </Transition>
</template>
