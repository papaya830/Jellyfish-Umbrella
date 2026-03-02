// client/src/components/TentacleControl.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { setMovement } from '../api';
import './TentacleControl.css';

const COOLDOWN_MS = 6000;

export default function TentacleControl() {
  const [lastDirection, setLastDirection] = useState(null); // 'left' | 'right' | null
  const [cooldownPct,   setCooldownPct]   = useState(0);    // 0–100
  const [status,        setStatus]        = useState('idle'); // 'idle'|'sending'|'sent'|'error'
  const [isOnCooldown,  setIsOnCooldown]  = useState(false);

  const rafRef       = useRef(null);
  const startTimeRef = useRef(null);

  // Animate the cooldown arc
  const startCooldown = useCallback(() => {
    setIsOnCooldown(true);
    setCooldownPct(100);
    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const remaining = Math.max(0, 1 - elapsed / COOLDOWN_MS);
      setCooldownPct(remaining * 100);
      if (elapsed < COOLDOWN_MS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsOnCooldown(false);
        setCooldownPct(0);
        setStatus('idle');
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const trigger = async (direction) => {
    if (isOnCooldown || status === 'sending') return;
    setStatus('sending');
    setLastDirection(direction);
    try {
      await setMovement({ direction });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
    startCooldown();
  };

  // SVG arc for cooldown ring
  const R = 54, STROKE = 4;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * (1 - cooldownPct / 100);
  const secsLeft = isOnCooldown
    ? Math.ceil(((cooldownPct / 100) * COOLDOWN_MS) / 1000)
    : 0;

  const statusText = {
    idle:    lastDirection ? `Last: moved ${lastDirection}` : 'Ready to move',
    sending: 'Sending command…',
    sent:    `Moved ${lastDirection} — cooling down`,
    error:   'Command failed — try again',
  }[status] || '';

  return (
    <div className="tc-root">
      {/* header */}
      <div className="tc-header">
        <div className="tc-header-left">
          <div className="tc-logo">🪼</div>
          <div>
            <div className="tc-site-title">Jellyfish Umbrella</div>
            <div className="tc-site-sub">Tentacle Movement</div>
          </div>
        </div>
      </div>

      <div className="tc-body">

        {/* central cooldown indicator */}
        <div className="tc-center">
          <div className="tc-ring-wrap">
            <svg className="tc-ring-svg" viewBox="0 0 124 124" width="124" height="124">
              {/* track */}
              <circle
                cx="62" cy="62" r={R}
                fill="none"
                stroke="rgba(120,200,255,.08)"
                strokeWidth={STROKE}
              />
              {/* active arc */}
              <circle
                cx="62" cy="62" r={R}
                fill="none"
                stroke={isOnCooldown ? 'rgba(79,195,247,.55)' : 'rgba(79,195,247,.0)'}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 62 62)"
                style={{ transition: isOnCooldown ? 'none' : 'stroke .3s' }}
              />
            </svg>
            <div className="tc-ring-inner">
              {isOnCooldown ? (
                <>
                  <div className="tc-ring-secs">{secsLeft}s</div>
                  <div className="tc-ring-label">cooldown</div>
                </>
              ) : (
                <>
                  <div className="tc-ring-ready">🪼</div>
                  <div className="tc-ring-label">ready</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* direction buttons */}
        <div className="tc-btn-row">
          <button
            className={`tc-dir-btn tc-dir-btn--left${lastDirection === 'left' && isOnCooldown ? ' tc-dir-btn--active' : ''}`}
            onClick={() => trigger('left')}
            disabled={isOnCooldown || status === 'sending'}
          >
            <div className="tc-dir-arrow">←</div>
            <div className="tc-dir-label">Left</div>
            <div className="tc-dir-sub">Swing tentacles left</div>
          </button>

          <button
            className={`tc-dir-btn tc-dir-btn--right${lastDirection === 'right' && isOnCooldown ? ' tc-dir-btn--active' : ''}`}
            onClick={() => trigger('right')}
            disabled={isOnCooldown || status === 'sending'}
          >
            <div className="tc-dir-arrow">→</div>
            <div className="tc-dir-label">Right</div>
            <div className="tc-dir-sub">Swing tentacles right</div>
          </button>
        </div>

        {/* status line */}
        <div className={`tc-status${status === 'error' ? ' tc-status--err' : isOnCooldown ? ' tc-status--cool' : ''}`}>
          {statusText}
        </div>

        {/* cooldown explanation */}
        <div className="tc-footnote">
          Each movement triggers a <strong>6-second cooldown</strong> to protect the servo motors from overloading.
        </div>

      </div>
    </div>
  );
}