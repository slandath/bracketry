<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CloseIcon, LogOutIcon } from '../assets'
import { authClient } from '../auth-client'
import { useBracketActions } from '../composables/useBracketActions'
import { showToast } from '../composables/useToast'
import '../styles/components/UserMenu.scss'

interface User {
  name: string
  email: string
}

interface Props {
  isOpen: boolean
  user?: User
  hasBracket?: boolean
}
const props = withDefaults(defineProps<Props>(), { user: undefined, hasBracket: false })
const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const { openSelectionTool, triggerEvaluate } = useBracketActions()

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
      <div class="button-container">
        <button class="open-selection-btn" :disabled="hasBracket" @click="openSelectionTool(); emit('close')">
          {{ hasBracket ? 'Picks Made!' : 'Make Picks' }}
        </button>
        <button class="open-selection-btn" @click="triggerEvaluate(); emit('close')">
          Evaluate Bracket
        </button>
      </div>
    </aside>
  </Transition>
</template>
