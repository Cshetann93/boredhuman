import React, { useState, useEffect, useRef } from 'react';

// Sound Synthesizer using Web Audio API (no external sound files required)
const playFx = (type: string, isMuted: boolean) => {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'pen-down') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'pen-up') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.03);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'switch') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'vote') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    // AudioContext blocked before user interaction
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'bubble' | 'pen' | 'switch' | 'coin' | 'mood' | 'scroll'>('bubble');
  const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('bh_muted') === 'true');
  const [totalActions, setTotalActions] = useState<number>(() => {
    return parseInt(localStorage.getItem('bh_actions') || '0', 10);
  });

  const recordAction = () => {
    setTotalActions((prev) => {
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

  // 1. Bubble Wrap State
  const [bubbles, setBubbles] = useState<boolean[]>(() => Array(48).fill(false));
  const popBubble = (index: number) => {
    if (bubbles[index]) return;
    playFx('pop', isMuted);
    recordAction();
    const updated = [...bubbles];
    updated[index] = true;
    setBubbles(updated);
  };
  const resetBubbles = () => {
    setBubbles(Array(48).fill(false));
  };

  // 2. Light Switch State
  const [lightsOn, setLightsOn] = useState<boolean>(false);
  const toggleLight = () => {
    playFx('switch', isMuted);
    recordAction();
    setLightsOn((prev) => !prev);
  };

  // 3. Pen Clicker State
  const [penPressed, setPenPressed] = useState<boolean>(false);
  const [penClicks, setPenClicks] = useState<number>(0);
  const clickPenDown = () => {
    setPenPressed(true);
    playFx('pen-down', isMuted);
    setPenClicks((prev) => prev + 1);
    recordAction();
  };
  const clickPenUp = () => {
    if (penPressed) {
      playFx('pen-up', isMuted);
      setPenPressed(false);
    }
  };

  // 4. Coin Toss State
  const [flipping, setFlipping] = useState<boolean>(false);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [coinStats, setCoinStats] = useState({ heads: 14, tails: 11 });
  const flipCoin = () => {
    if (flipping) return;
    setFlipping(true);
    playFx('coin', isMuted);
    recordAction();
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 'heads' : 'tails';
      setCoinSide(result);
      setCoinStats((prev) => ({ ...prev, [result]: prev[result] + 1 }));
      setFlipping(false);
    }, 700);
  };

  // 5. Daily Mood Meter State
  const [userVote, setUserVote] = useState<string | null>(() => localStorage.getItem('bh_mood_vote'));
  const [moodVotes, setMoodVotes] = useState({ great: 312, meh: 540, tired: 421 });
  const voteMood = (type: 'great' | 'meh' | 'tired') => {
    if (userVote) return;
    playFx('vote', isMuted);
    recordAction();
    setUserVote(type);
    localStorage.setItem('bh_mood_vote', type);
    setMoodVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };
  const totalMoodVotes = moodVotes.great + moodVotes.meh + moodVotes.tired;

  // 6. Longest Scroll State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [metersScrolled, setMetersScrolled] = useState<number>(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    const meters = Math.floor(top / 40);
    setMetersScrolled(meters);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: lightsOn ? '#f4f4f5' : '#09090b',
        color: lightsOn ? '#18181b' : '#fafafa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background-color 0.25s, color 0.25s',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          width: '100%',
          maxWidth: '850px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 20px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }}
          />
          <span style={{ fontWeight: 800, letterSpacing: '-0.5px', fontSize: '18px' }}>
            boredhuman.in
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: lightsOn ? '#e4e4e7' : '#18181b',
              border: `1px solid ${lightsOn ? '#d4d4d8' : '#27272a'}`,
              fontWeight: 600,
            }}
          >
            {totalActions} clicks today
          </div>

          <button
            onClick={toggleMute}
            aria-label="Toggle Sound"
            style={{
              background: lightsOn ? '#e4e4e7' : '#18181b',
              border: `1px solid ${lightsOn ? '#d4d4d8' : '#27272a'}`,
              color: 'inherit',
              borderRadius: '999px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {isMuted ? '🔇 Off' : '🔊 On'}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '750px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Tool 1: Bubble Wrap */}
        {activeTab === 'bubble' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '10px',
                padding: '24px',
                borderRadius: '24px',
                background: lightsOn ? '#ffffff' : '#121215',
                border: `1px solid ${lightsOn ? '#e4e4e7' : '#27272a'}`,
                boxShadow: lightsOn ? '0 10px 25px rgba(0,0,0,0.05)' : '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              {bubbles.map((isPopped, idx) => (
                <button
                  key={idx}
                  onClick={() => popBubble(idx)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: isPopped ? 'default' : 'pointer',
                    background: isPopped
                      ? (lightsOn ? '#e4e4e7' : '#27272a')
                      : 'linear-gradient(135deg, #38bdf8, #2563eb)',
                    opacity: isPopped ? 0.35 : 1,
                    transform: isPopped ? 'scale(0.88)' : 'scale(1)',
                    transition: 'all 0.12s ease',
                    boxShadow: isPopped ? 'none' : '0 4px 10px rgba(37,99,235,0.4)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={resetBubbles}
              style={{
                background: 'transparent',
                border: `1px solid ${lightsOn ? '#d4d4d8' : '#3f3f46'}`,
                color: 'inherit',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Fresh Sheet
            </button>
          </div>
        )}

        {/* Tool 2: Light Switch */}
        {activeTab === 'switch' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div
              onClick={toggleLight}
              style={{
                width: '100px',
                height: '170px',
                background: lightsOn ? '#ffffff' : '#18181b',
                border: `3px solid ${lightsOn ? '#d4d4d8' : '#27272a'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: lightsOn ? '0 15px 35px rgba(0,0,0,0.08)' : '0 20px 40px rgba(0,0,0,0.7)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '80px',
                  background: lightsOn ? '#f4f4f5' : '#27272a',
                  borderRadius: '8px',
                  border: `2px solid ${lightsOn ? '#d4d4d8' : '#3f3f46'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: lightsOn ? 'flex-start' : 'flex-end',
                  padding: '4px',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '34px',
                    borderRadius: '5px',
                    background: lightsOn ? '#3b82f6' : '#71717a',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            </div>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>
              The switch is currently {lightsOn ? 'ON' : 'OFF'}
            </span>
          </div>
        )}

        {/* Tool 3: Pen Clicker */}
        {activeTab === 'pen' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div
              onMouseDown={clickPenDown}
              onMouseUp={clickPenUp}
              onTouchStart={clickPenDown}
              onTouchEnd={clickPenUp}
              style={{
                width: '70px',
                height: '240px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Clickable Plunger */}
              <div
                style={{
                  width: '18px',
                  height: penPressed ? '10px' : '26px',
                  background: '#a1a1aa',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  transition: 'height 0.05s linear',
                }}
              />
              {/* Pen Body */}
              <div
                style={{
                  width: '40px',
                  height: '170px',
                  background: 'linear-gradient(180deg, #1e293b, #0f172a)',
                  borderRadius: '10px 10px 6px 6px',
                  border: '2px solid #334155',
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '20px',
                }}
              >
                <div style={{ width: '4px', height: '90px', background: '#475569', borderRadius: '2px' }} />
              </div>
              {/* Tip */}
              <div
                style={{
                  width: '0',
                  height: '0',
                  borderLeft: '14px solid transparent',
                  borderRight: '14px solid transparent',
                  borderTop: '28px solid #94a3b8',
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{penClicks}</div>
              <div style={{ fontSize: '13px', opacity: 0.6 }}>pen clicks</div>
            </div>
          </div>
        )}

        {/* Tool 4: Coin Toss */}
        {activeTab === 'coin' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div
              onClick={flipCoin}
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                border: '4px solid #fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 900,
                color: '#78350f',
                cursor: 'pointer',
                transform: flipping ? 'rotateY(720deg) scale(1.15)' : 'rotateY(0deg) scale(1)',
                transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 12px 30px rgba(217,119,6,0.4)',
              }}
            >
              {coinSide === 'heads' ? 'HEADS' : 'TAILS'}
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
              <span>Heads: <strong>{coinStats.heads}</strong></span>
              <span>Tails: <strong>{coinStats.tails}</strong></span>
            </div>
          </div>
        )}

        {/* Tool 5: Daily Mood Meter */}
        {activeTab === 'mood' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ margin: 0, fontWeight: 700 }}>How is your day going?</h3>
            <div style={{ display: 'flex', gap: '14px', width: '100%' }}>
              {[
                { key: 'great', label: 'Great 😄' },
                { key: 'meh', label: 'Meh 😐' },
                { key: 'tired', label: 'Tired 🥱' },
              ].map((item) => (
                <button
                  key={item.key}
                  disabled={Boolean(userVote)}
                  onClick={() => voteMood(item.key as any)}
                  style={{
                    flex: 1,
                    padding: '16px 8px',
                    borderRadius: '14px',
                    border: userVote === item.key ? '2px solid #3b82f6' : `1px solid ${lightsOn ? '#e4e4e7' : '#27272a'}`,
                    background: lightsOn ? '#ffffff' : '#141417',
                    color: 'inherit',
                    fontWeight: 600,
                    cursor: userVote ? 'default' : 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Results bar */}
            <div style={{ width: '100%', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.6, marginBottom: '6px' }}>
                <span>😄 {Math.round((moodVotes.great / totalMoodVotes) * 100)}%</span>
                <span>😐 {Math.round((moodVotes.meh / totalMoodVotes) * 100)}%</span>
                <span>🥱 {Math.round((moodVotes.tired / totalMoodVotes) * 100)}%</span>
              </div>
              <div style={{ height: '8px', width: '100%', display: 'flex', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${(moodVotes.great / totalMoodVotes) * 100}%`, background: '#10b981' }} />
                <div style={{ width: `${(moodVotes.meh / totalMoodVotes) * 100}%`, background: '#f59e0b' }} />
                <div style={{ width: `${(moodVotes.tired / totalMoodVotes) * 100}%`, background: '#ef4444' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tool 6: The Longest Scroll */}
        {activeTab === 'scroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800 }}>{metersScrolled}m</div>
              <div style={{ fontSize: '13px', opacity: 0.6 }}>depth reached into the void</div>
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              style={{
                width: '100%',
                maxWidth: '460px',
                height: '320px',
                borderRadius: '16px',
                border: `1px solid ${lightsOn ? '#e4e4e7' : '#27272a'}`,
                background: lightsOn ? '#ffffff' : '#111113',
                overflowY: 'scroll',
                position: 'relative',
                padding: '20px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ height: '14000px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '100px' }}>📍 2.5m — Start descending</div>
                <div style={{ position: 'absolute', top: '800px' }}>🦒 20m — Taller than a giraffe</div>
                <div style={{ position: 'absolute', top: '2900px' }}>🏛️ 73m — Qutub Minar passed</div>
                <div style={{ position: 'absolute', top: '5600px' }}>🗽 140m — Great Pyramid of Giza</div>
                <div style={{ position: 'absolute', top: '13000px' }}>🏆 325m — Eiffel Tower conquered</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Console Dock */}
      <nav
        style={{
          marginBottom: '28px',
          display: 'flex',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '999px',
          background: lightsOn ? '#ffffff' : '#18181b',
          border: `1px solid ${lightsOn ? '#e4e4e7' : '#27272a'}`,
          boxShadow: lightsOn ? '0 10px 30px rgba(0,0,0,0.06)' : '0 15px 35px rgba(0,0,0,0.6)',
        }}
      >
        {[
          { key: 'bubble', label: '🫧 Bubbles' },
          { key: 'pen', label: '🖊️ Pen' },
          { key: 'switch', label: '💡 Switch' },
          { key: 'coin', label: '🪙 Coin' },
          { key: 'mood', label: '🎭 Mood' },
          { key: 'scroll', label: '📜 Scroll' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key as any)}
            style={{
              background: activeTab === item.key ? (lightsOn ? '#18181b' : '#fafafa') : 'transparent',
              color: activeTab === item.key ? (lightsOn ? '#fafafa' : '#18181b') : 'inherit',
              border: 'none',
              borderRadius: '999px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
