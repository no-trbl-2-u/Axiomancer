// Token system — replaces MP. Five resource types accumulated in combat
// (body / mind / heart / fallacy / paradox). Skills require combinations.
//
// Engine mapping: engine `Skill.resourceCost` is `{body?, mind?, heart?,
// fallacy?, paradox?}` (axiomancer-mechanics 0.6.x Skill type). This UI
// surfaces each entry as a chip instead of summing to a single MP cost.

// ─── palette ───
const TOKEN = {
  body:    { color: '#c0152a', bg: '#1a0808', label: 'BODY',    short: 'BDY' },
  mind:    { color: '#6b8eb0', bg: '#0b1018', label: 'MIND',    short: 'MND' },
  heart:   { color: '#9e3a1a', bg: '#1a0d08', label: 'HEART',   short: 'HRT' },
  fallacy: { color: '#e8dfc8', bg: '#16140e', label: 'FALLACY', short: 'FAL' },
  paradox: { color: '#d4c026', bg: '#16140a', label: 'PARADOX', short: 'PDX' },
};
const TOKEN_KEYS = ['body', 'mind', 'heart', 'fallacy', 'paradox'];

// ─── tiny woodcut glyphs ───
function TokenIcon({ kind, size = 16, color }) {
  const c = color ?? TOKEN[kind].color;
  const s = { width: size, height: size, display: 'block' };
  switch (kind) {
    case 'body': // clenched fist — three knuckles
      return (
        <svg viewBox="0 0 16 16" style={s} fill="none" stroke={c} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
          <path d="M3 7 C 3 5, 5 4, 7 4 L 12 4 C 13 4, 13.5 5, 13.5 6 L 13.5 10 C 13.5 12, 12 13, 10 13 L 6 13 C 4 13, 3 12, 3 10.5 Z" fill={c} fillOpacity="0.25"/>
          <path d="M5.5 6 V 4.8 M 8 6 V 4.8 M 10.5 6 V 4.8 M 13 6 V 4.8"/>
          <path d="M3 8.5 H 13.5"/>
        </svg>
      );
    case 'mind': // open eye
      return (
        <svg viewBox="0 0 16 16" style={s} fill="none" stroke={c} strokeWidth="1.3" strokeLinejoin="round">
          <path d="M1.5 8 C 4 4, 12 4, 14.5 8 C 12 12, 4 12, 1.5 8 Z" fill={c} fillOpacity="0.18"/>
          <circle cx="8" cy="8" r="2.3" fill={c} />
          <circle cx="8.7" cy="7.4" r="0.6" fill="#0a0a0a" />
        </svg>
      );
    case 'heart': // small heart, hatched
      return (
        <svg viewBox="0 0 16 16" style={s} fill={c} stroke={c} strokeWidth="0.8" strokeLinejoin="round">
          <path d="M8 13.5 C 2.5 9.5, 1.5 6, 3 4 C 5 2, 7 3, 8 5 C 9 3, 11 2, 13 4 C 14.5 6, 13.5 9.5, 8 13.5 Z" />
          <path d="M5 5 L 7 7 M 11 5 L 9 7" stroke="#0a0a0a" strokeWidth="0.8" opacity="0.6"/>
        </svg>
      );
    case 'fallacy': // crooked argument — broken X / serpent
      return (
        <svg viewBox="0 0 16 16" style={s} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" stroke={c} strokeWidth="1" strokeDasharray="1.5 1.2" fill="none"/>
          <path d="M4 4 L 12 12 M 12 4 L 9 7 M 4 12 L 7 9" />
        </svg>
      );
    case 'paradox': // ouroboros / infinity
      return (
        <svg viewBox="0 0 16 16" style={s} fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8 C 3 6, 4.5 4.5, 6 4.5 C 7.5 4.5, 8 6, 8 8 C 8 10, 8.5 11.5, 10 11.5 C 11.5 11.5, 13 10, 13 8 C 13 6, 11.5 4.5, 10 4.5 C 8.5 4.5, 8 6, 8 8 C 8 10, 7.5 11.5, 6 11.5 C 4.5 11.5, 3 10, 3 8 Z" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── single chip showing token type with a count ───
// kept small enough to put 5 in a row inside a phone
function TokenChip({ kind, count = 0, max = 9, dim = false, glow = false, compact = false }) {
  const t = TOKEN[kind];
  const has = count > 0;
  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: compact ? '3px 4px 2px' : '4px 5px 3px',
      minWidth: compact ? 36 : 44,
      background: has ? t.bg : '#0a0a0a',
      backgroundImage: has ? NOISE_URI : 'none',
      backgroundBlendMode: 'multiply',
      border: `1px solid ${has ? t.color : AXM.ash}`,
      opacity: dim ? 0.4 : 1,
      boxShadow: glow ? `0 0 0 1px ${t.color}, 0 0 8px ${t.color}` : 'none',
      transition: 'box-shadow 120ms',
    }}>
      <TokenIcon kind={kind} size={compact ? 14 : 16} color={has ? t.color : AXM.bone} />
      <span style={{
        fontFamily: AXM.gothic, fontSize: compact ? 13 : 16, lineHeight: 1,
        color: has ? t.color : AXM.bone, marginTop: 1,
      }}>{count}</span>
      <span style={{
        fontFamily: AXM.mono, fontSize: 6, letterSpacing: 1,
        color: has ? t.color : AXM.bone, opacity: 0.75, marginTop: 1,
      }}>{t.short}</span>
    </div>
  );
}

// ─── token rack — replaces MP bar. Always visible in combat. ───
// Tracker for current pool. Hover/tap a chip to highlight skills that need it.
function TokenRack({ tokens = {}, highlightKind = null, compact = false }) {
  return (
    <div style={{
      display: 'flex', gap: compact ? 3 : 4,
      padding: compact ? '2px' : '4px 4px',
      background: '#06050a',
      backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
      border: `1px solid ${AXM.ash}`,
      borderLeft: `2px solid ${AXM.sulfur}`,
    }}>
      {!compact && (
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          paddingRight: 4, borderRight: `1px dashed ${AXM.ash}`,
        }}>
          <SectionLabel size={8} style={{ color: AXM.bone, letterSpacing: 1.5 }}>⚱</SectionLabel>
          <SectionLabel size={7} style={{ color: AXM.bone, letterSpacing: 1, transform: 'rotate(0)' }}>POOL</SectionLabel>
        </div>
      )}
      {TOKEN_KEYS.map(k => (
        <TokenChip
          key={k}
          kind={k}
          count={tokens[k] ?? 0}
          glow={highlightKind === k && (tokens[k] ?? 0) > 0}
          compact={compact}
        />
      ))}
    </div>
  );
}

// ─── per-skill cost display: a stack of small chips (1 per token req'd) ───
// e.g. { body: 1, fallacy: 1 } renders two tiny pips: a body pip + a fallacy pip.
function TokenCost({ cost = {}, tokens = {}, size = 14, dense = false }) {
  // expand into a flat list with multiplicity. tier-1 skills mostly have
  // 1 of one kind; tier-2 have 2 of different kinds; tier-3 mix three.
  const entries = TOKEN_KEYS.flatMap(k => Array.from({ length: cost[k] || 0 }, () => k));
  if (entries.length === 0) {
    return (
      <span style={{
        fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1,
      }}>FREE</span>
    );
  }
  // count how many of each we still owe so we can mark which pips lack the token
  const owed = { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 };
  const lacks = entries.map(k => {
    owed[k] += 1;
    return (tokens[k] ?? 0) < owed[k];
  });
  return (
    <div style={{ display: 'flex', gap: dense ? 2 : 3, alignItems: 'center' }}>
      {entries.map((k, i) => {
        const c = TOKEN[k];
        const missing = lacks[i];
        return (
          <div key={i} style={{
            width: size, height: size,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: missing ? 'transparent' : c.bg,
            border: `1px ${missing ? 'dashed' : 'solid'} ${c.color}`,
            opacity: missing ? 0.45 : 1,
          }}>
            <TokenIcon kind={k} size={size - 6} color={c.color} />
          </div>
        );
      })}
    </div>
  );
}

// ─── helper: does the player have enough tokens? ───
function canAfford(cost = {}, tokens = {}) {
  for (const k of TOKEN_KEYS) {
    if ((cost[k] || 0) > (tokens[k] || 0)) return false;
  }
  return true;
}

// ─── 12-skill engine library (mirrors axiomancer-mechanics@0.6 skillLibrary
// shape — 4 per stance, 6 fallacy / 6 paradox, tier-1/2/3) ───
const TOKEN_SKILLS = [
  // ── HEART (4) ──
  { id: 'appeal-to-pity',    name: 'APPEAL TO PITY',    cat: 'fallacy', stance: 'heart', tier: 1, cost: { heart: 1 },                            desc: 'Sway with sorrow. Foe holds blow if charmed.' },
  { id: 'ad-hominem-strike', name: 'AD HOMINEM',        cat: 'fallacy', stance: 'heart', tier: 2, cost: { heart: 1, fallacy: 1 },                desc: 'Strike the speaker. +2 dmg if foe wounded.' },
  { id: 'ship-of-theseus',   name: 'OF THESEUS',        cat: 'paradox', stance: 'heart', tier: 2, cost: { heart: 1, paradox: 1 },                desc: 'Replace foe limb. Disarm 2 rounds.' },
  { id: 'bootstrap-paradox', name: 'BOOTSTRAP',         cat: 'paradox', stance: 'heart', tier: 3, cost: { heart: 1, paradox: 2 },                desc: 'Pull tomorrow into now. Reroll the round.' },
  // ── BODY (4) ──
  { id: 'straw-man',         name: 'STRAW MAN',         cat: 'fallacy', stance: 'body', tier: 1, cost: { body: 1 },                              desc: 'Conjure decoy. Absorb next blow.' },
  { id: 'no-true-scotsman',  name: 'NO TRUE SCOT',      cat: 'fallacy', stance: 'body', tier: 2, cost: { body: 1, fallacy: 1 },                  desc: 'Reframe the wound — heal 4 by denial.' },
  { id: 'zenos-blade',       name: "ZENO'S BLADE",      cat: 'paradox', stance: 'body', tier: 2, cost: { body: 1, paradox: 1 },                  desc: 'Halve distance forever. Pierce.' },
  { id: 'grandfather',       name: 'GRANDFATHER',       cat: 'paradox', stance: 'body', tier: 3, cost: { body: 2, paradox: 1 },                  desc: 'Undo foe ancestor. –10 max HP.' },
  // ── MIND (4) ──
  { id: 'circular-logic',    name: 'CIRCULAR LOGIC',    cat: 'fallacy', stance: 'mind', tier: 1, cost: { mind: 1 },                              desc: 'Foe loses next action. Costs 1 HP.' },
  { id: 'sorites-cascade',   name: 'SORITES HEAP',      cat: 'paradox', stance: 'mind', tier: 2, cost: { mind: 1, paradox: 1 },                  desc: 'Wear foe down. +1 stack each round.' },
  { id: 'gamblers-fallacy',  name: "GAMBLER'S",         cat: 'fallacy', stance: 'mind', tier: 2, cost: { mind: 1, fallacy: 1 },                  desc: 'Force a re-roll on foe — keep worse.' },
  { id: 'eternal-regress',   name: 'ETERNAL REGRESS',   cat: 'paradox', stance: 'mind', tier: 3, cost: { mind: 2, paradox: 1, fallacy: 1 },      desc: 'Foe argues itself to dust. 3 turns, ramp.' },
];

// ─── how tokens are generated. canonical rules — surfaces in the Crucible
// artboard and the in-combat tooltip. matches the implied design
// (engine doesn't ship the rules yet — these are the proposal).
const TOKEN_RULES = [
  ['body',    'Each round you END in BODY stance', '+1'],
  ['mind',    'Each round you END in MIND stance', '+1'],
  ['heart',   'Each round you END in HEART stance', '+1'],
  ['fallacy', 'Win a round with ADVANTAGE',         '+1'],
  ['paradox', 'Suffer a hit AND survive',           '+1'],
  ['body',    'Land a crit while in BODY stance',   '+1'],
  ['mind',    'Mark a foe via MIND setup action',   '+1'],
  ['heart',   'Choose dialogue over violence',      '+1'],
  ['fallacy', 'Successfully cast any fallacy',      '+1 (banked)'],
  ['paradox', 'Successfully cast any paradox',      '+1 (banked)'],
];

// ─── Token Crucible — the standalone tracker / explainer artboard. ───
// Shows: the live pool, all 5 token rules, every skill's cost grid, the
// quick-cast highlight band. Lives outside the phone — a deeper UI surface
// for understanding the system.
function TokenCrucible({ tokens = { body: 2, mind: 1, heart: 2, fallacy: 1, paradox: 1 } }) {
  // for each skill, work out which tokens are missing — counter for "if I
  // had +1 X I could cast Y" hints.
  const skillsByStance = { heart: [], body: [], mind: [] };
  TOKEN_SKILLS.forEach(s => { skillsByStance[s.stance].push(s); });

  return (
    <div style={{
      width: 720, padding: 22, background: AXM.bg, backgroundImage: PAPER_URI,
      color: AXM.parchment, fontFamily: AXM.serif,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <SectionLabel size={11}>✠ TOKEN CRUCIBLE — POOL OF RESOURCES</SectionLabel>
        <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 }}>
          replaces MP · engine: Skill.resourceCost
        </span>
      </div>
      <div style={{
        fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 12,
        color: AXM.bone, marginBottom: 14, lineHeight: 1.35, maxWidth: 600,
      }}>
        Five resources accrue during combat. Each skill demands a unique combination —
        not a single mana number — so the round you spend "earning your tokens" is part
        of the dance.
      </div>

      {/* CURRENT POOL — big chips */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <SectionLabel size={9} style={{ color: AXM.bone, marginBottom: 4 }}>CURRENT POOL</SectionLabel>
          <div style={{
            background: '#0a0a0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `1px solid ${AXM.ash}`, padding: '10px 12px',
            display: 'flex', gap: 8,
          }}>
            {TOKEN_KEYS.map(k => (
              <div key={k} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 6px 6px', minWidth: 70,
                  background: tokens[k] ? TOKEN[k].bg : '#0a0a0a',
                  border: `1.5px solid ${tokens[k] ? TOKEN[k].color : AXM.ash}`,
                }}>
                  <TokenIcon kind={k} size={28} color={tokens[k] ? TOKEN[k].color : AXM.bone} />
                  <div style={{
                    fontFamily: AXM.gothic, fontSize: 28, lineHeight: 1, marginTop: 2,
                    color: tokens[k] ? TOKEN[k].color : AXM.bone,
                    textShadow: tokens[k] ? `1px 1px 0 #000` : 'none',
                  }}>{tokens[k] ?? 0}</div>
                  <div style={{
                    fontFamily: AXM.sans, fontSize: 9, letterSpacing: 2,
                    color: tokens[k] ? TOKEN[k].color : AXM.bone, marginTop: 2,
                  }}>{TOKEN[k].label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RULES + SKILL GRID two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 14 }}>
        {/* RULES */}
        <div>
          <SectionLabel size={9} style={{ color: AXM.bone, marginBottom: 4 }}>HOW TOKENS ACCRUE</SectionLabel>
          <div style={{
            background: '#0a0a0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `1px solid ${AXM.ash}`, padding: '8px 10px',
          }}>
            {TOKEN_RULES.map((row, i) => {
              const [k, when, amt] = row;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '18px 1fr auto',
                  alignItems: 'center', gap: 6, padding: '4px 0',
                  borderBottom: i < TOKEN_RULES.length - 1 ? `1px dashed ${AXM.ash}` : 'none',
                }}>
                  <div style={{
                    width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: TOKEN[k].bg, border: `1px solid ${TOKEN[k].color}`,
                  }}>
                    <TokenIcon kind={k} size={10} color={TOKEN[k].color} />
                  </div>
                  <span style={{ fontFamily: AXM.serif, fontSize: 11, color: AXM.parchment, lineHeight: 1.25 }}>{when}</span>
                  <span style={{
                    fontFamily: AXM.mono, fontSize: 10, letterSpacing: 1,
                    color: TOKEN[k].color,
                  }}>{amt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SKILL GRID — every skill, cost displayed as pips */}
        <div>
          <SectionLabel size={9} style={{ color: AXM.bone, marginBottom: 4 }}>SKILL COSTS · 12 SKILLS</SectionLabel>
          <div style={{
            background: '#0a0a0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `1px solid ${AXM.ash}`, padding: '8px 10px',
          }}>
            {['heart', 'body', 'mind'].map(stance => (
              <div key={stance} style={{
                marginBottom: 8, paddingBottom: 6, borderBottom: stance === 'mind' ? 'none' : `1px dashed ${AXM.ash}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <StanceGlyph kind={stance} size={14} color={AXM.parchment} />
                  <SectionLabel size={9} style={{ color: AXM.parchment }}>{stance.toUpperCase()} STANCE</SectionLabel>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {skillsByStance[stance].map(s => {
                    const afford = canAfford(s.cost, tokens);
                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '3px 6px',
                        background: afford ? '#0d0a06' : 'transparent',
                        border: afford ? `1px solid ${AXM.sulfur}` : `1px solid ${AXM.ash}`,
                        opacity: afford ? 1 : 0.7,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            fontFamily: AXM.mono, fontSize: 7, color: AXM.bone, letterSpacing: 1,
                          }}>T{s.tier}</span>
                          <span style={{
                            fontFamily: AXM.gothic, fontSize: 11, lineHeight: 1,
                            color: afford ? AXM.sulfur : AXM.parchment,
                          }}>{s.name}</span>
                        </div>
                        <TokenCost cost={s.cost} tokens={tokens} size={11} dense />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 }}>LEGEND:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 14, background: TOKEN.body.bg, border: `1px solid ${AXM.sulfur}` }} />
          <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.parchment }}>OWNED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 14, background: 'transparent', border: `1px dashed ${AXM.bone}` }} />
          <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.parchment }}>OWED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 14, background: '#0d0a06', border: `1px solid ${AXM.sulfur}` }} />
          <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.parchment }}>SKILL CASTABLE NOW</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TOKEN, TOKEN_KEYS, TokenIcon, TokenChip, TokenRack, TokenCost,
  canAfford, TOKEN_SKILLS, TOKEN_RULES, TokenCrucible,
});
