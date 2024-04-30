class TatoAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
  }
  process([input], [output]) {
    this.port.postMessage(input[0])
    output[0].set(input[0])
    return true

    // // Generate noise
    // output.forEach((channel) => {
    //   for (let i = 0; i < channel.length; i++) {
    //     channel[i] = Math.random() * 2 - 1
    //   }
    // })
  }
}

registerProcessor('tato-audio-processor', TatoAudioProcessor)
