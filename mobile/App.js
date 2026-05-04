import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Audio } from 'expo-av'
import Recorder from './src/components/Recorder'
import FilePicker from './src/components/FilePicker'
import ResultDisplay from './src/components/ResultDisplay'
import { fetchHealth, predictChord } from './src/api'
import { API_URL } from './src/config'

export default function App() {
  const [meta, setMeta] = useState(null)
  const [metaError, setMetaError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [soundUri, setSoundUri] = useState(null)
  const soundRef = { current: null }

  useEffect(() => {
    fetchHealth()
      .then(setMeta)
      .catch((e) => setMetaError(e.message))
  }, [])

  const handleAudio = async (uri, name, mimeType) => {
    setError(null)
    setResult(null)
    setSoundUri(uri)
    setLoading(true)
    try {
      const data = await predictChord(uri, name, mimeType)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const playLast = async () => {
    if (!soundUri) return
    if (soundRef.current) {
      await soundRef.current.unloadAsync()
    }
    const { sound } = await Audio.Sound.createAsync({ uri: soundUri })
    soundRef.current = sound
    await sound.playAsync()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chord Recognition</Text>
          <Text style={styles.subtitle}>CNN-based guitar chord classifier</Text>
          {meta && (
            <Text style={styles.meta}>
              {meta.classes?.length} classes · {meta.device}
            </Text>
          )}
          {metaError && (
            <Text style={styles.metaError}>
              Cannot reach backend at {API_URL}{'\n'}({metaError})
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <Recorder onAudio={handleAudio} disabled={loading} />
          <View style={styles.divider} />
          <FilePicker onAudio={handleAudio} disabled={loading} />
        </View>

        {loading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#ff7849" />
            <Text style={styles.loaderText}>Analyzing…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ResultDisplay result={result} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f1115' },
  container: { flex: 1, padding: 16, gap: 14 },
  header: { alignItems: 'center', marginTop: 8 },
  title: { color: '#ff8a5c', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#8a92a6', marginTop: 2 },
  meta: { color: '#8a92a6', fontFamily: 'monospace', fontSize: 12, marginTop: 6 },
  metaError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  controls: {
    backgroundColor: '#181b22',
    borderColor: '#2a2f3d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2a2f3d',
    marginVertical: 4,
  },
  loaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loaderText: { color: '#8a92a6', fontStyle: 'italic' },
  errorBanner: {
    backgroundColor: '#3b1d1d',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: '#ffd6d6' },
})
