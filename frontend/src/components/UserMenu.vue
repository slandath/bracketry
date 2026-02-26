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
    :header="props.user?.name"
    @update:visible="$emit('update:isOpen', $event)"
  >
    <p>{{ props.user?.email }}</p>
    <div class="btn-container">
      <Button :disabled="hasBracket" @click="openSelectionTool(); emit('close')">
        {{ hasBracket ? 'Picks Made!' : 'Make Picks' }}
      </Button>
      <Button label="Evaluate Bracket" @click="triggerEvaluate(); emit('close')" />
    </div>
    <div class="btn-container" style="margin-top: auto;">
      <Button icon="pi pi-sign-out" text aria-label="Sign out" @click="handleSignOut" />
    </div>
  </Drawer>
</template>
