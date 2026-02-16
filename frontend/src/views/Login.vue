<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authClient } from '../auth-client'
import '../styles/components/Login.scss'

const session = authClient.useSession()
const app_url = import.meta.env.VITE_APP_URL || window.location.origin
const error = ref('')
const router = useRouter()
const route = useRoute()

onMounted(() => {
  watch(() => session.value.isPending, (isPending) => {
    if (!isPending && session.value.data) {
      try {
        const postLoginRedirect = sessionStorage.getItem('post_login_redirect')
        const query_redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
        const target = postLoginRedirect || query_redirect || '/'
        if (target.startsWith('/') && !target.startsWith('//')) {
          router.push(target)
        }
        else {
          router.push('/')
        }
        sessionStorage.removeItem('post_login_redirect')
      }
      catch (error) {
        console.error('Redirect error:', error)
      }
    }
  }, { immediate: true })
})

async function handleSignIn() {
  try {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: app_url,
    })
  }
  catch (err) {
    error.value = 'Authentication failed. Please try again'
    console.error('Sign In Error:', err)
  }
}

function goBack() {
  router.go(-1)
}
</script>

<template>
  <main class="main-container">
    <section class="login-container">
      <h1>Login</h1>
      <div v-if="session.isPending">
        Loading...
      </div>
      <div v-else-if="error" class="error-message">
        <span>{{ error }}</span>
      </div>
      <button v-else-if="!session.data" class="github-btn" @click="handleSignIn">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>Login with GitHub
      </button>
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Mono Icons by Mono - https://github.com/mono-company/mono-icons/blob/master/LICENSE.md --><path fill="currentColor" d="M11.707 5.293a1 1 0 0 1 0 1.414L7.414 11H19a1 1 0 1 1 0 2H7.414l4.293 4.293a1 1 0 0 1-1.414 1.414l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 0" /></svg>
        Go back
      </button>
    </section>
  </main>
</template>
