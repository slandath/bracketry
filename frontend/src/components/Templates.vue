<script setup lang="ts">
import type { Template } from '../lib/data/types'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import { showToast } from '../composables/useToast'

defineProps<{
  templates: Template[]
}>()

const emit = defineEmits<{
  activate: [id: string]
  requestDelete: [template: Template]
}>()

function activate(id: string) {
  emit('activate', id)
}

function download(template: Template) {
  const dataStr = JSON.stringify(template.data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  showToast('Template downloaded', 'success')
}

function confirmDelete(template: Template) {
  emit('requestDelete', template)
}
</script>

<template>
  <Card>
    <template #content>
      <Toolbar>
        <template #start>
          <h2>Tournaments</h2>
        </template>
        <template #end>
          <Button label="New Tournament" icon="pi pi-plus" />
        </template>
      </Toolbar>

      <DataTable :value="templates" table-style="min-width: 50rem">
        <Column field="year" header="Year" sortable />
        <Column field="name" header="Name" />
        <Column header="Status">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.is_active ? 'Active' : 'Inactive'"
              :severity="slotProps.data.is_active ? 'success' : 'secondary'"
            />
          </template>
        </Column>
        <Column header="Actions">
          <template #body="slotProps">
            <Button
              v-if="!slotProps.data.is_active"
              icon="pi pi-check"
              @click="activate(slotProps.data.id)"
            />
            <Button
              icon="pi pi-download"
              @click="download(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDelete(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>
