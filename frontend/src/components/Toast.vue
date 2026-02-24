<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '../composables/useToast'
import '../styles/components/Toast.scss'

const { toast } = useToast()

const toastClass = computed(() => toast.value ? `toast--${toast.value.type}` : '')
</script>

<template>
  <Teleport to="body">
    <div v-if="toast" class="toast" :class="toastClass">
      <span class="toast__message">{{ toast.message }}</span>
      <button class="toast__close" @click="toast = null">
        x
      </button>
    </div>
  </Teleport>
</template>
