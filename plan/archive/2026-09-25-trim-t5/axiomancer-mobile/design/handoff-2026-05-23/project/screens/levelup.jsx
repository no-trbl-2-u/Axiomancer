// screens/levelup.jsx
// ─────────────────────────────────────────────────────────────────────────
// Level-up affordance + allocation modal. Two artboards, plus a Demo
// wrapper showing every meaningful state (header silent / header armed,
// modal mid-allocation / modal full / modal discard-confirm).
//
//   window.SelfTabHeaderWithLevelUp
//   window.LevelUpModal
//   window.LevelUpDemo
//
// Globals consumed from axm-system.jsx:
//   AXM, NOISE_URI, PAPER_URI, Splatter, tornEdge,
//   SectionLabel, StanceGlyph
// ─────────────────────────────────────────────────────────────────────────

// ── helpers ───────────────────────────────────────────────────────────────

// lowercase roman — for chrome copy (level numbers).
// Stat values, point counts, and derived numbers stay arabic.
function lcRoman(n) {
  if (n <= 0) return '·';
  const map = [
    ['m', 1000], ['cm', 900], ['d', 500], ['cd', 400],
    ['c', 100],  ['xc', 90],  ['l', 50],  ['xl', 40],
    ['x', 10],   ['ix', 9],   ['v', 5],   ['iv', 4], ['i', 1],
  ];
  let out = '';
  for (const [s, v] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}

// ── primitives ────────────────────────────────────────────────────────────

// LockSeal — the wax-seal motif. Sulfur disk, parchment rim, gothic
// cross-and-aleph mark struck into the wax. Pulses via a second concentric
// ring at half opacity (the 1px sulfur "breath" mentioned in the brief).
function LockSeal({ size = 36, pulse = false, color = null }) {
  const c = color || '#d4c026'; // sulfur
  const r = size / 2;
  return (
    <div style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
    }}>
      {/* outer breath ring */}
      <div style={{
        position: 'absolute', inset: -6,
        border: `1px solid ${c}`,
        borderRadius: '50%',
        opacity: pulse ? 0.5 : 0,
        pointerEvents: 'none',
      }} />
      {/* on-strip ring (1px sulfur) */}
      <div style={{
        position: 'absolute', inset: -2,
        border: `1px solid ${c}`,
        borderRadius: '50%',
        opacity: 0.85,
        pointerEvents: 'none',
      }} />
      <svg viewBox="0 0 36 36" width={size} height={size} style={{ display: 'block' }}>
        {/* wax disk */}
        <circle cx="18" cy="18" r="16" fill={c} />
        {/* parchment inner rim */}
        <circle cx="18" cy="18" r="13.4" fill="none" stroke="#e8dfc8" strokeWidth="0.6" opacity="0.7" />
        {/* notched outer rim — wax-press teeth */}
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const x1 = 18 + Math.cos(a) * 15.4;
          const y1 = 18 + Math.sin(a) * 15.4;
          const x2 = 18 + Math.cos(a) * 16.6;
          const y2 = 18 + Math.sin(a) * 16.6;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a0a0a" strokeWidth="0.7" opacity="0.55" />;
        })}
        {/* struck mark — cross over an aleph-stub */}
        <path d="M18 6.5 L18 28 M11 17 L25 17" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14 13.5 L22 22 M22 13.5 L14 22" stroke="#0a0a0a" strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
        {/* wax sheen */}
        <ellipse cx="13" cy="12" rx="3.5" ry="1.6" fill="#fff5e0" opacity="0.18" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// #1  SelfTabHeaderWithLevelUp — the in-tab affordance
// ─────────────────────────────────────────────────────────────────────────
function SelfTabHeaderWithLevelUp({
  characterName = 'GRIEF-FOR-NO-ONE',
  subtitle      = 'KNOTWORK · INITIATE',
  level         = 7,
  xp            = 84,
  xpMax         = 120,
  pendingPoints = 0,
  pressed       = false,                // demo-only — fake the press state
  onOpenLevelUp = () => {},
}) {
  const filled = Math.round((xp / xpMax) * 16);
  const armed  = pendingPoints > 0;

  return (
    <div style={{ padding: '14px 14px 0' }}>
      {/* subtitle eyebrow — same as today */}
      <SectionLabel size={9} color={AXM.bone}>{subtitle}</SectionLabel>

      {/* name + level box row — byte-for-byte the same as today */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginTop: 2,
      }}>
        <div style={{
          fontFamily: AXM.gothic, fontSize: 26, lineHeight: 0.95,
          color: AXM.parchment, letterSpacing: 0.5,
          maxWidth: 220, textWrap: 'pretty',
        }}>{characterName}</div>
        <div style={{
          width: 50, height: 50, border: `2px solid ${AXM.parchment}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: AXM.gothic, fontSize: 30, color: AXM.sulfur, background: '#000',
          flexShrink: 0,
        }}>{level}</div>
      </div>

      {/* ── LEVEL UP STRIP — only present when pendingPoints > 0 ── */}
      {armed && (
        <LevelUpStrip
          pendingPoints={pendingPoints}
          level={level}
          pressed={pressed}
          onOpen={onOpenLevelUp}
        />
      )}

      {/* xp chain — same as today */}
      <div style={{ marginTop: armed ? 12 : 8 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1, marginBottom: 2,
        }}>
          <span>XP CHAIN TO LVL {level + 1}</span>
          <span style={{ color: AXM.sulfur }}>{xp} / {xpMax}</span>
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <svg key={i} viewBox="0 0 12 14" width="100%" height="14" style={{ flex: 1 }}>
              <ellipse cx="6" cy="7" rx="4" ry="6" fill="none"
                stroke={i < filled ? AXM.sulfur : AXM.ash} strokeWidth="1.5" />
              <ellipse cx="6" cy="7" rx="2" ry="3" fill={i < filled ? AXM.sulfur : 'transparent'} />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelUpStrip({ pendingPoints, level, pressed, onOpen }) {
  const ptsLabel = `${pendingPoints} ${pendingPoints === 1 ? 'point' : 'points'} unspent · step into level ${lcRoman(level + 1)}`;
  const sulfurBorder = pressed ? 'rgba(212,192,38,0.85)' : AXM.sulfur;

  // chevron stack — one per pending point, up to 5, then ↑×N
  let chevronRow = null;
  if (pendingPoints >= 2) {
    chevronRow = pendingPoints <= 5
      ? Array.from({ length: pendingPoints }).map(() => '↑').join(' ')
      : `↑×${pendingPoints}`;
  }

  return (
    <button
      onClick={onOpen}
      style={{
        all: 'unset', cursor: 'pointer', display: 'block',
        position: 'relative',
        width: '100%',
        marginTop: 10,
        height: 64,
        background: AXM.panelBg,
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        borderTop:    `2px solid ${sulfurBorder}`,
        borderBottom: `2px solid ${sulfurBorder}`,
        borderLeft:   `1px solid ${AXM.parchment}`,
        borderRight:  `1px solid ${AXM.parchment}`,
        transform: pressed ? 'translateY(1px)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* noise overlay (already in bg). add the corner splatter — clipped
          to a small tornEdge run in the bottom-left only. */}
      <div style={{
        position: 'absolute', left: 0, bottom: 0, width: 96, height: 36,
        clipPath: tornEdge({ width: 96, height: 36, jag: 4, seed: 91, sides: ['top', 'right'] }),
        pointerEvents: 'none',
      }}>
        <Splatter color={AXM.blood} size={92} seed={307} style={{
          position: 'absolute', left: -26, bottom: -28, opacity: 0.34,
        }} />
      </div>

      {/* content row */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 12px', height: '100%', zIndex: 1,
      }}>
        {/* seal */}
        <LockSeal size={36} pulse />

        {/* center column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 18, color: AXM.sulfur,
            letterSpacing: 1, lineHeight: 1,
          }}>✠ ASCEND</div>
          <div className="axm-eyebrow" style={{
            color: AXM.sulfur, opacity: 0.4, marginTop: 4,
            fontSize: 9, letterSpacing: '0.18em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{ptsLabel}</div>
          {chevronRow && (
            <div style={{
              fontFamily: AXM.mono, fontSize: 9, color: AXM.sulfur,
              opacity: 0.7, marginTop: 3, letterSpacing: 2, lineHeight: 1,
            }}>{chevronRow}</div>
          )}
        </div>

        {/* chevron */}
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          borderRadius: '50%',
          border: `1px solid ${AXM.parchment}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: AXM.gothic, fontSize: 24, color: AXM.sulfur,
            lineHeight: 1, marginTop: -2,
          }}>›</span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// #2  LevelUpModal — the ledger opens
// ─────────────────────────────────────────────────────────────────────────
function LevelUpModal({
  characterName  = 'GRIEF-FOR-NO-ONE',
  fromLevel      = 6,
  toLevel        = 7,
  totalPoints    = 3,
  spent          = { heart: 1, body: 0, mind: 0 },
  current        = { heart: 11, body: 13, mind: 9 },
  derivedBefore  = {
    heart: { attack: 11, skill:  9, defense:  6 },
    body:  { attack: 13, skill:  7, defense: 10 },
    mind:  { attack:  8, skill: 14, defense:  8 },
  },
  derivedAfter   = null,                      // computed if null
  flavor         = 'the body that survives is not the body that arrived.',
  onInc          = () => {},
  onDec          = () => {},
  onReset        = () => {},
  onConfirm      = () => {},
  onCancel       = () => {},
  showDiscard    = false,
  discardSpent   = null,                      // override for the inset demo
}) {
  // derived-after fallback: simple convention — +1 stance point lifts
  // ATK by floor(deltaH+deltaB)/n stuff is engine-side; for the design
  // we display whatever the engine sends. If null, fall back to
  // derivedBefore + (spent[stance] across the row).
  const after = derivedAfter || (() => {
    const out = {};
    for (const k of ['heart', 'body', 'mind']) {
      out[k] = {
        attack:  derivedBefore[k].attack  + spent[k],
        skill:   derivedBefore[k].skill   + spent[k],
        defense: derivedBefore[k].defense + spent[k],
      };
    }
    return out;
  })();

  const sumSpent = spent.heart + spent.body + spent.mind;
  const remaining = totalPoints - sumSpent;
  const fullyAllocated = remaining === 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        width: 390, height: 844,
        background: AXM.deepBg,
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        display: 'flex', flexDirection: 'column',
        pointerEvents: 'auto',
        overflow: 'hidden',
        color: AXM.parchment,
        fontFamily: 'var(--f-serif)',
      }}
      className="axm"
    >
      {/* top binder — chronicle marker, sulfur register */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px',
        borderBottom: `1px solid ${AXM.ash}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.sulfur, letterSpacing: 2,
      }}>
        <span>✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠</span>
        <span style={{ color: AXM.bone }}>{lcRoman(toLevel)}.{lcRoman(1)}</span>
      </div>

      <div style={{
        flex: 1, padding: '26px 18px 14px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 1 — top eyebrow */}
        <div className="axm-caption" style={{ color: AXM.sulfur, textAlign: 'center', fontSize: 11 }}>
          ✠ THE LEDGER OPENS
        </div>

        {/* level transition — hairline, not a glyph */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, marginTop: 6,
        }}>
          <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 10 }}>
            level {lcRoman(fromLevel)}
          </span>
          <div style={{ width: 32, height: 1, background: AXM.sulfur }} />
          <span className="axm-eyebrow" style={{ color: AXM.parchment, fontSize: 10 }}>
            level {lcRoman(toLevel)}
          </span>
        </div>

        {/* 2 — title block */}
        <div style={{
          fontFamily: AXM.gothic, fontSize: 30, lineHeight: 1,
          letterSpacing: 1, color: AXM.parchment,
          textAlign: 'center', marginTop: 14,
          textShadow: `1.5px 1.5px 0 rgba(192,21,42,0.25)`,
        }}>{characterName}</div>

        {/* 3 — chronicle flavor */}
        <div className="axm-bodyit" style={{
          color: AXM.parchment, fontSize: 13, lineHeight: 1.35,
          marginTop: 8, textAlign: 'center', textWrap: 'pretty',
          padding: '0 6px',
        }}>“{flavor}”</div>

        {/* 4 — points remaining torn strip */}
        <PointsStrip
          remaining={remaining}
          total={totalPoints}
          fullyAllocated={fullyAllocated}
        />

        {/* 5 — three stance rows */}
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
          {(['heart', 'body', 'mind']).map((k, i) => (
            <React.Fragment key={k}>
              {i > 0 && <div className="axm-rule-dot" style={{ margin: '2px 0' }} />}
              <StanceRow
                stance={k}
                current={current[k]}
                spent={spent[k]}
                derivedBefore={derivedBefore[k]}
                derivedAfter={after[k]}
                canInc={remaining > 0}
                canDec={spent[k] > 0}
                onInc={() => onInc(k)}
                onDec={() => onDec(k)}
              />
            </React.Fragment>
          ))}
        </div>

        {/* 6 — reset link */}
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button
            onClick={onReset}
            disabled={sumSpent === 0}
            style={{
              all: 'unset',
              cursor: sumSpent === 0 ? 'default' : 'pointer',
              fontFamily: AXM.serif, fontStyle: 'italic',
              fontSize: 12, color: AXM.bone,
              opacity: sumSpent === 0 ? 0.3 : 1,
              letterSpacing: '0.02em',
            }}
          >↺ reset</button>
        </div>

        <div style={{ flex: 1, minHeight: 4 }} />

        {/* 7 — action pair */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8,
          alignItems: 'center',
        }}>
          <CommitBtn fullyAllocated={fullyAllocated} onClick={onConfirm} />
          <button
            onClick={onCancel}
            style={{
              all: 'unset', cursor: 'pointer',
              textAlign: 'center',
              padding: '10px 0',
              fontFamily: AXM.serif, fontStyle: 'italic',
              fontSize: 13, color: AXM.bone,
              letterSpacing: '0.02em',
            }}
          >keep deliberating</button>
        </div>

        {/* helper line — only when not full */}
        {!fullyAllocated && (
          <div className="axm-eyebrow" style={{
            color: AXM.bone, fontSize: 9, marginTop: 6, textAlign: 'center',
            letterSpacing: '0.2em', opacity: 0.7,
          }}>
            allocate all points to commit
          </div>
        )}
      </div>

      {/* 8 — promise line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
        borderTop: `1px solid ${AXM.ash}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: AXM.sans, fontSize: 9, color: AXM.bone, letterSpacing: '0.22em',
      }}>the chronicle records each change.</div>

      {/* discard inset — slides over lower third when active */}
      {showDiscard && (
        <DiscardInset
          spent={discardSpent || sumSpent}
          total={totalPoints}
          onStepBack={onCancel}
          onStay={() => {}}
        />
      )}
    </div>
  );
}

// ── modal pieces ──────────────────────────────────────────────────────────

function PointsStrip({ remaining, total, fullyAllocated }) {
  return (
    <div style={{ position: 'relative', marginTop: 14 }}>
      <div style={{
        position: 'relative',
        height: 28,
        background: AXM.panelBg,
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        clipPath: tornEdge({ width: 354, height: 28, jag: 3, seed: 401 }),
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: `inset 0 0 0 ${fullyAllocated ? 2 : 1}px ${AXM.sulfur}${fullyAllocated ? '' : '55'}`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'relative', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
        }}>
          <div className="axm-eyebrow" style={{ color: AXM.sulfur, fontSize: 9 }}>
            POINTS REMAINING
          </div>
          <div style={{
            fontFamily: AXM.mono, fontSize: 18, lineHeight: 1,
            color: AXM.sulfur,
            fontVariantNumeric: 'tabular-nums',
            textShadow: fullyAllocated ? `0 0 8px ${AXM.sulfur}aa, 0 0 2px ${AXM.sulfur}` : 'none',
            transition: 'text-shadow 200ms',
          }}>
            {remaining} <span style={{ color: AXM.bone, fontSize: 12 }}>/ {total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StanceRow({
  stance, current, spent, derivedBefore, derivedAfter,
  canInc, canDec, onInc, onDec,
}) {
  const label = stance.toUpperCase();
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '80px 1fr 44px 56px',
      gap: 6, alignItems: 'center',
      padding: '8px 0', minHeight: 88,
    }}>
      {/* emblem column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 56, height: 56,
          border: `1px solid ${AXM.parchment}`,
          background: AXM.panelBg,
          backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StanceGlyph kind={stance} size={40} color={AXM.parchment} />
        </div>
        <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>{label}</div>
      </div>

      {/* numeric counter */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        position: 'relative', paddingLeft: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: AXM.gothic, fontSize: 44, color: AXM.sulfur,
            lineHeight: 0.9, letterSpacing: 0.5,
            fontVariantNumeric: 'tabular-nums',
          }}>{current + spent}</span>
          <span style={{
            fontFamily: AXM.mono, fontSize: 8, color: AXM.bone,
            opacity: 0.7, lineHeight: 1,
          }}>from {current}</span>
        </div>
        {spent > 0 ? (
          <div style={{
            fontFamily: AXM.mono, fontSize: 11, color: AXM.parchment, opacity: 0.5,
            marginTop: 2, letterSpacing: 0.5,
          }}>+{spent}</div>
        ) : (
          <div style={{
            width: 24, height: 1, background: AXM.sulfur, marginTop: 5,
            opacity: 0.55,
          }} />
        )}
      </div>

      {/* ± stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StepBtn variant="plus"  enabled={canInc} onClick={onInc} />
        <StepBtn variant="minus" enabled={canDec} onClick={onDec} />
      </div>

      {/* derived-preview ribbon */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 3,
        paddingLeft: 4,
        borderLeft: `1px solid ${AXM.ash}`,
      }}>
        <DeltaRow label="ATK" before={derivedBefore.attack}  after={derivedAfter.attack}  />
        <DeltaRow label="SKL" before={derivedBefore.skill}   after={derivedAfter.skill}   />
        <DeltaRow label="DEF" before={derivedBefore.defense} after={derivedAfter.defense} />
      </div>
    </div>
  );
}

function DeltaRow({ label, before, after }) {
  const changed = after !== before;
  const c = changed ? AXM.sulfur : AXM.bone;
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 3,
      fontFamily: AXM.mono, fontSize: 9, color: c,
      lineHeight: 1, height: 12,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ color: AXM.bone, letterSpacing: 0.5, fontSize: 8 }}>{label}</span>
      <span style={{ color: c }}>·</span>
      <span style={{ color: c, fontWeight: changed ? 500 : 400 }}>{after}</span>
      {changed && (
        <span style={{ color: AXM.sulfur, fontSize: 8, opacity: 0.9 }}>+{after - before}</span>
      )}
    </div>
  );
}

function StepBtn({ variant, enabled, onClick, pressed = false }) {
  const isPlus = variant === 'plus';
  const glyph = isPlus ? '+' : '−';
  const baseColor = isPlus
    ? (enabled ? AXM.sulfur : AXM.ash)
    : (enabled ? AXM.bone : AXM.ash);
  const borderStyle = isPlus
    ? `1px solid ${enabled ? AXM.parchment : AXM.ash}`
    : `1px dashed ${enabled ? AXM.ash : AXM.ash}`;
  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      style={{
        all: 'unset',
        cursor: enabled ? 'pointer' : 'default',
        width: 36, height: 36,
        boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: pressed ? 'rgba(212,192,38,0.10)' : AXM.panelBg,
        border: pressed && enabled ? `1px solid ${AXM.sulfur}` : borderStyle,
        fontFamily: AXM.gothic, fontSize: 22,
        color: baseColor, lineHeight: 1,
        opacity: enabled ? 1 : 0.6,
      }}
    >{glyph}</button>
  );
}

function CommitBtn({ fullyAllocated, onClick }) {
  if (!fullyAllocated) {
    return (
      <div style={{
        position: 'relative',
        textAlign: 'center', padding: '12px 0',
        border: `1px solid ${AXM.ash}`,
        background: '#0a0807',
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        color: AXM.bone, opacity: 0.85,
        fontFamily: AXM.gothic, fontSize: 16, letterSpacing: 2,
        cursor: 'default',
      }}>✠ COMMIT</div>
    );
  }
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', display: 'block',
      position: 'relative', textAlign: 'center', padding: '12px 0',
      background: '#0a0807',
      backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
      border: `2px solid ${AXM.parchment}`,
      color: AXM.parchment,
      fontFamily: AXM.gothic, fontSize: 16, letterSpacing: 2,
    }}>
      ✠ COMMIT
      <div style={{
        position: 'absolute', left: 6, right: 6, bottom: 3, height: 1,
        background: AXM.sulfur, opacity: 0.85,
      }} />
    </button>
  );
}

// ── discard-confirm inset ─────────────────────────────────────────────────
function DiscardInset({ spent, total, onStepBack, onStay }) {
  return (
    <>
      {/* underlying-modal scrim — softens what's beneath */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(6,5,10,0.55)',
        backdropFilter: 'blur(1.2px)',
        pointerEvents: 'auto',
      }} />
      {/* inset */}
      <div style={{
        position: 'absolute',
        left: 22, right: 22, bottom: 110,
        background: AXM.panelBg,
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        clipPath: tornEdge({ width: 346, height: 200, jag: 5, seed: 511, sides: ['top', 'bottom'] }),
        padding: '20px 22px 22px',
        boxShadow: `inset 0 0 0 1px ${AXM.parchment}, 0 0 0 1px ${AXM.sulfur}55`,
      }}>
        <div className="axm-caption" style={{ color: AXM.blood, fontSize: 11, letterSpacing: '0.18em' }}>
          ✠ THE INK IS STILL WET
        </div>

        <div className="axm-bodyit" style={{
          color: AXM.parchment, fontSize: 13, lineHeight: 1.4,
          marginTop: 10, textWrap: 'pretty',
        }}>
          “you have spent {spent} of {total} points but not sealed the page.
          step back, and the marks fade.”
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={onStepBack} style={{
            all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center',
            padding: '10px 0',
            border: `1px solid ${AXM.parchment}`,
            background: '#0a0807',
            backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            color: AXM.parchment,
            fontFamily: AXM.gothic, fontSize: 14, letterSpacing: 2,
          }}>✠ STEP BACK</button>
          <button onClick={onStay} style={{
            all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center',
            padding: '8px 0',
            fontFamily: AXM.serif, fontStyle: 'italic',
            fontSize: 12, color: AXM.bone, letterSpacing: '0.02em',
          }}>stay on the page</button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Demo — five artboards on a single canvas at 390×844 each.
// ─────────────────────────────────────────────────────────────────────────
function LevelUpDemo() {
  const Frame = ({ title, sub, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 10 }}>{title}</div>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{
        position: 'relative', width: 390, height: 844,
        background: '#000', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }} className="axm">
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: PAPER_URI,
          backgroundSize: '320px 320px',
          color: AXM.parchment,
          fontFamily: 'var(--f-serif)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );

  // SELF-tab body stub — shows the BASE row beneath the header so the
  // in-tab button reads in its real context (not floating in a void).
  const SelfStub = () => (
    <div style={{ padding: '12px 14px 0' }}>
      <SectionLabel size={10}>✠ BASE</SectionLabel>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {[['heart', 11], ['body', 13], ['mind', 9]].map(([k, v], i) => (
          <div key={k} style={{
            flex: 1, padding: '8px 6px',
            background: AXM.panelBg, backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `1px solid ${AXM.ash}`, textAlign: 'center',
            clipPath: tornEdge({ width: 110, height: 88, jag: 3, seed: 130 + i }),
          }}>
            <StanceGlyph kind={k} size={28} color={AXM.parchment} />
            <div style={{ fontFamily: AXM.sans, fontSize: 10, letterSpacing: 2, color: AXM.bone, marginTop: 2 }}>
              {k.toUpperCase()}
            </div>
            <div style={{ fontFamily: AXM.gothic, fontSize: 28, color: AXM.sulfur, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <SectionLabel size={10}>✠ DERIVED</SectionLabel>
        <div style={{
          marginTop: 4,
          background: AXM.panelBg, backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
          border: `1px solid ${AXM.ash}`, padding: '6px 8px',
          fontFamily: AXM.mono, fontSize: 10, color: AXM.bone,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', letterSpacing: 1, paddingBottom: 3, borderBottom: `1px dashed ${AXM.ash}` }}>
            <span></span><span style={{ textAlign: 'right' }}>ATK</span><span style={{ textAlign: 'right' }}>SKL</span><span style={{ textAlign: 'right' }}>DEF</span>
          </div>
          {[['HEART', 11, 9, 6], ['BODY', 13, 7, 10], ['MIND', 8, 14, 8]].map(r => (
            <div key={r[0]} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
              fontFamily: AXM.gothic, fontSize: 14, color: AXM.parchment,
              padding: '3px 0', borderBottom: `1px solid #1a1814`,
            }}>
              <span style={{ fontFamily: AXM.sans, fontSize: 11, color: AXM.parchment, letterSpacing: 1.5, alignSelf: 'center' }}>{r[0]}</span>
              <span style={{ textAlign: 'right' }}>{r[1]}</span>
              <span style={{ textAlign: 'right' }}>{r[2]}</span>
              <span style={{ textAlign: 'right' }}>{r[3]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', gap: 28, padding: 24, alignItems: 'flex-start',
      background: '#1a1815', minHeight: '100vh',
      fontFamily: 'var(--f-serif)',
      overflowX: 'auto',
    }}>
      {/* a — header silent */}
      <Frame title="a · SELF · UNARMED" sub="pendingPoints === 0 — header reads as it does today">
        <SelfTabHeaderWithLevelUp
          characterName="GRIEF-FOR-NO-ONE"
          subtitle="KNOTWORK · INITIATE"
          level={7}
          xp={84}
          xpMax={120}
          pendingPoints={0}
        />
        <SelfStub />
      </Frame>

      {/* b — header armed (3 pts) */}
      <Frame title="b · SELF · ASCENSION AVAILABLE" sub="pendingPoints === 3 — pulsing sulfur seal, ↑↑↑ row">
        <SelfTabHeaderWithLevelUp
          characterName="GRIEF-FOR-NO-ONE"
          subtitle="KNOTWORK · INITIATE"
          level={7}
          xp={120}
          xpMax={120}
          pendingPoints={3}
        />
        <SelfStub />
      </Frame>

      {/* c — modal mid-allocation (1 of 3 spent on HEART) */}
      <Frame title="c · LEDGER · 1 / 3 SPENT" sub="HEART +1 pending — sulfur deltas in HEART row only">
        <LevelUpModal
          characterName="GRIEF-FOR-NO-ONE"
          fromLevel={7}
          toLevel={8}
          totalPoints={3}
          spent={{ heart: 1, body: 0, mind: 0 }}
          current={{ heart: 11, body: 13, mind: 9 }}
          flavor="the body that survives is not the body that arrived."
        />
      </Frame>

      {/* d — modal fully allocated */}
      <Frame title="d · LEDGER · FULL · COMMIT WAKES" sub="all 3 spent across HEART/BODY/MIND · sulfur underline on commit">
        <LevelUpModal
          characterName="GRIEF-FOR-NO-ONE"
          fromLevel={7}
          toLevel={8}
          totalPoints={3}
          spent={{ heart: 1, body: 1, mind: 1 }}
          current={{ heart: 11, body: 13, mind: 9 }}
          flavor="something in the marrow learned its own name."
        />
      </Frame>

      {/* e — discard-confirm inset on top of partial allocation */}
      <Frame title="e · LEDGER · DISCARD INSET" sub="back-gesture caught mid-allocation · ink is still wet">
        <LevelUpModal
          characterName="GRIEF-FOR-NO-ONE"
          fromLevel={7}
          toLevel={8}
          totalPoints={3}
          spent={{ heart: 1, body: 1, mind: 0 }}
          current={{ heart: 11, body: 13, mind: 9 }}
          flavor="the page turned itself."
          showDiscard={true}
        />
      </Frame>
    </div>
  );
}

// ─── Drop on window ─────────────────────────────────────────────────────
window.SelfTabHeaderWithLevelUp = SelfTabHeaderWithLevelUp;
window.LevelUpModal = LevelUpModal;
window.LevelUpDemo  = LevelUpDemo;
window.LockSeal     = LockSeal;
