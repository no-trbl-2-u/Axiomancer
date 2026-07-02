// Encounter Modal — appears when map movement triggers an encounter.
// The player CANNOT dismiss it. No close button, no tap-outside-to-close,
// no swipe-down. The only way out is to make a combat decision.

function IronRivet({ x, y, size = 10 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #6a625a 0%, #2a2520 60%, #0a0a0a 100%)',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 0 rgba(0,0,0,0.8)',
      border: '1px solid #0a0a0a',
    }} />
  );
}

// the "you cannot leave" marker — a small wax/lead seal
function LockSeal({ color = AXM.blood }) {
  return (
    <div style={{
      width: 22, height: 22, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 22 22" width="22" height="22">
        {/* sealing wax disc */}
        <circle cx="11" cy="11" r="10" fill={color} stroke="#0a0a0a" strokeWidth="0.6" />
        <circle cx="11" cy="11" r="10" fill="none" stroke="#0a0a0a" strokeWidth="0.4" strokeDasharray="1 1.5" opacity="0.6" />
        {/* impressed lock */}
        <path d="M7.5 11 h 7 v 5 h -7 z" fill="none" stroke="#0a0a0a" strokeWidth="1.2" />
        <path d="M8.5 11 v -2 a 2.5 2.5 0 0 1 5 0 v 2" fill="none" stroke="#0a0a0a" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

function EncounterModal({ variant = 'encounter', onChoice = () => {} }) {
  const data = {
    encounter: {
      badge: 'ENCOUNTER',
      badgeC: AXM.blood,
      title: 'A FIGURE STIRS\nIN THE ROT',
      sub: 'something with too many joints',
      body: 'It crawled out from under the cairn — patient as moss. Its mouth, where a mouth should be, makes the sound of bees made of teeth.',
      choices: [
        { l: 'FIGHT',      sub: 'Combat · turns',  icon: 'sword',  accent: AXM.blood },
        { l: 'SNEAK PAST', sub: 'Mind Test · 14',  icon: 'eye',    accent: AXM.parchment },
        { l: 'PARLEY',     sub: 'Heart Test · 12', icon: 'scroll', accent: AXM.sulfur },
        { l: 'FLEE',       sub: 'Luck Save',       icon: 'flee',   accent: AXM.bone },
      ],
    },
    boss: {
      badge: 'OMEN OF DOOM',
      badgeC: AXM.blood,
      title: 'THE GUTTED\nKING WAKES',
      sub: 'fourth seal · third sigh',
      body: 'The throne is a trough. The Gutted King smiles with three rows of nails. Above, the sky is a wound. There is no leaving now.',
      choices: [
        { l: 'KNEEL',  sub: 'Offer thyself',  icon: 'crown', accent: AXM.sulfur },
        { l: 'STRIKE', sub: 'Combat · BOSS',  icon: 'sword', accent: AXM.blood  },
      ],
    },
  }[variant];

  const isBoss = variant === 'boss';

  // ── backdrop covers the whole 390×844 phone interior ──
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      // hard, heavy darken on the world map — no tap-through
      background: 'radial-gradient(ellipse at center, rgba(10,5,5,0.86) 0%, rgba(0,0,0,0.97) 80%)',
      backgroundImage: NOISE_URI,
      backgroundBlendMode: 'multiply',
      display: 'flex', flexDirection: 'column',
      // explicitly catches every pointer event — the map underneath is dead.
      pointerEvents: 'auto',
    }}
      // swallow taps on the backdrop — nothing happens.
      onClick={(e) => { e.stopPropagation(); }}
    >
      {/* ── stamped chain across the very top — visual "sealed in" ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6px',
        background: 'linear-gradient(180deg, #1a0606 0%, #0a0303 100%)',
        borderBottom: `1px solid ${AXM.blood}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.blood, letterSpacing: 2,
      }}>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
        <span>SEALED</span>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
      </div>

      {/* ── the encounter card itself ── */}
      <div style={{
        position: 'relative',
        margin: '34px 14px 14px',
        flex: 1,
        display: 'flex', flexDirection: 'column',
        background: '#0a0807',
        backgroundImage: PAPER_URI,
        backgroundBlendMode: 'multiply',
        border: `2px solid ${AXM.blood}`,
        boxShadow: '0 0 0 1px #0a0a0a, 0 0 30px rgba(192,21,42,0.35), inset 0 0 80px rgba(0,0,0,0.7)',
        animation: 'axmModalSnap 280ms cubic-bezier(0.2, 1.2, 0.3, 1)',
      }}>
        {/* iron rivets in all four corners — implies bolted shut */}
        <IronRivet x={6}  y={6}  size={10} />
        <IronRivet x={'calc(100% - 16px)'} y={6}  size={10} />
        <IronRivet x={6}  y={'calc(100% - 16px)'} size={10} />
        <IronRivet x={'calc(100% - 16px)'} y={'calc(100% - 16px)'} size={10} />

        {/* header strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px 6px',
          borderBottom: `1px solid ${AXM.ash}`,
          background: 'linear-gradient(180deg, rgba(192,21,42,0.18), rgba(0,0,0,0))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LockSeal color={data.badgeC} />
            <div>
              <div style={{
                fontFamily: AXM.gothic, fontSize: 14, color: data.badgeC,
                letterSpacing: 2, lineHeight: 1,
              }}>{isBoss ? '☠ ' : '✠ '}{data.badge}</div>
              <div style={{
                fontFamily: AXM.mono, fontSize: 7, color: AXM.bone,
                letterSpacing: 1.6, marginTop: 2,
              }}>NO RETREAT · CHOOSE TO PROCEED</div>
            </div>
          </div>
          {/* deliberately NO close button. instead, a struck-out one — */}
          <div style={{
            position: 'relative', width: 22, height: 22,
            border: `1px dashed ${AXM.ash}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: AXM.mono, fontSize: 12, color: AXM.ash,
          }}>
            ✕
            <div style={{
              position: 'absolute', inset: -2,
              borderTop: `1.5px solid ${AXM.blood}`,
              transform: 'rotate(20deg)', transformOrigin: 'center',
            }} />
          </div>
        </div>

        {/* illustration */}
        <div style={{ position: 'relative', height: isBoss ? 200 : 170, overflow: 'hidden', margin: '6px 10px 0' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: '#06050a',
            backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            clipPath: tornEdge({ width: 340, height: isBoss ? 200 : 170, jag: 6, seed: 60 }),
          }} />
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.92)' }}>
            {isBoss ? <BossIllustration /> : <EncounterIllustration />}
          </div>
          <Splatter color={AXM.blood} size={140} seed={71} style={{
            position: 'absolute', top: -16, right: -20, opacity: 0.55,
          }} />
        </div>

        {/* title + sub */}
        <div style={{ padding: '10px 14px 0' }}>
          <div style={{
            fontFamily: AXM.gothic, fontSize: isBoss ? 32 : 24,
            lineHeight: 0.92, letterSpacing: 1,
            color: AXM.parchment, whiteSpace: 'pre-line',
            textShadow: isBoss ? `2px 2px 0 ${AXM.blood}` : 'none',
          }}>{data.title}</div>
          <div style={{
            fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 11,
            color: AXM.bone, marginTop: 2,
          }}>— {data.sub}</div>
        </div>

        {/* body */}
        <div style={{ padding: '8px 14px 4px' }}>
          <div style={{
            fontFamily: AXM.serif, fontSize: 11.5, color: AXM.parchment,
            lineHeight: 1.35, textWrap: 'pretty',
          }}>
            <span style={{
              float: 'left', fontFamily: AXM.gothic, fontSize: 32, lineHeight: 0.85,
              paddingRight: 5, paddingTop: 2, color: AXM.blood,
            }}>{data.body[0]}</span>
            {data.body.slice(1)}
          </div>
        </div>

        {/* choices */}
        <div style={{ padding: '10px 12px 14px', marginTop: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <SectionLabel size={9}>✠ THE ONLY WAYS OUT</SectionLabel>
            <span style={{
              fontFamily: AXM.mono, fontSize: 8, color: AXM.blood, letterSpacing: 1.4,
            }}>↻ MUST CHOOSE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.choices.map((c, i) => (
              <button
                key={c.l}
                onClick={() => onChoice(c.l)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: i === 0 ? '#1a0a0a' : '#0a0a0a',
                  backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
                  border: `2px solid ${c.accent}`,
                }}
              >
                <ActionIcon kind={c.icon} size={22} color={c.accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: AXM.gothic, fontSize: 17, color: AXM.parchment, lineHeight: 1, letterSpacing: 1.5 }}>{c.l}</div>
                  <div style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 }}>{c.sub.toUpperCase()}</div>
                </div>
                <span style={{ fontFamily: AXM.gothic, fontSize: 18, color: c.accent }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── stamped chain across the very bottom ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6px',
        background: 'linear-gradient(0deg, #1a0606 0%, #0a0303 100%)',
        borderTop: `1px solid ${AXM.blood}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.blood, letterSpacing: 2,
      }}>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
        <span>SEALED</span>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
      </div>

      <style>{`
        @keyframes axmModalSnap {
          0%   { transform: scale(0.92) rotate(-0.6deg); opacity: 0; }
          60%  { transform: scale(1.02) rotate(0.2deg); opacity: 1; }
          100% { transform: scale(1.0) rotate(0deg);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

window.EncounterModal = EncounterModal;
