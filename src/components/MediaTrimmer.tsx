import React, { useState, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
});

export default function MediaTrimmer() {
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isTrimming, setIsTrimming] = useState(false);

  useEffect(() => {
    ffmpeg.load().then(() => setReady(true));
  }, []);

  const handleTrim = async () => {
    if (!file) return;

    if (!ffmpeg.isLoaded()) {
      console.log("Waiting for ffmpeg to load...");
      await ffmpeg.load();
    }

    setIsTrimming(true);

    const data = await fetchFile(file);
    ffmpeg.FS('writeFile', 'input.mp4', data);

    await ffmpeg.run('-i', 'input.mp4', '-ss', '00:00:05', '-t', '00:00:10', '-c', 'copy', 'output.mp4');

    const trimmedData = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([trimmedData.buffer], { type: 'video/mp4' }));

    const a = document.createElement('a');
    a.href = url;
    a.download = 'trimmed.mp4';
    a.click();

    setIsTrimming(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>🎬 Claymorphic Media Trimmer</h1>

        <input
          type="file"
          accept="video/*"
          style={styles.input}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <button
          style={ready && file ? styles.button : styles.disabledButton}
          disabled={!ready || !file || isTrimming}
          onClick={handleTrim}
        >
          {isTrimming ? 'Trimming...' : 'Trim Video'}
        </button>

        {file && (
          <p style={styles.fileName}>📁 Selected: {file.name}</p>
        )}
      </div>
    </div>
  );
}

// 💅 Claymorphism-inspired styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#E0E5EC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", sans-serif',
  },
  card: {
    background: '#E0E5EC',
    padding: '40px',
    borderRadius: '30px',
    boxShadow: `
      20px 20px 60px #bebebe,
      -20px -20px 60px #ffffff
    `,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '90%',
    maxWidth: '400px',
  },
  heading: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#333',
    fontWeight: 700,
    textAlign: 'center',
  },
  input: {
    padding: '12px',
    borderRadius: '15px',
    border: 'none',
    background: '#f0f0f0',
    boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
    width: '100%',
    marginBottom: '20px',
    cursor: 'pointer',
  },
  button: {
    background: '#E0E5EC',
    borderRadius: '15px',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: `
      8px 8px 16px #bebebe,
      -8px -8px 16px #ffffff
    `,
    cursor: 'pointer',
    color: '#333',
    transition: 'all 0.3s ease',
  },
  disabledButton: {
    background: '#ccc',
    borderRadius: '15px',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: `
      inset 8px 8px 16px #a0a0a0,
      inset -8px -8px 16px #e0e0e0
    `,
    cursor: 'not-allowed',
    color: '#666',
  },
  fileName: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#444',
  },
};