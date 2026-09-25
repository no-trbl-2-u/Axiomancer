/* app.jsx — root canvas composition.
   All artboards live here, grouped into DCSections. */

const { useState: appUseS } = React;

// Frame wraps a screen in the PhoneFrame at the right tab + focus state
function PF({ tab = 'wilds', focus = null, combatTab = null, children, time }) {
  return <PhoneFrame tabBar={tab} focus={focus} combatTab={combatTab} statusTime={time}>{children}</PhoneFrame>;
}

function App() {
  return (
    <DesignCanvas>

      {/* ── DECISIONS ── */}
      <DCSection id="decisions" title="Decisions & rules" subtitle="The opinionated frame. Strings ↗ below. Flow map ↗ below.">
        <DCArtboard id="decisions-doc" label="docs/design.md" width={720} height={2500}>
          <DecisionsDoc/>
        </DCArtboard>
        <DCArtboard id="flow-map" label="Flow map" width={1080} height={760}>
          <FlowMap/>
        </DCArtboard>
      </DCSection>

      {/* ── WILDS ── */}
      <DCSection id="wilds" title="WILDS · Exploration" subtitle="Map persists behind every modal. The drawer is a 3-card peek, never paginated.">
        <DCArtboard id="wilds-canon" label="Canonical · mid-route" width={420} height={870}>
          <PF tab="wilds"><ScreenWilds variant="canonical"/></PF>
        </DCArtboard>
        <DCArtboard id="wilds-empty" label="Empty · paths close" width={420} height={870}>
          <PF tab="wilds"><EmptyWilds/></PF>
        </DCArtboard>
        <DCArtboard id="wilds-loading" label="Loading" width={420} height={870}>
          <PF tab="wilds"><LoadingWilds/></PF>
        </DCArtboard>
        <DCArtboard id="wilds-error" label="Error · store fell silent" width={420} height={870}>
          <PF tab="wilds"><ErrorWilds/></PF>
        </DCArtboard>
        <DCArtboard id="wilds-codex" label="Aesthetic B · cold codex" width={420} height={870}>
          <PF tab="wilds"><ScreenWildsCodex/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── STRIFE ── */}
      <DCSection id="strife" title="STRIFE · Combat" subtitle="Vertical phase stack; past phases collapse to a one-line summary. Crucible strip lives above DO.">
        <DCArtboard id="strife-stance" label="I · STAND" width={420} height={870}>
          <PF tab="strife"><ScreenStrife phase="choosing_stance"/></PF>
        </DCArtboard>
        <DCArtboard id="strife-action" label="II · DO  · canonical" width={420} height={870}>
          <PF tab="strife"><ScreenStrife phase="choosing_action"/></PF>
        </DCArtboard>
        <DCArtboard id="strife-skill"  label="III · CRAFT" width={420} height={870}>
          <PF tab="strife"><ScreenStrife phase="choosing_skill"/></PF>
        </DCArtboard>
        <DCArtboard id="strife-resolve" label="IV · LET" width={420} height={870}>
          <PF tab="strife"><ScreenStrife phase="resolving"/></PF>
        </DCArtboard>
        <DCArtboard id="strife-empty" label="Empty · no fight" width={420} height={870}>
          <PF tab="strife"><EmptyStrife/></PF>
        </DCArtboard>
        <DCArtboard id="strife-codex" label="Aesthetic B · cold codex" width={420} height={870}>
          <PF tab="strife"><ScreenStrifeCodex phase="choosing_action"/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── SELF ── */}
      <DCSection id="self" title="SELF · Character" subtitle="Hero card · accordion below. Two sections open by default.">
        <DCArtboard id="self-canon" label="Canonical" width={420} height={870}>
          <PF tab="self"><ScreenSelf/></PF>
        </DCArtboard>
        <DCArtboard id="self-empty" label="Fresh start" width={420} height={870}>
          <PF tab="self"><EmptySelf/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── SATCHEL ── */}
      <DCSection id="satchel" title="SATCHEL · Inventory" subtitle="Renamed from SACK. Tabs hairline; categories themed; counts mono.">
        <DCArtboard id="sat-canon" label="Canonical" width={420} height={870}>
          <PF tab="satchel"><ScreenSatchel/></PF>
        </DCArtboard>
        <DCArtboard id="sat-empty" label="Empty satchel" width={420} height={870}>
          <PF tab="satchel"><EmptySatchel/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── EVENT ── */}
      <DCSection id="event" title="EVENT · Two shells" subtitle="Combat-adjacent shell (encounter / hazard) · Paced shell (everything else). Map peeks behind both.">
        <DCArtboard id="ev-encounter" label="Combat-adjacent · encounter" width={420} height={870}>
          <PF tab="wilds" combatTab={true}><EventCombatAdjacent kind="encounter"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-rest" label="Paced · rest" width={420} height={870}>
          <PF tab="wilds"><EventPaced kind="rest"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-village" label="Paced · village" width={420} height={870}>
          <PF tab="wilds"><EventPaced kind="village"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-cutscene" label="Paced · cutscene" width={420} height={870}>
          <PF tab="wilds"><EventPaced kind="cutscene"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-interaction" label="Paced · interaction" width={420} height={870}>
          <PF tab="wilds"><EventPaced kind="interaction"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-loot" label="Paced · loot-cache" width={420} height={870}>
          <PF tab="wilds"><EventPaced kind="loot-cache"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-gathering" label="Paced · gathering" width={420} height={870}>
          <PF tab="wilds"><EventPaced kind="gathering"/></PF>
        </DCArtboard>
        <DCArtboard id="ev-encounter-codex" label="Combat-adjacent · cold codex" width={420} height={870}>
          <PF tab="wilds" combatTab={true}><EventCodex kind="encounter"/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── CRUCIBLE ── */}
      <DCSection id="crucible" title="CRUCIBLE · Modal" subtitle="Reference, not action. Inline strip lives in STRIFE.">
        <DCArtboard id="cru-canon" label="Canonical" width={420} height={870}>
          <PF tab="strife"><ScreenCrucible/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── STORYBOARD: seam motion ── */}
      <DCSection id="seam" title="Storyboard · Map → event → combat" subtitle="The seam in four frames. Diegetic stack: map persists behind, dimmed.">
        <DCArtboard id="seam-1" label="i · tap" width={420} height={870}>
          <PF tab="wilds"><ScreenWilds variant="canonical"/></PF>
        </DCArtboard>
        <DCArtboard id="seam-2" label="ii · event rises" width={420} height={870}>
          <PF tab="wilds" combatTab={true}><EventCombatAdjacent kind="encounter"/></PF>
        </DCArtboard>
        <DCArtboard id="seam-3" label="iii · combat replaces" width={420} height={870}>
          <PF tab="strife"><ScreenStrife phase="choosing_stance"/></PF>
        </DCArtboard>
        <DCArtboard id="seam-4" label="iv · recede to map" width={420} height={870}>
          <PF tab="wilds"><ScreenWildsAfter/></PF>
        </DCArtboard>
      </DCSection>

      {/* ── STRINGS ── */}
      <DCSection id="strings" title="Strings · per-screen" subtitle="VM keys → visible label → a11y note. Every label belongs to a presenter.">
        <DCArtboard id="str-wilds"    label="WILDS"    width={640} height={680}><StringsTable title="WILDS · exploration" rows={STR_WILDS}/></DCArtboard>
        <DCArtboard id="str-strife"   label="STRIFE"   width={640} height={1200}><StringsTable title="STRIFE · combat" rows={STR_STRIFE}/></DCArtboard>
        <DCArtboard id="str-event"    label="EVENT"    width={640} height={780}><StringsTable title="EVENT · modal shells" rows={STR_EVENT}/></DCArtboard>
        <DCArtboard id="str-self"     label="SELF"     width={640} height={700}><StringsTable title="SELF · character" rows={STR_SELF}/></DCArtboard>
        <DCArtboard id="str-satchel"  label="SATCHEL"  width={640} height={780}><StringsTable title="SATCHEL · inventory" rows={STR_SATCHEL}/></DCArtboard>
        <DCArtboard id="str-crucible" label="CRUCIBLE" width={640} height={700}><StringsTable title="CRUCIBLE · modal" rows={STR_CRUCIBLE}/></DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

// ─── State variants ────────────────────────────────────────────────
function EmptyWilds() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 20px' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ ASH MARCHES · DAY xii</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4 }}>The Crow-Gate Wood</div>
      <div style={{ margin: '14px 0', height: 320, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="axm-hatch">
        <div style={{ textAlign: 'center' }}>
          <div className="axm-caption" style={{ color: AXM.bone, fontSize: 10 }}>NO ROADS</div>
          <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 6, fontSize: 14 }}>the paths close.</div>
          <div style={{ marginTop: 18 }}>
            <button style={{ padding: '8px 18px', border: `1px solid ${AXM.sulfur}`, color: AXM.sulfur }} className="axm-caption">REST · OPEN A WAY</button>
          </div>
        </div>
      </div>
      <SectionLabel>WHITHER, PILGRIM?</SectionLabel>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 8, fontSize: 13 }}>The map gives nothing further. Rest or return.</div>
    </div>
  );
}

function LoadingWilds() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 20px' }}>
      <SkeletonLine w={140} h={9} dim/>
      <SkeletonLine w={220} h={20} t={6}/>
      <div style={{ margin: '14px 0', height: 320, background: AXM.deepBg, border: `1px solid ${AXM.ash}` }} className="axm-hatch"/>
      <SkeletonLine w={140} h={9} dim t={4}/>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ height: 56, background: AXM.panelBg, border: `1px solid ${AXM.rule}`, borderLeft: `2px solid ${AXM.ash}`, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <SkeletonLine w={200} h={11}/>
            <SkeletonLine w={120} h={8} dim/>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorWilds() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 20px' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ AN OMISSION</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4 }}>The Crow-Gate Wood</div>
      <div style={{ margin: '14px 0', minHeight: 320, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 320, padding: 26, background: AXM.panelBg, border: `1px solid ${AXM.blood}`, textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto', display: 'block' }}>
            <path d="M24 4 L 44 40 L 4 40 Z" stroke={AXM.blood} strokeWidth="2" fill="none"/>
            <path d="M24 18 L 24 28 M 24 33 L 24 36" stroke={AXM.blood} strokeWidth="2"/>
          </svg>
          <div className="axm-eyebrow" style={{ color: AXM.blood, marginTop: 14, fontSize: 11 }}>THE STORE FELL SILENT</div>
          <div className="axm-bodyit" style={{ color: AXM.parchment, marginTop: 10, fontSize: 13 }}>
            The map cannot be read. The pilgrimage stands still until it speaks again.
          </div>
          <div style={{ marginTop: 18 }}>
            <button style={{ padding: '10px 22px', border: `1px solid ${AXM.parchment}`, color: AXM.parchment }} className="axm-caption">TRY THE SILENCE AGAIN</button>
          </div>
          <div className="axm-mono" style={{ color: AXM.bone, marginTop: 10, fontSize: 9 }}>err · world.load</div>
        </div>
      </div>
    </div>
  );
}

function ScreenWildsAfter() {
  // Map after combat: consumed node greyed, current advanced, fresh blurb
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 20px 0' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ ASH MARCHES · DAY xii</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4 }}>The Crow-Gate Wood</div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 2, fontSize: 12 }}>iii xp gained · the larch-stalker fell.</div>
      <div style={{ margin: '12px -4px 0', height: 320, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative' }} className="axm-hatch">
        <NodeGraph variant="after"/>
      </div>
      <div style={{ marginTop: 14 }}>
        <SectionLabel>WHITHER, PILGRIM?</SectionLabel>
      </div>
    </div>
  );
}

// ─── STRIFE empty ──
function EmptyStrife() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ STILLNESS</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 26, color: AXM.parchment, marginTop: 4 }}>Nothing strikes.</div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 6, fontSize: 13 }}>This tab waits for an encounter. Walk on the map until something looks back.</div>
      <div style={{ flex: 1 }} />
      <div style={{ alignSelf: 'center', marginBottom: 60 }}>
        <button style={{ padding: '12px 22px', border: `1px solid ${AXM.parchment}`, color: AXM.parchment }} className="axm-caption">RETURN TO THE WILDS ▸</button>
      </div>
    </div>
  );
}

// ─── SELF empty ──
function EmptySelf() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 20px' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ THE PILGRIM · BORN HOUR</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--f-gothic)', fontSize: 28, color: AXM.parchment }}>—</span>
        <span className="axm-mono" style={{ color: AXM.bone }}>· lvl. i</span>
      </div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 6, fontSize: 13 }}>Unnamed. Three stats stand even. Nothing learned, nothing worn.</div>
      <div style={{ marginTop: 18, padding: 14, border: `1px dashed ${AXM.sulfur}` }}>
        <div className="axm-caption" style={{ color: AXM.sulfur, fontSize: 10 }}>OPENING RITES</div>
        <ul style={{ color: AXM.parchment, fontSize: 13, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
          <li>Choose a name.</li>
          <li>Allot the three stats — heart, body, mind. Six points between them.</li>
          <li>The first weapon is given. The first blessing chosen.</li>
        </ul>
        <button style={{ marginTop: 10, padding: '10px 18px', color: AXM.sulfur, border: `1px solid ${AXM.sulfur}` }} className="axm-caption">BEGIN ▸</button>
      </div>
    </div>
  );
}

function EmptySatchel() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 20px' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ WHAT IS CARRIED</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4 }}>The Satchel</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        <MetaCellEmpty label="SHILLINGS" value="·"/>
        <MetaCellEmpty label="BURDEN" value="0 / xxv"/>
        <MetaCellEmpty label="SLOTS" value="0 / xl"/>
      </div>
      <div style={{ marginTop: 24, padding: 36, border: `1px solid ${AXM.ash}`, background: AXM.panelBg, textAlign: 'center' }} className="axm-hatch">
        <div style={{ fontSize: 38, color: AXM.bone, fontFamily: 'var(--f-gothic)' }}>—</div>
        <div className="axm-eyebrow" style={{ color: AXM.bone, marginTop: 6 }}>EMPTY</div>
        <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 10, fontSize: 13 }}>a hollow satchel.</div>
      </div>
    </div>
  );
}
function MetaCellEmpty({ label, value }) {
  return (
    <div style={{ flex: 1, padding: '6px 10px', border: `1px solid ${AXM.ash}`, background: AXM.deepBg, opacity: 0.6 }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>{label}</div>
      <div className="axm-mono-lg" style={{ color: AXM.bone, fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SkeletonLine({ w, h, dim, t = 0 }) {
  return (
    <div style={{
      width: w, height: h, marginTop: t,
      background: dim ? 'rgba(232,223,200,0.06)' : 'rgba(232,223,200,0.14)',
    }}/>
  );
}

// ─── COLD CODEX VARIANTS (Aesthetic B) ──
// Cold codex: terminal-like cells, mono-leaning, less ornament, more cold structure.
function ScreenWildsCodex() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '14px 16px', fontFamily: 'var(--f-mono)' }}>
      <div className="axm-mono" style={{ color: AXM.bone, fontSize: 10, letterSpacing: '0.1em' }}>REGION/ASH-MARCHES · DAY=012 · STATE=UNRESTED</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 22, color: AXM.parchment, marginTop: 4 }}>crow-gate.wood</div>
      <div style={{ margin: '10px 0', height: 300, background: AXM.deepBg, border: `1px solid ${AXM.parchment}`, position: 'relative' }}>
        <CodexGrid/>
        <div style={{ position: 'absolute', top: 6, left: 6 }} className="axm-mono">
          <span style={{ color: AXM.bone, fontSize: 9 }}>BBOX 0,0 → 358,300</span>
        </div>
        <div style={{ position: 'absolute', bottom: 6, right: 6 }} className="axm-mono">
          <span style={{ color: AXM.bone, fontSize: 9 }}>SCALE 1:iii lg</span>
        </div>
      </div>
      <div className="axm-mono" style={{ color: AXM.parchment, fontSize: 11, padding: '6px 0' }}>OPTIONS · 03</div>
      <div style={{ borderTop: `1px solid ${AXM.parchment}` }}>
        <CodexStep n="01" kind="encounter" title="figure / larches" hint="ENCOUNTER" leagues="I" accent={AXM.blood}/>
        <CodexStep n="02" kind="rest" title="ring / coals" hint="REST" leagues="I"/>
        <CodexStep n="03" kind="treasure" title="chest / buried" hint="LOOT.RISK" leagues="II"/>
      </div>
    </div>
  );
}

function CodexGrid() {
  // engineering-document grid
  return (
    <svg width="100%" height="100%" viewBox="0 0 358 300" style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1={i * 30} y1={0} x2={i * 30} y2={300} stroke={AXM.rule} strokeWidth="0.5"/>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={i} x1={0} y1={i * 30} x2={358} y2={i * 30} stroke={AXM.rule} strokeWidth="0.5"/>
      ))}
      <NodeGraph variant="codex"/>
    </svg>
  );
}

function CodexStep({ n, kind, title, hint, leagues, accent }) {
  const c = accent || AXM.parchment;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '30px 1fr auto',
      gap: 10, padding: '10px 4px', borderBottom: `1px solid ${AXM.rule}`,
      alignItems: 'center',
    }}>
      <span className="axm-mono" style={{ color: AXM.bone, fontSize: 11 }}>{n}</span>
      <div>
        <div className="axm-mono" style={{ color: c, fontSize: 12 }}>{title}</div>
        <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, marginTop: 2 }}>{hint}</div>
      </div>
      <div className="axm-mono" style={{ color: c, fontSize: 14 }}>{leagues}·LG</div>
    </div>
  );
}

function ScreenStrifeCodex({ phase = 'choosing_action' }) {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, padding: '12px 14px', fontFamily: 'var(--f-mono)' }}>
      <div className="axm-mono" style={{ color: AXM.bone, fontSize: 10 }}>
        ENC=larch.stalker · ROUND=iv/iv · STATE={phase}
      </div>

      <div style={{ marginTop: 6, padding: 10, border: `1px solid ${AXM.blood}`, background: AXM.deepBg, display: 'flex', gap: 10 }}>
        <div style={{ width: 56, height: 56, background: AXM.bg, border: `1px solid ${AXM.ash}` }}><EnemyGlyph/></div>
        <div style={{ flex: 1 }}>
          <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9 }}>ID/0x4a · STANCE=BODY</div>
          <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 18, color: AXM.parchment }}>larch-stalker</div>
          <div style={{ marginTop: 6 }}><StatBar value={42} max={70} color={AXM.blood} label="HP" valueLabel="42 / 70"/></div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="axm-mono" style={{ color: AXM.parchment, fontSize: 11, padding: '6px 0' }}>PHASES</div>
        <CodexPhaseRow n="i" k="STAND" done state="BODY"/>
        <CodexPhaseRow n="ii" k="DO" current/>
        <CodexPhaseRow n="iii" k="CRAFT"/>
        <CodexPhaseRow n="iv" k="LET"/>
      </div>

      <div style={{ marginTop: 8, padding: 8, border: `1px solid ${AXM.parchment}` }}>
        <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, padding: '0 0 4px' }}>CRUCIBLE · POOL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
          {[['EMBER',3, AXM.blood],['MIRE',1, AXM.rust],['ASH',4, AXM.bone],['LUNE',2, AXM.parchment],['PITH',0, AXM.sulfur]].map(([n,c,col]) => (
            <div key={n} style={{ padding: 4, border: `1px solid ${col}`, textAlign: 'center' }}>
              <div className="axm-mono" style={{ fontSize: 9, color: AXM.bone }}>{n}</div>
              <div className="axm-mono" style={{ fontSize: 13, color: c > 0 ? col : AXM.ash }}>{c}</div>
            </div>
          ))}
        </div>
        <div className="axm-mono" style={{ color: AXM.parchment, fontSize: 11, padding: '8px 0 4px' }}>ACTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
          {['STRIKE','WARD','CRAFT','DRAW','FLEE'].map((a, i) => (
            <div key={a} style={{ padding: '8px 0', textAlign: 'center', border: `1px solid ${i === 2 ? AXM.sulfur : AXM.ash}`, color: i === 2 ? AXM.sulfur : (i === 4 ? AXM.bone : AXM.parchment) }} className="axm-mono">
              <div style={{ fontSize: 10 }}>{`0${i+1}`}</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>{a}</div>
            </div>
          ))}
        </div>
        <div className="axm-mono" style={{ color: AXM.sulfur, fontSize: 10, padding: '6px 0 0' }}>ADV BODY → HEART (+ii)</div>
      </div>

      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 80 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><StatBar value={58} max={80} color={AXM.blood} label="HP" valueLabel="58/80"/></div>
          <div style={{ flex: 1 }}><StatBar value={34} max={50} color={AXM.sulfur} label="MN" valueLabel="34/50"/></div>
        </div>
      </div>
    </div>
  );
}

function CodexPhaseRow({ n, k, done, current, state }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '24px 1fr auto',
      padding: '6px 8px', border: `1px solid ${current ? AXM.sulfur : AXM.ash}`,
      background: current ? AXM.deepBg : 'transparent', marginBottom: 4,
    }}>
      <span className="axm-mono" style={{ color: AXM.bone, fontSize: 11 }}>{n}</span>
      <span className="axm-mono" style={{ color: current ? AXM.sulfur : (done ? AXM.bone : AXM.parchment), fontSize: 11 }}>{k}</span>
      <span className="axm-mono" style={{ color: done ? AXM.parchment : AXM.bone, fontSize: 10 }}>{done ? '✓ ' + state : current ? '◉ ACTIVE' : '· pending'}</span>
    </div>
  );
}

function EventCodex({ kind = 'encounter' }) {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden' }}>
      <MapPeek/>
      <div style={{ position: 'absolute', inset: '40px 12px 12px', background: AXM.bg, border: `1px solid ${AXM.blood}`, fontFamily: 'var(--f-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${AXM.parchment}`, background: AXM.deepBg }}>
          <span className="axm-mono" style={{ color: AXM.blood, fontSize: 10 }}>EVENT/ENCOUNTER · 0x4a</span>
          <span className="axm-mono" style={{ color: AXM.bone, fontSize: 10 }}>NODE/023</span>
        </div>
        <div style={{ height: 200, position: 'relative' }} className="axm-hatch-strong">
          <LarchStalkerIllustration/>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" viewBox="0 0 358 200">
              <line x1="0" y1="100" x2="358" y2="100" stroke={AXM.parchment} strokeWidth="0.4" strokeDasharray="2 4"/>
              <line x1="179" y1="0" x2="179" y2="200" stroke={AXM.parchment} strokeWidth="0.4" strokeDasharray="2 4"/>
              <text x="6" y="14" fontSize="8" fill={AXM.parchment} fontFamily="var(--f-mono)">0,0</text>
              <text x="332" y="194" fontSize="8" fill={AXM.parchment} fontFamily="var(--f-mono)">358,200</text>
            </svg>
          </div>
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${AXM.parchment}` }}>
          <div className="axm-mono" style={{ color: AXM.bone, fontSize: 10 }}>NAME</div>
          <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment }}>the larch-stalker</div>
          <div className="axm-mono" style={{ color: AXM.parchment, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
            STAT/HP=70 · STANCE=BODY · MIEN=cold · CARRIED=bell, knife · ATT=v/lv · ADV=heart→body
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <CodexChoice label="01 · FIGHT" tone="blood" hint="OUTCOME=combat / xp ix"/>
            <CodexChoice label="02 · FLEE" tone="bone" hint="OUTCOME=forfeit · -ii morale"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodexChoice({ label, tone, hint }) {
  const c = tone === 'blood' ? AXM.blood : AXM.bone;
  return (
    <div style={{ padding: '10px 10px', border: `1px solid ${c}`, background: AXM.deepBg }}>
      <div className="axm-mono" style={{ color: c, fontSize: 12 }}>{label}</div>
      <div className="axm-mono" style={{ color: AXM.bone, fontSize: 9, marginTop: 4 }}>{hint}</div>
    </div>
  );
}

Object.assign(window, {
  EmptyWilds, LoadingWilds, ErrorWilds, EmptyStrife, EmptySelf, EmptySatchel,
  ScreenWildsAfter, ScreenWildsCodex, ScreenStrifeCodex, EventCodex,
});

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
