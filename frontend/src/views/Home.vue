<script setup lang="ts">
import type { Data } from '../lib/data/types'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '../auth-client'
import { useActiveTemplateOnLogin } from '../composables'
import { loadFromStorage } from '../composables/useBracketStorage'
import { showToast } from '../composables/useToast'
import { createBracket } from '../lib/lib'

const tournamentData = ref<Data | null>(null)
const bracketContainerRef = ref<HTMLElement | null>(null)
const router = useRouter()
const session = authClient.useSession()
const storedData = loadFromStorage()
const hasStoredData = storedData && (storedData.rounds?.length || storedData.matches?.length)
const isLoggedIn = computed(() => !!session.value.data)

const { data: templateData, isLoading, isError, error } = hasStoredData
  ? { data: ref(null), isLoading: ref(false), isError: ref(false), error: ref(null) }
  : useActiveTemplateOnLogin()

watch(() => isLoggedIn.value, (loggedIn) => {
  if (hasStoredData && loggedIn) {
    tournamentData.value = storedData
  }
  else if (!hasStoredData && !loggedIn) {
    router.push('/login')
  }
}, { immediate: true })

watch(templateData, (newData) => {
  if (newData?.template)
    tournamentData.value = newData.template.data.data as Data
})

watch(tournamentData, (data) => {
  if (data && bracketContainerRef.value)
    createBracket(data, bracketContainerRef.value, {})
}, { flush: 'post' })

watch(isError, (hasError) => {
  if (hasError && error.value) {
    const message = error.value instanceof Error ? error.value.message : 'Failed to load template'
    showToast(message, 'error')
  }
})
</script>

<template>
  <main class="app-container">
    <div v-if="isLoading">
      Loading...
    </div>
    <template v-else>
      <div ref="bracketContainerRef" class="bracketry-wrapper" />
      <button class="open-selection-btn">
        Make Picks
      </button>
      <button class="open-selection-btn">
        Evaluate Bracket
      </button>
    </template>
    <!-- <Transition name="modal" @after-leave="dialogRef?.close()">
      <dialog v-if="isSelectionOpen" ref="dialogRef" class="selection-modal">
        <div class="selection-modal__content">
          <button
            class="selection-modal__close"
            aria-label="Close"
            @click="closeDialog"
          >
            <CloseIcon />
          </button>
          <SelectionTool
            v-if="isSelectionOpen"
            :data="tournamentData"
            @pick="handlePick"
            @refresh="handleRefresh"
            @save="handleSave"
          />
        </div>
      </dialog>
    </Transition> -->
  </main>
</template>
