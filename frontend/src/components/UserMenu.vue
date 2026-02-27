<script setup lang="ts">
import { Drawer } from 'primevue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
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
  'close': []
  'update:isOpen': [value: boolean]
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
  <Drawer
    :visible="isOpen"
    position="right"
    @update:visible="$emit('update:isOpen', $event)"
  >
    <template #header>
      {{ props.user?.name }}
    </template>
    <Button :label="hasBracket ? 'Picks Made!' : 'Make Picks'" :disabled="hasBracket" icon="pi pi-pencil" size="large" @click="openSelectionTool(); emit('close')" />
    <Button label="Evaluate Bracket" size="large" @click="triggerEvaluate(); emit('close')" />
    <template #footer>
      <div class="btn-container">
        <Button icon="pi pi-sign-out" aria-label="Sign out" label="Log Out" size="large" @click="handleSignOut" />
      </div>
    </template>
  </Drawer>
</template>
