/* screens-canonical.jsx — five canonical screen surfaces.
   ScreenWilds, ScreenStrife, ScreenSelf, ScreenSatchel, ScreenEvent, ScreenCrucible
   Each is a 390×800 (content area) component that drops into <PhoneFrame>. */

const { useState: useS, useMemo: useM } = React;

// ─────────────────────────────────────────────────────────────────────
// WILDS — Exploration
// Map at top, "next steps" drawer at bottom with one-tap blurb cards.
// Eyebrow: ✠ WHITHER, PILGRIM?
// ─────────────────────────────────────────────────────────────────────
function ScreenWilds({ variant = 'canonical' }) {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden' }}>
      {/* parchment header */}
      <div style={{ padding: '14px 20px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="axm-eyebrow" style={{ color: AXM.bone }}>✠ ASH MARCHES · DAY xii</span>
          <span className="axm-mono" style={{ color: AXM.bone, fontSize: 10 }}>{variant === 'rest' ? 'rested' : 'unrested'}</span>
        </div>
        <div style={{ marginTop: 4, fontFamily: 'var(--f-gothic)', fontSize: 24, lineHeight: 1, color: AXM.parchment, letterSpacing: '0.01em' }}>
          The Crow-Gate Wood
        </div>
      </div>

      {/* MAP CANVAS */}
      <div style={{
        margin: '4px 16px 0', height: 320,
        background: AXM.deepBg, position: 'relative', border: `1px solid ${AXM.ash}`,
      }} className="axm-hatch">
        <NodeGraph variant={variant} />
        {/* corner marginalia — compass + scale */}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <Compass />
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span className="axm-mono" style={{ color: AXM.bone, fontSize: 9 }}>I ─── III leagues</span>
          <div style={{ width: 60, height: 1, background: AXM.bone }} />
        </div>
        {/* current-position vow */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          padding: '3px 6px', background: AXM.bg, border: `1px solid ${AXM.ash}`,
        }}>
          <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 9 }}>HERE</span>
        </div>
      </div>

      {/* Drawer eyebrow */}
      <div style={{ padding: '14px 20px 8px' }}>
        <SectionLabel>WHITHER, PILGRIM?</SectionLabel>
      </div>

      {/* Step options */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <StepCard kind="encounter" title="A figure waits among the larches" hint="a stranger · likely strife" leagues="I" />
        <StepCard kind="rest"      title="A doused fire-ring, still warm"     hint="rest · mend"             leagues="I" muted />
        <StepCard kind="treasure"  title="An iron-bound chest, half-buried"   hint="loot · risk of trap"     leagues="II" muted />
      </div>
    </div>
  );
}

function Compass() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke={AXM.bone} strokeWidth="1"/>
      <path d="M16 5 L 18 16 L 16 27 L 14 16 Z" fill={AXM.parchment}/>
      <path d="M5 16 L 27 16 M 16 5 L 16 27" stroke={AXM.bone} strokeWidth="0.5"/>
      <text x="16" y="4" fontSize="5" fill={AXM.bone} textAnchor="middle" fontFamily="var(--f-mono)">N</text>
    </svg>
  );
}

function NodeGraph({ variant }) {
  // Node positions (within 358×320 canvas)
  const nodes = [
    { id: 'n0', x: 60,  y: 250, kind: 'rest',     state: 'completed' },
    { id: 'n1', x: 130, y: 200, kind: 'gather',   state: 'completed' },
    { id: 'n2', x: 175, y: 145, kind: 'current',  state: 'current' },
    { id: 'n3', x: 245, y: 100, kind: 'encounter',state: 'available' },
    { id: 'n4', x: 220, y: 200, kind: 'rest',     state: 'available' },
    { id: 'n5', x: 300, y: 180, kind: 'treasure', state: 'available' },
    { id: 'n6', x: 320, y: 60,  kind: 'boss',     state: 'locked' },
    { id: 'n7', x: 100, y: 80,  kind: 'quest',    state: 'consumed' },
  ];
  const edges = [
    ['n0','n1'], ['n1','n2'], ['n2','n3'], ['n2','n4'], ['n3','n5'], ['n4','n5'], ['n3','n6'], ['n1','n7'], ['n7','n3'],
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <svg width="358" height="320" viewBox="0 0 358 320" style={{ position: 'absolute', inset: 0 }}>
      {/* river */}
      <path d="M 0 280 Q 80 260 140 270 T 280 285 T 358 280" stroke={AXM.bone} strokeWidth="1" fill="none" opacity="0.4"/>
      {/* edges */}
      {edges.map(([a, b], i) => {
        const A = byId[a], B = byId[b];
        const dim = A.state === 'locked' || B.state === 'locked';
        const consumed = A.state === 'consumed' && B.state !== 'current';
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
          stroke={dim ? AXM.ash : (consumed ? AXM.bone : AXM.parchment)}
          strokeWidth={dim ? 1 : 1.2}
          strokeDasharray={dim ? "2 3" : null}
          opacity={dim ? 0.5 : 0.7}
        />;
      })}
      {/* nodes */}
      {nodes.map(n => <MapNode key={n.id} {...n} />)}
    </svg>
  );
}

function MapNode({ x, y, kind, state }) {
  const isCurrent = state === 'current';
  const locked = state === 'locked';
  const completed = state === 'completed' || state === 'consumed';

  const color = isCurrent ? AXM.sulfur
    : state === 'available' ? AXM.parchment
    : completed ? AXM.bone
    : AXM.ash;
  const r = isCurrent ? 11 : 8;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* halo for current */}
      {isCurrent && <circle r="18" stroke={AXM.sulfur} strokeWidth="0.8" opacity="0.5" fill="none"/>}
      {isCurrent && <circle r="14" stroke={AXM.sulfur} strokeWidth="0.6" opacity="0.3" fill="none"/>}
      {/* node ring */}
      <circle r={r} fill={AXM.bg} stroke={color} strokeWidth="1.5"/>
      {/* glyph by kind */}
      <NodeGlyph kind={kind} color={color} completed={completed} locked={locked}/>
      {/* completed slash */}
      {state === 'completed' && <line x1="-7" y1="7" x2="7" y2="-7" stroke={AXM.bone} strokeWidth="1"/>}
      {state === 'consumed' && <circle r="3" fill={AXM.ash}/>}
    </g>
  );
}

function NodeGlyph({ kind, color, completed, locked }) {
  if (kind === 'rest')      return <text y="3" textAnchor="middle" fontSize="9" fill={color} fontFamily="var(--f-gothic)">⌂</text>;
  if (kind === 'gather')    return <text y="3" textAnchor="middle" fontSize="9" fill={color}>✿</text>;
  if (kind === 'encounter') return <text y="3" textAnchor="middle" fontSize="9" fill={color} fontFamily="var(--f-mono)">✸</text>;
  if (kind === 'treasure')  return <text y="3" textAnchor="middle" fontSize="9" fill={color}>◇</text>;
  if (kind === 'boss')      return <text y="3" textAnchor="middle" fontSize="9" fill={color}>☠</text>;
  if (kind === 'quest')     return <text y="3" textAnchor="middle" fontSize="9" fill={color}>✠</text>;
  if (kind === 'current')   return <circle r="3" fill={color}/>;
  return null;
}

function StepCard({ kind, title, hint, leagues, muted = false }) {
  const accent = kind === 'encounter' ? AXM.blood : kind === 'treasure' ? AXM.sulfur : AXM.parchment;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 12px',
      background: AXM.panelBg, border: `1px solid ${muted ? AXM.ash : AXM.rule}`,
      borderLeft: `2px solid ${muted ? AXM.ash : accent}`,
      alignItems: 'center',
    }}>
      <div style={{
        width: 28, height: 28, border: `1px solid ${muted ? AXM.ash : AXM.bone}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: AXM.bg,
      }}>
        <NodeMarkSmall kind={kind} color={muted ? AXM.bone : accent}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="axm-body" style={{ color: muted ? AXM.dim : AXM.parchment, fontSize: 14, lineHeight: 1.2 }}>{title}</div>
        <div className="axm-caption" style={{ color: AXM.bone, fontSize: 9, marginTop: 3, letterSpacing: '0.16em' }}>{hint.toUpperCase()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span className="axm-mono" style={{ color: AXM.bone, fontSize: 9 }}>LEAGUES</span>
        <span className="axm-mono-lg" style={{ color: muted ? AXM.dim : AXM.parchment, fontSize: 18 }}>{leagues}</span>
      </div>
    </div>
  );
}

function NodeMarkSmall({ kind, color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      {kind === 'encounter' && <path d="M12 3 L 14 11 L 21 12 L 14 13 L 12 21 L 10 13 L 3 12 L 10 11 Z" fill={color}/>}
      {kind === 'rest' && <path d="M4 18 L 12 8 L 20 18 L 17 18 L 17 21 L 7 21 L 7 18 Z" stroke={color} strokeWidth="1.4" fill="none"/>}
      {kind === 'treasure' && <path d="M4 9 L 20 9 L 20 21 L 4 21 Z M 4 9 L 12 4 L 20 9 M 10 14 L 14 14" stroke={color} strokeWidth="1.4" fill="none"/>}
      {kind === 'gather' && <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.4" fill="none"/>}
      {kind === 'boss' && <path d="M6 5 L 18 5 L 16 11 L 18 11 L 18 16 L 6 16 L 6 11 L 8 11 Z M 9 8 L 11 8 M 13 8 L 15 8" stroke={color} strokeWidth="1.2" fill="none"/>}
      {kind === 'quest' && <path d="M12 3 L 12 21 M 5 6 L 19 6 M 5 18 L 19 18" stroke={color} strokeWidth="1.4"/>}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STRIFE — Combat
// Vertical phase stack with progressive collapse. Crucible inline strip
// above action picker. Roman numerals for rounds.
// ─────────────────────────────────────────────────────────────────────
function ScreenStrife({ phase = 'choosing_action', variant = 'canonical' }) {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top: enemy panel */}
      <EnemyPanel />
      {/* Round indicator (VS strip) */}
      <RoundStrip />
      {/* Phase stack */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 14px' }}>
        <PhaseStack current={phase} />
      </div>
      {/* HUD bottom */}
      <PlayerHUD />
    </div>
  );
}

function EnemyPanel() {
  return (
    <div style={{ padding: '10px 16px 6px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* enemy portrait — woodcut silhouette */}
        <div style={{
          width: 60, height: 72, background: AXM.deepBg,
          border: `1px solid ${AXM.ash}`, position: 'relative', flex: '0 0 60px',
        }} className="axm-hatch">
          <EnemyGlyph />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="axm-eyebrow" style={{ color: AXM.bone }}>WHAT WAITS</div>
          <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 20, color: AXM.parchment, lineHeight: 1, marginTop: 2 }}>The Larch-Stalker</div>
          <div style={{ marginTop: 6 }}>
            <StatBar value={42} max={70} color={AXM.blood} label="VITAE" valueLabel="xlii / lxx" />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            <EffectChip kind="bleed" label="BLEED" duration="ii" tone="debuff"/>
            <EffectChip kind="guard" label="WARDED" duration="i" tone="buff"/>
          </div>
        </div>
        {/* stance indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>STANDS</span>
          <StanceGlyph kind="body" size={28} color={AXM.parchment}/>
        </div>
      </div>
    </div>
  );
}

function EnemyGlyph() {
  // angular larch-stalker silhouette
  return (
    <svg width="60" height="72" viewBox="0 0 60 72" style={{ position: 'absolute', inset: 0 }}>
      <path d="M30 6 L 24 16 L 26 22 L 18 28 L 20 38 L 14 52 L 22 62 L 30 56 L 38 62 L 46 52 L 40 38 L 42 28 L 34 22 L 36 16 Z"
        fill={AXM.parchment} opacity="0.85"/>
      <path d="M26 16 L 22 12 M 34 16 L 38 12" stroke={AXM.parchment} strokeWidth="1.4"/>
      <circle cx="27" cy="18" r="1" fill={AXM.bg}/>
      <circle cx="33" cy="18" r="1" fill={AXM.bg}/>
      <path d="M20 38 L 8 32 M 40 38 L 52 32" stroke={AXM.parchment} strokeWidth="1.2"/>
    </svg>
  );
}

function RoundStrip() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, padding: '0 16px 6px',
    }}>
      <div style={{ flex: 1, height: 1, background: AXM.rule }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
        <span className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 14 }}>iv</span>
        <span className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>ROUND</span>
        <span className="axm-mono-lg" style={{ color: AXM.bone, fontSize: 14 }}>iv</span>
      </div>
      <div style={{ flex: 1, height: 1, background: AXM.rule }} />
    </div>
  );
}

function PhaseStack({ current }) {
  // 4 phases: stance, action, skill (conditional), resolve
  const phases = [
    { id: 'choosing_stance',  label: 'I · STAND' },
    { id: 'choosing_action',  label: 'II · DO' },
    { id: 'choosing_skill',   label: 'III · CRAFT' },
    { id: 'resolving',        label: 'IV · LET' },
  ];
  const curIdx = phases.findIndex(p => p.id === current);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {phases.map((p, i) => {
        const state = i < curIdx ? 'past' : i === curIdx ? 'current' : 'future';
        return <PhaseRow key={p.id} phase={p} state={state} idx={i} />;
      })}
    </div>
  );
}

function PhaseRow({ phase, state, idx }) {
  const color = state === 'past' ? AXM.bone : state === 'current' ? AXM.parchment : AXM.ash;
  const collapsed = state !== 'current';

  return (
    <div style={{
      background: state === 'current' ? AXM.panelBg : 'transparent',
      border: `1px solid ${state === 'current' ? AXM.rule : 'transparent'}`,
      padding: collapsed ? '8px 12px' : '12px 14px 14px',
    }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="axm-eyebrow" style={{ color, fontSize: 10 }}>{phase.label}</span>
        <div style={{ flex: 1, height: 1, background: AXM.rule }} />
        {state === 'past' && (
          <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>{phasePastSummary(phase.id)}</span>
        )}
        {state === 'current' && (
          <span style={{ width: 5, height: 5, background: AXM.sulfur, borderRadius: 0 }} />
        )}
      </div>
      {/* body */}
      {!collapsed && (
        <div style={{ marginTop: 10 }}>
          {phase.id === 'choosing_stance'  && <StancePicker />}
          {phase.id === 'choosing_action'  && <ActionPicker />}
          {phase.id === 'choosing_skill'   && <SkillPicker />}
          {phase.id === 'resolving'        && <ResolvePane />}
        </div>
      )}
    </div>
  );
}

function phasePastSummary(id) {
  if (id === 'choosing_stance') return 'BODY';
  if (id === 'choosing_action') return 'SKILL';
  return '';
}

function StancePicker() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      <StanceCard kind="heart" label="HEART" gloss="parley, mercy" hint="adv. vs mind" picked={false}/>
      <StanceCard kind="body"  label="BODY"  gloss="iron, force"   hint="adv. vs heart" picked={true}/>
      <StanceCard kind="mind"  label="MIND"  gloss="cipher, ruse"  hint="adv. vs body" picked={false}/>
    </div>
  );
}

function StanceCard({ kind, label, gloss, hint, picked }) {
  const accent = picked ? AXM.sulfur : AXM.parchment;
  return (
    <div style={{
      padding: '10px 6px 8px',
      background: picked ? AXM.bg : 'transparent',
      border: `1px solid ${picked ? AXM.sulfur : AXM.ash}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      position: 'relative',
    }}>
      {picked && <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 2, background: AXM.sulfur }} />}
      <StanceGlyph kind={kind} size={32} color={accent}/>
      <span className="axm-caption" style={{ color: accent, fontSize: 11, letterSpacing: '0.18em' }}>{label}</span>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, lineHeight: 1.1, textAlign: 'center' }}>{gloss}</span>
    </div>
  );
}

function ActionPicker() {
  // Crucible strip first (since picked stance = body)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <CrucibleStrip />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6 }}>
        <ActionTile kind="attack" label="STRIKE" />
        <ActionTile kind="defend" label="WARD"   />
        <ActionTile kind="skill"  label="CRAFT"  picked />
        <ActionTile kind="item"   label="DRAW"   />
        <ActionTile kind="flee"   label="FLEE"   dim />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>ADVANTAGE</span>
        <span className="axm-mono" style={{ color: AXM.sulfur, fontSize: 11 }}>BODY vs HEART</span>
        <div style={{ flex: 1 }} />
        <span className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>iron over mercy.</span>
      </div>
    </div>
  );
}

function ActionTile({ kind, label, picked, dim }) {
  const accent = picked ? AXM.sulfur : dim ? AXM.bone : AXM.parchment;
  return (
    <div style={{
      padding: '8px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      border: `1px solid ${picked ? AXM.sulfur : AXM.ash}`,
      background: picked ? AXM.bg : 'transparent', opacity: dim ? 0.55 : 1,
    }}>
      <ActionIcon kind={kind} size={22} color={accent}/>
      <span className="axm-caption" style={{ color: accent, fontSize: 9, letterSpacing: '0.14em' }}>{label}</span>
    </div>
  );
}

function CrucibleStrip() {
  // Five tokens. Visible counts. Compact horizontal.
  const tokens = [
    { glyph: '◐', name: 'ember', count: 3, max: 5, color: AXM.blood },
    { glyph: '◒', name: 'mire',  count: 1, max: 5, color: AXM.rust },
    { glyph: '◑', name: 'ash',   count: 4, max: 5, color: AXM.bone },
    { glyph: '◓', name: 'lune',  count: 2, max: 5, color: AXM.parchment },
    { glyph: '◉', name: 'pith',  count: 0, max: 5, color: AXM.sulfur },
  ];
  return (
    <div style={{
      border: `1px solid ${AXM.ash}`, background: AXM.deepBg,
      padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>CRUCIBLE</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        {tokens.map(t => (
          <div key={t.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ color: t.count > 0 ? t.color : AXM.ash, fontSize: 14, fontFamily: 'var(--f-gothic)' }}>{t.glyph}</span>
            <span className="axm-mono" style={{ color: t.count > 0 ? AXM.parchment : AXM.bone, fontSize: 9 }}>{t.count}</span>
          </div>
        ))}
      </div>
      <button style={{ color: AXM.bone }} className="axm-caption">OPEN ▸</button>
    </div>
  );
}

function SkillPicker() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkillRow name="Rending Strike" stance="body" cost="II ember · I ash" effect="vii–xii dmg · bleed" picked />
      <SkillRow name="Ironwall" stance="body" cost="II ash" effect="grant warded · ii rounds"/>
      <SkillRow name="Sunder the Guard" stance="body" cost="I ember · I lune" effect="strip ward · ix dmg" locked="too few lune"/>
    </div>
  );
}

function SkillRow({ name, stance, cost, effect, picked, locked }) {
  const accent = picked ? AXM.sulfur : locked ? AXM.bone : AXM.parchment;
  return (
    <div style={{
      padding: '8px 10px', border: `1px solid ${picked ? AXM.sulfur : AXM.ash}`,
      background: picked ? AXM.bg : 'transparent', opacity: locked ? 0.6 : 1,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <StanceGlyph kind={stance} size={24} color={accent}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="axm-body" style={{ color: accent, fontSize: 14, lineHeight: 1.1 }}>{name}</div>
        <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, marginTop: 2 }}>{effect}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span className="axm-mono" style={{ color: locked ? AXM.blood : AXM.parchment, fontSize: 10 }}>{cost}</span>
        {locked && <div className="axm-bodyit" style={{ color: AXM.blood, fontSize: 9, fontStyle: 'italic' }}>{locked}</div>}
      </div>
    </div>
  );
}

function ResolvePane() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* VS */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center',
        padding: '8px 0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>YOU</span>
          <div className="axm-mono-lg" style={{ color: AXM.sulfur, fontSize: 26, marginTop: 2 }}>xiv</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>rending strike</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span className="axm-mono" style={{ color: AXM.bone }}>━━</span>
          <span className="axm-caption" style={{ color: AXM.sulfur, fontSize: 9 }}>VS</span>
          <span className="axm-mono" style={{ color: AXM.bone }}>━━</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>STALKER</span>
          <div className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 26, marginTop: 2 }}>vii</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>flailing claw</div>
        </div>
      </div>
      <button style={{
        padding: '12px 0', background: AXM.bg, border: `1px solid ${AXM.sulfur}`,
        color: AXM.sulfur,
      }} className="axm-caption">LET IT FALL ━━━━━ ▸</button>
    </div>
  );
}

function PlayerHUD() {
  return (
    <div style={{ padding: '8px 16px 8px', borderTop: `1px solid ${AXM.rule}`, background: AXM.deepBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StanceGlyph kind="body" size={26} color={AXM.sulfur}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><StatBar value={58} max={80} color={AXM.blood} label="VITAE" valueLabel="lviii"/></div>
            <div style={{ flex: 1 }}><StatBar value={34} max={50} color={AXM.sulfur} label="MANA" valueLabel="xxxiv"/></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>FRIENDSHIP</span>
            <FriendshipMeter value={1} max={5}/>
            <div style={{ flex: 1 }}/>
            <EffectChip kind="regen" label="MENDING" duration="ii" tone="buff"/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SELF — Character sheet (progressive disclosure)
// Hero card + collapsible sections.
// ─────────────────────────────────────────────────────────────────────
function ScreenSelf() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'auto', paddingBottom: 12 }}>
      {/* hero */}
      <div style={{ padding: '12px 20px 6px' }}>
        <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ THE PILGRIM</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--f-gothic)', fontSize: 28, color: AXM.parchment, lineHeight: 1 }}>Cas of Ash</span>
          <span className="axm-mono" style={{ color: AXM.bone }}>· lvl. vii</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <StatBar value={1240} max={1800} color={AXM.parchment} label="WORK · LVL VIII" valueLabel="mccxl / mdccc" />
        </div>
      </div>

      {/* stance triangle */}
      <div style={{ padding: '10px 16px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          border: `1px solid ${AXM.rule}`, padding: 12, background: AXM.panelBg,
        }}>
          <StanceTriCell kind="heart" value="vi" delta="+i"/>
          <StanceTriCell kind="body"  value="ix" delta="+ii" big/>
          <StanceTriCell kind="mind"  value="v"  delta=""/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 8px', border: `1px dashed ${AXM.sulfur}`, background: AXM.bg }}>
          <span style={{ width: 4, height: 4, background: AXM.sulfur }} />
          <span className="axm-caption" style={{ color: AXM.sulfur, fontSize: 10 }}>II POINTS UNSPENT</span>
          <div style={{ flex: 1 }} />
          <span className="axm-caption" style={{ color: AXM.sulfur, fontSize: 10 }}>ALLOT ▸</span>
        </div>
      </div>

      {/* expandable sections */}
      <Accordion title="EQUIPMENT · WORN & WIELDED" sub="vii of vii slots" open>
        <EquipmentBlock />
      </Accordion>
      <Accordion title="STATES · AFFLICTIONS & BLESSINGS" sub="ii · iii" open>
        <EffectsBlock />
      </Accordion>
      <Accordion title="MEASURES · ATTACK · SKILL · DEFENSE" sub="three rows"/>
      <Accordion title="TRIALS · SAVES & TESTS" sub="six rolls"/>
      <Accordion title="SKILLS · LEARNED" sub="iv known"/>
      <Accordion title="CRUCIBLE · POOL & ACCRUAL" sub="open in modal" link/>
    </div>
  );
}

function StanceTriCell({ kind, value, delta, big }) {
  return (
    <div style={{ textAlign: 'center', padding: '4px 0' }}>
      <StanceGlyph kind={kind} size={big ? 34 : 28} color={big ? AXM.sulfur : AXM.parchment}/>
      <div className="axm-caption" style={{ color: AXM.bone, fontSize: 9, marginTop: 4, letterSpacing: '0.16em' }}>{kind.toUpperCase()}</div>
      <div className="axm-mono-lg" style={{ color: big ? AXM.sulfur : AXM.parchment, fontSize: 20, marginTop: 2 }}>{value}</div>
      {delta && <div className="axm-mono" style={{ color: AXM.sulfur, fontSize: 9 }}>{delta}</div>}
    </div>
  );
}

function Accordion({ title, sub, open, link, children }) {
  return (
    <div style={{ borderTop: `1px solid ${AXM.rule}`, padding: '10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 10, letterSpacing: '0.18em' }}>{title}</span>
        <div style={{ flex: 1 }} />
        <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>{sub}</span>
        <span style={{ color: AXM.bone, fontSize: 11 }}>{link ? '↗' : (open ? '▾' : '▸')}</span>
      </div>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

function EquipmentBlock() {
  const slots = [
    { slot: 'HEAD',   item: 'Crow-feather hood',    rarity: 'common' },
    { slot: 'BODY',   item: 'Lacquered scale',       rarity: 'fine' },
    { slot: 'HANDS',  item: '—',                     rarity: null },
    { slot: 'FEET',   item: 'Tarred boots',          rarity: 'common' },
    { slot: 'WEAPON', item: 'Ash-haft falchion',     rarity: 'fine' },
    { slot: 'ARMOR',  item: 'Cracked aegis',         rarity: 'common' },
    { slot: 'ACCESSORY', item: 'Salt ring',          rarity: 'rare' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      {slots.map(s => (
        <div key={s.slot} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderLeft: `2px solid ${s.rarity === 'rare' ? AXM.sulfur : s.rarity === 'fine' ? AXM.parchment : AXM.ash}` }}>
          <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>{s.slot}</span>
          <span className="axm-body" style={{ color: s.item === '—' ? AXM.bone : AXM.parchment, fontSize: 12, textAlign: 'right' }}>{s.item}</span>
        </div>
      ))}
    </div>
  );
}

function EffectsBlock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <EffectRow kind="bleed" label="DEEPCUT"   gloss="from the stalker" duration="iii" tone="debuff"/>
      <EffectRow kind="burn"  label="FEVERED"   gloss="rest mends it"     duration="ii" tone="debuff"/>
      <EffectRow kind="regen" label="MENDING"   gloss="salt-ring grants"  duration="ii" tone="buff"/>
      <EffectRow kind="guard" label="WARDED"    gloss="from prayer"       duration="i"  tone="buff"/>
      <EffectRow kind="mark"  label="WATCHED"   gloss="something noted"   duration="∞"  tone="buff"/>
    </div>
  );
}

function EffectRow({ kind, label, gloss, duration, tone }) {
  const accent = tone === 'buff' ? AXM.sulfur : AXM.rust;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }}>
      <EffectGlyph kind={kind} size={14} color={accent}/>
      <span className="axm-caption" style={{ color: accent, fontSize: 10, letterSpacing: '0.14em', minWidth: 70 }}>{label}</span>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11, flex: 1 }}>{gloss}</span>
      <span className="axm-mono" style={{ color: AXM.parchment, fontSize: 10 }}>{duration}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SATCHEL — Inventory
// ─────────────────────────────────────────────────────────────────────
function ScreenSatchel({ tab = 'all' }) {
  const items = [
    { cat: 'PHIALS · DRAUGHTS', items: [
      { name: 'Phial of crow-tears', count: 3, sub: 'mends viii vitae · removes bleed' },
      { name: 'Sulphurous tonic',   count: 1, sub: 'mends xii mana' },
      { name: 'Vinegar of need',    count: 2, sub: 'sloughs one affliction' },
    ]},
    { cat: 'IRON · WORN & WIELDED', items: [
      { name: 'Ash-haft falchion',   count: null, sub: 'wielded · fine', tag: 'WORN' },
      { name: 'Crow-feather hood',   count: null, sub: 'worn · common', tag: 'WORN' },
      { name: 'Brass cuirass',       count: null, sub: 'unworn · fine' },
    ]},
    { cat: 'MATTER · STUFF', items: [
      { name: 'Iron chip',           count: 14, sub: 'splinters of bell-metal' },
      { name: 'Tallow lump',         count: 5,  sub: 'rendered, foul' },
      { name: 'Knot of hair',        count: 1,  sub: 'someone\u2019s' },
    ]},
    { cat: 'KEPT · BOUND', items: [
      { name: 'The Larch-Letter',    count: null, sub: 'unread · quest item', tag: 'QUEST' },
    ]},
  ];
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ WHAT IS CARRIED</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, lineHeight: 1 }}>The Satchel</span>
        </div>
        {/* meta row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <MetaCell label="SHILLINGS" value="lxxxiv" tone={AXM.sulfur}/>
          <MetaCell label="BURDEN" value="xviii / xxv" tone={AXM.parchment}/>
          <MetaCell label="SLOTS" value="xxii / xl" tone={AXM.bone}/>
        </div>
      </div>
      {/* tabs */}
      <div style={{ display: 'flex', padding: '0 16px', gap: 14, borderBottom: `1px solid ${AXM.rule}` }}>
        {['ALL','PHIALS','IRON','MATTER','KEPT'].map((t, i) => (
          <div key={t} style={{
            padding: '8px 0', position: 'relative',
            borderBottom: i === 0 ? `1px solid ${AXM.sulfur}` : 'none',
          }}>
            <span className="axm-caption" style={{
              color: i === 0 ? AXM.parchment : AXM.bone, fontSize: 10, letterSpacing: '0.16em',
            }}>{t}</span>
          </div>
        ))}
      </div>
      {/* lists */}
      <div style={{ flex: 1, padding: '0 16px' }}>
        {items.map(grp => (
          <div key={grp.cat} style={{ marginTop: 12 }}>
            <SectionLabel cross={false} dim>{grp.cat}</SectionLabel>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {grp.items.map(it => <ItemRow key={it.name} {...it} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaCell({ label, value, tone }) {
  return (
    <div style={{ flex: 1, padding: '6px 10px', border: `1px solid ${AXM.ash}`, background: AXM.panelBg }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>{label}</div>
      <div className="axm-mono-lg" style={{ color: tone, fontSize: 16, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function ItemRow({ name, count, sub, tag }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px',
      borderBottom: `1px solid ${AXM.rule}`,
    }}>
      {/* item icon — small mono mark */}
      <div style={{ width: 24, height: 24, border: `1px solid ${AXM.ash}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: AXM.bone, fontSize: 11, fontFamily: 'var(--f-gothic)' }}>{name[0]}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="axm-body" style={{ color: AXM.parchment, fontSize: 13, lineHeight: 1.1 }}>{name}</span>
          {tag && <span className="axm-caption" style={{ color: tag === 'QUEST' ? AXM.sulfur : AXM.bone, fontSize: 8 }}>· {tag}</span>}
        </div>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, marginTop: 1 }}>{sub}</div>
      </div>
      {count !== null && (
        <span className="axm-mono" style={{ color: AXM.parchment, fontSize: 11 }}>×{count}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MEMOIR — Journal surface (read-only)
// Header · Chronicle (typed events) · Errands (quests) · Measure
// (moral + philosophical alignment). View-model literals pinned to
// match `state/presenters/memoir.engine.ts` — fallback VM eyebrows,
// empty-state copy, band labels (RUTHLESS/STERN/UNDECLARED/BENEVOLENT/
// SAINTLY) and the "of the Body/Heart/Mind" philosophical labels.
// ─────────────────────────────────────────────────────────────────────
function ScreenMemoir({ variant = 'canonical' }) {
  const empty = variant === 'empty';
  const chronicle = empty ? [] : [
    { id: 'c1', label: 'FELLED',                body: 'a foe falls. +ix xp.' },
    { id: 'c2', label: 'CROSSED INTO ASHMARCH', body: 'new ground underfoot.' },
    { id: 'c3', label: 'SPOKE WITH THE WAGONER', body: 'words exchanged.' },
    { id: 'c4', label: 'ROSE TO VII',           body: 'a measure deepens.' },
    { id: 'c5', label: 'FELLED',                body: 'a foe falls. +vi xp.' },
  ];
  const active = empty ? [] : [
    {
      id: 'q1',
      name: 'The Larch-Letter',
      description: 'The wagoner pressed a sealed page into your hand. It is unread.',
      objectives: [
        { id: 'o1', text: 'carry: sealed letter',     done: true,  bullet: '✓' },
        { id: 'o2', text: 'deliver: to the bell-keeper', done: false, bullet: '○' },
      ],
    },
    {
      id: 'q2',
      name: 'A Salt for the Hearth',
      description: 'A widow at the doused fire-ring asked for salt rings.',
      objectives: [
        { id: 'o3', text: 'gather: salt ring (i of iii)', done: false, bullet: '○' },
      ],
    },
  ];
  const completed = empty ? [] : [
    { id: 'qc1', name: 'The Doused Fire-Ring' },
  ];
  const moral = empty
    ? { label: 'UNDECLARED', tint: AXM.bone, isEmpty: true }
    : { label: 'STERN',      tint: AXM.rust, isEmpty: false };
  const philosophical = empty
    ? { label: 'UNTESTED',     rationale: '' }
    : { label: 'of the Body',  rationale: 'Body is your largest measure (ix).' };

  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '12px 20px 6px' }}>
        <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ THE BOOK OF DEEDS</div>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12, marginTop: 2 }}>
          {empty ? 'gathering pages…' : 'Cas of Ash, pilgrim.'}
        </div>
      </div>

      {/* Chronicle */}
      <div style={{ padding: '12px 20px 0' }}>
        <SectionLabel>A CHRONICLE</SectionLabel>
        {chronicle.length === 0 ? (
          <div className="axm-mono" style={{ color: AXM.ash, fontSize: 10, letterSpacing: '0.12em', marginTop: 8, textTransform: 'uppercase' }}>
            THE PAGE IS BARE.
          </div>
        ) : (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chronicle.map(c => (
              <div key={c.id} style={{ borderLeft: `1px solid ${AXM.ash}`, paddingLeft: 10, paddingTop: 2, paddingBottom: 2 }}>
                <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, letterSpacing: '0.16em' }}>{c.label}</div>
                <div className="axm-body" style={{ color: AXM.parchment, fontSize: 12, lineHeight: 1.3, marginTop: 1 }}>{c.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errands */}
      <div style={{ padding: '14px 20px 0' }}>
        <SectionLabel>ERRANDS</SectionLabel>
        {active.length === 0 && completed.length === 0 ? (
          <div className="axm-mono" style={{ color: AXM.ash, fontSize: 10, letterSpacing: '0.12em', marginTop: 8, textTransform: 'uppercase' }}>
            NO ERRANDS WRITTEN HERE.
          </div>
        ) : (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.length > 0 && (
              <div>
                <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>✠ AT HAND</div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {active.map(q => <QuestCardMemoir key={q.id} quest={q} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>✠ COMPLETED</div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {completed.map(q => <QuestCardMemoir key={q.id} quest={{ ...q, status: 'completed', objectives: [], description: '' }} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Measure */}
      <div style={{ padding: '14px 20px 18px' }}>
        <SectionLabel>MEASURE</SectionLabel>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <div style={{ flex: 1, padding: '6px 10px', border: `1px solid ${moral.tint}`, background: AXM.panelBg }}>
            <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 14, color: moral.tint, letterSpacing: '0.06em' }}>{moral.label}</div>
            {moral.isEmpty && (
              <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, marginTop: 4 }}>the scales are level.</div>
            )}
          </div>
          <div style={{ flex: 1, padding: '6px 10px', border: `1px solid ${AXM.ash}`, background: AXM.panelBg }}>
            <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 14, color: AXM.parchment, letterSpacing: '0.06em' }}>{philosophical.label}</div>
            {philosophical.rationale ? (
              <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, marginTop: 4, lineHeight: 1.3 }}>{philosophical.rationale}</div>
            ) : (
              <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, marginTop: 4 }}>untested.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestCardMemoir({ quest }) {
  const completed = quest.status === 'completed';
  return (
    <div style={{
      padding: '6px 10px',
      border: `1px solid ${AXM.ash}`,
      background: AXM.panelBg,
      opacity: completed ? 0.55 : 1,
    }}>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 14, color: AXM.parchment, letterSpacing: '0.04em' }}>{quest.name}</div>
      {quest.description && (
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, marginTop: 3, lineHeight: 1.3 }}>{quest.description}</div>
      )}
      {quest.objectives && quest.objectives.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {quest.objectives.map(o => (
            <div key={o.id} className="axm-mono"
              style={{
                color: o.done ? AXM.sulfur : AXM.bone, fontSize: 9, letterSpacing: '0.04em',
                textDecoration: o.done ? 'line-through' : 'none',
              }}>
              {o.bullet} {o.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ScreenWilds, ScreenStrife, ScreenSelf, ScreenSatchel, ScreenMemoir });
