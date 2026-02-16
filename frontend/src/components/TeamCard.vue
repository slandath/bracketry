<script setup lang="ts">
import type { Team } from '../lib/data/data'
import { computed } from 'vue'

interface Props {
  team?: Team
  checked?: boolean
  name?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  team: undefined,
  checked: false,
  name: undefined,
  disabled: false,
})

const emit = defineEmits<{
  change: []
}>()

const cardClasses = computed(() => ({
  'team-card--selected': props.checked,
  'team-card--disabled': props.disabled,
}))

const ariaLabel = computed(() => {
  if (!props.team)
    return 'Team to be determined'
  const seed = props.team.seed ? `Seed ${props.team.seed}, ` : ''
  const status = props.checked ? ', selected' : ''
  return `${seed}${props.team.name}${status}`
})

function handleChange() {
  if (!props.disabled) {
    emit('change')
  }
}
</script>

<template>
  <div v-if="!team" class="team-card team-card--tbd">
    TBD
  </div>
  <label v-else class="team-card" :class="cardClasses" :aria-label="ariaLabel">
    <div class="team-card__left">
      <img
        v-if="team.logoUrl"
        :src="team.logoUrl"
        :alt="`${team.name} logo`"
        class="team-card__logo"
      >
      <div v-else class="team-card__logo team-card__logo--placeholder">
        {{ team.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <div class="team-card__body">
      <div class="team-card__title">
        <span v-if="team.seed" class="team-card__seed">
          {{ team.seed }}
        </span>
        <span class="team-card__name">{{ team.name }}</span>
      </div>
    </div>

    <div class="team-card__action">
      <input
        type="radio"
        class="team-card__pick-checkbox"
        :checked="checked"
        :name="name"
        :disabled="disabled"
        @change="handleChange"
      >
    </div>
  </label>
</template>
