<script setup lang="ts">
import { Drawer } from 'primevue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { authClient } from '../auth-client'
import { useBracketActions, useTypedSession } from '../composables'
import { showToast } from '../composables/useToast'
import '../styles/components/UserMenu.scss'

interface Props {
  isOpen: boolean
  hasBracket?: boolean
}

withDefaults(defineProps<Props>(), { hasBracket: false })

const emit = defineEmits<{
  'close': []
  'update:isOpen': [value: boolean]
}>()

const router = useRouter()
const { openSelectionTool } = useBracketActions()
const { data: resolvedSession, role } = useTypedSession()

function navigateToAdmin() {
  router.push('/admin')
  emit('close')
}

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
    :header="resolvedSession?.user?.name"
    position="right"
    @update:visible="$emit('update:isOpen', $event)"
  >
    <div class="button-container">
      <Button v-if="role === 'admin'" label="Admin" icon="pi pi-cog" size="large" @click="navigateToAdmin" />
      <Button :label="hasBracket ? 'Complete' : 'Make Picks'" :disabled="hasBracket" :icon="hasBracket ? 'pi pi-check' : 'pi pi-pencil'" size="large" @click="openSelectionTool(); emit('close')" />
    </div>
    <template #footer>
      <div class="btn-container">
        <Button icon="pi pi-sign-out" aria-label="Sign out" label="Log Out" size="large" @click="handleSignOut" />
      </div>
    </template>
  </Drawer>
</template>
