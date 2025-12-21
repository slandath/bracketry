<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import bracketData from "./2025-tournament-blank.json";
import CloseIcon from "./assets/CloseIcon.svg";
import type { BracketInstance, Data, Match } from "./lib/data/data";
import { createBracket } from "./lib/lib";
import { evaluateUserPicks } from "./lib/results_comparison";
import SelectionTool from "./SelectionTool.vue";
const STORAGE_KEY = "bracketry:tournament:v1";

// State
const tournamentData = ref<Data>(bracketData as Data);
const bracketContainerRef = ref<HTMLDivElement>();
const bracketInstanceRef = ref<BracketInstance>();
const isSelectionOpen = ref(false);
const dialogRef = ref<HTMLDialogElement>();

// Computed
const allPicked = computed(() => {
  const matches = tournamentData.value.matches ?? [];
  return matches.length > 0 && matches.every((m) => m.prediction);
});

// Storage
function loadFromStorage(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : bracketData;
  } catch {
    console.warn("Corrupted bracket data, using default");
    return bracketData as Data;
  }
}

function saveToStorage(data: Data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save bracket data", e);
  }
}

// Business logic
function recomputeRounds(data: Data) {
  const matches = data.matches ?? [];
  const maxRound = matches.reduce((max, m) => Math.max(max, m.roundIndex), 0);

  for (let r = 1; r <= maxRound; r++) {
    const curMatches = matches
      .filter((m) => m.roundIndex === r)
      .sort((a, b) => a.order - b.order);
    const prevMatches = matches
      .filter((m) => m.roundIndex === r - 1)
      .sort((a, b) => a.order - b.order);

    curMatches.forEach((target, i) => {
      const left = prevMatches[i * 2];
      const right = prevMatches[i * 2 + 1];

      const leftWinner = left?.prediction || left?.result || null;
      const rightWinner = right?.prediction || right?.result || null;

      target.sides = [
        { ...target.sides?.[0], teamId: leftWinner ?? undefined },
        { ...target.sides?.[1], teamId: rightWinner ?? undefined },
      ];

      if (!leftWinner || !rightWinner) {
        delete target.prediction;
        if (target.matchStatus === "Predicted") {
          target.matchStatus = "Scheduled";
        }
      } else {
        target.matchStatus = "Predicted";
      }
    });
  }
}

// Event handlers
function handlePick(match: Match, teamId: string) {
  const target = tournamentData.value.matches?.find(
    (m) => m.roundIndex === match.roundIndex && m.order === match.order,
  );
  if (!target) return;

  target.prediction = teamId;
  recomputeRounds(tournamentData.value);

  tournamentData.value = { ...tournamentData.value };
  saveToStorage(tournamentData.value);

  if (allPicked.value) {
    isSelectionOpen.value = false;
  }
}

function handleRefresh() {
  tournamentData.value = loadFromStorage();
}

function openDialog() {
  isSelectionOpen.value = true;
  nextTick(() => {
    dialogRef.value?.showModal();
  });
}

function closeDialog() {
  isSelectionOpen.value = false;
}

// Bracket management
function initializeBracket() {
  if (!tournamentData.value.matches || !bracketContainerRef.value) return;

  bracketInstanceRef.value?.uninstall?.();
  bracketInstanceRef.value = createBracket(
    tournamentData.value,
    bracketContainerRef.value,
    {},
  );
}

async function getUserBracketData() {
  const updatedBracket = await evaluateUserPicks();
  if (updatedBracket) {
    saveToStorage(updatedBracket);
  }
}

// Lifecycle
onMounted(async () => {
  tournamentData.value = loadFromStorage();
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveToStorage(tournamentData.value);
  }
});

onBeforeUnmount(() => {
  bracketInstanceRef.value?.uninstall?.();
});

watch(tournamentData, initializeBracket);
</script>

<template>
  <div class="app-container">
    <div ref="bracketContainerRef" class="bracketry-wrapper" />

    <button class="open-selection-btn" @click="openDialog">Make Picks</button>
    <button class="open-selection-btn" @click="getUserBracketData">
      Evaluate Bracket
    </button>
    <Transition name="modal" @leave-end="dialogRef?.close()">
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
          />
        </div>
      </dialog>
    </Transition>
  </div>
</template>
