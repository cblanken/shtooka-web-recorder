<script setup lang="ts">
defineProps({
  id: { type: String, required: true },
  text: { type: String, required: true },
  audioSrc: { type: String }
})
</script>

<template>
  <tr :data-id="id">
    <td class="text-white">{{ $props.id }}</td>
    <td class="text-left pl-4 selection:bg-transparent">{{ $props.text }}</td>
    <td><audio controls src=""></audio></td>
    <td><input class="w-5 h-5" type="checkbox" /></td>
  </tr>
</template>
