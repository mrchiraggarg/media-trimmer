import React, { useState, useEffect, useRef } from 'react';
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
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ffmpeg.load().then(() => setReady(true));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTrim = async () => {
    if (!file) return;

    if (!ffmpeg.isLoaded()) {
      console.log("Waiting for ffmpeg to load...");
      await ffmpeg.load();
    }

    setIsTrimming(true);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
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
      a.download = `trimmed_${file.name}`;
      a.click();

      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setIsTrimming(false);
      }, 1000);
    } catch (error) {
      console.error('Trimming failed:', error);
      setIsTrimming(false);
      setProgress(0);
    }

    clearInterval(progressInterval);
  };

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>🎬</span>
          </div>
          <h1 style={styles.heading}>Media Trimmer</h1>
          <p style={styles.subtitle}>Trim your videos with precision</p>
        </div>

        <div 
          style={{
            ...styles.dropZone,
            ...(isDragOver ? styles.dropZoneActive : {}),
            ...(file ? styles.dropZoneWithFile : {})
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={styles.fileInput}
            onChange={handleFileSelect}
          />
          
          {!file ? (
            <div style={styles.dropZoneContent}>
              <div style={styles.uploadIcon}>📁</div>
              <p style={styles.dropZoneText}>
                Drop your video here or <span style={styles.browseText}>browse</span>
              </p>
              <p style={styles.dropZoneSubtext}>Supports MP4, AVI, MOV, and more</p>
            </div>
          ) : (
            <div style={styles.fileInfo}>
              <div style={styles.fileIcon}>🎥</div>
              <div style={styles.fileDetails}>
                <p style={styles.fileName}>{file.name}</p>
                <p style={styles.fileSize}>{formatFileSize(file.size)}</p>
              </div>
              <button style={styles.removeButton} onClick={resetFile}>
                ✕
              </button>
            </div>
          )}
        </div>

        {file && (
          <div style={styles.timeSection}>
            <h3 style={styles.sectionTitle}>Trim Settings</h3>
            <div style={styles.timeInputs}>
              <div style={styles.timeInputContainer}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>⏰</span>
                  Start Time
                </label>
                <input
                  type="time"
                  step="1"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  style={styles.timeInput}
                />
              </div>
              <div style={styles.timeSeparator}>→</div>
              <div style={styles.timeInputContainer}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>⏱️</span>
                  End Time
                </label>
                <input
                  type="time"
                  step="1"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  style={styles.timeInput}
                />
              </div>
            </div>
          </div>
        )}

        {isTrimming && (
          <div style={styles.progressSection}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`
                }}
              />
            </div>
            <p style={styles.progressText}>Processing... {Math.round(progress)}%</p>
          </div>
        )}

        <div style={styles.actionSection}>
          <button
            style={ready && file && !isTrimming ? styles.button : styles.disabledButton}
            disabled={!ready || !file || isTrimming}
            onClick={handleTrim}
          >
            <span style={styles.buttonIcon}>
              {isTrimming ? '⏳' : '✂️'}
            </span>
            {isTrimming ? 'Processing...' : 'Trim Video'}
          </button>
          
          {!ready && (
            <p style={styles.loadingText}>
              <span style={styles.loadingSpinner}>⚙️</span>
              Loading FFmpeg...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: `
      0 20px 60px rgba(0, 0, 0, 0.1),
      0 8px 25px rgba(0, 0, 0, 0.08)
    `,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '500px',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
  },
  icon: {
    fontSize: '32px',
    filter: 'brightness(0) invert(1)',
  },
  heading: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0 0 8px 0',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: 0,
    fontWeight: '400',
  },
  dropZone: {
    width: '100%',
    minHeight: '160px',
    border: '2px dashed #e2e8f0',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    marginBottom: '24px',
    position: 'relative',
  },
  dropZoneActive: {
    borderColor: '#667eea',
    background: '#f0f4ff',
    transform: 'scale(1.02)',
  },
  dropZoneWithFile: {
    borderColor: '#48bb78',
    background: '#f0fff4',
  },
  dropZoneContent: {
    textAlign: 'center',
    padding: '20px',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.7,
  },
  dropZoneText: {
    fontSize: '1.1rem',
    color: '#4a5568',
    margin: '0 0 8px 0',
    fontWeight: '500',
  },
  browseText: {
    color: '#667eea',
    fontWeight: '600',
    textDecoration: 'underline',
  },
  dropZoneSubtext: {
    fontSize: '0.9rem',
    color: '#718096',
    margin: 0,
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '16px',
    gap: '16px',
  },
  fileIcon: {
    fontSize: '32px',
    opacity: 0.8,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 4px 0',
    wordBreak: 'break-word',
  },
  fileSize: {
    fontSize: '0.875rem',
    color: '#718096',
    margin: 0,
  },
  removeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: '#fed7d7',
    color: '#e53e3e',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },
  fileInput: {
    display: 'none',
  },
  timeSection: {
    width: '100%',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  timeInputs: {
    display: 'flex',
    alignItems: 'end',
    gap: '16px',
    width: '100%',
  },
  timeInputContainer: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: '1.5rem',
    color: '#667eea',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  timeInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    background: '#ffffff',
    fontSize: '1rem',
    color: '#1a202c',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'monospace',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    color: '#4a5568',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  labelIcon: {
    fontSize: '16px',
  },
  progressSection: {
    width: '100%',
    marginBottom: '24px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#718096',
    margin: 0,
    fontWeight: '500',
  },
  actionSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    minWidth: '160px',
    justifyContent: 'center',
  },
  disabledButton: {
    background: '#e2e8f0',
    color: '#a0aec0',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '160px',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: '18px',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#718096',
    margin: 0,
  },
  loadingSpinner: {
    fontSize: '16px',
    animation: 'spin 2s linear infinite',
  },
};