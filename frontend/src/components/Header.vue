<script setup lang="ts">
import { Button } from 'primevue'
import { computed, ref } from 'vue'
import { useCurrentBracketOnLogin, useTypedSession } from '../composables'
import UserMenu from './UserMenu.vue'
import '../styles/components/Header.scss'

const { data: sessionData, isPending } = useTypedSession()
const menuOpen = ref(false)
const show_user_icon = computed(() =>
  !isPending.value && !!sessionData.value?.user,
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
</script>

<template>
  <header>
    <div class="header">
      <div v-if="show_user_icon">
        <h1>{{ currentYear }} March Madness Bracket</h1>
      </div>
      <div v-if="show_user_icon" class="btn-container">
        <Button :label="sessionData?.user?.name ?? 'User'" icon="pi pi-user" title="User menu" size="large" @click="toggleUserMenu" />
      </div>
      <UserMenu
        v-if="sessionData?.user"
        :is-open="menuOpen"
        :has-bracket="hasBracket"
        @close="closeUserMenu"
        @update:is-open="menuOpen = $event"
      />
    </div>
  </header>
</template>
