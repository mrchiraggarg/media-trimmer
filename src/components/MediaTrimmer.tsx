// MediaTrimmer.tsx
import React, { useEffect, useState } from 'react';
import FFmpeg from '@ffmpeg/ffmpeg';

const createFFmpeg = FFmpeg.createFFmpeg;
const fetchFile = FFmpeg.fetchFile;

const ffmpeg = createFFmpeg({ log: true });

export default function MediaTrimmer() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<any>(null);

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  const handleTrim = async () => {
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(video));
    await ffmpeg.run('-i', 'input.mp4', '-ss', '00:00:05', '-t', '00:00:10', '-c', 'copy', 'output.mp4');
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trimmed.mp4';
    a.click();
  };

  return (
    <div>
      <h1>React Media Trimmer</h1>
      <input type="file" onChange={(e) => setVideo(e.target.files?.[0])} />
      <button onClick={handleTrim} disabled={!ready || !video}>
        Trim Video
      </button>
    </div>
  );
}
