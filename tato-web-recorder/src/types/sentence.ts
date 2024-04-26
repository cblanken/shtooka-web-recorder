export class Sentence {
  text: String
  id: Number
  audio_src: URL

  constructor(id: Number, sentence: String, audio_src: URL) {
    this.id = id
    this.text = sentence
    this.audio_src = audio_src
  }
}
