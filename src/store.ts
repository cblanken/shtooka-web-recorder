import { reactive } from 'vue'
import { RecordingState } from './types/audio'

export const store = reactive({
  recordingState: RecordingState.Idle,
  defaultGain: 0.5,
  dbThreshold: 2.0,
  silenceBeforeMargin: 250,
  silenceAfterMargin: 250
})
