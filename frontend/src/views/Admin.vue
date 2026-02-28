<script setup lang="ts">
import type { Template } from '../lib/data/types'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { onMounted, ref } from 'vue'
import { activateTemplate, deleteTemplate, getTemplates } from '../api'
import Templates from '../components/Templates.vue'
import { showToast } from '../composables/useToast'
import '../styles/components/Admin.scss'

const templates = ref<Template[]>([])
const loading = ref(true)
const deleteDialogVisible = ref(false)
const templateToDelete = ref<Template | null>(null)

async function fetchTemplates() {
  try {
    const response = await getTemplates()
    templates.value = response.templates
  }
  catch (error) {
    showToast('Failed to load templates', 'error')
    console.error('Error fetching templates:', error)
  }
  finally {
    loading.value = false
  }
}

async function handleActivate(id: string) {
  try {
    await activateTemplate(id)
    showToast('Template activated', 'success')
    await fetchTemplates()
  }
  catch (error) {
    showToast('Failed to activate template', 'error')
    console.error('Error activating template:', error)
  }
}

async function handleDelete(id: string) {
  try {
    await deleteTemplate(id)
    showToast('Template deleted', 'success')
    await fetchTemplates()
  }
  catch (error) {
    showToast('Failed to delete template', 'error')
    console.error('Error deleting template:', error)
  }
}

function handleRequestDelete(template: Template) {
  templateToDelete.value = template
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  if (templateToDelete.value) {
    await handleDelete(templateToDelete.value.id)
    deleteDialogVisible.value = false
    templateToDelete.value = null
  }
}

function cancelDelete() {
  deleteDialogVisible.value = false
  templateToDelete.value = null
}

onMounted(fetchTemplates)
</script>

<template>
  <div class="admin-container">
    <h1>Admin Page</h1>
    <div v-if="loading">
      Loading...
    </div>
    <Templates
      v-else
      :templates="templates"
      @activate="handleActivate"
      @request-delete="handleRequestDelete"
    />

    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirm Delete"
      :modal="true"
      :closable="false"
      :style="{ width: '25rem' }"
    >
      <p>Are you sure you want to delete "{{ templateToDelete?.name }}"?</p>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="cancelDelete" />
        <Button label="Delete" severity="danger" @click="confirmDelete" />
      </template>
    </Dialog>
  </div>
</template>
