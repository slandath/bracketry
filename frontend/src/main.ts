import { definePreset } from '@primeuix/themes'
import Material from '@primeuix/themes/material'
import { MutationCache, QueryCache, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import { createApp } from 'vue'
import App from './App.vue'
import { showToast } from './composables/useToast'
import router from './router'
import 'primeicons/primeicons.css'

const Preset = definePreset(Material, {
  semantic: {
    primary: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80c9ff',
      300: '#4db3ff',
      400: '#1a9cff',
      500: '#0080e6',
      600: '#006ab3',
      700: '#005380',
      800: '#003d4d',
      900: '#00261a',
      950: '#001a33',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
      },
    },
  },
})

const queryCache = new QueryCache({
  onError: (error: Error) => {
    showToast(error.message || 'Failed to fetch data', 'error')
  },
})

const mutationCache = new MutationCache({
  onError: (error: Error) => {
    showToast(error.message || 'An error occurred', 'error')
    console.error('Mutation error:', error)
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
  queryCache,
  mutationCache,
})

const app = createApp(App)
app.use(router)
app.use(VueQueryPlugin, { queryClient })
app.use(PrimeVue, {
  theme: {
    preset: Preset,
    options: {
      darkModeSelector: '.light',
    },
  },
})
app.mount('#app')
