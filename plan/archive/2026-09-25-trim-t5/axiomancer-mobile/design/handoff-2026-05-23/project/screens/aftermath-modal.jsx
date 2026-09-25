// screens/aftermath-modal.jsx
// ─────────────────────────────────────────────────────────────────────────
// Four post-combat / fallback artboards. All fill the 390 × 844 phone
// interior. NONE close on tap-outside — every modal owns its dismiss.
//
//   window.CombatVictoryModal      — the foe falls
//   window.CombatFriendshipModal   — the heart opens
//   window.CombatDefeatModal       — the page closes
//   window.ErrorScreen             — the binding tore
//
// Globals pulled in from axm-system.jsx:
//   AXM, NOISE_URI, PAPER_URI, Splatter, tornEdge,
//   SectionLabel, StanceGlyph, ActionIcon
// ─────────────────────────────────────────────────────────────────────────

// ── primitives ────────────────────────────────────────────────────────────

function IronRivet({ x, y, size = 8 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #6a625a 0%, #2a2520 60%, #0a0a0a 100%)',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 0 rgba(0,0,0,0.8)',
      border: '1px solid #0a0a0a', pointerEvents: 'none',
    }} />
  );
}

// page-frame backdrop common to every aftermath modal —
// covers the entire phone interior, swallows pointer events.
function Backdrop({ tint = '#06050a', children, hatch = false }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        width: 390, height: 844,
        background: tint,
        backgroundImage: NOISE_URI,
        backgroundBlendMode: 'multiply',
        display: 'flex', flexDirection: 'column',
        pointerEvents: 'auto',
        overflow: 'hidden',
        color: AXM.parchment,
        fontFamily: 'var(--f-serif)',
      }}
      className={hatch ? 'axm axm-hatch' : 'axm'}
    >{children}</div>
  );
}

// torn-edge panel with optional rivets + splatter slots
function TornBox({
  width, height, jag = 5, seed = 1, accent = AXM.ash,
  bg = '#0f0c08', children, rivets = false, style = {},
}) {
  return (
    <div style={{
      position: 'relative', width, height,
      background: bg,
      backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
      clipPath: tornEdge({ width, height, jag, seed }),
      ...style,
    }}>
      {/* inner hairline shadow — outline isn't possible inside clipPath, so
          we fake it with a slightly inset border via box-shadow */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: `inset 0 0 0 1px ${accent}`,
        pointerEvents: 'none',
      }} />
      {rivets && <>
        <IronRivet x={6} y={6} />
        <IronRivet x={width - 14} y={6} />
        <IronRivet x={6} y={height - 14} />
        <IronRivet x={width - 14} y={height - 14} />
      </>}
      {children}
    </div>
  );
}

// primary action — full-width gothic button, parchment border
function PrimaryBtn({ label, accent = AXM.parchment, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      display: 'block', width: '100%', textAlign: 'center',
      padding: '12px 0',
      background: '#0a0807',
      backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
      border: `2px solid ${accent}`,
      color: AXM.parchment,
      fontFamily: AXM.gothic, fontSize: 16, letterSpacing: 2,
    }}>{label}</button>
  );
}

// quiet ghost — bone italic, no border, lowercase
function GhostBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      display: 'block', textAlign: 'center',
      padding: '10px 0',
      fontFamily: AXM.serif, fontStyle: 'italic',
      fontSize: 13, color: AXM.bone,
      letterSpacing: '0.02em',
    }}>{label}</button>
  );
}

// reward column — number in mono-lg with a soft sulfur/rust shine.
function RewardCell({ label, value, tint = AXM.parchment, sub }) {
  return (
    <div style={{
      flex: 1, padding: '6px 4px 8px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div style={{
        fontFamily: AXM.mono, fontSize: 18, color: tint,
        letterSpacing: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        textShadow: tint === AXM.parchment ? 'none' : `0 0 6px ${tint}55`,
      }}>{value}</div>
      {sub && <div style={{
        fontFamily: AXM.mono, fontSize: 9, color: tint, opacity: 0.85,
        marginTop: 2, letterSpacing: 0.4,
      }}>{sub}</div>}
      <div style={{
        fontFamily: AXM.sans, fontSize: 9, letterSpacing: 2,
        color: AXM.bone, marginTop: 5,
      }}>{label}</div>
    </div>
  );
}

// small SVG glyph for loot rows — matches the primitive style of
// inventory.jsx :: ItemGlyph (woodcut, 2px stroke, no fill except hints).
function ItemGlyph({ slot, size = 18 }) {
  const c = AXM.parchment;
  const s = { width: size, height: size, display: 'block' };
  if (slot === 'weapon') return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
      <path d="M22 4 L28 4 L28 10 L13 25 L10 28 L4 28 L4 22 L7 19 Z" />
      <path d="M11 21 L15 25" />
    </svg>
  );
  if (slot === 'trinket' || slot === 'accessory') return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={c} strokeWidth="2">
      <circle cx="16" cy="18" r="8" />
      <circle cx="16" cy="18" r="3" fill={AXM.sulfur} stroke="none" />
      <path d="M16 4 L 18 10 L 14 10 Z" fill={c} stroke="none" />
    </svg>
  );
  if (slot === 'relic') return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
      <path d="M16 3 L21 8 L21 14 L26 16 L21 18 L21 24 L16 29 L11 24 L11 18 L6 16 L11 14 L11 8 Z" />
      <circle cx="16" cy="16" r="2.5" fill={c} stroke="none" />
    </svg>
  );
  if (slot === 'tome' || slot === 'scroll') return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
      <path d="M6 6 H26 V22 C26 25 24 27 21 27 H8 C5 27 3 25 3 22 V9 C3 7 5 5 6 6 Z" />
      <path d="M10 12 H22 M 10 16 H22 M 10 20 H18" />
    </svg>
  );
  if (slot === 'reagent' || slot === 'material') return (
    <svg viewBox="0 0 32 32" style={s} fill={c}>
      <circle cx="10" cy="14" r="3" /><circle cx="20" cy="10" r="2.5" />
      <circle cx="22" cy="20" r="3.5" /><circle cx="12" cy="22" r="2" />
    </svg>
  );
  // default — a notched bone fragment
  return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
      <path d="M8 6 L24 6 L26 12 L20 18 L24 28 L12 28 L8 22 L12 16 Z" />
    </svg>
  );
}

// rarity hairline rail on the right of a loot row
function RarityRail({ rarity }) {
  if (rarity === 'legendary') {
    return (
      <div style={{
        width: 28, height: 1, background: AXM.sulfur,
        boxShadow: `0 0 4px ${AXM.sulfur}88`,
      }} />
    );
  }
  if (rarity === 'rare') {
    return <div style={{ width: 28, height: 1, background: AXM.parchment }} />;
  }
  // common — dotted parchment
  return (
    <div style={{
      width: 28, height: 1,
      backgroundImage: `linear-gradient(to right, ${AXM.parchment} 50%, transparent 50%)`,
      backgroundSize: '4px 1px',
    }} />
  );
}

// roman numerals (mirrors shared.jsx :: roman)
function roman(n) {
  if (n <= 0) return '·';
  const map = [['m',1000],['cm',900],['d',500],['cd',400],['c',100],['xc',90],['l',50],['xl',40],['x',10],['ix',9],['v',5],['iv',4],['i',1]];
  let out = '';
  for (const [s, v] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// #1  CombatVictoryModal — the foe falls
// ─────────────────────────────────────────────────────────────────────────
function CombatVictoryModal({
  enemyName = 'THE HIEROPHANT',
  enemyEpithet = 'iron-tongued',
  finalBlow = { skillName: 'AXE-FALL', damage: 28, descriptor: 'cleaves the binding rib' },
  finalBlowPhrase = 'and the iron-tongued went down face-first into its own teeth.',
  rewards = {
    xp: 24,
    currency: { vitae: 6, sigils: 1 },
    loot: [
      { name: 'Iron-Tongue Shard', slot: 'relic',  rarity: 'rare' },
      { name: "Hierarch's Tooth",  slot: 'trinket', rarity: 'common' },
      { name: 'Binding-Rib',       slot: 'tome',   rarity: 'legendary' },
    ],
  },
  onContinue = () => {},
}) {
  const lootCount = rewards.loot?.length ?? 0;
  return (
    <Backdrop>
      {/* page-edge stamped chain — chronicle binder */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px',
        borderBottom: `1px solid ${AXM.ash}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.blood, letterSpacing: 2,
      }}>
        <span>✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠</span>
        <span style={{ color: AXM.bone }}>{roman(7)}.{roman(3)}</span>
      </div>

      <div style={{ flex: 1, padding: '26px 18px 14px', display: 'flex', flexDirection: 'column' }}>

        {/* eyebrow */}
        <div className="axm-caption" style={{ color: AXM.blood, fontSize: 11 }}>
          ✠ THE FOE FALLS
        </div>

        {/* title + epithet */}
        <div style={{ marginTop: 6 }}>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 30, lineHeight: 0.95,
            letterSpacing: 1, color: AXM.parchment,
          }}>{enemyName}</div>
          <div className="axm-bodyit" style={{
            color: AXM.bone, fontSize: 14, marginTop: 4,
          }}>— {enemyEpithet}</div>
        </div>

        {/* final blow torn panel */}
        <div style={{ position: 'relative', marginTop: 14 }}>
          <TornBox width={354} height={108} jag={5} seed={41}
            accent={AXM.blood} bg="#0f0a08">
            {/* sparing splatter */}
            <Splatter color={AXM.blood} size={120} seed={73} style={{
              position: 'absolute', top: -22, right: -22, opacity: 0.42,
              pointerEvents: 'none',
            }} />
            <Splatter color={AXM.blood} size={92} seed={91} style={{
              position: 'absolute', bottom: -28, left: -18, opacity: 0.30,
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', padding: '12px 14px 10px' }}>
              <div style={{
                fontFamily: AXM.mono, fontSize: 9, letterSpacing: 1.5,
                color: AXM.bone,
              }}>
                FINAL BLOW · <span style={{ color: AXM.parchment }}>{finalBlow.skillName}</span>
                {' · '}
                <span style={{ color: AXM.blood, fontFamily: AXM.mono }}>{finalBlow.damage}</span>
              </div>
              <div className="axm-bodyit" style={{
                color: AXM.parchment, fontSize: 14, lineHeight: 1.35,
                marginTop: 8, textWrap: 'pretty',
              }}>“{finalBlowPhrase}”</div>
              <div style={{
                fontFamily: AXM.mono, fontSize: 8, color: AXM.ash,
                letterSpacing: 1.4, marginTop: 8,
              }}>— {finalBlow.descriptor}</div>
            </div>
          </TornBox>
        </div>

        {/* reward strip */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          marginTop: 16,
          border: `1px solid ${AXM.ash}`,
          background: '#0a0807',
          backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        }}>
          <RewardCell label="EXPERIENCE" value={rewards.xp} tint={AXM.parchment} />
          <div className="axm-rule-v" />
          <RewardCell
            label="VITAE · SIGILS"
            value={`${rewards.currency.vitae}·${rewards.currency.sigils}`}
            tint={AXM.sulfur}
          />
          <div className="axm-rule-v" />
          <RewardCell label="LOOT" value={lootCount || '—'} tint={AXM.parchment}
            sub={lootCount > 0 ? `${roman(lootCount)} items` : null} />
        </div>

        {/* loot list */}
        <div style={{ marginTop: 14 }}>
          <SectionLabel size={9}>✠ SPOILS OF THE FELLED</SectionLabel>
          {lootCount === 0 ? (
            <div className="axm-bodyit" style={{
              color: AXM.bone, fontSize: 13, marginTop: 8, textAlign: 'center',
            }}>“no spoils. only quiet.”</div>
          ) : (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column' }}>
              {rewards.loot.map((it, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 8px',
                  borderTop: i === 0 ? `1px solid ${AXM.ash}` : 'none',
                  borderBottom: `1px solid ${AXM.ash}`,
                  background: i % 2 === 0 ? 'rgba(232,223,200,0.02)' : 'transparent',
                }}>
                  <div style={{
                    width: 22, height: 22, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ItemGlyph slot={it.slot} size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="axm-caption" style={{
                      color: AXM.parchment, fontSize: 12, letterSpacing: '0.08em',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{it.name}</div>
                    <div className="axm-eyebrow" style={{
                      color: AXM.bone, marginTop: 2, fontSize: 9,
                    }}>{it.slot.toUpperCase()}</div>
                  </div>
                  <RarityRail rarity={it.rarity} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 8 }} />

        {/* continue */}
        <PrimaryBtn label="✠ CARRY ON" accent={AXM.parchment} onClick={onContinue} />
      </div>

      {/* bottom binder */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 14,
        borderTop: `1px solid ${AXM.ash}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>chronicle · {roman(7)}.{roman(3)}</div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// #2  CombatFriendshipModal — the heart opens
// pixel-art emblem in the center — the ONLY pixel art in the whole app.
// ─────────────────────────────────────────────────────────────────────────

// 16×16 sprite. Chars:
//   .  transparent     r  heart blood (AXM.blood = #c0152a)
//   s  shadow #7a0d1c  h  highlight #fff5e0
//   p  hand parchment  *  sulfur sparkle
const PIXEL_HEART = [
  '............*...', // 0  — sparkle off upper-right
  '..rrr......rrr..', // 1
  '.rrrrr....rrrrr.', // 2
  'rrrrrrr..rrrrrrr', // 3
  'rhrrrrrrrrrrrrrr', // 4  — highlight at (1,4)
  'rrrrrrrrrrrrrrrs', // 5
  'rrpprrrrrrrppr.s', // 6  — forearm cuffs enter heart
  'rppppprrrrppppps', // 7  — wider forearms
  'rpppppppppppppps', // 8  — clasp
  'rrppppppppppppss', // 9  — shadow column
  '.rrrrrrrrrrrrss.', // 10
  '..rrrrrrrrrrss..', // 11
  '...rrrrrrrrss...', // 12
  '....rrrrrrss....', // 13
  '.....rrrrss.....', // 14
  '......rrss......', // 15
];

const PIX_COLORS = {
  r: AXM.blood,
  s: '#7a0d1c',
  h: '#fff5e0',
  p: AXM.parchment,
  '*': AXM.sulfur,
};

function PixelEmblem({ cell = 11 }) {
  const side = 16 * cell;
  return (
    <div style={{
      width: side + 16, padding: 8,
      border: `1px solid ${AXM.parchment}`,
      background: '#0a0807',
      backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
    }}>
      <svg
        width={side} height={side}
        viewBox={`0 0 ${side} ${side}`}
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        {PIXEL_HEART.map((row, y) =>
          row.split('').map((ch, x) => {
            if (ch === '.') return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x * cell} y={y * cell}
                width={cell} height={cell}
                fill={PIX_COLORS[ch]}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

function CombatFriendshipModal({
  formerFoeName = 'THE LARCH-STALKER',
  formerFoeEpithet = 'cold-of-tooth',
  pactPhrase = 'it set down the bell, slow, and laid its long face against the wet ground.',
  rewards = {
    xp: 18,
    currency: { vitae: 4, sigils: 0 },
    loot: [],
    journalEntry: {
      bookName: 'THE CODEX OF KEPT WORDS',
      entryTitle: 'On the Iron-Tongued',
      preview: 'It does not eat. It does not speak the river-name. It carries a bell that does not ring',
    },
  },
  onContinue = () => {},
}) {
  const lootCount = rewards.loot?.length ?? 0;
  return (
    <Backdrop>
      {/* top binder — rust register */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px',
        borderBottom: `1px solid ${AXM.ash}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.rust, letterSpacing: 2,
      }}>
        <span>❦ ❦ ❦ ❦ ❦ ❦ ❦ ❦ ❦ ❦</span>
        <span style={{ color: AXM.bone }}>{roman(7)}.{roman(4)}</span>
      </div>

      <div style={{ flex: 1, padding: '26px 18px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* eyebrow */}
        <div className="axm-caption" style={{ color: AXM.rust, fontSize: 11 }}>
          ❦ THE HEART OPENS
        </div>

        {/* title */}
        <div style={{ marginTop: 6 }}>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 28, lineHeight: 0.95,
            letterSpacing: 1, color: AXM.parchment,
          }}>{formerFoeName}</div>
          <div className="axm-bodyit" style={{
            color: AXM.bone, fontSize: 14, marginTop: 4,
          }}>— {formerFoeEpithet}</div>
        </div>

        {/* emblem */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginTop: 14, gap: 6,
        }}>
          <PixelEmblem cell={11} />
          <div className="axm-caption" style={{
            color: AXM.rust, fontSize: 10, marginTop: 2, letterSpacing: '0.22em',
          }}>❦ AN ACCORD</div>
        </div>

        {/* pact phrase */}
        <div className="axm-bodyit" style={{
          color: AXM.parchment, fontSize: 13, lineHeight: 1.4,
          marginTop: 10, textAlign: 'center', textWrap: 'pretty',
          padding: '0 8px',
        }}>“{pactPhrase}”</div>

        {/* reward strip — rust currency */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          marginTop: 14,
          border: `1px solid ${AXM.ash}`,
          background: '#0a0807',
          backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        }}>
          <RewardCell label="EXPERIENCE" value={rewards.xp} tint={AXM.parchment} />
          <div className="axm-rule-v" />
          <RewardCell
            label="VITAE · SIGILS"
            value={`${rewards.currency.vitae}·${rewards.currency.sigils}`}
            tint={AXM.rust}
          />
          <div className="axm-rule-v" />
          <RewardCell label="LOOT" value={lootCount || '—'} tint={AXM.parchment} />
        </div>

        {/* journal entry */}
        {rewards.journalEntry && (
          <div style={{ marginTop: 12 }}>
            <SectionLabel size={9} accent={AXM.rust}>✎ A NEW ENTRY</SectionLabel>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <TornBox width={354} height={92} jag={4} seed={205}
                accent={AXM.rust} bg={AXM.panelBg}>
                <div style={{ display: 'flex', padding: '10px 12px', gap: 12 }}>
                  {/* closed book glyph */}
                  <svg width="28" height="34" viewBox="0 0 28 34" style={{ flexShrink: 0 }}>
                    <path d="M4 3 L24 3 L24 31 L4 31 Z" fill="#0a0807" stroke={AXM.rust} strokeWidth="1.4"/>
                    <path d="M4 3 L4 31" stroke={AXM.rust} strokeWidth="2.5" />
                    <path d="M9 10 L 19 10 M 9 14 L 19 14 M 9 18 L 16 18" stroke={AXM.bone} strokeWidth="1"/>
                    <circle cx="20" cy="24" r="1.6" fill={AXM.rust} />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="axm-eyebrow" style={{
                      color: AXM.rust, fontSize: 9,
                    }}>{rewards.journalEntry.bookName}</div>
                    <div style={{
                      fontFamily: AXM.gothic, fontSize: 16, color: AXM.parchment,
                      letterSpacing: 0.5, lineHeight: 1.05, marginTop: 4,
                    }}>{rewards.journalEntry.entryTitle}</div>
                    <div className="axm-bodyit" style={{
                      color: AXM.bone, fontSize: 11, marginTop: 4, lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>“{rewards.journalEntry.preview}…”</div>
                  </div>
                </div>
              </TornBox>
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 8 }} />

        <PrimaryBtn label="❦ PART AS FRIENDS" accent={AXM.rust} onClick={onContinue} />
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 14,
        borderTop: `1px solid ${AXM.ash}`,
        fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>chronicle · {roman(7)}.{roman(4)}</div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// #3  CombatDefeatModal — the page closes
// More black. No splatter. Slow seep at the bottom edge.
// ─────────────────────────────────────────────────────────────────────────
function CombatDefeatModal({
  characterName = 'WORM-EATEN PILGRIM',
  cause = {
    killerName: 'THE HIEROPHANT',
    killerEpithet: 'iron-tongued',
    finalSkill: 'AXE-FALL',
    damage: 28,
  },
  causePhrase = 'And so the pilgrim laid down where it stood, while the hierophant\u2019s blade learned its ribs by name. The journey had been short. The journey had been kept.',
  run = { rounds: 4, encountersSurvived: 12, deepestNode: 'iii.b' },
  onRetry = () => {},
  onAbandon = () => {},
}) {
  return (
    <Backdrop tint="#040305">
      {/* spent wick — single hairline drop from very top */}
      <div style={{
        position: 'absolute', top: 28, left: '50%', width: 1, height: 80,
        background: `linear-gradient(to bottom, ${AXM.parchment}, ${AXM.ash} 60%, transparent)`,
      }} />
      {/* wick ember — extinguished */}
      <div style={{
        position: 'absolute', top: 26, left: 'calc(50% - 2px)', width: 4, height: 4,
        background: AXM.ash, borderRadius: 2,
      }} />

      <div style={{
        flex: 1, padding: '120px 24px 14px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* eyebrow */}
        <div className="axm-caption" style={{
          color: AXM.blood, fontSize: 11, textAlign: 'center',
        }}>✠ THE PAGE CLOSES</div>

        {/* character name */}
        <div style={{
          fontFamily: AXM.gothic, fontSize: 30, lineHeight: 0.95,
          letterSpacing: 1, color: AXM.parchment,
          textAlign: 'center', marginTop: 14,
        }}>{characterName}</div>

        {/* fell-to line */}
        <div className="axm-bodyit" style={{
          color: AXM.bone, fontSize: 13, marginTop: 8,
          textAlign: 'center',
        }}>
          fell to <span style={{ color: AXM.parchment }}>{cause.killerName}</span>
          {', '}<span style={{ fontStyle: 'italic' }}>{cause.killerEpithet}</span>
        </div>

        {/* one-line ledger of the killing blow, mono */}
        <div style={{
          fontFamily: AXM.mono, fontSize: 9, letterSpacing: 1.4,
          color: AXM.ash, marginTop: 6, textAlign: 'center',
        }}>
          {cause.finalSkill} · {cause.damage}
        </div>

        {/* chronicle paragraph */}
        <div className="axm-body axm-dropcap" style={{
          color: AXM.parchment, fontSize: 14, lineHeight: 1.55,
          marginTop: 22, textWrap: 'pretty',
        }}>{causePhrase}</div>

        {/* run summary ledger */}
        <div style={{
          marginTop: 'auto', marginBottom: 16,
          padding: '6px 0',
        }}>
          <SectionLabel size={9} dim>· LEDGER ·</SectionLabel>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column' }}>
            {[
              ['rounds endured',      roman(run.rounds)],
              ['encounters survived', roman(run.encountersSurvived)],
              ['deepest node',        run.deepestNode],
            ].map(([k, v], i) => (
              <div key={k} style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                alignItems: 'baseline', padding: '8px 2px',
                borderTop: `1px dotted ${AXM.ash}`,
              }}>
                <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12 }}>{k}</span>
                <span style={{
                  fontFamily: AXM.mono, fontSize: 14, color: AXM.parchment,
                  fontVariantNumeric: 'tabular-nums',
                }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px dotted ${AXM.ash}` }} />
          </div>
        </div>

        {/* actions — two side by side */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12,
          alignItems: 'center', position: 'relative', zIndex: 2,
        }}>
          <PrimaryBtn label="✠ BEGIN AGAIN" accent={AXM.parchment} onClick={onRetry} />
          <GhostBtn label="let the page close" onClick={onAbandon} />
        </div>
      </div>

      {/* blood seep — torn-edge clipped from beneath, ~80px tall */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
        background: `linear-gradient(to top, ${AXM.blood} 0%, rgba(192,21,42,0.55) 30%, transparent 80%)`,
        clipPath: tornEdge({ width: 390, height: 80, jag: 8, seed: 17, sides: ['top'] }),
        opacity: 0.78, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        clipPath: tornEdge({ width: 390, height: 80, jag: 8, seed: 17, sides: ['top'] }),
        opacity: 0.5, pointerEvents: 'none',
      }} />
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// #4  ErrorScreen — the binding tore
// Dev-facing fallback; stays in world. Heavy hatched diagonal.
// ─────────────────────────────────────────────────────────────────────────
function ErrorScreen({
  errorCode = 'E_BOUND_LOOSE',
  technical = "RuntimeError: cannot marshal node 0x4a — expected stance='body', found seal:empty.\n  at sealBinding (combat/seal.ts:188)\n  at resolveRound (combat/loop.ts:64)",
  hint = 'a brittle binding came apart in the press; the scribe is rebinding.',
  onCopy = () => {},
  onRetry = () => {},
  onReturnHome = () => {},
  copyPressed = false,
}) {
  return (
    <Backdrop tint={AXM.panelBg} hatch>
      {/* full-bleed hatch overlay (axm-hatch is on the Backdrop, but
          push intensity with a strong-hatch overlay too) */}
      <div className="axm-hatch-strong" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.8,
      }} />

      <div style={{
        position: 'relative', flex: 1,
        padding: '40px 20px 14px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* code marker — chapter style */}
        <div className="axm-eyebrow" style={{
          color: AXM.rust, fontSize: 10, textAlign: 'center',
        }}>{errorCode}</div>

        {/* title — illuminated gothic with blood drop-shadow */}
        <div style={{
          fontFamily: AXM.gothic, fontSize: 38, lineHeight: 1,
          letterSpacing: 1.5, color: AXM.parchment,
          textAlign: 'center', marginTop: 14,
          textShadow: `2.5px 2.5px 0 ${AXM.blood}, 5px 5px 0 #0a0a0a`,
        }}>THE BINDING TORE</div>

        {/* in-margin scribe note */}
        {hint && (
          <div className="axm-bodyit" style={{
            color: AXM.bone, fontSize: 13, lineHeight: 1.4,
            marginTop: 18, textAlign: 'center', textWrap: 'pretty',
            padding: '0 14px',
          }}>“{hint}”</div>
        )}

        {/* torn-edge inset panel — technical (the unspeakable part) */}
        <div style={{ position: 'relative', marginTop: 22 }}>
          <TornBox width={350} height={188} jag={5} seed={313}
            accent={AXM.ash} bg="#06050a">
            {/* COPY ghost button — top right */}
            <button
              onClick={onCopy}
              style={{
                all: 'unset', cursor: 'pointer',
                position: 'absolute', top: 8, right: 10, zIndex: 2,
                padding: '3px 8px',
                border: `1px solid ${copyPressed ? AXM.sulfur : AXM.ash}`,
                background: copyPressed ? 'rgba(212,192,38,0.10)' : 'rgba(0,0,0,0.4)',
                fontFamily: AXM.sans, fontSize: 9, letterSpacing: 2,
                color: copyPressed ? AXM.sulfur : AXM.bone,
                textShadow: copyPressed ? `0 0 4px ${AXM.sulfur}99` : 'none',
                transition: 'color 120ms, border-color 120ms',
              }}>
              ✎ {copyPressed ? 'COPIED' : 'COPY'}
            </button>

            <div style={{
              position: 'absolute', top: 8, left: 12,
              fontFamily: AXM.mono, fontSize: 8, color: AXM.ash,
              letterSpacing: 1.4,
            }}>— scribe's transcription —</div>

            <pre style={{
              margin: 0, padding: '32px 14px 12px',
              fontFamily: AXM.mono, fontSize: 10.5,
              color: 'rgba(232,223,200,0.62)',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxHeight: 144, overflow: 'hidden',
            }}>{technical}</pre>
          </TornBox>
        </div>

        <div style={{ flex: 1, minHeight: 14 }} />

        {/* actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <PrimaryBtn label="✠ TRY AGAIN" accent={AXM.parchment} onClick={onRetry} />
          <GhostBtn label="return to the hearth" onClick={onReturnHome} />
        </div>

        {/* the consolation */}
        <div className="axm-eyebrow" style={{
          color: AXM.bone, fontSize: 9, marginTop: 12, textAlign: 'center',
          letterSpacing: '0.18em',
        }}>
          the chronicle is incomplete — but not lost.
        </div>
      </div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Demo — mounts all four artboards side-by-side at 390×844 so they're
// previewable on the canvas. Includes the empty-loot and null-journal
// branches per the consistency checklist.
// ─────────────────────────────────────────────────────────────────────────
function AftermathDemo() {
  const Frame = ({ title, sub, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 10 }}>{title}</div>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{
        position: 'relative', width: 390, height: 844,
        background: '#000', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}>{children}</div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', gap: 28, padding: 24, alignItems: 'flex-start',
      background: '#1a1815', minHeight: '100vh',
      fontFamily: 'var(--f-serif)',
    }}>
      <Frame title="i · COMBAT VICTORY" sub="rewards · 3 loot · all rarities">
        <CombatVictoryModal />
      </Frame>

      <Frame title="ii · COMBAT FRIENDSHIP" sub="pixel emblem · journal entry present">
        <CombatFriendshipModal />
      </Frame>

      <Frame title="iii · COMBAT DEFEAT" sub="ledger · blood seep · two actions">
        <CombatDefeatModal />
      </Frame>

      <Frame title="iv · ERROR" sub="copy pressed-state shown">
        <ErrorScreen copyPressed={true} />
      </Frame>

      {/* branch variants — empty loot / null journal / fresh error */}
      <Frame title="i.b · VICTORY · NO SPOILS" sub="loot.length === 0 branch">
        <CombatVictoryModal
          enemyName="THE LISTENING CROW"
          enemyEpithet="patient as moss"
          finalBlow={{ skillName: 'QUIET STRIKE', damage: 11, descriptor: 'silenced beneath the cairn' }}
          finalBlowPhrase="the crow folded into itself, twice, the way a wet rag folds."
          rewards={{
            xp: 7,
            currency: { vitae: 1, sigils: 0 },
            loot: [],
          }}
        />
      </Frame>

      <Frame title="ii.b · FRIENDSHIP · NO ENTRY" sub="journalEntry === null branch">
        <CombatFriendshipModal
          formerFoeName="THE BELL-KEEPER"
          formerFoeEpithet="who counts the hours"
          pactPhrase="it held out the bell, mouth-down, so it would not sound."
          rewards={{
            xp: 9,
            currency: { vitae: 2, sigils: 0 },
            loot: [],
            journalEntry: null,
          }}
        />
      </Frame>
    </div>
  );
}

// ─── Drop on window ─────────────────────────────────────────────────────
window.CombatVictoryModal = CombatVictoryModal;
window.CombatFriendshipModal = CombatFriendshipModal;
window.CombatDefeatModal = CombatDefeatModal;
window.ErrorScreen = ErrorScreen;
window.AftermathDemo = AftermathDemo;
