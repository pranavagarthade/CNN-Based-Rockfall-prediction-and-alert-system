import React, { useEffect } from 'react';

interface DangerOverlayProps {
  mineName: string;
  onFinish: () => void;
}

const beep = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 880;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.2;
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    ctx.close();
  }, 400);
};

const DangerOverlay: React.FC<DangerOverlayProps> = ({ mineName, onFinish }) => {
  useEffect(() => {
    let count = 0;
    const beepInterval = setInterval(() => {
      beep();
      count++;
      if (count >= 5) clearInterval(beepInterval);
    }, 1000);
    const timer = setTimeout(() => {
      clearInterval(beepInterval);
      onFinish();
    }, 5000);
    return () => {
      clearInterval(beepInterval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(200,0,0,0.95)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textShadow: '2px 2px 8px #000',
      transition: 'opacity 0.5s',
    }}>
  <div>⚠️ DANGER: Rockfall Detected at <span style={{color:'#fff', background:'#b91c1c', padding:'0 8px', borderRadius:4}}>{mineName}</span>!</div>
  <div style={{ fontSize: '1.2rem', marginTop: 32 }}>Evacuate immediately!</div>
    </div>
  );
};

export default DangerOverlay;
