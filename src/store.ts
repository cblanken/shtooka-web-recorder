import { reactive } from 'vue'
import { RecordingState } from './types/audio'

export const store = reactive({
  recordingState: RecordingState.Idle,
  recordingVolume: 0,
  dbThreshold: 2.0,
  silenceBeforeMargin: 250,
  silenceAfterMargin: 250
})
