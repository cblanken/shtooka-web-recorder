<script setup lang="ts">
import { RecordingState } from '../types/audio'

defineProps({
  recordingState: { type: Number, required: true }
})
defineEmits(['start', 'stop', 'pause'])
</script>

<template>
  <button
    v-if="$props.recordingState === RecordingState.Idle"
    @click="$emit('start')"
    class="btn btn-ready btn-wide"
  >
    Record
  </button>
  <button
    v-else-if="$props.recordingState === RecordingState.Recording"
    @click="$emit('stop')"
    class="btn btn-stop btn-wide"
  >
    Stop
  </button>
  <button v-else @click="$emit('stop')" class="btn btn-stop btn-wide">Stop</button>
</template>
