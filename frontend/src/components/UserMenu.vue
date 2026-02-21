<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CloseIcon, LogOutIcon } from '../assets'
import { authClient } from '../auth-client'
import { showToast } from '../composables/useToast'

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
    showToast(`Sign out error: ${err}`, 'error')
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

<style scoped>
.icon {
  display: flex;
  align-items: center;
  color: hsl(198 100% 44%);
}

.menu-btn {
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  background-color: transparent;
  color: white;
}

.menu-btn:hover {
  opacity: 0.9;
}

.menu-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background-color: hsl(198 100% 44%);
  z-index: 1000;
  font-size: 1rem;
  padding: 1rem;
  opacity: 0.95;
}

.btn-container {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
