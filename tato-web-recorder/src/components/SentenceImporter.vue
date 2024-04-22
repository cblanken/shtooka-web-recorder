import { URL } from 'node:url';
<script setup lang="ts">
// TODO: load alternative file formats
// TODO: read data from Tatoeba API

const model = defineModel()

async function loadShtookaFile(e) {
  let file = e.target?.files?.item(0)
  let sentences = new Map()
  try {
    let text = await file?.text()
    if (text) {
      let lines = text.trim().split('\n')
      if (lines.length > 0) {
        lines.forEach((line) => {
          let [id, line_text] = line.split('-')
          sentences.set(id.trim(), line_text.trim())
        })
      }
    }
  } catch (e) {
    alert(
      `Unable to load file: "${file?.name}". It may have an invalid format. Please try again with a properly formatted file.`
    )
  }

  model.value = sentences
}
</script>

<template>
  <button @click="$refs.fileInput.click()" class="bg-[#7977FF] px-2 py-1 rounded-md text-lg">
    <input @change="loadShtookaFile" class="hidden" type="file" ref="fileInput" />
    Upload Sentences
  </button>
</template>
