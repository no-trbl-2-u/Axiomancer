/* prototype.jsx — the clickable single-phone prototype.
   Routes: wilds | strife | self | satchel + modal: event | crucible.
   Phase machine: choosing_stance → choosing_action → (choosing_skill) → resolving → reset.
   All state local; the prototype is read-only from a backend standpoint.
*/

const { useState: ptS, useEffect: ptE, useRef: ptR } = React;

const NODES = [
  { id: 'n0', x: 60,  y: 250, kind: 'rest',     state: 'completed',  title: 'A doused fire-ring', hint: 'rest · mend' },
  { id: 'n1', x: 130, y: 200, kind: 'gather',   state: 'completed',  title: 'Mire-mint, gathered',hint: 'no further use' },
  { id: 'n2', x: 175, y: 145, kind: 'current',  state: 'current',    title: 'You stand here',     hint: 'the lichen ticks' },
  { id: 'n3', x: 245, y: 100, kind: 'encounter',state: 'available',  title: 'A figure waits',     hint: 'a stranger · likely strife' },
  { id: 'n4', x: 220, y: 200, kind: 'rest',     state: 'available',  title: 'Stone hearth',       hint: 'rest · mend' },
  { id: 'n5', x: 300, y: 180, kind: 'treasure', state: 'available',  title: 'A buried chest',     hint: 'loot · risk' },
  { id: 'n6', x: 320, y: 60,  kind: 'boss',     state: 'locked',     title: 'The Bell-Keeper',    hint: 'still distant' },
  { id: 'n7', x: 100, y: 80,  kind: 'quest',    state: 'consumed',   title: 'A wagoner',          hint: 'spoke once already' },
];

function Prototype() {
  const [route, setRoute] = ptS('wilds');     // wilds | strife | self | satchel
  const [modal, setModal] = ptS(null);        // null | { kind:'event', node } | { kind:'crucible' } | { kind:'aftermath' }
  const [combatPhase, setCombatPhase] = ptS('choosing_stance'); // choosing_stance|choosing_action|choosing_skill|resolving|ended
  const [combatChoice, setCombatChoice] = ptS({ stance: null, action: null, skill: null });
  const [nodes, setNodes] = ptS(NODES);
  const [round, setRound] = ptS(1);
  const [tip, setTip] = ptS(null);

  function tapNode(node) {
    if (node.state !== 'available') {
      setTip(node.state === 'locked' ? 'this way is sealed' : 'walked already');
      return;
    }
    if (node.kind === 'encounter' || node.kind === 'boss') {
      setModal({ kind: 'event-combat', node });
    } else {
      setModal({ kind: 'event-paced', node });
    }
  }

  // Combat tab is shown when fighting OR when an encounter/hazard event is up.
  const combatTabShown = route === 'strife' || modal?.kind === 'event-combat';

  function startCombat(node) {
    setRoute('strife');
    setCombatPhase('choosing_stance');
    setCombatChoice({ stance: null, action: null, skill: null });
    setRound(1);
    setModal(null);
  }

  function commitStance(s) {
    setCombatChoice(c => ({ ...c, stance: s }));
    setCombatPhase('choosing_action');
  }
  function commitAction(a) {
    setCombatChoice(c => ({ ...c, action: a }));
    if (a === 'skill') setCombatPhase('choosing_skill');
    else setCombatPhase('resolving');
  }
  function commitSkill(sk) {
    setCombatChoice(c => ({ ...c, skill: sk }));
    setCombatPhase('resolving');
  }
  function letItFall() {
    if (round >= 3) {
      // victory
      setCombatPhase('ended');
      setTimeout(() => {
        // mark node consumed, return to wilds
        const node = modal?.node || nodes.find(n => n.kind === 'encounter' && n.state === 'available');
        setNodes(ns => ns.map(n => n.id === 'n3' ? { ...n, state: 'consumed' } : n.id === 'n2' ? { ...n, state: 'completed' } : n));
        // advance current to n3 position
        setNodes(ns => ns.map(n => n.id === 'n3' ? { ...n, state: 'consumed' } : n));
        setRoute('wilds');
        setModal({ kind: 'aftermath' });
        setTimeout(() => setModal(null), 2500);
      }, 1200);
    } else {
      setRound(r => r + 1);
      setCombatPhase('choosing_stance');
      setCombatChoice({ stance: null, action: null, skill: null });
    }
  }

  // Toast
  ptE(() => {
    if (!tip) return;
    const t = setTimeout(() => setTip(null), 1600);
    return () => clearTimeout(t);
  }, [tip]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', padding: 40, gap: 28, fontFamily: 'var(--f-serif)' }}>
      {/* phone */}
      <div style={{ position: 'relative' }}>
        <PhoneFrame tabBar={routeToTab(route)} focus={null} combatTab={combatTabShown}>
          {route === 'wilds'   && <PtWilds nodes={nodes} onTap={tapNode}/>}
          {route === 'strife'  && <PtStrife phase={combatPhase} choice={combatChoice} round={round}
            onStance={commitStance} onAction={commitAction} onSkill={commitSkill} onResolve={letItFall}
            onOpenCrucible={() => setModal({ kind: 'crucible' })}/>}
          {route === 'self'    && <ScreenSelf/>}
          {route === 'satchel' && <ScreenSatchel/>}

          {/* tab bar router — overlay tap targets atop the visual */}
          <PtTabHits onPick={setRoute} combatTabShown={combatTabShown}/>

          {/* modals overlay inside phone */}
          {modal?.kind === 'event-combat' && <PtEventModal node={modal.node} kind="combat" onClose={() => setModal(null)} onCommit={() => startCombat(modal.node)}/>}
          {modal?.kind === 'event-paced'  && <PtEventModal node={modal.node} kind="paced"  onClose={() => setModal(null)} onCommit={() => setModal(null)}/>}
          {modal?.kind === 'crucible'     && <PtCrucibleModal onClose={() => setModal(null)}/>}
          {modal?.kind === 'aftermath'    && <PtAftermathBanner onClose={() => setModal(null)}/>}

          {/* toast */}
          {tip && <PtToast text={tip}/>}
        </PhoneFrame>
      </div>

      {/* notes / how-to-use */}
      <PtNotes route={route} phase={combatPhase}/>
    </div>
  );
}

function routeToTab(r) {
  return r;
}

// ─── Pt Wilds (clickable map) ────────────────────────────────────────
function PtWilds({ nodes, onTap }) {
  const available = nodes.filter(n => n.state === 'available');
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 8px' }}>
        <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ ASH MARCHES · DAY xii</div>
        <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4, letterSpacing: '0.01em' }}>The Crow-Gate Wood</div>
      </div>

      <div style={{ margin: '4px 16px 0', height: 320, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative' }} className="axm-hatch">
        <svg width="358" height="320" viewBox="0 0 358 320" style={{ position: 'absolute', inset: 0 }}>
          {/* river */}
          <path d="M 0 280 Q 80 260 140 270 T 280 285 T 358 280" stroke={AXM.bone} strokeWidth="1" fill="none" opacity="0.4"/>
          {/* edges */}
          {[['n0','n1'],['n1','n2'],['n2','n3'],['n2','n4'],['n3','n5'],['n4','n5'],['n3','n6'],['n1','n7'],['n7','n3']].map(([a,b], i) => {
            const A = nodes.find(n => n.id === a), B = nodes.find(n => n.id === b);
            const dim = A.state === 'locked' || B.state === 'locked';
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={dim ? AXM.ash : AXM.parchment} strokeWidth={dim ? 1 : 1.2}
              strokeDasharray={dim ? "2 3" : null} opacity={dim ? 0.5 : 0.7}/>;
          })}
          {/* nodes (visual) */}
          {nodes.map(n => <MapNode key={n.id} {...n}/>)}
        </svg>
        {/* tap targets — divs above the SVG for click hits */}
        {nodes.map(n => (
          <button key={n.id}
            onClick={() => onTap(n)}
            style={{
              position: 'absolute', left: n.x - 16, top: n.y - 16, width: 32, height: 32,
              background: 'transparent', border: 0, cursor: n.state === 'available' ? 'pointer' : 'default',
            }}
            aria-label={n.title}
          />
        ))}
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <SectionLabel>WHITHER, PILGRIM?</SectionLabel>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {available.length === 0 && (
          <div className="axm-bodyit" style={{ color: AXM.bone, padding: '20px 4px' }}>the paths close.</div>
        )}
        {available.slice(0, 3).map((n, i) => (
          <button key={n.id} onClick={() => onTap(n)} style={{ textAlign: 'left', display: 'block', width: '100%' }}>
            <StepCardClickable kind={n.kind} title={n.title} hint={n.hint} leagues={['I','I','II'][i] || 'III'}/>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCardClickable({ kind, title, hint, leagues }) {
  const accent = kind === 'encounter' ? AXM.blood : kind === 'treasure' ? AXM.sulfur : AXM.parchment;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 12px',
      background: AXM.panelBg, border: `1px solid ${AXM.rule}`,
      borderLeft: `2px solid ${accent}`, alignItems: 'center',
    }}>
      <div style={{
        width: 28, height: 28, border: `1px solid ${AXM.bone}`, background: AXM.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <NodeMarkSmall kind={kind} color={accent}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="axm-body" style={{ color: AXM.parchment, fontSize: 14 }}>{title}</div>
        <div className="axm-caption" style={{ color: AXM.bone, fontSize: 9, marginTop: 3, letterSpacing: '0.16em' }}>{hint.toUpperCase()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span className="axm-mono" style={{ color: AXM.bone, fontSize: 9 }}>LEAGUES</span>
        <span className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 18 }}>{leagues}</span>
      </div>
    </div>
  );
}

// ─── Pt Strife — full phase machine ──────────────────────────────────
function PtStrife({ phase, choice, round, onStance, onAction, onSkill, onResolve, onOpenCrucible }) {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, display: 'flex', flexDirection: 'column' }}>
      <EnemyPanel round={round}/>
      <RoundStripLive round={round}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 14px' }}>
        <PhaseStackLive phase={phase} choice={choice} onStance={onStance} onAction={onAction} onSkill={onSkill} onResolve={onResolve} onOpenCrucible={onOpenCrucible}/>
      </div>
      <PlayerHUDLive stance={choice.stance}/>
    </div>
  );
}

function RoundStripLive({ round }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 6px' }}>
      <div style={{ flex: 1, height: 1, background: AXM.rule }}/>
      <div style={{ padding: '0 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 14 }}>{roman(round)}</span>
        <span className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>ROUND</span>
        <span className="axm-mono-lg" style={{ color: AXM.bone, fontSize: 14 }}>{roman(round)}</span>
      </div>
      <div style={{ flex: 1, height: 1, background: AXM.rule }}/>
    </div>
  );
}

function PhaseStackLive({ phase, choice, onStance, onAction, onSkill, onResolve, onOpenCrucible }) {
  const phases = ['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving'];
  const showSkill = choice.action === 'skill';
  const visiblePhases = phases.filter(p => p !== 'choosing_skill' || showSkill || phase === 'choosing_skill');
  const curIdx = visiblePhases.indexOf(phase);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {visiblePhases.map((p, i) => {
        const state = i < curIdx ? 'past' : i === curIdx ? 'current' : 'future';
        const labelMap = { choosing_stance: 'I · STAND', choosing_action: 'II · DO', choosing_skill: 'III · CRAFT', resolving: 'IV · LET' };
        return (
          <div key={p} style={{
            background: state === 'current' ? AXM.panelBg : 'transparent',
            border: `1px solid ${state === 'current' ? AXM.rule : 'transparent'}`,
            padding: state === 'current' ? '12px 14px 14px' : '8px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="axm-eyebrow" style={{ color: state === 'past' ? AXM.bone : state === 'current' ? AXM.parchment : AXM.ash, fontSize: 10 }}>
                {labelMap[p]}
              </span>
              <div style={{ flex: 1, height: 1, background: AXM.rule }}/>
              {state === 'past' && (
                <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>
                  {p === 'choosing_stance' ? (choice.stance || '').toUpperCase() :
                   p === 'choosing_action' ? (choice.action === 'skill' ? (choice.skill || 'SKILL') : (choice.action || '')).toUpperCase() :
                   p === 'choosing_skill'  ? (choice.skill || '').toUpperCase() : ''}
                </span>
              )}
              {state === 'current' && <span style={{ width: 5, height: 5, background: AXM.sulfur }}/>}
            </div>
            {state === 'current' && (
              <div style={{ marginTop: 10 }}>
                {p === 'choosing_stance' && <StancePickerLive onPick={onStance}/>}
                {p === 'choosing_action' && <ActionPickerLive stance={choice.stance} onPick={onAction} onOpenCrucible={onOpenCrucible}/>}
                {p === 'choosing_skill'  && <SkillPickerLive stance={choice.stance} onPick={onSkill}/>}
                {p === 'resolving'       && <ResolvePaneLive choice={choice} round={round} onResolve={onResolve}/>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StancePickerLive({ onPick }) {
  const opts = [
    { kind: 'heart', label: 'HEART', gloss: 'parley, mercy' },
    { kind: 'body',  label: 'BODY',  gloss: 'iron, force' },
    { kind: 'mind',  label: 'MIND',  gloss: 'cipher, ruse' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {opts.map(o => (
        <button key={o.kind} onClick={() => onPick(o.kind)}
          style={{ padding: '10px 6px 8px', background: 'transparent', border: `1px solid ${AXM.ash}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <StanceGlyph kind={o.kind} size={32} color={AXM.parchment}/>
          <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 11, letterSpacing: '0.18em' }}>{o.label}</span>
          <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, textAlign: 'center' }}>{o.gloss}</span>
        </button>
      ))}
    </div>
  );
}

function ActionPickerLive({ stance, onPick, onOpenCrucible }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        border: `1px solid ${AXM.ash}`, background: AXM.deepBg,
        padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>CRUCIBLE</span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {[
            ['◐', 3, AXM.blood], ['◒', 1, AXM.rust], ['◑', 4, AXM.bone], ['◓', 2, AXM.parchment], ['◉', 0, AXM.sulfur],
          ].map(([g, c, col], i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: c > 0 ? col : AXM.ash, fontSize: 14, fontFamily: 'var(--f-gothic)' }}>{g}</span>
              <span className="axm-mono" style={{ color: c > 0 ? AXM.parchment : AXM.bone, fontSize: 9 }}>{c}</span>
            </div>
          ))}
        </div>
        <button onClick={onOpenCrucible} className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>OPEN ▸</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
        {[
          { k: 'attack', label: 'STRIKE' },
          { k: 'defend', label: 'WARD' },
          { k: 'skill',  label: 'CRAFT' },
          { k: 'item',   label: 'DRAW' },
          { k: 'flee',   label: 'FLEE',  dim: true },
        ].map(o => (
          <button key={o.k} onClick={() => onPick(o.k === 'flee' ? null : o.k)} disabled={o.dim}
            style={{
              padding: '8px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              border: `1px solid ${AXM.ash}`, background: 'transparent', opacity: o.dim ? 0.5 : 1,
              cursor: o.dim ? 'not-allowed' : 'pointer',
            }}>
            <ActionIcon kind={o.k} size={22} color={AXM.parchment}/>
            <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 9, letterSpacing: '0.14em' }}>{o.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>ADVANTAGE</span>
        <span className="axm-mono" style={{ color: AXM.sulfur, fontSize: 11 }}>{advantageFor(stance)}</span>
        <div style={{ flex: 1 }}/>
        <span className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>{glossFor(stance)}</span>
      </div>
    </div>
  );
}

function advantageFor(stance) {
  if (stance === 'body') return 'BODY vs HEART';
  if (stance === 'heart') return 'HEART vs MIND';
  if (stance === 'mind') return 'MIND vs BODY';
  return '—';
}
function glossFor(stance) {
  if (stance === 'body') return 'iron over mercy.';
  if (stance === 'heart') return 'mercy over ruse.';
  if (stance === 'mind') return 'ruse over iron.';
  return '';
}

function SkillPickerLive({ stance, onPick }) {
  const skills = [
    { id: 'rend',    name: 'Rending Strike',  cost: 'II ember · I ash', effect: 'vii–xii dmg · bleed', stance: 'body' },
    { id: 'wall',    name: 'Ironwall',         cost: 'II ash',           effect: 'grant warded · ii rounds', stance: 'body' },
    { id: 'sunder',  name: 'Sunder the Guard', cost: 'I ember · I lune', effect: 'strip ward · ix dmg', stance: 'body', locked: 'too few lune'},
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {skills.map(s => (
        <button key={s.id} disabled={s.locked} onClick={() => onPick(s.name)}
          style={{
            padding: '8px 10px', border: `1px solid ${AXM.ash}`, background: 'transparent',
            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
            opacity: s.locked ? 0.6 : 1, cursor: s.locked ? 'not-allowed' : 'pointer',
          }}>
          <StanceGlyph kind={s.stance} size={24} color={AXM.parchment}/>
          <div style={{ flex: 1 }}>
            <div className="axm-body" style={{ color: AXM.parchment, fontSize: 14 }}>{s.name}</div>
            <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, marginTop: 2 }}>{s.effect}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="axm-mono" style={{ color: s.locked ? AXM.blood : AXM.parchment, fontSize: 10 }}>{s.cost}</span>
            {s.locked && <div className="axm-bodyit" style={{ color: AXM.blood, fontSize: 9 }}>{s.locked}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

function ResolvePaneLive({ choice, round, onResolve }) {
  const playerRoll = round === 1 ? 'xiv' : round === 2 ? 'ix' : 'xviii';
  const enemyRoll = round === 1 ? 'vii' : round === 2 ? 'xi' : 'vi';
  const playerAct = choice.action === 'skill' ? (choice.skill || 'skill') : (choice.action || 'strike').toLowerCase() === 'attack' ? 'strike' : (choice.action || '').toLowerCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', padding: '8px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>YOU</span>
          <div className="axm-mono-lg" style={{ color: AXM.sulfur, fontSize: 26, marginTop: 2 }}>{playerRoll}</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>{playerAct}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ color: AXM.bone, fontFamily: 'var(--f-mono)' }}>━━</span>
          <span className="axm-caption" style={{ color: AXM.sulfur, fontSize: 9 }}>VS</span>
          <span style={{ color: AXM.bone, fontFamily: 'var(--f-mono)' }}>━━</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>STALKER</span>
          <div className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 26, marginTop: 2 }}>{enemyRoll}</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>flailing claw</div>
        </div>
      </div>
      <button onClick={onResolve} className="axm-caption"
        style={{ padding: '12px 0', background: AXM.bg, border: `1px solid ${AXM.sulfur}`, color: AXM.sulfur, cursor: 'pointer' }}>
        {round >= 3 ? 'LET IT FALL · IT IS DONE ▸' : 'LET IT FALL ━━━━━ ▸'}
      </button>
    </div>
  );
}

function PlayerHUDLive({ stance }) {
  return (
    <div style={{ padding: '8px 16px 8px', borderTop: `1px solid ${AXM.rule}`, background: AXM.deepBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StanceGlyph kind={stance || 'body'} size={26} color={stance ? AXM.sulfur : AXM.bone}/>
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

// ─── Pt Event ──────────────────────────────────────────────────────────
function PtEventModal({ node, kind, onClose, onCommit }) {
  if (kind === 'combat') {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, animation: 'rise 280ms ease-out' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.6)' }} onClick={onClose}/>
        <div style={{
          position: 'absolute', left: 12, right: 12, top: 56, bottom: 84,
          background: AXM.bg, border: `1px solid ${AXM.rust}`, display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderBottom: `1px solid ${AXM.rule}` }}>
            <svg width="10" height="10"><path d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood}/></svg>
            <span className="axm-eyebrow" style={{ color: AXM.blood }}>{node.kind === 'boss' ? 'BOSS · ENCOUNTER' : 'ENCOUNTER'}</span>
            <div style={{ flex: 1 }}/>
            <button onClick={onClose} className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>×</button>
          </div>
          <div style={{ height: 220, background: AXM.deepBg, position: 'relative', borderBottom: `1px solid ${AXM.rule}` }} className="axm-hatch-strong">
            <LarchStalkerIllustration/>
            <div style={{ position: 'absolute', top: 0, left: 0, background: AXM.blood, padding: '3px 12px 3px 14px', clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
              <span className="axm-caption" style={{ color: AXM.bg, fontSize: 10 }}>STRIFE STIRS</span>
            </div>
          </div>
          <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="axm-eyebrow" style={{ color: AXM.bone }}>{node.title}.</div>
            <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 26, color: AXM.parchment, lineHeight: 1, marginTop: 4 }}>The Larch-Stalker</div>
            <div className="axm-bodyit" style={{ color: AXM.parchment, marginTop: 8, fontSize: 13 }}>
              It does not move. Long-limbed, ash-smeared, mouth too wide. A bell at the belt. No greeting.
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <button onClick={onCommit}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: AXM.bg, border: `1px solid ${AXM.blood}`, borderLeft: `3px solid ${AXM.blood}`, color: AXM.blood, cursor: 'pointer' }}>
                <span className="axm-caption" style={{ fontSize: 14 }}>FIGHT</span>
                <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>ix · vi vitae · adv. unknown</span>
              </button>
              <button onClick={onClose}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: AXM.bg, border: `1px solid ${AXM.bone}`, borderLeft: `3px solid ${AXM.bone}`, color: AXM.bone, cursor: 'pointer' }}>
                <span className="axm-caption" style={{ fontSize: 12 }}>FLEE</span>
                <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>forfeit the path · -ii morale</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // paced
  const kindToMeta = {
    rest:     { eye: 'A FIRE LOWERS',    title: 'The Stone Hearth',   body: 'Stones laid in a tight ring. Coals still red. No one tends them.', ill: 'fire' },
    treasure: { eye: 'A FOUND THING',     title: 'A Buried Chest',     body: 'Iron-bound. The lock is rusted through. The wood, somehow, is not.', ill: 'chest' },
    gather:   { eye: 'A SMALL HARVEST',   title: 'A Stand of Mire-Mint', body: 'Bitter green. The leaves bruise easily. Worth the stoop.', ill: 'plant' },
    quest:    { eye: 'INTERACTION',       title: 'The Wagoner',         body: 'A man at a broken cart. One wheel split. He has not looked up.', ill: 'figure' },
  };
  const m = kindToMeta[node.kind] || { eye: 'A SETTLEMENT', title: node.title, body: node.hint, ill: 'town' };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, animation: 'rise 280ms ease-out' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.65)' }} onClick={onClose}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 100,
        background: AXM.bg, borderTop: `1px solid ${AXM.parchment}`, boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '12px 20px 0' }}><SectionLabel>{m.eye}</SectionLabel></div>
        <div style={{ margin: '10px 16px', height: 170, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative' }} className="axm-hatch">
          <PacedIllustration kind={m.ill}/>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment }}>{m.title}</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, marginTop: 8, fontSize: 13 }}>{m.body}</div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ padding: '12px 16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={onCommit}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${AXM.sulfur}`, borderLeft: `3px solid ${AXM.sulfur}`, color: AXM.sulfur, background: AXM.bg, cursor: 'pointer' }}>
            <span className="axm-caption">TAKE / REST / OFFER</span>
            <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>commit</span>
          </button>
          <button onClick={onClose}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${AXM.bone}`, borderLeft: `3px solid ${AXM.bone}`, color: AXM.bone, background: AXM.bg, cursor: 'pointer' }}>
            <span className="axm-caption">WALK ON</span>
            <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>no cost</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PtCrucibleModal({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,5,10,0.85)' }} onClick={onClose}/>
      <div style={{ position: 'absolute', inset: '44px 0 0', background: AXM.bg, borderTop: `1px solid ${AXM.parchment}` }}>
        <ScreenCrucible/>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, left: 18, color: AXM.parchment }} className="axm-caption">← BACK</button>
      </div>
    </div>
  );
}

function PtAftermathBanner({ onClose }) {
  return (
    <div style={{ position: 'absolute', top: 56, left: 24, right: 24, zIndex: 50, padding: 16, background: AXM.panelBg, border: `1px solid ${AXM.sulfur}`, animation: 'rise 280ms ease-out' }}>
      <div className="axm-eyebrow" style={{ color: AXM.sulfur }}>IT IS DONE</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 22, color: AXM.parchment, marginTop: 2 }}>The Larch-Stalker fell.</div>
      <div className="axm-mono" style={{ color: AXM.parchment, marginTop: 6, fontSize: 11 }}>+ ix XP · + i salt ring · + ii ember</div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 4, fontSize: 12 }}>The map returns. Walk on.</div>
    </div>
  );
}

function PtToast({ text }) {
  return (
    <div style={{
      position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      padding: '6px 14px', background: AXM.bg, border: `1px solid ${AXM.bone}`, zIndex: 70,
      animation: 'fade 200ms ease-out',
    }}>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12 }}>{text}</span>
    </div>
  );
}

// ─── Tab bar hit overlay ─────────────────────────────────────────────
function PtTabHits({ onPick, combatTabShown }) {
  // Three slots — first is wilds or strife depending on combat state.
  const firstKey = combatTabShown ? 'strife' : 'wilds';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 72, zIndex: 35,
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    }}>
      {[firstKey, 'self', 'satchel'].map(k => (
        <button key={k} onClick={() => onPick(k)} style={{ background: 'transparent', border: 0, cursor: 'pointer' }} aria-label={k}/>
      ))}
    </div>
  );
}

// ─── Notes panel ─────────────────────────────────────────────────────
function PtNotes({ route, phase }) {
  return (
    <div style={{ width: 340, color: '#5a4a2a', fontFamily: 'var(--f-serif)' }}>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 30, color: '#2a251f' }}>Try it.</div>
      <div style={{ fontStyle: 'italic', marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
        Tap an available node on the map (sulfur ring) to begin. The encounter rises over the map; combat replaces in place; the aftermath flashes once and recedes.
      </div>
      <div style={{ marginTop: 18, padding: 12, background: '#fef4a8', borderLeft: '3px solid #c96442', fontSize: 13 }}>
        <b>Now:</b> {label(route, phase)}
      </div>
      <ul style={{ marginTop: 18, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
        <li>The map node at <i>(245, 100)</i> — the encounter — is the canonical path.</li>
        <li>The hearth and the chest demo the <i>paced</i> shell.</li>
        <li>The boss and quest nodes show locked / consumed states.</li>
        <li>Tab to STRIFE without an encounter for the empty state.</li>
        <li>Crucible <b>OPEN ▸</b> button (action phase) opens the modal.</li>
      </ul>
      <div style={{ marginTop: 18, fontSize: 12, color: '#7a6a4a' }}>
        Visual fidelity here mirrors the canvas. Strings are presenter-shaped.
      </div>
      <div style={{ marginTop: 16, fontSize: 12 }}>
        <a href="index.html" style={{ color: '#2a251f' }}>← Back to design canvas</a>
      </div>
    </div>
  );
}
function label(route, phase) {
  if (route === 'wilds')   return 'Wilds tab · map open';
  if (route === 'self')    return 'Self tab · the pilgrim';
  if (route === 'satchel') return 'Satchel · the carried';
  if (route === 'strife')  {
    return ({
      choosing_stance: 'Strife · stand · pick a stance',
      choosing_action: 'Strife · do · pick an action (Crucible above)',
      choosing_skill:  'Strife · craft · pick a skill',
      resolving:       'Strife · let · commit the round',
      ended:           'Strife · ended',
    })[phase];
  }
  return '';
}

// ─── Render ───────────────────────────────────────────────────────────
const ptStyle = document.createElement('style');
ptStyle.textContent = `
  @keyframes rise { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
`;
document.head.appendChild(ptStyle);

const ptRoot = ReactDOM.createRoot(document.getElementById('root'));
ptRoot.render(<Prototype/>);
