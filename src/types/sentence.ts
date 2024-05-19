export class Sentence {
  id: string
  text: string
  audio_src: string
  export_enabled: boolean

  constructor(id: string, sentence: string, audio_src: string, export_enabled: boolean = false) {
    this.id = id
    this.text = sentence
    this.audio_src = audio_src
    this.export_enabled = export_enabled
  }
}
