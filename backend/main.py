"""FastAPI backend for guitar chord recognition."""
import base64
import io
from pathlib import Path

import librosa
import librosa.display
import matplotlib
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

matplotlib.use("Agg")
import matplotlib.pyplot as plt


class ChordCNN(nn.Module):
    def __init__(self, num_classes, input_shape):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        with torch.no_grad():
            dummy = torch.zeros(1, 1, *input_shape)
            flat_size = self.features(dummy).flatten(1).shape[1]
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(flat_size, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


CHECKPOINT_PATH = Path(__file__).resolve().parent.parent / "chord_cnn.pth"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

ckpt = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
CLASSES = ckpt["classes"]
INPUT_SHAPE = tuple(ckpt["input_shape"])
SAMPLE_RATE = ckpt["sample_rate"]
DURATION = ckpt["duration"]
N_MELS = ckpt["n_mels"]
N_FFT = ckpt["n_fft"]
HOP_LENGTH = ckpt["hop_length"]

model = ChordCNN(len(CLASSES), INPUT_SHAPE).to(device)
model.load_state_dict(ckpt["model_state_dict"])
model.eval()

print(f"[startup] device={device} classes={CLASSES}")


app = FastAPI(title="Chord Recognition API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def audio_bytes_to_melspec(audio_bytes: bytes) -> np.ndarray:
    y, _ = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE, duration=DURATION)
    target_length = int(SAMPLE_RATE * DURATION)
    if len(y) < target_length:
        y = np.pad(y, (0, target_length - len(y)))
    mel = librosa.feature.melspectrogram(
        y=y, sr=SAMPLE_RATE, n_fft=N_FFT, hop_length=HOP_LENGTH, n_mels=N_MELS
    )
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8)
    return mel_db.astype(np.float32)


def melspec_to_png_b64(mel: np.ndarray) -> str:
    fig, ax = plt.subplots(figsize=(6, 3))
    librosa.display.specshow(
        mel, sr=SAMPLE_RATE, hop_length=HOP_LENGTH,
        x_axis="time", y_axis="mel", ax=ax, cmap="magma",
    )
    ax.set_title("Mel-spectrogram")
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("ascii")


@app.get("/")
def health():
    return {
        "status": "ok",
        "device": str(device),
        "classes": CLASSES,
        "sample_rate": SAMPLE_RATE,
        "duration": DURATION,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty file")

    try:
        mel = audio_bytes_to_melspec(audio_bytes)
    except Exception as exc:
        raise HTTPException(400, f"Could not decode audio: {exc}")

    x = torch.tensor(mel).unsqueeze(0).unsqueeze(0).to(device)
    with torch.no_grad():
        probs = torch.softmax(model(x), dim=1)[0].cpu().numpy()

    sorted_idx = np.argsort(probs)[::-1]
    ranking = [
        {"chord": CLASSES[i], "probability": float(probs[i])}
        for i in sorted_idx
    ]

    return {
        "prediction": CLASSES[int(probs.argmax())],
        "confidence": float(probs.max()),
        "ranking": ranking,
        "spectrogram_png_b64": melspec_to_png_b64(mel),
    }
