import { URL } from 'node:url';
<script setup lang="ts">
// TODO: load alternative file formats
// TODO: read data from Tatoeba API

const model = defineModel()

async function loadShtookaFile(e: Event) {
  let target = e.target as HTMLInputElement
  let file = target?.files?.item(0)
  let sentences = new Map()
  try {
    let text = await file?.text()
    if (text) {
      let lines = text.trim().split('\n')
      if (lines.length > 0) {
        lines.forEach((line: string) => {
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
  <label class="hidden" for="sentenceFile">Upload File</label>
  <input
    id="sentenceFile"
    @change="loadShtookaFile"
    class="input-load-file text-xl"
    type="file"
    ref="fileInput"
  />
</template>
