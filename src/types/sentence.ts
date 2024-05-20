export class Sentence {
  id: string
  text: string
  export_enabled: boolean
  audio_src: string | undefined

  constructor(
    id: string,
    sentence: string,
    audio_src: string | undefined = undefined,
    export_enabled: boolean = false
  ) {
    this.id = id
    this.text = sentence
    this.audio_src = audio_src
    this.export_enabled = export_enabled
  }
}
