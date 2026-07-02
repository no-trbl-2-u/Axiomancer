// Axiomancer — shared design system
// Palette, type, woodcut glyphs, distressed primitives.

const AXM = {
  bg: '#0a0a0a',
  ink: '#e8dfc8',
  parchment: '#e8dfc8',
  blood: '#c0152a',
  sulfur: '#d4c026',
  rust: '#9e3a1a',
  debuff: '#1a0a2e',
  buff: '#2a1f00',
  bone: '#8a8273',
  ash: '#3a3530',
  // type
  gothic: '"Pirata One", "IM Fell English SC", serif',
  serif: '"IM Fell English", "Special Elite", serif',
  sans: '"Bebas Neue", "Oswald", sans-serif',
  mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
};

// ─── grain + noise SVG (data-uri, lightweight repeating texture) ───
const NOISE_URI = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.91  0 0 0 0 0.87  0 0 0 0 0.78  0 0 0 0.18 0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`
) + '")';

const PAPER_URI = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
    <filter id="p">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/>
    </filter>
    <rect width="100%" height="100%" fill="#0a0a0a"/>
    <rect width="100%" height="100%" filter="url(#p)"/>
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="12"/>
      <feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.86  0 0 0 0 0.78  0 0 0 0.07 0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#g)"/>
  </svg>`
) + '")';

// ─── Splatter SVG (decorative ink) ───
function Splatter({ color = '#c0152a', size = 220, seed = 1, style = {} }) {
  // pseudo-random splat
  const rnd = (i) => {
    const x = Math.sin(i * 9301 + seed * 49297) * 233280;
    return x - Math.floor(x);
  };
  const drops = Array.from({ length: 28 }, (_, i) => ({
    cx: 10 + rnd(i + 1) * 200,
    cy: 10 + rnd(i + 7) * 200,
    r: 0.5 + rnd(i + 13) * 6,
  }));
  const main = { cx: 110 + (rnd(99) - 0.5) * 30, cy: 110 + (rnd(101) - 0.5) * 30, r: 30 + rnd(102) * 18 };
  return (
    <svg viewBox="0 0 220 220" width={size} height={size} style={{ pointerEvents: 'none', ...style }}>
      <circle cx={main.cx} cy={main.cy} r={main.r} fill={color} opacity="0.9" />
      {drops.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={0.4 + rnd(i + 200) * 0.55} />
      ))}
    </svg>
  );
}

// ─── Torn paper edge generator. Returns clip-path polygon string. ───
function tornEdge({ width = 360, height = 200, jag = 6, seed = 1, sides = 'all' }) {
  const rnd = (i) => {
    const x = Math.sin(i * 9301 + seed * 49297) * 233280;
    return x - Math.floor(x);
  };
  const pts = [];
  const stepX = 14, stepY = 14;
  // top
  for (let x = 0; x <= width; x += stepX) {
    const j = (sides === 'all' || sides.includes('top')) ? rnd(x + 1) * jag : 0;
    pts.push([x, j]);
  }
  // right
  for (let y = stepY; y <= height; y += stepY) {
    const j = (sides === 'all' || sides.includes('right')) ? rnd(y + 100) * jag : 0;
    pts.push([width - j, y]);
  }
  // bottom
  for (let x = width; x >= 0; x -= stepX) {
    const j = (sides === 'all' || sides.includes('bottom')) ? rnd(x + 200) * jag : 0;
    pts.push([x, height - j]);
  }
  // left
  for (let y = height - stepY; y > 0; y -= stepY) {
    const j = (sides === 'all' || sides.includes('left')) ? rnd(y + 300) * jag : 0;
    pts.push([j, y]);
  }
  return 'polygon(' + pts.map(([x, y]) => `${x}px ${y}px`).join(',') + ')';
}

// ─── Torn panel — black panel with rough edges & noise ───
function TornPanel({ children, color = AXM.bg, jag = 6, padding = 12, style = {}, seed = 1, border = true }) {
  // We use box-shadow to draw a faint inner outline — the clip path means we
  // can't use border/outline directly.
  return (
    <div style={{
      position: 'relative',
      background: color,
      backgroundImage: NOISE_URI,
      backgroundBlendMode: 'multiply',
      padding,
      clipPath: `path('M 0 ${jag} L ${jag} 0 L 100% 0 L 100% calc(100% - ${jag}px) L calc(100% - ${jag}px) 100% L 0 100% Z')`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Rough HP / Mana bar with tick marks ───
function StatBar({ value, max, color = AXM.blood, label, height = 14, showText = true, mono = true }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: AXM.sans, fontSize: 11, letterSpacing: 2,
          color: AXM.parchment, opacity: 0.85, marginBottom: 2,
        }}>
          <span>{label}</span>
          {showText && <span style={{ fontFamily: mono ? AXM.mono : AXM.sans }}>{value}/{max}</span>}
        </div>
      )}
      <div style={{
        position: 'relative', height, width: '100%',
        background: '#1a1814',
        boxShadow: 'inset 0 0 0 1px rgba(232,223,200,0.35)',
        overflow: 'hidden',
      }}>
        {/* fill */}
        <div style={{
          position: 'absolute', inset: 0, width: `${pct * 100}%`,
          background: color, backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        }} />
        {/* tick marks */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage: 'repeating-linear-gradient(to right, transparent 0, transparent 9px, rgba(0,0,0,0.55) 9px, rgba(0,0,0,0.55) 10px)',
          mixBlendMode: 'multiply',
        }} />
        {/* ragged top/bottom */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'rgba(232,223,200,0.4)',
        }} />
      </div>
    </div>
  );
}

// ─── Stance glyphs (woodcut style, monochrome, sturdy) ───
function GlyphHeart({ size = 40, color = AXM.parchment, stroke = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round">
      {/* anatomical-ish heart */}
      <path d="M32 18 C 26 6, 10 8, 10 22 C 10 36, 32 52, 32 56 C 32 52, 54 36, 54 22 C 54 8, 38 6, 32 18 Z" fill={color} fillOpacity="0.18" />
      <path d="M22 22 L 22 32 M 42 22 L 42 32 M 32 18 L 32 38" stroke={color} strokeWidth={stroke * 0.7} />
      {/* aorta stubs */}
      <path d="M28 14 L 26 8 M 36 14 L 38 8" />
      {/* hatching */}
      <path d="M16 30 L 22 36 M 18 36 L 22 40 M 42 36 L 48 30 M 42 40 L 46 36" stroke={color} strokeWidth={stroke * 0.6} opacity="0.55" />
    </svg>
  );
}
function GlyphBody({ size = 40, color = AXM.parchment, stroke = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round">
      {/* clenched fist */}
      <path d="M14 30 C 14 24, 20 20, 26 20 L 44 20 C 48 20, 50 22, 50 26 L 50 38 C 50 46, 44 52, 36 52 L 26 52 C 18 52, 14 46, 14 40 Z" fill={color} fillOpacity="0.18" />
      {/* knuckle ridges */}
      <path d="M22 26 L 22 22 M 30 26 L 30 22 M 38 26 L 38 22 M 46 26 L 46 22" />
      <path d="M22 34 L 50 34 M 22 40 L 50 40" stroke={color} strokeWidth={stroke * 0.7} />
      {/* wrist */}
      <path d="M14 30 L 8 34 L 10 40 L 14 38" />
      {/* hatching */}
      <path d="M30 44 L 36 50 M 40 44 L 46 50" stroke={color} strokeWidth={stroke * 0.6} opacity="0.55" />
    </svg>
  );
}
function GlyphMind({ size = 40, color = AXM.parchment, stroke = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round">
      {/* cracked skull */}
      <path d="M14 28 C 14 16, 22 8, 32 8 C 42 8, 50 16, 50 28 L 50 38 C 50 42, 48 44, 44 44 L 44 50 C 44 52, 42 54, 40 54 L 24 54 C 22 54, 20 52, 20 50 L 20 44 C 16 44, 14 42, 14 38 Z" fill={color} fillOpacity="0.18" />
      {/* eye sockets */}
      <ellipse cx="24" cy="30" rx="5" ry="6" fill="#0a0a0a" />
      <ellipse cx="40" cy="30" rx="5" ry="6" fill="#0a0a0a" />
      {/* nasal */}
      <path d="M30 38 L 32 42 L 34 38 Z" fill={color} />
      {/* teeth ridge */}
      <path d="M22 48 L 26 48 M 28 48 L 32 48 M 34 48 L 38 48 M 40 48 L 42 48" />
      {/* fracture crack */}
      <path d="M32 8 L 30 14 L 34 18 L 28 22 L 32 26" stroke={color} strokeWidth={stroke * 0.9} />
    </svg>
  );
}
function StanceGlyph({ kind, size = 40, color = AXM.parchment, stroke = 2.4 }) {
  if (kind === 'heart') return <GlyphHeart size={size} color={color} stroke={stroke} />;
  if (kind === 'body') return <GlyphBody size={size} color={color} stroke={stroke} />;
  return <GlyphMind size={size} color={color} stroke={stroke} />;
}

// ─── Effect glyphs ───
function EffectGlyph({ kind, size = 16, color = AXM.parchment }) {
  const s = { width: size, height: size, display: 'block' };
  switch (kind) {
    case 'poison': // dripping vial
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M9 3 H15 V8 L18 18 C18 20 16 21 12 21 C8 21 6 20 6 18 L9 8 Z" fill={color} fillOpacity="0.25" />
          <path d="M9 3 H15" strokeWidth="2" />
          <circle cx="12" cy="15" r="1.2" fill={color} />
          <path d="M10 17 v2" strokeLinecap="round" />
        </svg>
      );
    case 'bleed': // three drops
      return (
        <svg viewBox="0 0 24 24" style={s} fill={color}>
          <path d="M6 4 C4 9 4 12 6 13 C8 12 8 9 6 4 Z" />
          <path d="M12 8 C10 13 10 16 12 17 C14 16 14 13 12 8 Z" />
          <path d="M18 4 C16 9 16 12 18 13 C20 12 20 9 18 4 Z" />
        </svg>
      );
    case 'stun': // burst
      return (
        <svg viewBox="0 0 24 24" style={s} fill={color}>
          <path d="M12 1 L14 8 L21 7 L15 12 L21 17 L14 16 L12 23 L10 16 L3 17 L9 12 L3 7 L10 8 Z" />
        </svg>
      );
    case 'regen': // arrow through heart
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M12 21 C5 16 3 12 3 8 A4 4 0 0 1 12 6 A4 4 0 0 1 21 8 C21 12 19 16 12 21 Z" fill={color} fillOpacity="0.2" />
          <path d="M12 22 V2 M8 6 L12 2 L16 6" strokeLinecap="round" />
        </svg>
      );
    case 'burn':
      return (
        <svg viewBox="0 0 24 24" style={s} fill={color}>
          <path d="M12 2 C 14 6 18 8 18 13 C18 17 15 21 12 21 C9 21 6 18 6 14 C6 11 8 10 9 8 C 10 11 11 10 12 8 C 12 6 11 4 12 2 Z" />
        </svg>
      );
    case 'buff':
      return (
        <svg viewBox="0 0 24 24" style={s} fill={color}>
          <path d="M12 2 L22 20 H2 Z" />
        </svg>
      );
    case 'debuff':
      return (
        <svg viewBox="0 0 24 24" style={s} fill={color}>
          <path d="M12 22 L22 4 H2 Z" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" style={s} fill={color} stroke={color} strokeWidth="1">
          <path d="M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z" />
        </svg>
      );
    default:
      return <div style={{ ...s, background: color }} />;
  }
}

// ─── Generic woodcut icons used in actions ───
function ActionIcon({ kind, size = 28, color = AXM.parchment }) {
  const s = { width: size, height: size, display: 'block' };
  switch (kind) {
    case 'sword':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M22 4 L28 4 L28 10 L13 25 L10 28 L4 28 L4 22 L7 19 Z" fill={color} fillOpacity="0.15" />
          <path d="M11 21 L15 25" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M16 3 L28 7 V17 C28 23 23 28 16 30 C9 28 4 23 4 17 V7 Z" fill={color} fillOpacity="0.15" />
          <path d="M16 3 V30 M4 14 H28" />
        </svg>
      );
    case 'arcane':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <circle cx="16" cy="16" r="11" />
          <path d="M16 4 L20 28 L4 13 H28 L12 28 Z" />
        </svg>
      );
    case 'bag':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M8 10 H24 L26 28 H6 Z" fill={color} fillOpacity="0.15" />
          <path d="M11 10 V7 A5 5 0 0 1 21 7 V10" />
        </svg>
      );
    case 'flee':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M6 28 L18 16 L10 8 L26 4 L22 20 L14 12" />
        </svg>
      );
    case 'eye':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M2 16 C 8 6 24 6 30 16 C 24 26 8 26 2 16 Z" fill={color} fillOpacity="0.1" />
          <circle cx="16" cy="16" r="5" fill={color} />
          <path d="M16 22 L 14 28 M 18 26 L 17 30" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M3 10 L8 22 H24 L29 10 L23 14 L16 6 L9 14 Z" fill={color} fillOpacity="0.18" />
          <path d="M3 26 H29" />
          {/* split crack */}
          <path d="M16 6 L 14 22 M 16 6 L 18 22" stroke="#c0152a" strokeWidth="1.5" />
        </svg>
      );
    case 'chest':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <rect x="4" y="12" width="24" height="16" fill={color} fillOpacity="0.15" />
          <path d="M4 12 C 4 6 28 6 28 12" />
          <rect x="14" y="16" width="4" height="6" fill={color} />
        </svg>
      );
    case 'scroll':
      return (
        <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d="M6 6 H26 V22 C26 25 24 27 21 27 H8 C5 27 3 25 3 22 V9 C3 7 5 5 6 6 Z" fill={color} fillOpacity="0.12" />
          <path d="M10 12 H22 M 10 16 H22 M 10 20 H18" />
        </svg>
      );
    case 'flame':
      return <EffectGlyph kind="burn" size={size} color={color} />;
    default: return null;
  }
}

// ─── Cross / X glyph for completed nodes ───
function NodeMark({ kind = 'available', size = 28 }) {
  if (kind === 'completed') {
    return (
      <svg viewBox="0 0 32 32" width={size} height={size} fill={AXM.bone} stroke={AXM.bone} strokeWidth="1">
        {/* skull */}
        <path d="M8 12 C 8 6 12 4 16 4 C 20 4 24 6 24 12 V18 C 24 20 22 21 21 21 V25 H11 V21 C 10 21 8 20 8 18 Z" />
        <circle cx="13" cy="14" r="2" fill="#0a0a0a" />
        <circle cx="19" cy="14" r="2" fill="#0a0a0a" />
        <path d="M14 24 H 18" stroke="#0a0a0a" />
      </svg>
    );
  }
  if (kind === 'locked') {
    return (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <circle cx="16" cy="16" r="11" fill="#1a1814" stroke={AXM.ash} strokeWidth="2" strokeDasharray="3 3" />
        <path d="M8 8 L 24 24 M 24 8 L 8 24" stroke={AXM.blood} strokeWidth="2.5" />
      </svg>
    );
  }
  if (kind === 'current') {
    return (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <circle cx="16" cy="16" r="13" fill="none" stroke={AXM.sulfur} strokeWidth="2" />
        <circle cx="16" cy="16" r="6" fill={AXM.sulfur} />
        <circle cx="16" cy="16" r="2.5" fill="#0a0a0a" />
      </svg>
    );
  }
  // available
  return (
    <svg viewBox="0 0 32 32" width={size} height={size}>
      <circle cx="16" cy="16" r="11" fill={AXM.bg} stroke={AXM.parchment} strokeWidth="2" />
      <circle cx="16" cy="16" r="5" fill={AXM.parchment} />
    </svg>
  );
}

// ─── Big section label ───
function SectionLabel({ children, color = AXM.parchment, size = 11, style = {} }) {
  return (
    <div style={{
      fontFamily: AXM.sans, fontSize: size, letterSpacing: 3,
      color, textTransform: 'uppercase', ...style,
    }}>{children}</div>
  );
}

// ─── Effect chip ───
function EffectChip({ effect, dim = false }) {
  const tintMap = {
    buff: AXM.buff, debuff: AXM.debuff, neutral: '#171410',
  };
  const colorMap = {
    poison: '#5a8a3a', bleed: AXM.blood, stun: AXM.sulfur,
    regen: '#5a8a3a', burn: AXM.rust, buff: AXM.sulfur, debuff: AXM.blood,
  };
  const c = colorMap[effect.kind] || AXM.parchment;
  return (
    <div title={effect.name} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 5px 3px 4px',
      background: tintMap[effect.tint || 'neutral'],
      border: `1px solid ${c}`,
      opacity: dim ? 0.55 : 1,
      fontFamily: AXM.mono, fontSize: 10, color: c,
    }}>
      <EffectGlyph kind={effect.kind} size={12} color={c} />
      <span>{effect.duration ?? ''}</span>
      {effect.intensity > 1 && <span style={{ color: AXM.parchment, opacity: 0.65 }}>×{effect.intensity}</span>}
    </div>
  );
}

// ─── Friendship counter — engine: incrementFriendship / FRIENDSHIP_COUNTER_MAX ───
function FriendshipMeter({ value = 0, max = 5, compact = false }) {
  const hearts = max;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {!compact && <SectionLabel size={9} style={{ color: AXM.bone }}>FRIEND</SectionLabel>}
      <div style={{ display: 'flex', gap: 1 }}>
        {Array.from({ length: hearts }).map((_, i) => (
          <svg key={i} viewBox="0 0 16 14" width="11" height="10">
            <path d="M8 13 C 2 9, 0 5, 2 2.5 C 4 0.5, 6.5 1.5, 8 4 C 9.5 1.5, 12 0.5, 14 2.5 C 16 5, 14 9, 8 13 Z"
              fill={i < value ? AXM.rust : 'none'} stroke={AXM.rust} strokeWidth="1.2" />
          </svg>
        ))}
      </div>
      <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone }}>{value}/{max}</span>
    </div>
  );
}

// ─── Mind Mark stack — engine: MIND_MARK_ID / getStudyMarkIntensity ───
function MindMark({ stacks = 0 }) {
  if (stacks <= 0) return null;
  return (
    <div title={`Studied ×${stacks}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 4px',
      background: '#000',
      border: `1px dashed ${AXM.sulfur}`,
      fontFamily: AXM.mono, fontSize: 9, color: AXM.sulfur, letterSpacing: 0.5,
    }}>
      <svg viewBox="0 0 12 12" width="10" height="10">
        <circle cx="6" cy="6" r="4.5" fill="none" stroke={AXM.sulfur} strokeWidth="1" />
        <circle cx="6" cy="6" r="1.5" fill={AXM.sulfur} />
        <path d="M6 0 V 2 M 6 10 V 12 M 0 6 H 2 M 10 6 H 12" stroke={AXM.sulfur} strokeWidth="1" />
      </svg>
      MARK ×{stacks}
    </div>
  );
}

// ─── Difficulty badge — engine: EnemyDifficulty ───
function DifficultyBadge({ tier = 'normal' }) {
  const map = {
    simple: { c: AXM.bone, label: 'SIMPLE' },
    normal: { c: AXM.parchment, label: 'NORMAL' },
    elite: { c: AXM.sulfur, label: 'ELITE' },
    boss: { c: AXM.blood, label: 'BOSS' },
    unique: { c: AXM.rust, label: 'UNIQUE' },
  };
  const m = map[tier] || map.normal;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px',
      border: `1px solid ${m.c}`, color: m.c,
      fontFamily: AXM.sans, fontSize: 10, letterSpacing: 2,
      background: 'rgba(0,0,0,0.5)',
    }}>
      <span style={{ width: 5, height: 5, background: m.c, display: 'inline-block' }} />
      {m.label}
    </div>
  );
}

// ─── Distressed background — to wrap a phone screen interior ───
function ScreenBg({ children, style = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: AXM.bg,
      backgroundImage: PAPER_URI,
      backgroundSize: '320px 320px',
      color: AXM.parchment,
      fontFamily: AXM.serif,
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
      }} />
      {children}
    </div>
  );
}

// ─── Status card (top of every gameplay screen) ───
function StatusCard({ name = 'WORM-EATEN PILGRIM', level = 7, hp = 22, hpMax = 38, tokens = { body: 2, mind: 1, heart: 2, fallacy: 1, paradox: 1 } }) {
  return (
    <div style={{
      position: 'relative',
      margin: '8px 10px 0',
      padding: '8px 10px 10px',
      background: '#100d0a',
      backgroundImage: NOISE_URI,
      backgroundBlendMode: 'multiply',
      clipPath: tornEdge({ width: 370, height: 96, jag: 5, seed: 13 }),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 36, height: 36,
          border: `2px solid ${AXM.parchment}`,
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: AXM.gothic, fontSize: 22, color: AXM.sulfur,
          flexShrink: 0,
        }}>{level}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 15, lineHeight: 1, color: AXM.parchment,
            letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</div>
          <SectionLabel size={9} style={{ marginTop: 2, color: AXM.bone }}>LEVEL · LVL {level} PILGRIM</SectionLabel>
        </div>
        <div style={{ minWidth: 120 }}>
          <StatBar value={hp} max={hpMax} color={AXM.blood} label="HP" height={9} />
        </div>
      </div>
      {/* token rack replaces MP — sits across the bottom */}
      <div style={{ marginTop: 6 }}>
        {typeof TokenRack === 'function' ? <TokenRack tokens={tokens} compact /> : null}
      </div>
    </div>
  );
}

Object.assign(window, {
  AXM, NOISE_URI, PAPER_URI, Splatter, tornEdge, TornPanel, StatBar,
  GlyphHeart, GlyphBody, GlyphMind, StanceGlyph, EffectGlyph, ActionIcon,
  NodeMark, SectionLabel, EffectChip, DifficultyBadge, ScreenBg, StatusCard,
});
