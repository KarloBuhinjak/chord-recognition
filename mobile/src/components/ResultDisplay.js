import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function ResultDisplay({ result }) {
  if (!result) return null
  const { prediction, confidence, ranking, spectrogram_png_b64 } = result

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.predictionCard}>
        <Text style={styles.label}>PREDICTED CHORD</Text>
        <Text style={styles.chord}>{prediction}</Text>
        <Text style={styles.confidence}>
          {(confidence * 100).toFixed(1)}% confidence
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ALL PROBABILITIES</Text>
        {ranking.map((r, i) => (
          <View key={r.chord} style={styles.row}>
            <Text style={styles.chordName}>{r.chord}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${r.probability * 100}%` },
                  i === 0 && styles.barFillTop,
                ]}
              />
            </View>
            <Text style={styles.pct}>{(r.probability * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      {spectrogram_png_b64 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEL-SPECTROGRAM</Text>
          <Image
            source={{ uri: `data:image/png;base64,${spectrogram_png_b64}` }}
            style={styles.spectrogram}
            resizeMode="contain"
          />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 16, paddingBottom: 40 },
  predictionCard: {
    backgroundColor: '#181b22',
    borderColor: '#2a2f3d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  label: { color: '#8a92a6', fontSize: 11, letterSpacing: 1.5 },
  chord: { color: '#ff8a5c', fontSize: 64, fontWeight: '800', marginVertical: 6 },
  confidence: { color: '#8a92a6', fontFamily: 'monospace' },
  section: {
    backgroundColor: '#181b22',
    borderColor: '#2a2f3d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    color: '#8a92a6',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  chordName: { color: '#e6e8ee', width: 50, fontWeight: '600' },
  barTrack: {
    flex: 1,
    backgroundColor: '#1f2330',
    height: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#8a92a6' },
  barFillTop: { backgroundColor: '#ff7849' },
  pct: {
    color: '#8a92a6',
    fontFamily: 'monospace',
    fontSize: 12,
    width: 56,
    textAlign: 'right',
  },
  spectrogram: { width: '100%', height: 180, borderRadius: 8 },
})
