import React, { useEffect, useRef, useState } from 'react';
import './Candle.css';

const Candle = ({ left }) => {
  const [state, setState] = useState('idle'); // idle | flicker | blown
  const isBlownRef = useRef(false); // 🔁 Ref to pause detection loop
  const blowStartRef = useRef(null); // Keep track of blow timing

  useEffect(() => {
    let audioContext = null;
    let mic = null;
    let analyser = null;
    let dataArray = null;

    const detectBlow = () => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mic = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        mic.connect(analyser);

        const loop = () => {
          requestAnimationFrame(loop);

          // 🔒 Pause detection when blown
          if (isBlownRef.current) return;

          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

          if (volume > 20) {
            if (!blowStartRef.current) blowStartRef.current = Date.now();
            setState('flicker');

            if (Date.now() - blowStartRef.current > 800) {
              // 🎉 Detected long blow
              setState('blown');
              isBlownRef.current = true;

              setTimeout(() => {
                setState('idle');
                isBlownRef.current = false;
                blowStartRef.current = null;
              }, 2000); // 🕒 Control your no-flame zone here (6 sec)
            }
          } else {
            blowStartRef.current = null;
            if (state !== 'blown') setState('idle');
          }
        };

        loop();
      });
    };

    detectBlow();
  }, []);

  return (
    <div className="cake" style={{ left }}>
      {state !== 'blown' && (
        <>
          <div className={`fuego ${state}`}></div>
          <div className={`fuego ${state}`}></div>
          <div className={`fuego ${state}`}></div>
          <div className={`fuego ${state}`}></div>
          <div className={`fuego ${state}`}></div>
        </>
      )}
      {state === 'blown' && <div className="smoke"></div>}
    </div>
  );
};

export default Candle;
