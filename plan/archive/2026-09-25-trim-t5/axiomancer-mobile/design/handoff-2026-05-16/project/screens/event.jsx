// Screen 5 — Event / Encounter Card

function EventScreen({ variant = 'encounter' }) {
  const data = {
    encounter: {
      badge: 'ENCOUNTER',
      badgeC: AXM.blood,
      title: 'A FIGURE STIRS\nIN THE ROT',
      sub: 'something with too many joints',
      body: 'It crawled out from under the cairn — patient as moss. Its mouth, where a mouth should be, makes the sound of bees made of teeth. It has not yet seen you.',
      choices: [
        { l: 'FIGHT',       sub: 'Combat · turns', icon: 'sword', accent: AXM.blood },
        { l: 'SNEAK PAST',  sub: 'Mind Test · 14', icon: 'eye', accent: AXM.parchment },
        { l: 'PARLEY',      sub: 'Heart Test · 12', icon: 'scroll', accent: AXM.sulfur },
        { l: 'FLEE',        sub: 'Luck Save', icon: 'flee', accent: AXM.bone },
      ],
    },
    boss: {
      badge: 'OMEN OF DOOM',
      badgeC: AXM.blood,
      title: 'THE GUTTED\nKING WAKES',
      sub: 'fourth seal · third sigh',
      body: 'You have come to the throne and the throne is a trough. The Gutted King smiles with three rows of nails. Above, the sky is a wound. Below, the ground forgets your name. There is no leaving now — only how.',
      lore: '"He who counts the bones of saints shall sit beside Him until the lamps are out." — Cipher of Worms, fol. xliv',
      choices: [
        { l: 'KNEEL',     sub: 'Offer thyself', icon: 'crown', accent: AXM.sulfur },
        { l: 'STRIKE',    sub: 'Combat · BOSS', icon: 'sword', accent: AXM.blood },
      ],
    },
  };
  const d = data[variant] || data.encounter;
  const isBoss = variant === 'boss';

  return (
    <ScreenBg>
      {/* illustration area */}
      <div style={{ position: 'relative', margin: '8px 8px 0', height: isBoss ? 360 : 320, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: '#06050a',
          backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
          clipPath: tornEdge({ width: 374, height: isBoss ? 360 : 320, jag: 7, seed: 200 }),
        }} />
        {/* illustration: scene composition */}
        {isBoss
          ? <BossIllustration />
          : <EncounterIllustration />
        }
        {/* badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          padding: '4px 8px', background: '#0a0a0a',
          border: `2px solid ${d.badgeC}`,
          fontFamily: AXM.gothic, fontSize: 14, color: d.badgeC, letterSpacing: 2,
        }}>{isBoss ? '☠ ' : '✠ '}{d.badge}</div>
        {/* corner index */}
        <div style={{
          position: 'absolute', top: 14, right: 16,
          fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, textAlign: 'right',
        }}>SCENE iv · ix<br/>NODE: BLACK CAIRN</div>
        {/* splatter overlay */}
        <Splatter color={AXM.blood} size={180} seed={45} style={{
          position: 'absolute', top: -20, right: -30, opacity: isBoss ? 0.7 : 0.5,
        }} />
      </div>

      {/* title bar */}
      <div style={{ padding: '8px 14px 0' }}>
        <div style={{
          fontFamily: AXM.gothic, fontSize: isBoss ? 38 : 28,
          lineHeight: 0.92, letterSpacing: 1,
          color: AXM.parchment, whiteSpace: 'pre-line',
          textShadow: isBoss ? `3px 3px 0 ${AXM.blood}` : 'none',
        }}>{d.title}</div>
        <div style={{
          fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 11,
          color: AXM.bone, marginTop: 2,
        }}>— {d.sub}</div>
      </div>

      {/* body copy */}
      <div style={{ padding: '8px 14px 0' }}>
        <div style={{
          fontFamily: AXM.serif, fontSize: 12, color: AXM.parchment,
          lineHeight: 1.35, textWrap: 'pretty',
        }}>
          <span style={{
            float: 'left', fontFamily: AXM.gothic, fontSize: 36, lineHeight: 0.85,
            paddingRight: 6, paddingTop: 2, color: AXM.blood,
          }}>{d.body[0]}</span>
          {d.body.slice(1)}
        </div>
        {isBoss && d.lore && (
          <div style={{
            marginTop: 8, padding: '6px 8px',
            borderLeft: `2px solid ${AXM.sulfur}`,
            fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 10,
            color: AXM.sulfur, lineHeight: 1.3,
          }}>{d.lore}</div>
        )}
      </div>

      {/* choices */}
      <div style={{ padding: '12px 14px 16px' }}>
        <SectionLabel size={10} style={{ marginBottom: 6 }}>✠ WHAT WILL YOU DO?</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {d.choices.map((c, i) => (
            <div key={c.l} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              background: i === 0 ? '#1a0a0a' : '#0a0a0a',
              backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
              border: `2px solid ${c.accent}`,
              cursor: 'pointer',
            }}>
              <ActionIcon kind={c.icon} size={24} color={c.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: AXM.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 1, letterSpacing: 1.5 }}>{c.l}</div>
                <div style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 }}>{c.sub.toUpperCase()}</div>
              </div>
              <span style={{ fontFamily: AXM.gothic, fontSize: 18, color: c.accent }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenBg>
  );
}

function EncounterIllustration() {
  return (
    <svg viewBox="0 0 374 320" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {/* horizon */}
      <line x1="0" y1="200" x2="374" y2="200" stroke={AXM.bone} strokeWidth="0.5" opacity="0.4" />
      {/* trees - hanged */}
      {[40, 100, 280, 340].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 60 L ${x} 220`} stroke={AXM.parchment} strokeWidth="2" />
          <path d={`M${x-30} 90 L ${x+30} 90 M ${x-25} 130 L ${x+20} 125`} stroke={AXM.parchment} strokeWidth="1.5" />
          <ellipse cx={x} cy={130} rx="3" ry="6" fill={AXM.parchment} />
          {/* hanged figure */}
          <line x1={x-20} y1="90" x2={x-20} y2="115" stroke={AXM.parchment} strokeWidth="1" />
          <circle cx={x-20} cy="120" r="4" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1" />
        </g>
      ))}
      {/* central cairn with creature */}
      <g transform="translate(187 200)">
        <ellipse cx="0" cy="0" rx="60" ry="12" fill="#06050a" stroke={AXM.parchment} strokeWidth="1" />
        <path d="M-50 0 L -55 -20 L -40 -30 L -25 -10 L -10 -38 L 5 -22 L 25 -45 L 38 -25 L 50 -8 L 55 0 Z"
          fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1.5" />
        {/* the figure: insectoid silhouette */}
        <g transform="translate(0 -50)">
          <ellipse cx="0" cy="0" rx="14" ry="20" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1.5" />
          {/* eyes - many */}
          {[[-6,-8],[6,-8],[-8,-2],[8,-2],[0,-12]].map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="1.5" fill={AXM.blood} />
          ))}
          {/* limbs sprawled */}
          <path d="M-12 0 L -28 8 L -22 18 M 12 0 L 28 8 L 22 18 M -10 14 L -20 26 M 10 14 L 20 26"
            stroke={AXM.parchment} strokeWidth="1.5" fill="none" />
          {/* mouth — too wide */}
          <path d="M-8 6 L 8 6" stroke={AXM.blood} strokeWidth="1.5" />
          <path d="M-6 6 L -4 10 M -2 6 L 0 10 M 2 6 L 4 10" stroke={AXM.blood} strokeWidth="0.8" />
        </g>
      </g>
      {/* moon — slit */}
      <circle cx="60" cy="50" r="20" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      <path d="M50 50 q 10 -8 20 0" stroke={AXM.blood} strokeWidth="1.5" fill="none" />
      {/* fog hatching */}
      <g stroke={AXM.bone} strokeWidth="0.5" opacity="0.3">
        {Array.from({ length: 60 }).map((_, i) => (
          <line key={i} x1={i*7} y1={210 + (i%4)*3} x2={i*7+10} y2={210 + (i%4)*3} />
        ))}
      </g>
    </svg>
  );
}

function BossIllustration() {
  return (
    <svg viewBox="0 0 374 360" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {/* throne backdrop — broken arch */}
      <path d="M40 20 L 40 200 L 100 80 L 187 30 L 274 80 L 334 200 L 334 20 Z"
        fill="#06050a" stroke={AXM.parchment} strokeWidth="1.5" />
      <path d="M120 80 L 187 50 L 254 80" stroke={AXM.blood} strokeWidth="1.5" fill="none" />
      {/* halo */}
      <circle cx="187" cy="130" r="60" fill="none" stroke={AXM.sulfur} strokeWidth="1" opacity="0.5" />
      <circle cx="187" cy="130" r="80" fill="none" stroke={AXM.sulfur} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 4" />
      {/* gutted king */}
      <g transform="translate(187 130)">
        {/* crown */}
        <path d="M-30 -50 L -22 -75 L -15 -55 L -8 -82 L 0 -55 L 8 -82 L 15 -55 L 22 -75 L 30 -50 Z"
          fill={AXM.sulfur} stroke="#0a0a0a" strokeWidth="1" />
        <path d="M-30 -50 L 30 -50 L 30 -45 L -30 -45 Z" fill={AXM.sulfur} />
        <circle cx="0" cy="-66" r="2.5" fill={AXM.blood} />
        {/* crown crack */}
        <path d="M0 -75 L -3 -55 L 3 -45" stroke={AXM.blood} strokeWidth="1.5" fill="none" />
        {/* head — gaunt */}
        <ellipse cx="0" cy="-20" rx="22" ry="28" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1.5" />
        {/* eyes — empty */}
        <ellipse cx="-8" cy="-26" rx="4" ry="5" fill="#000" stroke={AXM.parchment} strokeWidth="1" />
        <ellipse cx="8" cy="-26" rx="4" ry="5" fill="#000" stroke={AXM.parchment} strokeWidth="1" />
        <circle cx="-8" cy="-26" r="1" fill={AXM.blood} />
        <circle cx="8" cy="-26" r="1" fill={AXM.blood} />
        {/* mouth — three rows of nails */}
        <path d="M-12 -10 L 12 -10" stroke={AXM.parchment} strokeWidth="1" />
        {[-10,-7,-4,-1,2,5,8,11].map((x,i) => (
          <g key={i}>
            <line x1={x} y1="-10" x2={x} y2="-5" stroke={AXM.parchment} strokeWidth="0.8" />
            <line x1={x+0.5} y1="-7" x2={x+0.5} y2="-3" stroke={AXM.parchment} strokeWidth="0.8" />
          </g>
        ))}
        {/* body — opened ribs */}
        <path d="M-30 5 L -36 80 L -10 90 L 10 90 L 36 80 L 30 5"
          fill="#06050a" stroke={AXM.parchment} strokeWidth="1.5" />
        {/* gutted opening — viscera spill */}
        <path d="M-22 10 L -28 70 L 28 70 L 22 10 Z" fill="#3a0612" stroke={AXM.blood} strokeWidth="1" />
        {/* ribs */}
        {[15, 28, 41, 54, 67].map((y, i) => (
          <path key={i} d={`M-22 ${y} Q 0 ${y-5} 22 ${y}`} stroke={AXM.parchment} strokeWidth="1" fill="none" />
        ))}
        {/* viscera trails */}
        <path d="M-10 70 q 0 30 -8 50 M 10 70 q 0 30 8 50 M 0 70 q 0 40 0 60"
          stroke={AXM.blood} strokeWidth="1.5" fill="none" />
        {/* arms — long */}
        <path d="M-30 10 L -54 80 L -50 130 M 30 10 L 54 80 L 50 130"
          stroke={AXM.parchment} strokeWidth="1.5" fill="none" />
        <circle cx="-50" cy="135" r="5" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1" />
        <circle cx="50" cy="135" r="5" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1" />
      </g>
      {/* candles flanking */}
      {[60, 314].map((x, i) => (
        <g key={i}>
          <rect x={x-3} y="240" width="6" height="80" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth="1" />
          <path d={`M${x} 235 q -3 -8 0 -15 q 3 8 0 15 z`} fill={AXM.sulfur} />
          <path d={`M${x} 240 q -1 -4 0 -8 q 1 4 0 8 z`} fill={AXM.blood} />
        </g>
      ))}
    </svg>
  );
}

window.EventScreen = EventScreen;
