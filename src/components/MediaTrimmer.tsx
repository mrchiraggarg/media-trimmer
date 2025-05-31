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
  const [fromTime, setFromTime] = useState('00:00:00');
  const [toTime, setToTime] = useState('00:00:10');

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

    const duration = toTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0) -
                    fromTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);

    await ffmpeg.run(
      '-i', 'input.mp4',
      '-ss', fromTime,
      '-t', String(duration),
      '-c', 'copy',
      'output.mp4'
    );

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
        <h1 style={styles.heading}>🎬 Media Trimmer</h1>

        <div style={styles.fileInputContainer}>
          <label style={styles.fileInputLabel}>
            Choose File
            <input
              type="file"
              accept="video/*"
              style={styles.fileInput}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div style={styles.timeInputs}>
          <div style={styles.timeInputContainer}>
            <label style={styles.label}>From:</label>
            <input
              type="time"
              step="1"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              style={styles.timeInput}
            />
          </div>
          <div style={styles.timeInputContainer}>
            <label style={styles.label}>To:</label>
            <input
              type="time"
              step="1"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              style={styles.timeInput}
            />
          </div>
        </div>

        <button
          style={ready && file ? styles.button : styles.disabledButton}
          disabled={!ready || !file || isTrimming}
          onClick={handleTrim}
        >
          {isTrimming ? 'Trimming...' : 'Trim Now'}
        </button>

        {file && (
          <p style={styles.fileName}>📁 Selected: {file.name}</p>
        )}
      </div>
    </div>
  );
}

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
  fileInputContainer: {
    width: '100%',
    marginBottom: '20px',
  },
  fileInputLabel: {
    display: 'block',
    padding: '12px 24px',
    background: '#E0E5EC',
    borderRadius: '15px',
    cursor: 'pointer',
    textAlign: 'center',
    color: '#333',
    fontWeight: 600,
    boxShadow: `
      8px 8px 16px #bebebe,
      -8px -8px 16px #ffffff
    `,
    transition: 'all 0.3s ease',
  },
  fileInput: {
    display: 'none',
  },
  timeInputs: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    width: '100%',
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    padding: '12px',
    borderRadius: '15px',
    border: 'none',
    background: '#E0E5EC',
    boxShadow: `
      inset 5px 5px 10px #bebebe,
      inset -5px -5px 10px #ffffff
    `,
    width: '100%',
    color: '#333',
    fontSize: '14px',
    outline: 'none',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#444',
    fontSize: '14px',
    fontWeight: 600,
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
}