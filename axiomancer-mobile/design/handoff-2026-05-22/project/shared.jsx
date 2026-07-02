/* shared.jsx — Axiomancer shared UI primitives.
   PhoneFrame, TabBar, Glyphs (heart/body/mind), EffectGlyph,
   ActionIcon, StatBar, FriendshipMeter, TornFrame, SectionLabel.
   All draw from CSS variables defined in tokens.css. */

const { useState, useMemo } = React;

const AXM = {
  bg: '#0a0a0a', deepBg: '#06050a', panelBg: '#100d0a',
  parchment: '#e8dfc8', bone: '#8a8273', ash: '#3a3530',
  blood: '#c0152a', sulfur: '#d4c026', rust: '#9e3a1a',
  buff: '#2a1f00', debuff: '#1a0a2e',
  dim: 'rgba(232,223,200,0.55)', faint: 'rgba(232,223,200,0.18)',
  rule: 'rgba(232,223,200,0.12)',
};

// ─── Phone frame ────────────────────────────────────────────────────────
// 390 × 844 (iPhone 14 portrait). Status bar uses parchment glyphs.
// Bottom area inset for tab bar; the screen content fills 390 × 720.
function PhoneFrame({ children, label, tabBar = true, focus = null, statusTime = "iii:xliii", combatTab = null }) {
  // combatTab: explicit override — if true, the first slot is STRIFE.
  // If null, inferred from the active tab (active === 'strife').
  const showCombat = combatTab === true || tabBar === 'strife';
  return (
    <div className="axm" style={{
      width: 390, height: 844, borderRadius: 46, overflow: 'hidden',
      position: 'relative', background: AXM.bg,
      boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,223,200,0.07), inset 0 0 0 1px rgba(232,223,200,0.04)',
      fontFamily: 'var(--f-serif)',
    }}>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        zIndex: 30, display: 'flex', alignItems: 'center', padding: '14px 28px',
        justifyContent: 'space-between', pointerEvents: 'none',
      }}>
        <span className="axm-mono" style={{ color: AXM.parchment, fontSize: 11, letterSpacing: '0.05em' }}>{statusTime}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* signal — three bars */}
          <svg width="13" height="9" viewBox="0 0 13 9"><rect x="0" y="6" width="2" height="3" fill={AXM.parchment}/><rect x="3.5" y="4" width="2" height="5" fill={AXM.parchment}/><rect x="7" y="2" width="2" height="7" fill={AXM.parchment}/><rect x="10.5" y="0" width="2" height="9" fill={AXM.parchment} opacity="0.35"/></svg>
          {/* moon (vow of silence) */}
          <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1 a5 5 0 1 0 4.5 7 a4 4 0 0 1 -4.5 -7 z" fill={AXM.parchment}/></svg>
          {/* battery */}
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={AXM.parchment} fill="none" opacity="0.5"/><rect x="2" y="2" width="13" height="6" rx="1" fill={AXM.parchment}/><rect x="19" y="3" width="2" height="4" rx="0.6" fill={AXM.parchment} opacity="0.5"/></svg>
        </div>
      </div>
      {/* notch ornament — small etched glyph rather than a dynamic island */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 60, height: 4, borderRadius: 2, background: 'rgba(232,223,200,0.08)', zIndex: 30,
      }} />

      {/* content */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: tabBar ? 72 : 0,
        overflow: 'hidden', zIndex: 10,
      }}>
        {children}
      </div>

      {/* tab bar */}
      {tabBar && <TabBar active={tabBar === true ? 'wilds' : tabBar} focus={focus} combatTab={showCombat} />}

      {/* edge vignette — subtle ash gradient at corners only */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 46,
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55)',
      }} />
    </div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────
// Three slots: [WILDS | STRIFE] · SELF · SATCHEL.
// The first slot is STRIFE when combatTab=true (combat in progress or an
// encounter/hazard event is pending); WILDS otherwise.
function TabBar({ active = 'wilds', focus = null, combatTab = false }) {
  const firstSlot = combatTab
    ? { key: 'strife', label: 'STRIFE', glyph: 'sword' }
    : { key: 'wilds',  label: 'WILDS',  glyph: 'eye'   };
  const tabs = [
    firstSlot,
    { key: 'self',    label: 'SELF',    glyph: 'crown'  },
    { key: 'memoir',  label: 'MEMOIR',  glyph: 'scroll' },
    { key: 'satchel', label: 'SATCHEL', glyph: 'bag'    },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 72, zIndex: 30,
      background: 'linear-gradient(to top, #0a0a0a 0%, #0a0a0a 80%, rgba(10,10,10,0))',
      paddingTop: 8,
    }}>
      <div style={{ height: 1, background: combatTab ? AXM.blood : AXM.rule, opacity: combatTab ? 0.6 : 1 }} />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '6px 8px 0',
      }}>
        {tabs.map(t => {
          const on = t.key === active;
          const col = on ? AXM.parchment : AXM.bone;
          return (
            <div key={t.key} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '4px 0 2px', position: 'relative',
            }}>
              {on && <div style={{
                position: 'absolute', top: 0, width: 14, height: 1,
                background: t.key === 'strife' ? AXM.blood : AXM.sulfur,
              }} />}
              <TabGlyph kind={t.glyph} size={22} color={col} />
              <span className="axm-caption" style={{
                color: t.key === 'strife' && combatTab ? (on ? AXM.blood : '#8a5a55') : col,
                fontSize: 10, letterSpacing: '0.18em',
              }}>{t.label}</span>
              {focus === t.key && !on && (
                <span style={{
                  position: 'absolute', top: 6, right: '22%', width: 5, height: 5,
                  borderRadius: 5, background: AXM.sulfur, boxShadow: '0 0 6px ' + AXM.sulfur,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabGlyph({ kind, size = 22, color = AXM.parchment }) {
  if (kind === 'eye') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M2 16 C 8 6 24 6 30 16 C 24 26 8 26 2 16 Z" stroke={color} strokeWidth="1.6"/>
      <circle cx="16" cy="16" r="4.5" fill={color}/>
      <path d="M16 2 L16 5 M16 27 L 16 30 M2 16 L 5 16 M 27 16 L 30 16" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
  if (kind === 'sword') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M22 4 L 28 4 L 28 10 L 13 25 L 10 28 L 4 28 L 4 22 L 7 19 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M11 21 L 15 25" stroke={color} strokeWidth="1.6"/>
      <path d="M25 7 L 27 7 M 25 9 L 27 9" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
  if (kind === 'crown') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M3 11 L 8 22 L 24 22 L 29 11 L 23 14 L 16 6 L 9 14 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M3 26 L 29 26" stroke={color} strokeWidth="1.6"/>
      <circle cx="16" cy="9" r="1.4" fill={color}/>
    </svg>
  );
  if (kind === 'bag') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M7 11 L 25 11 L 27 28 L 5 28 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M11 11 V 8 A 5 5 0 0 1 21 8 V 11" stroke={color} strokeWidth="1.6"/>
      <path d="M12 18 L 20 18" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
  if (kind === 'scroll') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M6 6 H 26 V 22 C 26 25 24 27 21 27 H 8 C 5 27 3 25 3 22 V 9 C 3 7 5 5 6 6 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10 12 H 22 M 10 16 H 22 M 10 20 H 18" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
  return null;
}

// ─── Stance glyphs ─────────────────────────────────────────────────────
function GlyphHeart({ size = 32, color = AXM.parchment }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path fill={color} fillRule="evenodd" stroke={color} strokeWidth="1"
        d="M32 16 L 34 13 L 38 10 L 43 9 L 48 10 L 53 14 L 56 19 L 56 25 L 54 31 L 50 37 L 44 43 L 38 48 L 33 53 L 32 55 L 31 53 L 26 48 L 20 43 L 14 37 L 10 31 L 8 25 L 8 19 L 11 14 L 16 10 L 21 9 L 26 10 L 30 13 Z M22 22 L 26 26 L 24 28 L 20 24 Z M14 30 L 18 34 L 16 36 L 12 32 Z M40 24 L 42 26 L 38 30 L 36 28 Z M44 32 L 48 36 L 46 38 L 42 34 Z"/>
      <path d="M32 14 L 32 4 M 30 6 L 32 4 L 34 6" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
function GlyphBody({ size = 32, color = AXM.parchment }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path fill={color} d="M28 12 L 30 8 L 34 8 L 36 12 L 38 14 L 42 20 L 45 28 L 45 32 L 44 36 L 42 40 L 38 46 L 34 50 L 30 50 L 26 46 L 22 40 L 20 36 L 19 32 L 19 28 L 22 20 L 26 14 Z"/>
      <path d="M22 22 L 26 22 M 32 22 L 36 22 M 38 22 L 42 22" stroke={AXM.bg} strokeWidth="1.6"/>
      <path d="M24 28 L 40 28 M 24 34 L 40 34" stroke={AXM.bg} strokeWidth="1.6"/>
    </svg>
  );
}
function GlyphMind({ size = 32, color = AXM.parchment }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M14 28 C 14 16, 22 8, 32 8 C 42 8, 50 16, 50 28 L 50 38 C 50 42, 48 44, 44 44 L 44 50 C 44 52, 42 54, 40 54 L 24 54 C 22 54, 20 52, 20 50 L 20 44 C 16 44, 14 42, 14 38 Z"
        fill={color} fillOpacity="0.18" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <ellipse cx="24" cy="30" rx="4.5" ry="5.5" fill={AXM.bg}/>
      <ellipse cx="40" cy="30" rx="4.5" ry="5.5" fill={AXM.bg}/>
      <path d="M30 38 L 32 42 L 34 38 Z" fill={color}/>
      <path d="M32 8 L 30 14 L 34 18 L 28 22 L 32 26" stroke={color} strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

function StanceGlyph({ kind, size = 32, color = AXM.parchment }) {
  if (kind === 'heart') return <GlyphHeart size={size} color={color} />;
  if (kind === 'body')  return <GlyphBody size={size} color={color} />;
  return <GlyphMind size={size} color={color} />;
}

// ─── Effect glyphs (smaller, used in chips) ────────────────────────────
function EffectGlyph({ kind, size = 14, color = AXM.parchment }) {
  if (kind === 'bleed') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M6 4 C 4 9 4 12 6 13 C 8 12 8 9 6 4 Z"/>
      <path d="M12 8 C 10 13 10 16 12 17 C 14 16 14 13 12 8 Z"/>
      <path d="M18 4 C 16 9 16 12 18 13 C 20 12 20 9 18 4 Z"/>
    </svg>
  );
  if (kind === 'burn') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2 C 14 6 18 8 18 13 C 18 17 15 21 12 21 C 9 21 6 18 6 14 C 6 11 8 10 9 8 C 10 11 11 10 12 8 C 12 6 11 4 12 2 Z"/>
    </svg>
  );
  if (kind === 'regen') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21 C 5 16 3 12 3 8 A 4 4 0 0 1 12 6 A 4 4 0 0 1 21 8 C 21 12 19 16 12 21 Z"
        fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.6"/>
      <path d="M12 16 V 6 M 9 9 L 12 6 L 15 9" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  );
  if (kind === 'stun') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 1 L 14 8 L 21 7 L 15 12 L 21 17 L 14 16 L 12 23 L 10 16 L 3 17 L 9 12 L 3 7 L 10 8 Z"/>
    </svg>
  );
  if (kind === 'shield') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2 L 21 5 V 12 C 21 17 17 21 12 22 C 7 21 3 17 3 12 V 5 Z"/>
    </svg>
  );
  if (kind === 'poison') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 3 H 15 V 8 L 18 18 C 18 20 16 21 12 21 C 8 21 6 20 6 18 L 9 8 Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
      <path d="M9 3 H 15" stroke={color} strokeWidth="2"/>
    </svg>
  );
  if (kind === 'mark') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" fill={color}/>
    </svg>
  );
  if (kind === 'guard') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L 19 6 V 13 C 19 17 16 20 12 21 C 8 20 5 17 5 13 V 6 Z" stroke={color} strokeWidth="1.5"/>
      <path d="M9 12 L 11 14 L 15 10" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  );
  return null;
}

// ─── Action icons (combat) ─────────────────────────────────────────────
function ActionIcon({ kind, size = 24, color = AXM.parchment }) {
  if (kind === 'attack') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M22 4 L 28 4 L 28 10 L 13 25 L 10 28 L 4 28 L 4 22 L 7 19 Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
  if (kind === 'defend') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3 L 28 7 V 17 C 28 23 23 28 16 30 C 9 28 4 23 4 17 V 7 Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M16 3 V 30 M 4 14 L 28 14" stroke={color} strokeWidth="2"/>
    </svg>
  );
  if (kind === 'skill') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" stroke={color} strokeWidth="2"/>
      <path d="M16 4 L 20 28 L 4 13 L 28 13 L 12 28 Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
  if (kind === 'item') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M14 5 L 18 5 L 18 11 L 22 11 L 22 27 L 10 27 L 10 11 L 14 11 Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
  if (kind === 'flee') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M6 28 L 18 16 L 10 8 L 26 4 L 22 20 L 14 12" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
  return null;
}

// ─── Stat bar (HP, mana, friendship, xp) ──────────────────────────────
function StatBar({ value, max, color = AXM.blood, height = 6, label, valueLabel, dim = false }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {(label || valueLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="axm-eyebrow" style={{ color: dim ? AXM.bone : AXM.parchment }}>{label}</span>
          <span className="axm-mono" style={{ color: dim ? AXM.bone : color, fontWeight: 500 }}>{valueLabel ?? `${value}/${max}`}</span>
        </div>
      )}
      <div style={{ height, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color }} />
        {/* notches every 25% */}
        {[0.25, 0.5, 0.75].map(p => (
          <div key={p} style={{ position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0, width: 1, background: AXM.bg, opacity: 0.6 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Friendship meter — different visual: linked rings ─────────────────
function FriendshipMeter({ value, max = 5 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => {
        const on = i < value;
        return (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: 12,
            background: on ? AXM.rust : 'transparent',
            border: `1.5px solid ${on ? AXM.rust : AXM.bone}`,
          }} />
        );
      })}
    </div>
  );
}

// ─── Effect chip ───────────────────────────────────────────────────────
function EffectChip({ kind, label, duration, intensity, tone = 'debuff' }) {
  const accent = tone === 'buff' ? AXM.sulfur : AXM.rust;
  const bg = tone === 'buff' ? AXM.buff : AXM.debuff;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 22,
      padding: '0 8px 0 6px', background: bg, border: `1px solid ${accent}`,
    }}>
      <EffectGlyph kind={kind} size={12} color={accent} />
      <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 10 }}>{label}</span>
      {duration && <span className="axm-mono" style={{ color: AXM.bone, fontSize: 10 }}>{duration}</span>}
      {intensity && <span className="axm-mono" style={{ color: accent, fontSize: 10 }}>×{intensity}</span>}
    </div>
  );
}

// ─── Section label (eyebrow with rule) ─────────────────────────────────
function SectionLabel({ children, cross = true, dim = false, accent = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {cross && <span style={{ color: accent ?? (dim ? AXM.bone : AXM.parchment), fontSize: 10 }}>✠</span>}
      <span className="axm-eyebrow" style={{ color: accent ?? (dim ? AXM.bone : AXM.parchment) }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: AXM.rule }} />
    </div>
  );
}

// ─── Torn frame — ragged-edge container ────────────────────────────────
// SVG mask creates the torn look. Width/height must be known.
function TornFrame({ children, width, height, bg = AXM.panelBg, screenBg = AXM.bg, padding = 14, seed = 1, jag = 4 }) {
  const path = useMemo(() => makeTornPath(width, height, jag, seed), [width, height, jag, seed]);
  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <path d={path} fill={bg}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, padding }}>{children}</div>
    </div>
  );
}
function makeTornPath(w, h, jag, seed) {
  const rnd = (i) => { const x = Math.sin(i * 9301 + seed * 49297) * 233280; return x - Math.floor(x); };
  const pts = [];
  const step = 14;
  for (let x = 0; x <= w; x += step) pts.push([x, rnd(x + 1) * jag]);
  for (let y = step; y <= h; y += step) pts.push([w - rnd(y + 100) * jag, y]);
  for (let x = w; x >= 0; x -= step) pts.push([x, h - rnd(x + 200) * jag]);
  for (let y = h - step; y > 0; y -= step) pts.push([rnd(y + 300) * jag, y]);
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z';
}

// ─── Roman numeral helper ──────────────────────────────────────────────
function roman(n) {
  if (n <= 0) return '·';
  const map = [['m',1000],['cm',900],['d',500],['cd',400],['c',100],['xc',90],['l',50],['xl',40],['x',10],['ix',9],['v',5],['iv',4],['i',1]];
  let out = '';
  for (const [s, v] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}

// ─── Card (subtle bordered panel) ──────────────────────────────────────
function Panel({ children, style = {}, accent = null, hatch = false }) {
  return (
    <div style={{
      background: AXM.panelBg,
      border: `1px solid ${accent || AXM.ash}`,
      position: 'relative',
      ...style,
    }} className={hatch ? 'axm-hatch' : ''}>
      {children}
    </div>
  );
}

// ─── Drop on window for cross-script access ───────────────────────────
Object.assign(window, {
  AXM, PhoneFrame, TabBar, TabGlyph,
  GlyphHeart, GlyphBody, GlyphMind, StanceGlyph,
  EffectGlyph, ActionIcon, StatBar, FriendshipMeter, EffectChip,
  SectionLabel, TornFrame, Panel, roman,
});
