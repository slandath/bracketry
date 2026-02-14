<script setup lang="ts">
import { authClient } from './auth-client'
import './lib/styles/Header.scss'

const session = authClient.useSession()

async function handleSignIn() {
  try {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: 'http://localhost:5173/',
    })
  }
  catch (error) {
    console.error('Sign In Error:', error)
  }
}
async function handleSignOut() {
  try {
    await authClient.signOut({
    })
  }
  catch (error) {
    console.error('Sign Out Error:', error)
  }
}
</script>

<template>
  <header>
    <div class="header">
      <h1>2025 NCAA Men's Tournament</h1>
      <!-- Loading state -->
      <span v-if="session.isPending">Loading...</span>
      <!-- Not logged in -->
      <button
        v-else-if="!session.data"
        class="header-btn"
        @click="handleSignIn"
      >
        Sign In with GitHub
      </button>
      <!-- Logged in -->
      <div v-else class="user-section">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Mono Icons by Mono - https://github.com/mono-company/mono-icons/blob/master/LICENSE.md --><path fill="currentColor" d="M12 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8M6 8a6 6 0 1 1 12 0A6 6 0 0 1 6 8m2 10a3 3 0 0 0-3 3a1 1 0 1 1-2 0a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5a1 1 0 1 1-2 0a3 3 0 0 0-3-3z" /></svg>
        <button class="header-btn" @click="handleSignOut">
          Sign Out
        </button>
      </div>
    </div>
  </header>
</template>
