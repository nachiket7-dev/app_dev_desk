// App.jsx
// Handles: OS theme detection, setup screen (camera + fullscreen), then renders MainExam.

import { useEffect, useRef, useState } from 'react';
import './App.css';
import MainExam from './MainExam';

function App() {
  const [view, setView] = useState('setup'); // 'setup' | 'exam'
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [timer, setTimer] = useState('');
  const videoRef = useRef(null);

  // ─── Apply OS theme on mount and listen for changes
  useEffect(() => {
    async function applyTheme() {
      const theme = await window.athena.getTheme();
      document.documentElement.setAttribute('data-theme', theme);
    }
    applyTheme();

    const removeThemeListener = window.athena.onThemeChange((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    });

    return () => removeThemeListener();
  }, []);

  // ─── Register Electron IPC listeners
  useEffect(() => {
    const removeTimerListener = window.athena.registerListenerForTimerTickFromMain(setTimer);
    const removeCameraListener = window.athena.registerListenerForCameraSnapFromMain(saveVideoScreenShots);
    return () => {
      removeTimerListener();
      removeCameraListener();
    };
  }, []);

  async function saveVideoScreenShots() {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      if (!track) return;
      const imageCapture = new ImageCapture(track);
      const blob = await imageCapture.takePhoto();
      const arrayBuffer = await blob.arrayBuffer();
      window.athena.storeCameraSnapImageOnDisk(arrayBuffer);
    } catch (error) {
      console.error('Failed to capture image:', error);
    }
  }

  async function getCameraAccess() {
    try {
      const videoData = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = videoData;
      setCameraEnabled(true);
    } catch {
      alert('Cannot access Camera');
    }
  }

  async function enableFullScreen() {
    try {
      await document.documentElement.requestFullscreen();
      setFullScreen(true);
    } catch {
      alert('Cannot access full screen');
    }
  }

  // ─── Render MainExam once setup is done
  if (view === 'exam') {
    return <MainExam />;
  }

  // ─── Setup View
  return (
    <div className="page-container">
      <div className="card-container">
        {/* Camera */}
        <div className="permission-item">
          <div className="permission-content">
            <h3>Configure Camera</h3>
            <p>Kindly configure Camera to attempt quiz/contests.</p>
            <div className="action-row">
              <button
                className="btn btn-black"
                disabled={cameraEnabled}
                onClick={getCameraAccess}
              >
                {cameraEnabled ? 'Camera Connected' : 'Get Camera Access'}
              </button>
              <video ref={videoRef} autoPlay playsInline className="video-preview" />
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Fullscreen */}
        <div className="permission-item">
          <div className="permission-content">
            <h3>Switch to Full Screen</h3>
            <button
              className="btn btn-primary"
              disabled={fullScreen}
              onClick={enableFullScreen}
            >
              {fullScreen ? 'Full Screen Enabled' : 'Give Full Screen Permissions'}
            </button>
          </div>
        </div>
      </div>

      {/* Go To Test */}
      <div className="bottom-actions">
        <button
          className="btn btn-primary"
          disabled={!cameraEnabled || !fullScreen}
          onClick={async () => {
            try { await window.athena.startTimerOnMain(); } catch {}
            setView('exam');
          }}
        >
          Go To Test
        </button>
      </div>

      {timer !== '' && (
        <div className="muted" style={{ marginTop: '8px', fontSize: '13px' }}>
          {timer} (s) elapsed
        </div>
      )}
    </div>
  );
}

export default App;