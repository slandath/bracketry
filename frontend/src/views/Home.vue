<script setup lang="ts">
import type { Data } from '../lib/data/types'
import { ref, watch } from 'vue'
import { useActiveTemplateOnLogin } from '../composables'
import { showToast } from '../composables/useToast'
import { createBracket } from '../lib/lib'

const { data: templateData, isLoading, isError, error } = useActiveTemplateOnLogin()
const tournamentData = ref<Data | null>(null)
const bracketContainerRef = ref<HTMLElement | null>(null)

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
