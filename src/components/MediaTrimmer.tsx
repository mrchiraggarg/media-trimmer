import React, { useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export default function MediaTrimmer() {
  const [ready, setReady] = useState(false);
  const [ffmpeg] = useState(() => new FFmpeg({ log: true }));
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    ffmpeg.load().then(() => setReady(true));
  }, [ffmpeg]);

  const handleTrim = async () => {
    if (!file) return;

    const data = await FFmpeg.fetchFile(file);
    ffmpeg.FS('writeFile', 'input.mp4', data);

    await ffmpeg.run('-i', 'input.mp4', '-ss', '00:00:05', '-t', '00:00:10', '-c', 'copy', 'output.mp4');

    const trimmedData = ffmpeg.FS('readFile', 'output.mp4');

    const url = URL.createObjectURL(new Blob([trimmedData.buffer], { type: 'video/mp4' }));

    const a = document.createElement('a');
    a.href = url;
    a.download = 'trimmed.mp4';
    a.click();
  };

  return (
    <div>
      <h1>Media Trimmer</h1>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button disabled={!ready || !file} onClick={handleTrim}>
        Trim Video
      </button>
    </div>
  );
}
