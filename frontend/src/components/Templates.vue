<script setup lang="ts">
import type { Template } from '../lib/data/types'
import { ButtonGroup } from 'primevue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Tooltip from 'primevue/tooltip'
import { showToast } from '../composables/useToast'

defineOptions({
  directives: {
    Tooltip,
  },
})

defineProps<{
  templates: Template[]
}>()

const emit = defineEmits<{
  activate: [id: string]
  requestDelete: [template: Template]
  create: []
  editResults: [template: Template]
}>()

function activate(id: string) {
  emit('activate', id)
}

function editResults(template: Template) {
  emit('editResults', template)
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
          <Button label="New Tournament" icon="pi pi-plus" @click="emit('create')" />
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
            <ButtonGroup>
              <Button
                v-if="!slotProps.data.is_active"
                v-tooltip.top="'Set as active'"
                icon="pi pi-check"
                severity="success"
                @click="activate(slotProps.data.id)"
              />
              <Button
                v-tooltip.top="'Edit results'"
                icon="pi pi-pencil"
                @click="editResults(slotProps.data)"
              />
              <Button
                v-tooltip.top="'Download template'"
                icon="pi pi-download"
                @click="download(slotProps.data)"
              />
              <Button
                v-tooltip.top="'Delete template'"
                icon="pi pi-trash"
                severity="danger"
                @click="confirmDelete(slotProps.data)"
              />
            </ButtonGroup>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>
