<script setup lang="ts">
import { store } from '../store'
import { RecordingState } from '../types/audio'

const emit = defineEmits(['start', 'stop'])
function click() {
  if (store.recordingState === RecordingState.Idle) {
    // TODO: start recording
    console.log('start')
    emit('start')
    store.recordingState = RecordingState.Recording
  } else if (store.recordingState === RecordingState.Recording) {
    // TODO: stop recording
    console.log('stop')
    emit('stop')
    store.recordingState = RecordingState.Idle
  } else {
    console.log('do nothin')
  }
}
</script>

<template>
  <button @click="click" class="btn btn-cancel">Record</button>
</template>
