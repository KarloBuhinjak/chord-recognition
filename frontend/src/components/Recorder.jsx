import { useEffect, useRef, useState } from "react";
import { blobToWav } from "../utils/wavEncoder.js";

export default function Recorder({ onAudio, disabled }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => stopStream();
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const selectedType = preferredTypes.find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const recorder = selectedType
        ? new MediaRecorder(stream, { mimeType: selectedType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const chunkType = chunksRef.current[0]?.type;
        const mimeType = recorder.mimeType || chunkType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        try {
          const wav = await blobToWav(blob, 22050);
          onAudio(wav, "recording.wav", blob);
        } catch (err) {
          setError("Conversion failed: " + err.message);
        }
        stopStream();
      };

      recorder.start();
      setRecording(true);
      setElapsed(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startedAt) / 1000);
      }, 100);
    } catch (err) {
      setError("Microphone access denied: " + err.message);
    }
  };

  const stop = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="recorder">
      {!recording ? (
        <button className="btn btn-primary" onClick={start} disabled={disabled}>
          Start recording
        </button>
      ) : (
        <button className="btn btn-danger pulsing" onClick={stop}>
          Stop ({elapsed.toFixed(1)}s)
        </button>
      )}
      {error && <p className="error">{error}</p>}
      <p className="hint">Play one chord clearly for ~2 seconds.</p>
    </div>
  );
}
