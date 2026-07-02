/* prototype.jsx — the clickable single-phone prototype.
   Routes: wilds | strife | self | satchel + modal: event | crucible.
   Phase machine: choosing_stance → choosing_action → (choosing_skill) → resolving → reset.
   All state local; the prototype is read-only from a backend standpoint.
*/

const { useState: ptS, useEffect: ptE, useRef: ptR } = React;

const NODES = [
{ id: 'n0', x: 60, y: 250, kind: 'rest', state: 'completed', title: 'A doused fire-ring', hint: 'rest · mend' },
{ id: 'n1', x: 130, y: 200, kind: 'gather', state: 'completed', title: 'Mire-mint, gathered', hint: 'no further use' },
{ id: 'n2', x: 175, y: 145, kind: 'current', state: 'current', title: 'You stand here', hint: 'the lichen ticks' },
{ id: 'n3', x: 245, y: 100, kind: 'encounter', state: 'available', title: 'A figure waits', hint: 'a stranger · likely strife' },
{ id: 'n4', x: 220, y: 200, kind: 'rest', state: 'available', title: 'Stone hearth', hint: 'rest · mend' },
{ id: 'n5', x: 300, y: 180, kind: 'treasure', state: 'available', title: 'A buried chest', hint: 'loot · risk' },
{ id: 'n6', x: 320, y: 60, kind: 'boss', state: 'locked', title: 'The Bell-Keeper', hint: 'still distant' },
{ id: 'n7', x: 100, y: 80, kind: 'quest', state: 'consumed', title: 'A wagoner', hint: 'spoke once already' }];


function Prototype() {
  const [route, setRoute] = ptS('wilds'); // wilds | strife | self | memoir | satchel
  // ─── ENCOUNTER MODEL ─────────────────────────────────────────────────
  // The encounter lives in ONE modal that opens on `tapNode` and stays
  // mounted across intro → combat → aftermath. Combat does NOT route to
  // its own tab; it happens inside the same modal seal. Only `closeAftermath`
  // dismisses. STRIFE tab is the re-entry point if the player peeks at
  // SELF / SATCHEL during the fight (the encounter state persists).
  const [encounter, setEncounter] = ptS(null); // null | { node, phase: 'intro'|'combat'|'aftermath' }
  const [combatPhase, setCombatPhase] = ptS('choosing_stance'); // sub-phase of encounter.phase==='combat'
  const [combatChoice, setCombatChoice] = ptS({ stance: null, action: null, skill: null });
  const [round, setRound] = ptS(1);
  const [pacedModal, setPacedModal] = ptS(null); // paced events (rest, treasure, etc.) — separate flow
  const [crucibleOpen, setCrucibleOpen] = ptS(false);
  const [nodes, setNodes] = ptS(NODES);
  const [tip, setTip] = ptS(null);

  function tapNode(node) {
    if (node.state !== 'available') {
      setTip(node.state === 'locked' ? 'this way is sealed' : 'walked already');
      return;
    }
    if (node.kind === 'encounter' || node.kind === 'boss') {
      // Open the encounter as a modal. Combat will play out INSIDE this
      // same modal until the aftermath is dismissed.
      setEncounter({ node, phase: 'intro' });
      setCombatPhase('choosing_stance');
      setCombatChoice({ stance: null, action: null, skill: null });
      setRound(1);
      // Don't change route — modal layers over whichever tab is up.
    } else {
      setPacedModal({ node });
    }
  }

  const combatTabShown = !!encounter;

  // FIGHT → modal contents transition from intro to combat. Same chrome,
  // same z-layer; only the body swaps. Route flips to STRIFE so the tab
  // indicator matches what's in the modal, but the modal is what the
  // player is looking at.
  function startCombat() {
    setEncounter((e) => e ? { ...e, phase: 'combat' } : e);
    setRoute('strife');
  }

  function commitStance(s) {
    setCombatChoice((c) => ({ ...c, stance: s }));
    setCombatPhase('choosing_action');
  }
  function commitAction(a) {
    setCombatChoice((c) => ({ ...c, action: a }));
    if (a === 'skill') setCombatPhase('choosing_skill');else
    setCombatPhase('resolving');
  }
  function commitSkill(sk) {
    setCombatChoice((c) => ({ ...c, skill: sk }));
    setCombatPhase('resolving');
  }
  function letItFall() {
    if (round >= 3) {
      // victory → modal body swaps to the aftermath panel.
      setEncounter((e) => e ? { ...e, phase: 'aftermath' } : e);
    } else {
      setRound((r) => r + 1);
      setCombatPhase('choosing_stance');
      setCombatChoice({ stance: null, action: null, skill: null });
    }
  }
  // The ONLY explicit dismiss for the encounter modal once combat has begun.
  function closeAftermath() {
    const nid = encounter?.node?.id;
    setNodes((ns) => ns.map((n) =>
      n.id === nid ? { ...n, state: 'consumed' } :
      n.id === 'n2' ? { ...n, state: 'completed' } : n
    ));
    setEncounter(null);
    setRoute('wilds');
  }
  // Intro-phase only — there's no flee out from within combat itself.
  function fleeIntro() { setEncounter(null); }

  // Toast
  ptE(() => {
    if (!tip) return;
    const t = setTimeout(() => setTip(null), 1600);
    return () => clearTimeout(t);
  }, [tip]);

  // The encounter modal is mounted whenever an encounter exists AND the
  // player is on wilds or strife. If they switch to SELF / MEMOIR /
  // SATCHEL the modal hides (state persists) — they return via the
  // STRIFE tab.
  const modalVisible = !!encounter && (route === 'wilds' || route === 'strife');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', padding: 40, gap: 28, fontFamily: 'var(--f-serif)' }}>
      {/* phone */}
      <div style={{ position: 'relative' }}>
        <PhoneFrame tabBar={route} focus={null} combatTab={combatTabShown}>
          {route === 'wilds' && <PtWilds nodes={nodes} onTap={tapNode} />}
          {route === 'strife' && (
            encounter ? <PtStrifeUnderlay /> : <PtStrifeEmpty />
          )}
          {route === 'self' && <ScreenSelf />}
          {route === 'memoir' && <ScreenMemoir />}
          {route === 'satchel' && <ScreenSatchel />}

          {/* tab bar router — overlay tap targets atop the visual */}
          <PtTabHits onPick={setRoute} combatTabShown={combatTabShown} />

          {/* The encounter seal — intro / combat / aftermath all live HERE. */}
          {modalVisible && (
            <PtEncounterFlow
              encounter={encounter}
              combatPhase={combatPhase}
              combatChoice={combatChoice}
              round={round}
              onStartCombat={startCombat}
              onFleeIntro={fleeIntro}
              onStance={commitStance}
              onAction={commitAction}
              onSkill={commitSkill}
              onResolve={letItFall}
              onOpenCrucible={() => setCrucibleOpen(true)}
              onCarryOn={closeAftermath}
            />
          )}
          {pacedModal && <PtEventModal node={pacedModal.node} onClose={() => setPacedModal(null)} onCommit={() => setPacedModal(null)} />}
          {crucibleOpen && <PtCrucibleModal onClose={() => setCrucibleOpen(false)} />}

          {/* toast */}
          {tip && <PtToast text={tip} />}
        </PhoneFrame>
      </div>

      {/* notes / how-to-use */}
      <PtNotes route={route} phase={combatPhase} encounter={encounter} />
    </div>);

}

// ─── Pt Strife sub-components (used INSIDE PtEncounterFlow's combat body) ──

// ─── Pt Wilds (clickable map) ────────────────────────────────────────
function PtWilds({ nodes, onTap }) {
  const available = nodes.filter((n) => n.state === 'available');
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 8px' }}>
        <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ ASH MARCHES · DAY xii</div>
        <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4, letterSpacing: '0.01em' }}>The Crow-Gate Wood</div>
      </div>

      <div style={{ margin: '4px 16px 0', height: 320, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative' }} className="axm-hatch">
        <svg width="358" height="320" viewBox="0 0 358 320" style={{ position: 'absolute', inset: 0 }}>
          {/* river */}
          <path d="M 0 280 Q 80 260 140 270 T 280 285 T 358 280" stroke={AXM.bone} strokeWidth="1" fill="none" opacity="0.4" />
          {/* edges */}
          {[['n0', 'n1'], ['n1', 'n2'], ['n2', 'n3'], ['n2', 'n4'], ['n3', 'n5'], ['n4', 'n5'], ['n3', 'n6'], ['n1', 'n7'], ['n7', 'n3']].map(([a, b], i) => {
            const A = nodes.find((n) => n.id === a),B = nodes.find((n) => n.id === b);
            const dim = A.state === 'locked' || B.state === 'locked';
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke={dim ? AXM.ash : AXM.parchment} strokeWidth={dim ? 1 : 1.2}
            strokeDasharray={dim ? "2 3" : null} opacity={dim ? 0.5 : 0.7} />;
          })}
          {/* nodes (visual) */}
          {nodes.map((n) => <MapNode key={n.id} {...n} />)}
        </svg>
        {/* tap targets — divs above the SVG for click hits */}
        {nodes.map((n) =>
        <button key={n.id}
        onClick={() => onTap(n)}
        style={{
          position: 'absolute', left: n.x - 16, top: n.y - 16, width: 32, height: 32,
          background: 'transparent', border: 0, cursor: n.state === 'available' ? 'pointer' : 'default'
        }}
        aria-label={n.title} />

        )}
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <SectionLabel>WHITHER, PILGRIM?</SectionLabel>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {available.length === 0 &&
        <div className="axm-bodyit" style={{ color: AXM.bone, padding: '20px 4px' }}>the paths close.</div>
        }
        {available.slice(0, 3).map((n, i) =>
        <button key={n.id} onClick={() => onTap(n)} style={{ textAlign: 'left', display: 'block', width: '100%' }}>
            <StepCardClickable kind={n.kind} title={n.title} hint={n.hint} leagues={['I', 'I', 'II'][i] || 'III'} />
          </button>
        )}
      </div>
    </div>);

}

function StepCardClickable({ kind, title, hint, leagues }) {
  const accent = kind === 'encounter' ? AXM.blood : kind === 'treasure' ? AXM.sulfur : AXM.parchment;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 12px',
      background: AXM.panelBg, border: `1px solid ${AXM.rule}`,
      borderLeft: `2px solid ${accent}`, alignItems: 'center'
    }}>
      <div style={{
        width: 28, height: 28, border: `1px solid ${AXM.bone}`, background: AXM.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <NodeMarkSmall kind={kind} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="axm-body" style={{ color: AXM.parchment, fontSize: 14 }}>{title}</div>
        <div className="axm-caption" style={{ color: AXM.bone, fontSize: 9, marginTop: 3, letterSpacing: '0.16em' }}>{hint.toUpperCase()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span className="axm-mono" style={{ color: AXM.bone, fontSize: 9 }}>LEAGUES</span>
        <span className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 18 }}>{leagues}</span>
      </div>
    </div>);

}

// ─── Pt Strife — full phase machine ──────────────────────────────────
// (The wrapper is no longer rendered as a tab — combat lives inside
// PtEncounterFlow. Its sub-components below are reused there.)

function RoundStripLive({ round }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 6px' }} data-comment-anchor="d82402d06b-div-227-5">
      <div style={{ flex: 1, height: 1, background: AXM.rule }} />
      <div style={{ padding: '0 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="axm-mono-lg" style={{ color: AXM.parchment, fontSize: 14 }}>{roman(round)}</span>
        <span className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>ROUND</span>
        <span className="axm-mono-lg" style={{ color: AXM.bone, fontSize: 14 }}>{roman(round)}</span>
      </div>
      <div style={{ flex: 1, height: 1, background: AXM.rule }} />
    </div>);

}

function PhaseStackLive({ phase, choice, round, onStance, onAction, onSkill, onResolve, onOpenCrucible }) {
  const phases = ['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving'];
  const showSkill = choice.action === 'skill';
  const visiblePhases = phases.filter((p) => p !== 'choosing_skill' || showSkill || phase === 'choosing_skill');
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
            padding: state === 'current' ? '12px 14px 14px' : '8px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="axm-eyebrow" style={{ color: state === 'past' ? AXM.bone : state === 'current' ? AXM.parchment : AXM.ash, fontSize: 10 }}>
                {labelMap[p]}
              </span>
              <div style={{ flex: 1, height: 1, background: AXM.rule }} />
              {state === 'past' &&
              <span className="axm-caption" style={{ color: AXM.bone, fontSize: 9 }}>
                  {p === 'choosing_stance' ? (choice.stance || '').toUpperCase() :
                p === 'choosing_action' ? (choice.action === 'skill' ? choice.skill || 'SKILL' : choice.action || '').toUpperCase() :
                p === 'choosing_skill' ? (choice.skill || '').toUpperCase() : ''}
                </span>
              }
              {state === 'current' && <span style={{ width: 5, height: 5, background: AXM.sulfur }} />}
            </div>
            {state === 'current' &&
            <div style={{ marginTop: 10 }}>
                {p === 'choosing_stance' && <StancePickerLive onPick={onStance} />}
                {p === 'choosing_action' && <ActionPickerLive stance={choice.stance} onPick={onAction} onOpenCrucible={onOpenCrucible} />}
                {p === 'choosing_skill' && <SkillPickerLive stance={choice.stance} onPick={onSkill} />}
                {p === 'resolving' && <ResolvePaneLive choice={choice} round={round} onResolve={onResolve} />}
              </div>
            }
          </div>);

      })}
    </div>);

}

function StancePickerLive({ onPick }) {
  const opts = [
  { kind: 'heart', label: 'HEART', gloss: 'parley, mercy' },
  { kind: 'body', label: 'BODY', gloss: 'iron, force' },
  { kind: 'mind', label: 'MIND', gloss: 'cipher, ruse' }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {opts.map((o) =>
      <button key={o.kind} onClick={() => onPick(o.kind)}
      style={{ padding: '10px 6px 8px', background: 'transparent', border: `1px solid ${AXM.ash}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <StanceGlyph kind={o.kind} size={32} color={AXM.parchment} />
          <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 11, letterSpacing: '0.18em' }}>{o.label}</span>
          <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 10, textAlign: 'center' }}>{o.gloss}</span>
        </button>
      )}
    </div>);

}

function ActionPickerLive({ stance, onPick, onOpenCrucible }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        border: `1px solid ${AXM.ash}`, background: AXM.deepBg,
        padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>CRUCIBLE</span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {[
          ['◐', 3, AXM.blood], ['◒', 1, AXM.rust], ['◑', 4, AXM.bone], ['◓', 2, AXM.parchment], ['◉', 0, AXM.sulfur]].
          map(([g, c, col], i) =>
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: c > 0 ? col : AXM.ash, fontSize: 14, fontFamily: 'var(--f-gothic)' }}>{g}</span>
              <span className="axm-mono" style={{ color: c > 0 ? AXM.parchment : AXM.bone, fontSize: 9 }}>{c}</span>
            </div>
          )}
        </div>
        <button onClick={onOpenCrucible} className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>OPEN ▸</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
        {[
        { k: 'attack', label: 'STRIKE' },
        { k: 'defend', label: 'WARD' },
        { k: 'skill', label: 'CRAFT' },
        { k: 'item', label: 'DRAW' },
        { k: 'flee', label: 'FLEE', dim: true }].
        map((o) =>
        <button key={o.k} onClick={() => onPick(o.k === 'flee' ? null : o.k)} disabled={o.dim}
        style={{
          padding: '8px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          border: `1px solid ${AXM.ash}`, background: 'transparent', opacity: o.dim ? 0.5 : 1,
          cursor: o.dim ? 'not-allowed' : 'pointer'
        }}>
            <ActionIcon kind={o.k} size={22} color={AXM.parchment} />
            <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 9, letterSpacing: '0.14em' }}>{o.label}</span>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>ADVANTAGE</span>
        <span className="axm-mono" style={{ color: AXM.sulfur, fontSize: 11 }}>{advantageFor(stance)}</span>
        <div style={{ flex: 1 }} />
        <span className="axm-bodyit" style={{ color: AXM.parchment, fontSize: 11 }}>{glossFor(stance)}</span>
      </div>
    </div>);

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
  { id: 'rend', name: 'Rending Strike', cost: 'II ember · I ash', effect: 'vii–xii dmg · bleed', stance: 'body' },
  { id: 'wall', name: 'Ironwall', cost: 'II ash', effect: 'grant warded · ii rounds', stance: 'body' },
  { id: 'sunder', name: 'Sunder the Guard', cost: 'I ember · I lune', effect: 'strip ward · ix dmg', stance: 'body', locked: 'too few lune' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {skills.map((s) =>
      <button key={s.id} disabled={s.locked} onClick={() => onPick(s.name)}
      style={{
        padding: '8px 10px', border: `1px solid ${AXM.ash}`, background: 'transparent',
        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        opacity: s.locked ? 0.6 : 1, cursor: s.locked ? 'not-allowed' : 'pointer'
      }}>
          <StanceGlyph kind={s.stance} size={24} color={AXM.parchment} />
          <div style={{ flex: 1 }}>
            <div className="axm-body" style={{ color: AXM.parchment, fontSize: 14 }}>{s.name}</div>
            <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, marginTop: 2 }}>{s.effect}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="axm-mono" style={{ color: s.locked ? AXM.blood : AXM.parchment, fontSize: 10 }}>{s.cost}</span>
            {s.locked && <div className="axm-bodyit" style={{ color: AXM.blood, fontSize: 9 }}>{s.locked}</div>}
          </div>
        </button>
      )}
    </div>);

}

function ResolvePaneLive({ choice, round, onResolve }) {
  const playerRoll = round === 1 ? 'xiv' : round === 2 ? 'ix' : 'xviii';
  const enemyRoll = round === 1 ? 'vii' : round === 2 ? 'xi' : 'vi';
  const playerAct = choice.action === 'skill' ? choice.skill || 'skill' : (choice.action || 'strike').toLowerCase() === 'attack' ? 'strike' : (choice.action || '').toLowerCase();
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
    </div>);

}

function PlayerHUDLive({ stance }) {
  return (
    <div style={{ padding: '8px 16px 8px', borderTop: `1px solid ${AXM.rule}`, background: AXM.deepBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StanceGlyph kind={stance || 'body'} size={26} color={stance ? AXM.sulfur : AXM.bone} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><StatBar value={58} max={80} color={AXM.blood} label="VITAE" valueLabel="lviii" /></div>
            <div style={{ flex: 1 }}><StatBar value={34} max={50} color={AXM.sulfur} label="MANA" valueLabel="xxxiv" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>FRIENDSHIP</span>
            <FriendshipMeter value={1} max={5} />
            <div style={{ flex: 1 }} />
            <EffectChip kind="regen" label="MENDING" duration="ii" tone="buff" />
          </div>
        </div>
      </div>
    </div>);

}

// ─── Pt Event — paced events only (rest, treasure, gather, interaction) ──
// Combat-adjacent events now flow through PtEncounterFlow so the encounter
// stays in a single modal seal until resolved.
function PtEventModal({ node, onClose, onCommit }) {
  const kindToMeta = {
    rest: { eye: 'A FIRE LOWERS', title: 'The Stone Hearth', body: 'Stones laid in a tight ring. Coals still red. No one tends them.', ill: 'fire' },
    treasure: { eye: 'A FOUND THING', title: 'A Buried Chest', body: 'Iron-bound. The lock is rusted through. The wood, somehow, is not.', ill: 'chest' },
    gather: { eye: 'A SMALL HARVEST', title: 'A Stand of Mire-Mint', body: 'Bitter green. The leaves bruise easily. Worth the stoop.', ill: 'plant' },
    quest: { eye: 'INTERACTION', title: 'The Wagoner', body: 'A man at a broken cart. One wheel split. He has not looked up.', ill: 'figure' }
  };
  const m = kindToMeta[node.kind] || { eye: 'A SETTLEMENT', title: node.title, body: node.hint, ill: 'town' };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, animation: 'rise 280ms ease-out' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.65)' }} onClick={onClose} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 100,
        background: AXM.bg, borderTop: `1px solid ${AXM.parchment}`, boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '12px 20px 0' }}><SectionLabel>{m.eye}</SectionLabel></div>
        <div style={{ margin: '10px 16px', height: 170, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative' }} className="axm-hatch">
          <PacedIllustration kind={m.ill} />
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment }}>{m.title}</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, marginTop: 8, fontSize: 13 }}>{m.body}</div>
        </div>
        <div style={{ flex: 1 }} />
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
    </div>);

}

function PtCrucibleModal({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,5,10,0.85)' }} onClick={onClose} />
      <div style={{ position: 'absolute', inset: '44px 0 0', background: AXM.bg, borderTop: `1px solid ${AXM.parchment}` }}>
        <ScreenCrucible />
        <button onClick={onClose} style={{ position: 'absolute', top: 12, left: 18, color: AXM.parchment }} className="axm-caption">← BACK</button>
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────────────
// PtEncounterFlow — the SINGLE modal that holds intro → combat → aftermath.
// Designed around the principle that an encounter is encapsulated in the
// seal that opens it; combat does not leave the seal until resolved.
// ─────────────────────────────────────────────────────────────────────
function PtEncounterFlow({
  encounter, combatPhase, combatChoice, round,
  onStartCombat, onFleeIntro, onStance, onAction, onSkill, onResolve,
  onOpenCrucible, onCarryOn,
}) {
  const { node, phase } = encounter;
  const stripLabel =
    phase === 'intro' ? 'AT ARMS' :
    phase === 'combat' ? `ROUND ${roman(round).toUpperCase()}` :
    'IT IS DONE';
  const stripColor = phase === 'aftermath' ? AXM.sulfur : AXM.blood;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}
      onClick={(e) => e.stopPropagation()}>
      {/* heavy darken — no tap-through */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(10,5,5,0.82) 0%, rgba(0,0,0,0.95) 80%)',
      }} />

      {/* SEALED top chain */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6px',
        background: 'linear-gradient(180deg, #1a0606 0%, #0a0303 100%)',
        borderBottom: `1px solid ${stripColor}`,
        fontFamily: 'var(--f-mono)', fontSize: 8, color: stripColor, letterSpacing: 2,
      }}>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
        <span>SEALED · {stripLabel}</span>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
      </div>

      {/* the seal card — content swaps per phase, chrome stays put */}
      <div style={{
        position: 'absolute', left: 10, right: 10, top: 26, bottom: 92,
        background: '#0a0807',
        border: `2px solid ${stripColor}`,
        boxShadow: `0 0 0 1px #0a0a0a, 0 0 24px ${phase === 'aftermath' ? 'rgba(212,192,38,0.30)' : 'rgba(192,21,42,0.35)'}, inset 0 0 60px rgba(0,0,0,0.7)`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'rise 280ms ease-out',
      }}>
        <PtRivet x={6} y={6} />
        <PtRivet x={'calc(100% - 14px)'} y={6} />
        <PtRivet x={6} y={'calc(100% - 14px)'} />
        <PtRivet x={'calc(100% - 14px)'} y={'calc(100% - 14px)'} />

        {phase === 'intro' && (
          <PtEncounterIntro node={node} onFight={onStartCombat} onFlee={onFleeIntro} />
        )}
        {phase === 'combat' && (
          <PtCombatBody
            round={round}
            combatPhase={combatPhase}
            combatChoice={combatChoice}
            onStance={onStance}
            onAction={onAction}
            onSkill={onSkill}
            onResolve={onResolve}
            onOpenCrucible={onOpenCrucible}
          />
        )}
        {phase === 'aftermath' && (
          <PtAftermathInModal node={node} round={round} onCarryOn={onCarryOn} />
        )}
      </div>

      {/* SEALED bottom chain */}
      <div style={{
        position: 'absolute', bottom: 72, left: 0, right: 0, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6px',
        background: 'linear-gradient(0deg, #1a0606 0%, #0a0303 100%)',
        borderTop: `1px solid ${stripColor}`,
        fontFamily: 'var(--f-mono)', fontSize: 8, color: stripColor, letterSpacing: 2,
      }}>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
        <span>{phase === 'aftermath' ? 'CARRY ON' : 'NO RETREAT'}</span>
        <span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>
      </div>
    </div>);
}

function PtRivet({ x, y }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: 8, height: 8,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #6a625a 0%, #2a2520 60%, #0a0a0a 100%)',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 0 rgba(0,0,0,0.8)',
      border: '1px solid #0a0a0a', zIndex: 2, pointerEvents: 'none',
    }} />);
}

// ─── intro phase — "a figure waits" + FIGHT / FLEE
function PtEncounterIntro({ node, onFight, onFlee }) {
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px 6px',
        borderBottom: `1px solid ${AXM.ash}`,
        background: 'linear-gradient(180deg, rgba(192,21,42,0.18), rgba(0,0,0,0))',
      }}>
        <svg width="10" height="10"><path d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood} /></svg>
        <span className="axm-eyebrow" style={{ color: AXM.blood }}>
          {node.kind === 'boss' ? 'OMEN · DOOM AT THE GATE' : 'ENCOUNTER'}
        </span>
        <div style={{ flex: 1 }} />
        {/* a struck-out close — there is no easy way out */}
        <div style={{
          position: 'relative', width: 18, height: 18,
          border: `1px dashed ${AXM.ash}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--f-mono)', fontSize: 10, color: AXM.ash,
        }}>
          ×
          <div style={{
            position: 'absolute', inset: -2,
            borderTop: `1.5px solid ${AXM.blood}`,
            transform: 'rotate(20deg)',
          }} />
        </div>
      </div>
      <div style={{ height: 200, position: 'relative', borderBottom: `1px solid ${AXM.rule}` }} className="axm-hatch-strong">
        <LarchStalkerIllustration />
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
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <button onClick={onFight}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: AXM.bg, border: `1px solid ${AXM.blood}`, borderLeft: `3px solid ${AXM.blood}`, color: AXM.blood, cursor: 'pointer' }}>
            <span className="axm-caption" style={{ fontSize: 14 }}>FIGHT</span>
            <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>ix · vi vitae · adv. unknown</span>
          </button>
          <button onClick={onFlee}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: AXM.bg, border: `1px solid ${AXM.bone}`, borderLeft: `3px solid ${AXM.bone}`, color: AXM.bone, cursor: 'pointer' }}>
            <span className="axm-caption" style={{ fontSize: 12 }}>FLEE</span>
            <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11 }}>forfeit the path · -ii morale</span>
          </button>
        </div>
      </div>
    </>);
}

// ─── combat phase — full phase machine, rendered INSIDE the seal
function PtCombatBody({ round, combatPhase, combatChoice, onStance, onAction, onSkill, onResolve, onOpenCrucible }) {
  return (
    <>
      <EnemyPanel round={round} />
      <RoundStripLive round={round} />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px 12px' }}>
        <PhaseStackLive
          phase={combatPhase}
          choice={combatChoice}
          round={round}
          onStance={onStance}
          onAction={onAction}
          onSkill={onSkill}
          onResolve={onResolve}
          onOpenCrucible={onOpenCrucible}
        />
      </div>
      <PlayerHUDLive stance={combatChoice.stance} />
    </>);
}

// ─── aftermath phase — the seal turns sulfur and yields a single carry-on
function PtAftermathInModal({ node, round, onCarryOn }) {
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px 6px',
        borderBottom: `1px solid ${AXM.ash}`,
        background: 'linear-gradient(180deg, rgba(212,192,38,0.14), rgba(0,0,0,0))',
      }}>
        <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill={AXM.sulfur} /></svg>
        <span className="axm-eyebrow" style={{ color: AXM.sulfur }}>✠ THE FOE FALLS</span>
      </div>
      <div style={{ padding: '20px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="axm-eyebrow" style={{ color: AXM.blood, fontSize: 10 }}>IT IS DONE</div>
        <div style={{
          fontFamily: 'var(--f-gothic)', fontSize: 28, color: AXM.parchment,
          letterSpacing: 1, lineHeight: 1, marginTop: 6,
        }}>THE LARCH-STALKER</div>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 13, marginTop: 4 }}>— fell, on the {roman(round).toUpperCase()}.</div>

        <div className="axm-bodyit" style={{
          color: AXM.parchment, fontSize: 13, lineHeight: 1.5,
          marginTop: 16, textWrap: 'pretty',
        }}>
          “It set the bell down, slow. The bell did not ring. The wet ground
          took the rest.”
        </div>

        {/* reward strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          marginTop: 18, border: `1px solid ${AXM.ash}`, background: '#0a0807',
          alignItems: 'stretch',
        }}>
          <div style={{ padding: '10px 6px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 18, color: AXM.parchment, lineHeight: 1 }}>ix</div>
            <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9, marginTop: 6 }}>EXPERIENCE</div>
          </div>
          <div style={{ background: AXM.ash }} />
          <div style={{ padding: '10px 6px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 18, color: AXM.sulfur, lineHeight: 1, textShadow: `0 0 6px ${AXM.sulfur}44` }}>vi·i</div>
            <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9, marginTop: 6 }}>VITAE · SIGILS</div>
          </div>
          <div style={{ background: AXM.ash }} />
          <div style={{ padding: '10px 6px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 18, color: AXM.parchment, lineHeight: 1 }}>ii</div>
            <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9, marginTop: 6 }}>LOOT</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* the only explicit dismiss */}
        <button onClick={onCarryOn}
          style={{
            all: 'unset', cursor: 'pointer', textAlign: 'center',
            padding: '12px 0',
            background: AXM.bg,
            border: `2px solid ${AXM.parchment}`,
            color: AXM.parchment,
            fontFamily: 'var(--f-gothic)', fontSize: 16, letterSpacing: 2,
          }}>
          ✠ CARRY ON
        </button>
      </div>
    </>);
}

// Placeholder shown UNDER the encounter modal when on the strife tab —
// the modal covers it, so this only needs to be a dim, in-keeping backdrop
// (visible for a frame at modal-open / modal-close).
function PtStrifeUnderlay() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg }} className="axm-hatch" />);
}

// Empty STRIFE tab — shown when no encounter is in progress.
function PtStrifeEmpty() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: 20, display: 'flex', flexDirection: 'column' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ STILLNESS</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 26, color: AXM.parchment, marginTop: 4 }}>Nothing strikes.</div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 6, fontSize: 13 }}>
        This tab waits for an encounter. Tap a figure on the map until something looks back.
      </div>
      <div style={{ flex: 1 }} />
      <div className="axm-mono" style={{ color: AXM.ash, fontSize: 10, letterSpacing: 1.4, textAlign: 'center', paddingBottom: 60 }}>
        — STRIFE is the way back in, when one begins. —
      </div>
    </div>);
}

function PtToast({ text }) {
  return (
    <div style={{
      position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      padding: '6px 14px', background: AXM.bg, border: `1px solid ${AXM.bone}`, zIndex: 70,
      animation: 'fade 200ms ease-out'
    }}>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12 }}>{text}</span>
    </div>);

}

// ─── Tab bar hit overlay ─────────────────────────────────────────────
function PtTabHits({ onPick, combatTabShown }) {
  // Four slots — first is wilds or strife depending on combat state.
  const firstKey = combatTabShown ? 'strife' : 'wilds';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 72, zIndex: 35,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)'
    }}>
      {[firstKey, 'self', 'memoir', 'satchel'].map((k) =>
      <button key={k} onClick={() => onPick(k)} style={{ background: 'transparent', border: 0, cursor: 'pointer' }} aria-label={k} />
      )}
    </div>);

}

// ─── Notes panel ─────────────────────────────────────────────────────
function PtNotes({ route, phase, encounter }) {
  return (
    <div style={{ width: 340, color: '#5a4a2a', fontFamily: 'var(--f-serif)' }}>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 30, color: '#2a251f' }}>Try it.</div>
      <div style={{ fontStyle: 'italic', marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
        Tap an available node (sulfur ring) on the map to open an encounter.
        The seal that opens stays closed around the entire fight — intro,
        combat, aftermath — and only the <b>carry on</b> button at the end
        releases it.
      </div>
      <div style={{ marginTop: 18, padding: 12, background: '#fef4a8', borderLeft: '3px solid #c96442', fontSize: 13 }}>
        <b>Now:</b> {label(route, phase, encounter)}
      </div>
      <ul style={{ marginTop: 18, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
        <li>Tap the figure on the map → modal opens at <i>intro</i>.</li>
        <li>FIGHT → same modal, body swaps to <i>combat</i>; the binding seal stays.</li>
        <li>Round III → seal turns sulfur; body swaps to the <i>aftermath</i>.</li>
        <li>While in combat, peek at SELF / SATCHEL — the modal hides but the
            fight is held. Tap STRIFE to return to the seal.</li>
        <li>Hearth and chest still flow through the paced shell, separately.</li>
        <li>Crucible <b>OPEN ▸</b> (action phase) opens a sub-modal.</li>
      </ul>
      <div style={{ marginTop: 18, fontSize: 12, color: '#7a6a4a' }}>
        Architecturally: <span style={{ fontFamily: 'var(--f-mono)' }}>encounter = &#123; node, phase &#125;</span> — one
        modal, three sub-views; the route never owns the combat.
      </div>
      <div style={{ marginTop: 16, fontSize: 12 }}>
        <a href="index.html" style={{ color: '#2a251f' }}>← Back to design canvas</a>
      </div>
    </div>);

}
function label(route, phase, encounter) {
  if (encounter) {
    if (encounter.phase === 'intro') return 'Encounter · intro (the seal is fresh)';
    if (encounter.phase === 'combat') {
      return {
        choosing_stance: 'Encounter · combat · stand (pick a stance)',
        choosing_action: 'Encounter · combat · do (pick an action)',
        choosing_skill: 'Encounter · combat · craft (pick a skill)',
        resolving: 'Encounter · combat · let (commit the round)',
      }[phase] || 'Encounter · combat';
    }
    if (encounter.phase === 'aftermath') return 'Encounter · aftermath (carry on to release the seal)';
  }
  if (route === 'wilds') return 'Wilds tab · map open';
  if (route === 'self') return 'Self tab · the pilgrim';
  if (route === 'memoir') return 'Memoir · the book of deeds';
  if (route === 'satchel') return 'Satchel · the carried';
  if (route === 'strife') return 'Strife tab · stillness (no fight begun)';
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
ptRoot.render(<Prototype />);