<script setup lang="ts">
import type { FormSubmitEvent } from '@primevue/forms'
import type { Template } from '../lib/data/types'
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import { activateTemplate, createTemplate, deleteTemplate, getTemplates } from '../api'
import Templates from '../components/Templates.vue'
import { showToast } from '../composables/useToast'
import '../styles/components/Admin.scss'

const templateSchema = z.object({
  year: z.number().min(2000).max(2100),
  name: z.string().min(1, 'Name is required'),
  jsonData: z.string().min(1, 'JSON data is required'),
})

const templates = ref<Template[]>([])
const loading = ref(true)
const deleteDialogVisible = ref(false)
const templateToDelete = ref<Template | null>(null)
const createDialogVisible = ref(false)

const initialValues = {
  year: null as number | null,
  name: '',
  jsonData: '',
}

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

function openCreateDialog() {
  createDialogVisible.value = true
}

async function onFormSubmit(event: FormSubmitEvent) {
  if (!event.valid)
    return

  const { year, name, jsonData } = event.values as { year: number, name: string, jsonData: string }

  try {
    const parsedData = JSON.parse(jsonData)
    await createTemplate({
      year,
      name,
      data: parsedData,
    })
    showToast('Template created', 'success')
    createDialogVisible.value = false
    await fetchTemplates()
  }
  catch (error) {
    if (error instanceof SyntaxError) {
      showToast('Invalid JSON', 'error')
    }
    else {
      showToast('Failed to create template', 'error')
      console.error('Error creating template:', error)
    }
  }
}

function cancelCreate() {
  createDialogVisible.value = false
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
      @create="openCreateDialog"
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

    <Dialog
      v-model:visible="createDialogVisible"
      header="Create New Tournament"
      :modal="true"
      :style="{ width: '30rem' }"
    >
      <Form
        v-slot="$form"
        :initial-values
        :resolver="zodResolver(templateSchema)"
        class="flex flex-col gap-4"
        @submit="onFormSubmit"
      >
        <div class="flex flex-col gap-1">
          <InputNumber
            name="year"
            placeholder="Year"
            :min="2000"
            :max="2100"
            fluid
          />
          <Message v-if="$form.year?.invalid" severity="error" size="small" variant="simple">
            {{ $form.year.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <InputText
            name="name"
            placeholder="Tournament Name"
            fluid
          />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <Textarea
            name="jsonData"
            placeholder="Paste template JSON here"
            rows="10"
            fluid
          />
          <Message v-if="$form.jsonData?.invalid" severity="error" size="small" variant="simple">
            {{ $form.jsonData.error?.message }}
          </Message>
        </div>

        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" type="button" @click="cancelCreate" />
          <Button label="Create" type="submit" />
        </div>
      </Form>
    </Dialog>
  </div>
</template>
