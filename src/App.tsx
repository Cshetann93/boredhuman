import React, { useState, useRef } from 'react';

// Precision Audio Engine: Rich mechanical acoustics via Web Audio API
const playAcousticFx = (type: string, isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'bubble-pop') {
      // Natural plastic bubble rupture: pop transient + hollow resonant cavity
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const randomPitch = 520 + Math.random() * 180;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomPitch, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'pen-click') {
      // Dual-stage metallic latch click
      const bufferSize = ctx.sampleRate * 0.03;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 4;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(now);
    } else if (type === 'heavy-switch') {
      // Heavy mechanical wall switch thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'coin-clink') {
      // Pure nickel/brass coin ring
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1980, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Audio context was blocked or not allowed yet
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'bubble' | 'pen' | 'switch' | 'coin' | 'mood' | 'scroll'>('bubble');
  const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('bh_muted') === 'true');
  const [actions, setActions] = useState<number>(() => {
    return parseInt(localStorage.getItem('bh_actions') || '0', 10);
  });

  const recordAction = () => {
    setActions((prev) => {
      const next = prev + 1;
      localStorage.setItem('bh_actions', next.toString());
      return next;
    });
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      localStorage.setItem('bh_muted', (!prev).toString());
      return !prev;
    });
  };

  // 1. Bubble Wrap
  const [bubbles, setBubbles] = useState<boolean[]>(() => Array(40).fill(false));
  const popBubble = (idx: number) => {
    if (bubbles[idx]) return;
    playAcousticFx('bubble-pop', isMuted);
    recordAction();
    const updated = [...bubbles];
    updated[idx] = true;
    setBubbles(updated);
  };
  const resetBubbles = () => {
    setBubbles(Array(40).fill(false));
  };

  // 2. Heavy Switch
  const [powerOn, setPowerOn] = useState<boolean>(false);
  const toggleSwitch = () => {
    playAcousticFx('heavy-switch', isMuted);
    recordAction();
    setPowerOn((prev) => !prev);
  };

  // 3. Tactile Pen
  const [penDepressed, setPenDepressed] = useState<boolean>(false);
  const [penCount, setPenCount] = useState<number>(0);
  const clickPen = () => {
    playAcousticFx('pen-click', isMuted);
    recordAction();
    setPenDepressed(true);
    setPenCount((prev) => prev + 1);
    setTimeout(() => setPenDepressed(false), 90);
  };

  // 4. Coin Toss
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [coinSide, setCoinSide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [coinStats, setCoinStats] = useState({ heads: 24, tails: 19 });
  const triggerFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    playAcousticFx('coin-clink', isMuted);
    recordAction();
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setCoinSide(outcome);
      setCoinStats((prev) => ({ ...prev, [outcome.toLowerCase()]: prev[outcome.toLowerCase() as 'heads' | 'tails'] + 1 }));
      setIsFlipping(false);
    }, 600);
  };

  // 5. Minimalist Mood Meter
  const [selectedMood, setSelectedMood] = useState<string | null>(() => localStorage.getItem('bh_mood_vote'));
  const [votes, setVotes] = useState({ serene: 412, neutral: 689, drained: 531 });
  const castVote = (type: 'serene' | 'neutral' | 'drained') => {
    if (selectedMood) return;
    playAcousticFx('heavy-switch', isMuted);
    recordAction();
    setSelectedMood(type);
    localStorage.setItem('bh_mood_vote', type);
    setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };
  const totalVotes = votes.serene + votes.neutral + votes.drained;

  // 6. Monolith Scroll Depth
  const [meters, setMeters] = useState<number>(0);
  const onScrollContainer = (e: React.UIEvent<HTMLDivElement>) => {
    const depth = Math.floor(e.currentTarget.scrollTop / 32);
    setMeters(depth);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: powerOn ? '#fafafa' : '#090a0f',
        color: powerOn ? '#090a0f' : '#ededed',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'background-color 0.2s ease, color 0.2s ease',
        userSelect: 'none',
      }}
    >
      {/* Precision Top Bar */}
      <header
        style={{
          width: '100%',
          maxWidth: '960px',
          margin: '0 auto',
          padding: '24px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          borderBottom: `1px solid ${powerOn ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: powerOn ? '#090a0f' : '#22c55e',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            boredhuman
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '13px',
              letterSpacing: '0.02em',
              color: powerOn ? '#52525b' : '#a1a1aa',
            }}
          >
            {actions.toLocaleString()} INTERACTIONS
          </div>
          <button
            onClick={toggleMute}
            style={{
              background: 'transparent',
              border: `1px solid ${powerOn ? '#e4e4e7' : '#27272a'}`,
              color: 'inherit',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {isMuted ? 'Muted' : 'Audio On'}
          </button>
        </div>
      </header>

      {/* Interactive Clean Viewport */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Tool 1: Tactile Bubble Membrane */}
        {activeTab === 'bubble' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 44px)',
                gridGap: '12px',
                padding: '24px',
                borderRadius: '16px',
                background: powerOn ? '#ffffff' : '#111217',
                border: `1px solid ${powerOn ? '#e5e7eb' : '#1f2027'}`,
                boxShadow: powerOn
                  ? '0 20px 40px -15px rgba(0,0,0,0.06)'
                  : '0 30px 60px -20px rgba(0,0,0,0.8)',
              }}
            >
              {bubbles.map((popped, i) => (
                <div
                  key={i}
                  onClick={() => popBubble(i)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: popped ? 'default' : 'pointer',
                    background: popped
                      ? (powerOn ? '#f4f4f5' : '#181920')
                      : (powerOn
                          ? 'radial-gradient(circle at 35% 35%, #ffffff, #d4d4d8)'
                          : 'radial-gradient(circle at 35% 35%, #2a2d39, #13141a)'),
                    border: popped
                      ? `1px solid ${powerOn ? '#e4e4e7' : '#1f212a'}`
                      : `1px solid ${powerOn ? '#cbd5e1' : '#333745'}`,
                    boxShadow: popped
                      ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                      : (powerOn
                          ? '0 4px 10px rgba(0,0,0,0.08), inset 0 -2px 4px rgba(0,0,0,0.1)'
                          : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)'),
                    transform: popped ? 'scale(0.92)' : 'scale(1)',
                    transition: 'transform 0.08s ease, background 0.15s ease',
                  }}
                />
              ))}
            </div>

            <button
              onClick={resetBubbles}
              style={{
                background: 'transparent',
                border: 'none',
                color: powerOn ? '#71717a' : '#71717a',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Regenerate Sheet
            </button>
          </div>
        )}

        {/* Tool 2: Industrial Rocker Switch */}
        {activeTab === 'switch' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div
              onClick={toggleSwitch}
              style={{
                width: '120px',
                height: '210px',
                background: powerOn ? '#ffffff' : '#14151b',
                borderRadius: '12px',
                border: `1px solid ${powerOn ? '#e2e8f0' : '#232530'}`,
                boxShadow: powerOn
                  ? '0 25px 50px -12px rgba(0,0,0,0.08)'
                  : '0 30px 60px -15px rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '130px',
                  background: powerOn ? '#f1f5f9' : '#0b0c10',
                  borderRadius: '6px',
                  border: `1px solid ${powerOn ? '#cbd5e1' : '#272935'}`,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: powerOn ? 'flex-start' : 'flex-end',
                  padding: '5px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    height: '58px',
                    width: '100%',
                    background: powerOn
                      ? 'linear-gradient(180deg, #ffffff, #e2e8f0)'
                      : 'linear-gradient(180deg, #262833, #181920)',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    border: `1px solid ${powerOn ? '#cbd5e1' : '#323645'}`,
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.5, textTransform: 'uppercase' }}>
              STATE: {powerOn ? 'LIGHT' : 'DARK'}
            </div>
          </div>
        )}

        {/* Tool 3: Tactile Aluminum Pen Plunger */}
        {activeTab === 'pen' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' }}>
            <div
              onClick={clickPen}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              {/* Plunger Actuator */}
              <div
                style={{
                  width: '28px',
                  height: penDepressed ? '14px' : '38px',
                  background: 'linear-gradient(90deg, #94a3b8, #cbd5e1, #64748b)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.06s cubic-bezier(0.1, 0.9, 0.2, 1)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)',
                }}
              />
              {/* Barrel */}
              <div
                style={{
                  width: '48px',
                  height: '240px',
                  background: powerOn
                    ? 'linear-gradient(90deg, #334155, #1e293b, #0f172a)'
                    : 'linear-gradient(90deg, #1e2029, #282b37, #13141a)',
                  borderRadius: '4px 4px 2px 2px',
                  border: `1px solid ${powerOn ? '#475569' : '#333746'}`,
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ width: '4px', height: '140px', background: '#475569', opacity: 0.4, borderRadius: '2px' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '38px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {penCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.5, textTransform: 'uppercase', marginTop: '4px' }}>
                ACTUATIONS
              </div>
            </div>
          </div>
        )}

        {/* Tool 4: Pure Metallic Coin */}
        {activeTab === 'coin' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' }}>
            <div
              onClick={triggerFlip}
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: powerOn
                  ? 'radial-gradient(circle at 35% 35%, #f1f5f9, #cbd5e1)'
                  : 'radial-gradient(circle at 35% 35%, #2a2d3a, #13141a)',
                border: `3px solid ${powerOn ? '#94a3b8' : '#3f4457'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: powerOn ? '#0f172a' : '#f1f5f9',
                cursor: 'pointer',
                transform: isFlipping ? 'rotateX(720deg) scale(1.05)' : 'rotateX(0deg) scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: powerOn
                  ? '0 20px 40px -10px rgba(0,0,0,0.15)'
                  : '0 25px 50px -10px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.15)',
              }}
            >
              {coinSide}
            </div>

            <div style={{ display: 'flex', gap: '32px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <span>HEADS: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{coinStats.heads}</strong></span>
              <span>TAILS: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{coinStats.tails}</strong></span>
            </div>
          </div>
        )}

        {/* Tool 5: Minimal Atmospheric Mood Meter */}
        {activeTab === 'mood' && (
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7 }}>
              Today's Global State
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              {[
                { id: 'serene', label: 'Balanced' },
                { id: 'neutral', label: 'Neutral' },
                { id: 'drained', label: 'Depleted' },
              ].map((m) => (
                <button
                  key={m.id}
                  disabled={Boolean(selectedMood)}
                  onClick={() => castVote(m.id as 'serene' | 'neutral' | 'drained')}
                  style={{
                    flex: 1,
                    padding: '16px 0',
                    borderRadius: '8px',
                    border: selectedMood === m.id
                      ? `2px solid ${powerOn ? '#090a0f' : '#ffffff'}`
                      : `1px solid ${powerOn ? '#e4e4e7' : '#232530'}`,
                    background: powerOn ? '#ffffff' : '#121318',
                    color: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: selectedMood ? 'default' : 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Precision Bar */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ height: '4px', width: '100%', display: 'flex', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(votes.serene / totalVotes) * 100}%`, background: '#3b82f6' }} />
                <div style={{ width: `${(votes.neutral / totalVotes) * 100}%`, background: '#71717a' }} />
                <div style={{ width: `${(votes.drained / totalVotes) * 100}%`, background: '#ef4444' }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontVariantNumeric: 'tabular-nums',
                  opacity: 0.5,
                  marginTop: '10px',
                  letterSpacing: '0.04em',
                }}
              >
                <span>BALANCED {Math.round((votes.serene / totalVotes) * 100)}%</span>
                <span>NEUTRAL {Math.round((votes.neutral / totalVotes) * 100)}%</span>
                <span>DEPLETED {Math.round((votes.drained / totalVotes) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tool 6: Precision Monolith Scroll */}
        {activeTab === 'scroll' && (
          <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '42px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                {meters}m
              </div>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.5, textTransform: 'uppercase', marginTop: '2px' }}>
                Depth Descended
              </div>
            </div>

            <div
              onScroll={onScrollContainer}
              style={{
                width: '100%',
                height: '320px',
                borderRadius: '12px',
                border: `1px solid ${powerOn ? '#e4e4e7' : '#1f212a'}`,
                background: powerOn ? '#ffffff' : '#0d0e12',
                overflowY: 'scroll',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ height: '18000px', position: 'relative', padding: '24px' }}>
                <div style={{ position: 'absolute', top: '80px', fontSize: '12px', opacity: 0.4 }}>02m - Surface layer</div>
                <div style={{ position: 'absolute', top: '1200px', fontSize: '12px', opacity: 0.4 }}>38m - Blue Whale body length</div>
                <div style={{ position: 'absolute', top: '2400px', fontSize: '12px', opacity: 0.4 }}>73m - Qutub Minar, Delhi</div>
                <div style={{ position: 'absolute', top: '4800px', fontSize: '12px', opacity: 0.4 }}>140m - Great Pyramid of Giza</div>
                <div style={{ position: 'absolute', top: '10500px', fontSize: '12px', opacity: 0.4 }}>330m - Eiffel Tower, Paris</div>
                <div style={{ position: 'absolute', top: '17000px', fontSize: '12px', opacity: 0.4 }}>530m - Deepest scuba descent record</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Industrial Navigation Dock */}
      <footer
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '36px',
        }}
      >
        <nav
          style={{
            display: 'flex',
            gap: '4px',
            padding: '6px',
            borderRadius: '10px',
            background: powerOn ? '#ffffff' : '#121318',
            border: `1px solid ${powerOn ? '#e4e4e7' : '#232530'}`,
            boxShadow: powerOn ? '0 10px 25px rgba(0,0,0,0.04)' : '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {[
            { id: 'bubble', label: 'Membrane' },
            { id: 'pen', label: 'Plunger' },
            { id: 'switch', label: 'Rocker' },
            { id: 'coin', label: 'Coin' },
            { id: 'mood', label: 'Atmosphere' },
            { id: 'scroll', label: 'Void' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? (powerOn ? '#090a0f' : '#ededed') : 'transparent',
                color: activeTab === tab.id ? (powerOn ? '#ffffff' : '#090a0f') : (powerOn ? '#71717a' : '#71717a'),
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}
