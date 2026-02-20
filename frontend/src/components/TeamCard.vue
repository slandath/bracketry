<script setup lang="ts">
import type { Team } from '../lib/data/types'
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

<style scoped>
.team-card {
  width: 100%;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.625rem;
  border: 1px solid hsl(0 0% 93.3%);
  background: hsl(0 0% 98%);
  transition:
    box-shadow 120ms ease,
    border-color 120ms ease;
  cursor: pointer;
  user-select: none;
}

.team-card:hover {
  box-shadow: 0 0.25rem 0.625rem hsla(0 0% 0% / 0.04);
}

.team-card--tbd {
  padding: 0.75rem;
  border: 1px dashed hsl(0 0% 73%);
  text-align: center;
  color: hsl(0 0% 40%);
}

.team-card--selected {
  border: 2px solid hsl(198 100% 44%);
  background: hsla(210 89% 46% / 0.06);
}

.team-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.team-card__logo {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: contain;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.team-card__logo--placeholder {
  background: hsl(0 0% 95%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-card__body {
  flex: 1;
  min-width: 0;
}

.team-card__title {
  font-weight: 700;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.team-card__seed {
  font-weight: 700;
  color: hsl(0 0% 40%);
}

.team-card__name {
  font-weight: 700;
}

.team-card__action {
  display: flex;
  align-items: center;
}

.team-card__pick-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
  cursor: pointer;
}
</style>
