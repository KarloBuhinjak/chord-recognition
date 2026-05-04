import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native'
import { Audio } from 'expo-av'

// Record uncompressed PCM on iOS (.wav) and AAC m4a on Android.
// Backend uses librosa+audioread; m4a needs ffmpeg installed on the backend host.
const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
}

export default function Recorder({ onAudio, disabled }) {
  const [recording, setRecording] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const start = async () => {
    setError(null)
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) {
        setError('Microphone permission denied')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const rec = new Audio.Recording()
      await rec.prepareToRecordAsync(RECORDING_OPTIONS)
      await rec.startAsync()
      setRecording(rec)
      setElapsed(0)

      const startedAt = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startedAt) / 1000)
      }, 100)
    } catch (err) {
      setError('Could not start recording: ' + err.message)
    }
  }

  const stop = async () => {
    if (!recording) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      const isWav = Platform.OS === 'ios'
      const name = isWav ? 'recording.wav' : 'recording.m4a'
      const mime = isWav ? 'audio/wav' : 'audio/m4a'
      onAudio(uri, name, mime)
    } catch (err) {
      setError('Stop failed: ' + err.message)
    } finally {
      setRecording(null)
    }
  }

  const isRecording = recording !== null

  return (
    <View style={styles.container}>
      <Pressable
        onPress={isRecording ? stop : start}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          isRecording ? styles.recording : styles.idle,
          (disabled || pressed) && styles.dim,
        ]}
      >
        <Text style={styles.buttonText}>
          {isRecording ? `Stop (${elapsed.toFixed(1)}s)` : 'Start recording'}
        </Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.hint}>Play one chord clearly for ~2 seconds.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  idle: { backgroundColor: '#ff7849' },
  recording: { backgroundColor: '#ef4444' },
  dim: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  hint: { color: '#8a92a6', fontSize: 13 },
  error: { color: '#ef4444', fontSize: 13 },
})
