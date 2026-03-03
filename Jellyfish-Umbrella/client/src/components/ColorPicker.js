import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setColor, generateAIColors } from '../api';
import MovementModeControl from './MovementModeControl';
import './ColorPicker.css';

// ─────────────────────────────────────────────────
//  Pure colour helpers (no React)
// ─────────────────────────────────────────────────
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

// brightness 0-255 → lightness % so colours stay rich
function briToL(bri) { return 10 + (bri / 255) * 55; }

function calcRgb(hue, sat, bri) { return hslToRgb(hue, sat, briToL(bri)); }

function toHex2(v) { return v.toString(16).padStart(2, '0').toUpperCase(); }
function toHex6(r, g, b) { return toHex2(r) + toHex2(g) + toHex2(b); }

// Convert a 6-char hex string back to hue (0-360) + sat (0-100)
// so the wheel can reposition itself when AI returns a colour.
function hexToHueSat(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l   = (max + min) / 2;
  if (max === min) return { hue: 0, sat: 0 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return { hue: Math.round(h * 360), sat: Math.round(s * 100) };
}

function css(r, g, b, a) {
  return a === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}

// ─────────────────────────────────────────────────
//  Wave gradient helper
// ─────────────────────────────────────────────────
function waveBandGradient(r, g, b, pos, alpha) {
  const span = 0.35;
  const lo   = Math.max(0,   (pos - span) * 100).toFixed(1);
  const mid  = (pos * 100).toFixed(1);
  const hi   = Math.min(100, (pos + span) * 100).toFixed(1);
  const dim    = css(r, g, b, alpha * 0.18);
  const bright = css(r, g, b, alpha);
  return `linear-gradient(to bottom, ${dim} 0%, ${dim} ${lo}%, ${bright} ${mid}%, ${dim} ${hi}%, ${dim} 100%)`;
}

// ─────────────────────────────────────────────────
//  Twinkle state helpers
// ─────────────────────────────────────────────────
function makeTwinkleStates(count) {
  return Array.from({ length: count }, () => ({
    active: false, phase: 0, speed: 0,
    countdown: Math.floor(Math.random() * 60),
  }));
}

function stepTwinkle(states) {
  return states.map(s => {
    if (s.active) {
      s.phase += s.speed;
      if (s.phase >= 1) {
        s.active = false;
        s.countdown = Math.floor(20 + Math.random() * 80);
        return 0.08;
      }
      const t = s.phase;
      return Math.max(0.08, t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8);
    } else {
      s.countdown--;
      if (s.countdown <= 0) {
        s.active = true; s.phase = 0;
        s.speed = 0.025 + Math.random() * 0.04;
      }
      return 0.08;
    }
  });
}

// ─────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────
const PATTERNS = [
  { id: 'solid',   name: 'Solid',   tip: 'All LEDs on, steady.' },
  { id: 'twinkle', name: 'Twinkle', tip: 'LEDs sparkle randomly.' },
  { id: 'rainbow', name: 'Rainbow', tip: 'Cycles through all hues.' },
  { id: 'pulse',   name: 'Pulse',   tip: 'Fades in and out.' },
  { id: 'wave',    name: 'Wave',    tip: 'Light travels down strips.' },
];

const MINI_H = [7, 10, 13, 10, 7];
// 8 main tentacles for clearer movement preview
const MAIN_H = [30, 40, 48, 40, 40, 48, 40, 30];

// ─────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────
export default function ColorPicker({ onColorSent, tentacleState = 'resting', setTentacleState } = {}) {
  // ── React state (triggers re-render) ────────────
  const [hue,     setHue]     = useState(200);
  const [sat,     setSat]     = useState(90);
  const [bri,     setBri]     = useState(192);
  const [pattern, setPattern] = useState('solid');
  const [sendStatus, setSendStatus] = useState('idle'); // 'idle'|'sending'|'sent'|'error'
  const [connected,  setConnected]  = useState(true);
  const [aiPrompt,   setAiPrompt]   = useState('');
  const [aiStatus,   setAiStatus]   = useState('idle'); // 'idle'|'loading'|'error'

  // ── Refs — mutable values that don't need re-render ─
  const hueRef = useRef(hue);
  const satRef = useRef(sat);
  const briRef = useRef(bri);
  useEffect(() => { hueRef.current = hue; }, [hue]);
  useEffect(() => { satRef.current = sat; }, [sat]);
  useEffect(() => { briRef.current = bri; }, [bri]);

  // DOM refs
  const canvasRef      = useRef(null);
  const wheelCenterRef = useRef(null);
  const hexLabelRef    = useRef(null);
  const chipRRef       = useRef(null);
  const chipGRef       = useRef(null);
  const chipBRef       = useRef(null);
  const chipHexRef     = useRef(null);
  const jellyBellRef   = useRef(null);
  const glowBallRef    = useRef(null);
  const previewLblRef  = useRef(null);
  const sendBtnRef     = useRef(null);
  // main tentacle refs array
  const mainTRefs      = useRef(MAIN_H.map(() => React.createRef()));
  // mini jellyfish refs: { patternId: { bellRef, tentacleRefs[] } }
  const miniRefs       = useRef(
    Object.fromEntries(PATTERNS.map(p => [
      p.id,
      {
        bell:      React.createRef(),
        tentacles: MINI_H.map(() => React.createRef()),
        wrapRef:   React.createRef(),
      },
    ]))
  );

  // animation frame handles
  const hoverFrameRef  = useRef(null);
  const hoverTRef      = useRef(0);
  const miniFrameRefs  = useRef(Object.fromEntries(PATTERNS.map(p => [p.id, null])));
  const miniTRefs_     = useRef(Object.fromEntries(PATTERNS.map(p => [p.id, 0])));
  const twinkleMain    = useRef(makeTwinkleStates(MAIN_H.length));
  const twinkleMini    = useRef(Object.fromEntries(PATTERNS.map(p => [p.id, makeTwinkleStates(MINI_H.length)])));

  // dragging state
  const dragging = useRef(false);

  // ── Colour from current state ────────────────────
  const getRgb = useCallback(() => calcRgb(hueRef.current, satRef.current, briRef.current), []);

  // ── Draw wheel ───────────────────────────────────
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const outerR = W / 2 - 6;
    const innerR = outerR * 0.34;
    const edgeAA = 1.5; // small band for softer edge

    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;
    const l = briToL(briRef.current);

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const x = px - cx, y = py - cy;
        const dist = Math.sqrt(x * x + y * y);
        if (dist > outerR + edgeAA || dist < innerR - edgeAA) continue;

        let alpha = 1;
        if (dist > outerR - edgeAA) {
          alpha = Math.max(0, (outerR + edgeAA - dist) / (2 * edgeAA));
        }
        if (dist < innerR + edgeAA) {
          alpha = Math.min(alpha, Math.max(0, (dist - (innerR - edgeAA)) / (2 * edgeAA)));
        }
        if (alpha <= 0) continue;

        const h   = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
        const s   = Math.min(100, (dist / outerR) * 100);
        const { r, g, b } = hslToRgb(h, s, l);
        const idx = (py * W + px) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = Math.round(255 * alpha);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // indicator dot
    const { r: cr, g: cg, b: cb } = getRgb();
    const angle = hueRef.current * Math.PI / 180;
    const dotR  = (satRef.current / 100) * outerR;
    const dx = cx + dotR * Math.cos(angle);
    const dy = cy + dotR * Math.sin(angle);

    ctx.beginPath(); ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    ctx.fillStyle = css(cr, cg, cb, .25); ctx.fill();

    ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = css(cr, cg, cb); ctx.shadowBlur = 14;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2);
    ctx.fillStyle = css(cr, cg, cb); ctx.fill();

    // outer glow
    const grd = ctx.createRadialGradient(cx, cy, outerR - 2, cx, cy, outerR + 22);
    grd.addColorStop(0, css(cr, cg, cb, .18)); grd.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, outerR + 20, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }, [getRgb]);

  // ── Update all DOM readouts ──────────────────────
  const updateReadouts = useCallback(() => {
    const { r, g, b } = getRgb();
    const hex6 = toHex6(r, g, b);
    const c = css(r, g, b), ca = css(r, g, b, .7);

    if (wheelCenterRef.current) {
      wheelCenterRef.current.style.background = c;
      wheelCenterRef.current.style.boxShadow  = `0 0 28px 8px ${ca}`;
    }
    if (hexLabelRef.current)  hexLabelRef.current.textContent  = '#' + hex6;
    if (chipRRef.current)     chipRRef.current.textContent     = toHex2(r);
    if (chipGRef.current)     chipGRef.current.textContent     = toHex2(g);
    if (chipBRef.current)     chipBRef.current.textContent     = toHex2(b);
    if (chipHexRef.current)   chipHexRef.current.textContent   = hex6;
    if (sendBtnRef.current) {
      sendBtnRef.current.style.background = `linear-gradient(135deg, ${css(r,g,b,.75)}, ${css(Math.min(r+30,255),Math.min(g+15,255),Math.min(b+30,255),.9)})`;
      sendBtnRef.current.style.boxShadow  = `0 4px 24px ${css(r,g,b,.45)}`;
    }
  }, [getRgb]);

  // ── Set main preview to solid current colour ─────
  const setMainSolid = useCallback(() => {
    const { r, g, b } = getRgb();
    const c = css(r, g, b), ca = css(r, g, b, .7);
    if (jellyBellRef.current) {
      jellyBellRef.current.style.background = c;
      jellyBellRef.current.style.boxShadow  = `0 0 20px 6px ${ca}`;
    }
    if (glowBallRef.current) {
      glowBallRef.current.style.background = c;
      glowBallRef.current.style.opacity    = '1';
    }
    mainTRefs.current.forEach(ref => {
      if (!ref.current) return;
      ref.current.style.background = c;
      ref.current.style.boxShadow  = `0 0 6px ${ca}`;
      ref.current.style.transform  = 'none';
    });
  }, [getRgb]);

  // ── Refresh all mini jellies to solid current colour
  const refreshAllMiniJellies = useCallback(() => {
    const { r, g, b } = getRgb();
    const c = css(r, g, b), ca = css(r, g, b, .6);
    PATTERNS.forEach(p => {
      const refs = miniRefs.current[p.id];
      if (refs.bell.current) {
        refs.bell.current.style.background = c;
        refs.bell.current.style.boxShadow  = `0 0 6px 2px ${ca}`;
      }
      refs.tentacles.forEach(t => {
        if (!t.current) return;
        t.current.style.background = c;
        t.current.style.boxShadow  = `0 0 3px ${ca}`;
        t.current.style.height     = MINI_H[refs.tentacles.indexOf(t)] + 'px';
      });
    });
  }, [getRgb]);

  // ── Mini anim ────────────────────────────────────
  const startMiniAnim = useCallback((id) => {
    if (miniFrameRefs.current[id]) return;
    miniTRefs_.current[id] = 0;
    if (id === 'twinkle') twinkleMini.current[id] = makeTwinkleStates(MINI_H.length);

    const refs = miniRefs.current[id];

    function loop() {
      miniTRefs_.current[id]++;
      const t = miniTRefs_.current[id];
      const { r, g, b } = calcRgb(hueRef.current, satRef.current, briRef.current);
      const c = css(r, g, b), ca = css(r, g, b, .6);

      const bell = refs.bell.current;
      const tents = refs.tentacles.map(ref => ref.current);

      if (id === 'solid') {
        if (bell) { bell.style.background = c; bell.style.boxShadow = `0 0 6px 2px ${ca}`; }
        tents.forEach(el => { if (el) { el.style.background = c; el.style.boxShadow = `0 0 3px ${ca}`; } });

      } else if (id === 'twinkle') {
        if (bell) { bell.style.background = c; bell.style.boxShadow = `0 0 6px 2px ${ca}`; }
        const ops = stepTwinkle(twinkleMini.current[id]);
        tents.forEach((el, i) => {
          if (!el) return;
          const op  = ops[i];
          const fa  = Math.max(0, op - 0.5) * 2;
          const fr  = Math.min(255, r + Math.round((255 - r) * fa));
          const fg  = Math.min(255, g + Math.round((255 - g) * fa));
          const fb_ = Math.min(255, b + Math.round((255 - b) * fa));
          el.style.background = css(fr, fg, fb_, op);
          el.style.boxShadow  = `0 0 ${3 * op}px ${css(fr, fg, fb_, op * .8)}`;
        });

      } else if (id === 'rainbow') {
        const h  = (t * 2.5) % 360;
        if (bell) { bell.style.background = `hsl(${h},100%,55%)`; bell.style.boxShadow = `0 0 6px 2px hsla(${h},100%,55%,.6)`; }
        tents.forEach((el, i) => {
          if (!el) return;
          const th = (h + i * 22) % 360;
          el.style.background = `hsl(${th},100%,55%)`;
          el.style.boxShadow  = `0 0 3px hsl(${th},100%,55%)`;
        });

      } else if (id === 'pulse') {
        const f  = (Math.sin(t * 0.07) + 1) / 2;
        const op = (.08 + .92 * f).toFixed(2);
        if (bell) { bell.style.background = css(r,g,b,op); bell.style.boxShadow = `0 0 6px 2px ${css(r,g,b,(f*.7).toFixed(2))}`; }
        tents.forEach(el => { if (el) { el.style.background = css(r,g,b,op); el.style.boxShadow = `0 0 3px ${css(r,g,b,(f*.7).toFixed(2))}`; } });

      } else if (id === 'wave') {
        if (bell) { bell.style.background = c; bell.style.boxShadow = `0 0 6px 2px ${ca}`; }
        const speed = 0.018;
        tents.forEach((el, i) => {
          if (!el) return;
          const offset = i * 0.15;
          const pos    = ((t * speed) + offset) % 1;
          el.style.background = waveBandGradient(r, g, b, pos, 0.9);
          el.style.boxShadow  = `0 0 3px ${css(r,g,b,.4)}`;
        });
      }

      miniFrameRefs.current[id] = requestAnimationFrame(loop);
    }
    loop();
  }, []);

  const stopMiniAnim = useCallback((id) => {
    if (miniFrameRefs.current[id]) {
      cancelAnimationFrame(miniFrameRefs.current[id]);
      miniFrameRefs.current[id] = null;
    }
    // reset tentacle heights
    const refs = miniRefs.current[id];
    refs.tentacles.forEach((ref, i) => {
      if (ref.current) ref.current.style.height = MINI_H[i] + 'px';
    });
    refreshAllMiniJellies();
  }, [refreshAllMiniJellies]);

  // ── Main hover anim ──────────────────────────────
  const startHoverAnim = useCallback((patId) => {
    if (hoverFrameRef.current) cancelAnimationFrame(hoverFrameRef.current);
    hoverTRef.current = 0;
    if (patId === 'twinkle') twinkleMain.current = makeTwinkleStates(MAIN_H.length);

    const pat = PATTERNS.find(p => p.id === patId);
    if (previewLblRef.current) {
      previewLblRef.current.textContent = `Previewing: ${pat.name} — ${pat.tip}`;
      previewLblRef.current.className   = 'cp-preview-label hovering';
    }

    function loop() {
      hoverTRef.current++;
      const ht = hoverTRef.current;
      const { r, g, b } = calcRgb(hueRef.current, satRef.current, briRef.current);
      const c = css(r,g,b), ca = css(r,g,b,.7);
      const bell    = jellyBellRef.current;
      const glow    = glowBallRef.current;
      const tents   = mainTRefs.current.map(ref => ref.current);

      if (patId === 'solid') {
        if (bell) { bell.style.background = c; bell.style.boxShadow = `0 0 20px 6px ${ca}`; }
        if (glow) { glow.style.background = c; glow.style.opacity = '1'; }
        tents.forEach(el => { if (el) { el.style.background = c; el.style.boxShadow = `0 0 6px ${ca}`; el.style.transform = 'none'; } });

      } else if (patId === 'twinkle') {
        if (bell) { bell.style.background = c; bell.style.boxShadow = `0 0 20px 6px ${ca}`; }
        if (glow) { glow.style.background = c; glow.style.opacity = '1'; }
        const ops = stepTwinkle(twinkleMain.current);
        tents.forEach((el, i) => {
          if (!el) return;
          const op  = ops[i];
          const fa  = Math.max(0, op - 0.3) / 0.7;
          const fr  = Math.min(255, r + Math.round((255 - r) * fa));
          const fg  = Math.min(255, g + Math.round((255 - g) * fa));
          const fb_ = Math.min(255, b + Math.round((255 - b) * fa));
          el.style.background = css(fr, fg, fb_, op);
          el.style.boxShadow  = `0 0 ${Math.round(8 * op)}px ${css(fr, fg, fb_, op * .8)}`;
          el.style.transform  = 'none';
        });

      } else if (patId === 'rainbow') {
        const h  = (ht * 2.2) % 360;
        const rc = `hsl(${h},100%,55%)`;
        if (bell) { bell.style.background = rc; bell.style.boxShadow = `0 0 20px 6px hsla(${h},100%,55%,.7)`; }
        if (glow) { glow.style.background = rc; glow.style.opacity = '1'; }
        tents.forEach((el, i) => {
          if (!el) return;
          const th = (h + i * 16) % 360;
          el.style.background = `hsl(${th},100%,55%)`;
          el.style.boxShadow  = `0 0 6px hsl(${th},100%,55%)`;
          el.style.transform  = 'none';
        });

      } else if (patId === 'pulse') {
        const f   = (Math.sin(ht * 0.055) + 1) / 2;
        const op  = (.06 + .94 * f).toFixed(3);
        const gf  = (f * .75).toFixed(3);
        if (bell) { bell.style.background = css(r,g,b,op); bell.style.boxShadow = `0 0 ${4 + 26*f}px 6px ${css(r,g,b,gf)}`; }
        if (glow) { glow.style.background = c; glow.style.opacity = op; }
        tents.forEach(el => { if (el) { el.style.background = css(r,g,b,op); el.style.boxShadow = `0 0 6px ${css(r,g,b,gf)}`; el.style.transform = 'none'; } });

      } else if (patId === 'wave') {
        const speed = 0.012;
        if (bell) { bell.style.background = c; bell.style.boxShadow = `0 0 20px 6px ${ca}`; }
        if (glow) { glow.style.background = c; glow.style.opacity = '0.7'; }
        tents.forEach((el, i) => {
          if (!el) return;
          const offset = (i / (MAIN_H.length - 1)) * 0.25;
          const pos    = ((ht * speed) + offset) % 1;
          el.style.background = waveBandGradient(r, g, b, pos, 1.0);
          el.style.boxShadow  = `0 0 6px ${css(r,g,b,.5)}`;
          el.style.transform  = 'none';
        });
      }

      hoverFrameRef.current = requestAnimationFrame(loop);
    }
    loop();
  }, []);

  const stopHoverAnim = useCallback((currentPattern) => {
    if (hoverFrameRef.current) { cancelAnimationFrame(hoverFrameRef.current); hoverFrameRef.current = null; }
    if (previewLblRef.current) previewLblRef.current.className = 'cp-preview-label';
    setMainSolid();
    const pat = PATTERNS.find(p => p.id === currentPattern);
    if (previewLblRef.current && pat)
      previewLblRef.current.textContent = `${pat.name} · Brightness ${briRef.current}`;
  }, [setMainSolid]);

  // ── Wheel pick ───────────────────────────────────
  const pickFromWheel = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const ex = e.touches ? e.touches[0].clientX : e.clientX;
    const ey = e.touches ? e.touches[0].clientY : e.clientY;
    const x  = (ex - rect.left) * sx - canvas.width / 2;
    const y  = (ey - rect.top)  * sy - canvas.height / 2;
    const dist   = Math.sqrt(x * x + y * y);
    const outerR = canvas.width / 2 - 6;
    const innerR = outerR * 0.34;
    if (dist < innerR || dist > outerR + 10) return;

    const newHue = Math.round(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360);
    const newSat = Math.min(100, Math.round((dist / outerR) * 100));
    setHue(newHue);
    setSat(newSat);
    // also update refs immediately so drawWheel uses fresh values
    hueRef.current = newHue;
    satRef.current = newSat;
    drawWheel();
    updateReadouts();
    refreshAllMiniJellies();
    if (!hoverFrameRef.current) setMainSolid();
  }, [drawWheel, updateReadouts, refreshAllMiniJellies, setMainSolid]);

  // ── Effects ──────────────────────────────────────

  // Redraw wheel + readouts whenever hue/sat/bri changes
  useEffect(() => {
    drawWheel();
    updateReadouts();
    refreshAllMiniJellies();
    if (!hoverFrameRef.current) {
      setMainSolid();
      const pat = PATTERNS.find(p => p.id === pattern);
      if (previewLblRef.current && pat)
        previewLblRef.current.textContent = `${pat.name} · Brightness ${bri}`;
    }
  }, [hue, sat, bri, pattern, drawWheel, updateReadouts, refreshAllMiniJellies, setMainSolid]);

  // Global mouse/touch up
  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener('mouseup',  up);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up); };
  }, []);

  // Global mouse/touch move
  useEffect(() => {
    const move = e => { if (dragging.current) pickFromWheel(e); };
    const tmove = e => { if (dragging.current) { e.preventDefault(); pickFromWheel(e); } };
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', tmove, { passive: false });
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('touchmove', tmove); };
  }, [pickFromWheel]);

  // Connection ping
  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch('/api/status');
        setConnected(res.ok);
      } catch { setConnected(false); }
    };
    ping();
    const id = setInterval(ping, 10_000);
    return () => clearInterval(id);
  }, []);

  // Cleanup all anim frames on unmount
  useEffect(() => {
    return () => {
      if (hoverFrameRef.current) cancelAnimationFrame(hoverFrameRef.current);
      PATTERNS.forEach(p => {
        if (miniFrameRefs.current[p.id]) cancelAnimationFrame(miniFrameRefs.current[p.id]);
      });
    };
  }, []);

  // ── AI colour from prompt ─────────────────────────
  const handleAIGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiStatus('loading');
    try {
      // API takes a raw string and returns { colors: [{r,g,b}, ...] }
      const data = await generateAIColors(prompt);

      if (!data?.colors?.length) throw new Error('No colors returned');

      const { r: cr, g: cg, b: cb } = data.colors[0];

      // Convert {r,g,b} → hue+sat so the wheel repositions itself
      const toUnit = v => v / 255;
      const ru = toUnit(cr), gu = toUnit(cg), bu = toUnit(cb);
      const max = Math.max(ru, gu, bu), min = Math.min(ru, gu, bu);
      const ll  = (max + min) / 2;
      let newHue = 0, newSat = 0;
      if (max !== min) {
        const d = max - min;
        newSat = ll > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case ru: newHue = ((gu - bu) / d + (gu < bu ? 6 : 0)) / 6; break;
          case gu: newHue = ((bu - ru) / d + 2) / 6; break;
          default: newHue = ((ru - gu) / d + 4) / 6;
        }
      }
      newHue = Math.round(newHue * 360);
      newSat = Math.round(newSat * 100);

      setHue(newHue); setSat(newSat);
      hueRef.current = newHue; satRef.current = newSat;

      drawWheel();
      updateReadouts();
      refreshAllMiniJellies();
      if (!hoverFrameRef.current) setMainSolid();

      setAiStatus('idle');
    } catch {
      setAiStatus('error');
      setTimeout(() => setAiStatus('idle'), 3000);
    }
  };

  // ── Send handler ─────────────────────────────────
  const handleSend = async () => {
    const { r, g, b } = getRgb();
    const hex6 = toHex6(r, g, b);
    setSendStatus('sending');
    try {
      await setColor({ hex: hex6, brightness: bri, pattern });
      if (onColorSent) onColorSent({ r, g, b });
      setSendStatus('sent');
      setTimeout(() => setSendStatus('idle'), 2500);
    } catch {
      setSendStatus('error');
    }
  };

  // ── Pattern hover handlers ───────────────────────
  const handlePatternEnter = (id) => { startMiniAnim(id); startHoverAnim(id); };
  const handlePatternLeave = (id) => { stopMiniAnim(id); stopHoverAnim(pattern); };
  const handlePatternClick = (id) => { setPattern(id); };

  // ── Derived values for render ────────────────────
  const { r, g, b } = getRgb();
  const hex6 = toHex6(r, g, b);
  const activeC = css(r, g, b);

  const sendLabel = { idle: '▶ \u00A0 Send to Jellyfish', sending: '◌  Sending…', sent: '✓  Sent!', error: '✕  Failed — retry?' }[sendStatus];
  const feedbackText = {
    idle:    'Sends a 6-character hex colour + brightness to the ESP32 over Wi-Fi',
    sending: 'Connecting to ESP32…',
    sent:    `Sent #${hex6} · ${pattern} · brightness ${bri}`,
    error:   'Could not reach the ESP32. Check Wi-Fi and IP address.',
  }[sendStatus];

  // ─────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────
  return (
    <div className="cp-root">
      {/* header */}
      <div className="cp-header">
        <div className="cp-conn-badge">
          <div className={`cp-conn-dot${connected ? '' : ' offline'}`} />
          <span>{connected ? 'Connected · ESP32' : 'Offline'}</span>
        </div>
      </div>

      <div className="cp-main">

        {/* ── colour wheel ── */}
        <div className="cp-card cp-wheel-card">
          <div className="cp-card-title">Step 1 — Pick a colour</div>
          <div className="cp-wheel-wrap">
            <canvas
              ref={canvasRef}
              width={220} height={220}
              className="cp-wheel"
              onMouseDown={e => { dragging.current = true; pickFromWheel(e); }}
              onTouchStart={e => { e.preventDefault(); dragging.current = true; pickFromWheel(e); }}
            />
            <div ref={wheelCenterRef} className="cp-wheel-center">
              <span ref={hexLabelRef} className="cp-wheel-hex">#{hex6}</span>
            </div>
          </div>
          <div className="cp-readout">
            <div className="cp-chip cp-chip--r">
              <div className="cp-chip-label">Red</div>
              <div ref={chipRRef} className="cp-chip-val">{toHex2(r)}</div>
            </div>
            <div className="cp-chip cp-chip--g">
              <div className="cp-chip-label">Green</div>
              <div ref={chipGRef} className="cp-chip-val">{toHex2(g)}</div>
            </div>
            <div className="cp-chip cp-chip--b">
              <div className="cp-chip-label">Blue</div>
              <div ref={chipBRef} className="cp-chip-val">{toHex2(b)}</div>
            </div>
            <div className="cp-chip cp-chip-hex">
              <div className="cp-chip-label">Hex sent</div>
              <div ref={chipHexRef} className="cp-chip-val">{hex6}</div>
            </div>
          </div>

          {/* ── AI colour prompt ── */}
          <div className="cp-ai-section">
            <div className="cp-ai-label">
              <span className="cp-ai-icon">✦</span>
              Describe a colour
            </div>
            <div className="cp-ai-row">
              <input
                className={`cp-ai-input${aiStatus === 'error' ? ' error' : ''}`}
                type="text"
                placeholder="e.g. warm summer orange, deep ocean blue…"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAIGenerate(); }}
                disabled={aiStatus === 'loading'}
              />
              <button
                className="cp-ai-btn"
                onClick={handleAIGenerate}
                disabled={aiStatus === 'loading' || !aiPrompt.trim()}
                style={{
                  background:  css(r, g, b, .15),
                  borderColor: css(r, g, b, .35),
                  color: aiStatus === 'loading' ? 'var(--cp-text-hint)' : css(r, g, b),
                }}
              >
                {aiStatus === 'loading' ? '◌' : '→'}
              </button>
            </div>
            {aiStatus === 'error' && (
              <div className="cp-ai-error">Couldn't get a colour — try rephrasing</div>
            )}
            <div className="cp-ai-footnote">
              <strong className="cp-ai-footnote-accent">✦ AI-generated</strong> — not sure what to pick? Describe a mood, memory, or feeling and we'll translate it into a colour for you.
            </div>
          </div>
        </div>

        {/* ── brightness ── */}
        <div className="cp-card">
          <div className="cp-card-title">Step 2 — Adjust brightness</div>
          <div className="cp-slider-header">
            <div className="cp-slider-info" />
          </div>
          <div className="cp-brightness-scale" aria-hidden="true">
            <span className="cp-brightness-scale-left">☀</span>
            <span className="cp-brightness-scale-right">☀</span>
          </div>
          <div className="cp-track-wrap">
            <div className="cp-track-bg" />
            <div className="cp-track-fill" style={{ width: `${(bri / 255) * 100}%` }} />
            <div className="cp-track-thumb" style={{ left: `${(bri / 255) * 100}%` }} />
            <input
              type="range" min="0" max="255" value={bri}
              className="cp-range"
              onChange={e => setBri(+e.target.value)}
            />
          </div>
        </div>

        {/* ── preview ── */}
        <div className="cp-card">
          <div className="cp-card-title">Live Preview</div>
          <div className="cp-card-desc" style={{ marginBottom: 8 }}>See your colour and pattern before sending.</div>
          <div className={`cp-jelly-preview cp-jelly-preview--${tentacleState || 'resting'}`}>
            <div className="cp-jelly-glow">
              <div ref={glowBallRef} className="cp-glow-ball" />
            </div>
              <div className="cp-jelly-body">
              <div ref={jellyBellRef} className="cp-jelly-bell" />
              <div className="cp-jelly-tentacles">
                {MAIN_H.map((h, i) => (
                  <div
                    key={i}
                    ref={mainTRefs.current[i]}
                    className={`cp-tentacle cp-tentacle--i${i}`}
                    style={{ height: h + 'px' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div ref={previewLblRef} className="cp-preview-label">
            {PATTERNS.find(p => p.id === pattern)?.name} · Brightness {bri}
          </div>
        </div>

        {/* ── patterns ── */}
        <div className="cp-card cp-pattern-card-full">
          <div className="cp-card-title">Step 3 — Choose a pattern</div>
          <div className="cp-card-desc">
            How the LEDs animate. <strong style={{ color: 'var(--cp-accent)', fontWeight: 500 }}>Hover any pattern</strong> to preview it above.
          </div>
          <div className="cp-pattern-grid">
            {PATTERNS.map(p => {
              const refs  = miniRefs.current[p.id];
              const isActive = pattern === p.id;
              return (
                <button
                  key={p.id}
                  className={`cp-pattern-btn${isActive ? ' active' : ''}`}
                  style={isActive ? {
                    borderColor: css(r, g, b, .5),
                    background:  css(r, g, b, .08),
                    color:       activeC,
                  } : {}}
                  onClick={() => handlePatternClick(p.id)}
                  onMouseEnter={() => handlePatternEnter(p.id)}
                  onMouseLeave={() => handlePatternLeave(p.id)}
                >
                  {/* mini jellyfish */}
                  <div
                    ref={refs.wrapRef}
                    className="cp-mini-jelly"
                    style={isActive ? {
                      borderColor: css(r, g, b, .4),
                      background:  css(r, g, b, .1),
                    } : {}}
                  >
                    <div ref={refs.bell} className="cp-mini-bell" />
                    <div className="cp-mini-tentacles">
                      {MINI_H.map((h, i) => (
                        <div
                          key={i}
                          ref={refs.tentacles[i]}
                          className="cp-mini-tentacle"
                          style={{ height: h + 'px' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="cp-pattern-name">{p.name}</div>
                  <div className="cp-pattern-tip">{p.tip}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── step 4 — movement modes ── */}
        <MovementModeControl
          tentacleState={tentacleState}
          setTentacleState={setTentacleState}
        />

        {/* ── send ── */}
        <div className="cp-send-section">
          <button
            ref={sendBtnRef}
            className="cp-send-btn"
            disabled={sendStatus === 'sending'}
            onClick={handleSend}
          >
            {sendLabel}
          </button>
          <div className={`cp-send-feedback${sendStatus === 'sent' ? ' ok' : sendStatus === 'error' ? ' err' : ''}`}>
            {feedbackText}
          </div>
        </div>

      </div>
    </div>
  );
}