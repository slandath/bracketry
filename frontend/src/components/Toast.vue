<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '../composables/useToast'

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

<style scoped>
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  max-width: 90vw;
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

.toast--error {
  background-color: #ef4444;
  color: #ffffff;
  border: 1px solid #dc2626;
}

.toast--success {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.toast--info {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.toast__message {
  flex: 1;
}

.toast__close {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
  padding: 0;
  line-height: 1;
}

.toast__close:hover {
  opacity: 1;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 640px) {
  .toast {
    bottom: 1rem;
    padding: 0.625rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
