import { MutationCache, QueryCache, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'
import { showToast } from './composables/useToast'
import router from './router'

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
app.mount('#app')
