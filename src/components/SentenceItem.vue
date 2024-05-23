<script setup lang="ts">
import IconDownload from './icons/IconDownload.vue'
defineEmits<{
  download: []
  toggle_checkbox: [value: string]
}>()

defineProps({
  id: { type: String, required: true },
  text: { type: String, required: true },
  exportEnabled: { type: Boolean, required: true },
  ext: { type: String, required: true },
  audioSrc: { type: String }
})
</script>

<template>
  <tr :data-id="id">
    <td class="text-white">{{ $props.id }}</td>
    <td class="text-left pl-4 selection:bg-transparent">{{ $props.text }}</td>
    <td><audio controls :src="$props.audioSrc"></audio></td>
    <td>
      <input
        @change="$emit('toggle_checkbox', $props.id)"
        :disabled="audioSrc === undefined"
        :checked="exportEnabled || undefined"
        class="w-5 h-5"
        type="checkbox"
      />
    </td>
    <td class="align-middle">
      <a
        v-if="$props.audioSrc && $props.audioSrc.length > 0"
        :download="`${$props.id} - ${$props.text}.${$props.ext}`"
        :href="$props.audioSrc"
        ><IconDownload class="text-green-400 d-block m-auto"
      /></a>
      <a v-else><IconDownload class="d-block m-auto" /></a>
    </td>
  </tr>
</template>
