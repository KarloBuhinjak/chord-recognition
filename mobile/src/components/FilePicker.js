import { Pressable, Text, View, StyleSheet } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

export default function FilePicker({ onAudio, disabled }) {
  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    })
    if (res.canceled) return
    const asset = res.assets[0]
    onAudio(asset.uri, asset.name || 'audio', asset.mimeType || 'audio/*')
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={pick}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          (disabled || pressed) && styles.dim,
        ]}
      >
        <Text style={styles.buttonText}>Pick audio file</Text>
      </Pressable>
      <Text style={styles.hint}>.wav, .mp3, .m4a, .ogg…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2a2f3d',
    borderWidth: 1,
    borderColor: '#3a4053',
  },
  dim: { opacity: 0.6 },
  buttonText: { color: '#e6e8ee', fontWeight: '600', fontSize: 16 },
  hint: { color: '#8a92a6', fontSize: 13 },
})
