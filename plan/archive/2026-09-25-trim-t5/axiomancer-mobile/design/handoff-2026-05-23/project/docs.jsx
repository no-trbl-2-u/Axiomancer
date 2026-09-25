/* docs.jsx — Decisions doc, flow map, strings tables. Each component
   produces an artboard-ready block. */

function DecisionsDoc() {
  return (
    <div style={{ width: 720, padding: 32, background: AXM.bg, color: AXM.parchment, minHeight: 880, fontFamily: 'var(--f-serif)' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ DOCS / DESIGN</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 36, lineHeight: 1, color: AXM.parchment, marginTop: 6 }}>Locked decisions</div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 4 }}>To live in docs/design.md. Pinned by bearings.md. Edit only with a rationale row.</div>

      <Sec n="I" t="Voice">
        <li>Cold, terse, archaic — closer to a margin-gloss than a stage line.</li>
        <li><i>No</i> second-person archaic pronouns. Banned: <b>thee, thou, thy, thine, ye</b>.</li>
        <li>Lowercase Roman numerals for in-world counts (xliv, iii, mccxl). Latin-script Arabic when out-of-world.</li>
        <li>Drop the modifier rather than add one. <i>The air shivers.</i> not <i>A pale cold air shivers across the field.</i></li>
        <li>Capitals only as eyebrows and labels. Mid-sentence small caps are forbidden.</li>
      </Sec>

      <Sec n="II" t="Palette">
        <Swatch hex="#0a0a0a" name="bg"        use="near-black background"/>
        <Swatch hex="#100d0a" name="panelBg"   use="panel fill, slightly warmer"/>
        <Swatch hex="#06050a" name="deepBg"    use="void inside frames; behind crucible"/>
        <Swatch hex="#e8dfc8" name="parchment" use="primary text · active glyph"/>
        <Swatch hex="#8a8273" name="bone"      use="secondary text · inactive · hint"/>
        <Swatch hex="#3a3530" name="ash"       use="borders · disabled · locked"/>
        <Swatch hex="#c0152a" name="blood"     use="VITAE · danger · bleed · combat-adjacent"/>
        <Swatch hex="#d4c026" name="sulfur"    use="MANA · selected · current · friendship-cap"/>
        <Swatch hex="#9e3a1a" name="rust"      use="friendship · debuff outline"/>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12, marginTop: 6 }}>No new colours added in this pass. Tokens map 1:1 to <code>theme/axm.ts</code>.</div>
      </Sec>

      <Sec n="III" t="Type scale">
        <TypeRow font="var(--f-gothic)" size={32} name="display" use="screen-name once per route"/>
        <TypeRow font="var(--f-gothic)" size={22} name="h1"      use="event titles · enemy names"/>
        <TypeRow font="var(--f-serif)"  size={18} name="h2"      use="card title (when needed)"/>
        <TypeRow font="var(--f-serif)"  size={14} name="body"    use="prose · choice hints"/>
        <TypeRow font="var(--f-serif)"  size={14} name="bodyIt"  use="atmospheric prose · gloss" italic/>
        <TypeRow font="var(--f-sans)"   size={12} name="caption" use="button labels · table heads"/>
        <TypeRow font="var(--f-sans)"   size={10} name="eyebrow" use="section labels · meta"/>
        <TypeRow font="var(--f-mono)"   size={12} name="mono"    use="numerics, Roman or Arabic"/>
        <TypeRow font="var(--f-mono)"   size={20} name="monoLg"  use="big numerics — HP, damage, level"/>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12, marginTop: 6 }}>No new tokens proposed. New: <code>--axm-rule</code> and <code>--axm-rule-strong</code> for hairline rules; both derive from parchment.</div>
      </Sec>

      <Sec n="IV" t="Tab labels — final · with mutex">
        <p>Three visible slots: <b>[WILDS · STRIFE]</b> · <b>SELF</b> · <b>SATCHEL</b>.</p>
        <p>The first slot is a single tab that swaps between WILDS and STRIFE — never both visible.</p>
        <ul>
          <li>The slot reads <b>STRIFE</b> when a combat is in progress <i>or</i> a combat-adjacent event (<i>encounter / hazard</i>) is on screen. The slot tick goes <span style={{color: AXM.blood}}>blood</span> instead of sulfur.</li>
          <li>The slot reads <b>WILDS</b> everywhere else: open map, paced events (<i>rest / village / cutscene / interaction / gathering / loot-cache</i>), self, satchel.</li>
        </ul>
        <p style={{ color: AXM.bone, fontStyle: 'italic' }}>SACK is gone. SATCHEL keeps the noun, drops the slang.</p>
        <p style={{ color: AXM.bone, fontStyle: 'italic' }}>The swap is the only chrome signal that combat is imminent — no badges, no dots. The slot itself <i>turns</i>.</p>
      </Sec>

      <Sec n="V" t="Seam motion — diegetic stack">
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          <li>Tapping a node fades the drawer; the map stays. The event sheet rises from the tapped node, anchored to its position.</li>
          <li>Map is dimmed to 35% behind the sheet; <i>not</i> blurred (blur is GPU-expensive on low-end Androids).</li>
          <li>If the event commits to combat, the sheet swaps illustration for the enemy panel and tab-bar swaps WILDS → STRIFE without a page change. No second cut.</li>
          <li>On combat end, the strife screen <i>recedes</i> back into the same anchor point — map fades back up to full opacity, drawer redrawn with the consumed node greyed.</li>
        </ol>
        <p>Only two transitions exist in the seam: <i>fade</i> (opacity 250ms) and <i>rise</i> (translateY 280ms ease-out). No spring, no scale, no parallax.</p>
      </Sec>

      <Sec n="VI" t="Combat phase — vertical stack">
        <p>The horizontal phase carousel ships poorly. Replacement:</p>
        <ul>
          <li><b>Four phases live as collapsible rows</b>, top to bottom: STAND · DO · CRAFT · LET.</li>
          <li>Past phases collapse to a one-line summary (<i>BODY</i> in the STAND row once committed).</li>
          <li>Current phase is the only expanded row; selection lives inside it.</li>
          <li>Skill row appears only if the chosen action is <i>CRAFT</i>; otherwise it stays collapsed.</li>
          <li>To reselect a past phase, tap its row — it expands, downstream rows collapse to ash.</li>
        </ul>
        <p style={{ color: AXM.bone, fontStyle: 'italic' }}>Discoverability win: there is no hidden swipe. The reselect affordance is a visible row.</p>
      </Sec>

      <Sec n="VII" t="Crucible — inline strip">
        <p>The Crucible appears as a five-cell strip <i>above</i> the action picker — always when the player is in combat, never anywhere else.</p>
        <p>The strip shows token glyph + current count. Cost rows in the SKILL phase compare directly against it.</p>
        <p>The Crucible modal still exists, reachable from the strip's <code>OPEN ▸</code> button or from the SELF tab (for accrual rules). It is reference, not action.</p>
      </Sec>

      <Sec n="VIII" t="Event modal — two shells">
        <p><b>Combat-adjacent shell</b> · for <i>encounter, hazard</i>. Tighter, vertical illustration, blood-tinged eyebrow, FIGHT/FLEE rows tall and bordered. The shell carries a corner banner <i>STRIFE STIRS</i> when combat will resolve.</p>
        <p><b>Paced shell</b> · for <i>interaction, rest, cutscene, village, gathering, loot-cache</i>. Wider illustration, parchment eyebrow, choice rows are uniform. Cutscenes use no choices except <i>WITNESS</i>.</p>
        <p>Both shells inherit the diegetic-stack rule. The map peeks behind both.</p>
      </Sec>

      <Sec n="IX" t="Character — progressive disclosure">
        <p>Hero card at top: name · level · XP bar · stance triangle with deltas.</p>
        <p>Everything else is an accordion: <i>EQUIPMENT, STATES, MEASURES, TRIALS, SKILLS, CRUCIBLE</i> (link). Two open by default — <i>EQUIPMENT</i> and <i>STATES</i> — since those change between combats. The rest collapse on first paint.</p>
        <p>Unspent stat points get a dashed sulfur prompt directly under the triangle; this is the only modal-summoner on the screen.</p>
      </Sec>

      <Sec n="X" t="Empty / loading / error">
        <p>No screen collapses to a void. Each route ships three baselines:</p>
        <ul>
          <li><b>Empty</b> · the screen renders structure with placeholders. A short italic gloss explains why (<i>nothing to wield</i>, <i>the paths close</i>).</li>
          <li><b>Loading</b> · structure dims to bone; meters become hatched bars; text lines become parchment-faint blocks. No spinners. The status bar gains a small <i>·</i> instead of the moon glyph.</li>
          <li><b>Error</b> · the screen frame remains; content area carries a single torn panel reading <i>THE STORE FELL SILENT.</i> Above it: a labeled retry button.</li>
        </ul>
      </Sec>

      <Sec n="XI" t="Strings ownership">
        <p>Every visible label flows from a presenter VM. Designs ship a strings table per route (next section in this canvas). Inline literals in <code>.tsx</code> are a build-break.</p>
      </Sec>

      <Sec n="XII" t="Accessibility">
        <p>Every interactive node has an accessibilityLabel. Where the visible label is Roman or archaic, the a11y label uses plain English numeric. <code>iv / lxx</code> → <i>"four of seventy"</i>. Stance glyphs label with the stance word and its current advantage.</p>
        <p>Minimum hit target 44pt. The phase-row collapse handle counts as a hit target the full row width.</p>
      </Sec>
    </div>
  );
}

function Sec({ n, t, children }) {
  return (
    <section style={{ marginTop: 28, borderTop: `1px solid ${AXM.rule}`, paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span className="axm-mono-lg" style={{ color: AXM.sulfur, fontSize: 14 }}>§ {n}</span>
        <span style={{ fontFamily: 'var(--f-gothic)', fontSize: 22, color: AXM.parchment }}>{t}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: AXM.parchment }}>
        {children}
      </div>
    </section>
  );
}

function Swatch({ hex, name, use }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', borderBottom: `1px solid ${AXM.rule}` }}>
      <div style={{ width: 28, height: 28, background: hex, border: `1px solid ${AXM.ash}` }}/>
      <span className="axm-mono" style={{ color: AXM.bone, fontSize: 11, width: 70 }}>{hex}</span>
      <span className="axm-caption" style={{ color: AXM.parchment, fontSize: 11, letterSpacing: '0.14em', width: 110 }}>{name.toUpperCase()}</span>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12 }}>{use}</span>
    </div>
  );
}

function TypeRow({ font, size, name, use, italic }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '4px 0', borderBottom: `1px solid ${AXM.rule}` }}>
      <span style={{ fontFamily: font, fontSize: size, color: AXM.parchment, fontStyle: italic ? 'italic' : 'normal', minWidth: 100 }}>{name}</span>
      <span className="axm-mono" style={{ color: AXM.bone, fontSize: 11, width: 50 }}>{size}px</span>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 12 }}>{use}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FLOW MAP
// ─────────────────────────────────────────────────────────────────────
function FlowMap() {
  return (
    <div style={{ width: 1080, height: 760, background: AXM.bg, color: AXM.parchment, padding: 32, fontFamily: 'var(--f-serif)' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ DOCS / FLOW MAP</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 32, color: AXM.parchment, marginTop: 4 }}>How a player moves</div>
      <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 2 }}>Tabs · modals · the seam between them.</div>

      <svg width="1016" height="630" viewBox="0 0 1016 630" style={{ marginTop: 14 }}>
        <defs>
          <marker id="arr" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L 8 4 L 0 8 Z" fill={AXM.parchment}/>
          </marker>
          <marker id="arr-rust" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L 8 4 L 0 8 Z" fill={AXM.rust}/>
          </marker>
          <marker id="arr-sulfur" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L 8 4 L 0 8 Z" fill={AXM.sulfur}/>
          </marker>
        </defs>

        {/* Tabs row */}
        <FlowNode x={50}  y={40}  w={170} h={70} title="WILDS"   sub="exploration"/>
        <FlowNode x={50}  y={140} w={170} h={70} title="STRIFE"  sub="combat" accent={AXM.blood}/>
        <FlowNode x={50}  y={240} w={170} h={70} title="SELF"    sub="character"/>
        <FlowNode x={50}  y={340} w={170} h={70} title="SATCHEL" sub="inventory"/>

        <text x={50} y={28} className="axm-eyebrow" fill={AXM.bone} fontSize="10" fontFamily="var(--f-sans)" letterSpacing="2">TABS · MUTEX</text>

        {/* Map -> Event -> Combat seam */}
        <FlowNode x={290} y={40}  w={210} h={70} title="MAP NODE"      sub="player taps · enters tile"/>
        <FlowNode x={290} y={140} w={210} h={70} title="EVENT · COMBAT-ADJ"   sub="encounter · hazard" accent={AXM.blood}/>
        <FlowNode x={290} y={240} w={210} h={70} title="EVENT · PACED"  sub="interaction · rest · etc." accent={AXM.rust}/>
        <FlowNode x={290} y={340} w={210} h={70} title="DIALOGUE TREE"  sub="multi-step · NPC"/>

        {/* combat */}
        <FlowNode x={570} y={40}  w={200} h={70} title="STAND" sub="phase i"/>
        <FlowNode x={570} y={130} w={200} h={70} title="DO"    sub="phase ii · crucible visible"/>
        <FlowNode x={570} y={220} w={200} h={70} title="CRAFT" sub="phase iii · skill" accent={AXM.sulfur}/>
        <FlowNode x={570} y={310} w={200} h={70} title="LET"   sub="phase iv · resolve" accent={AXM.blood}/>
        <FlowNode x={570} y={420} w={200} h={70} title="END REPORT" sub="xp · loot · friendship"/>

        {/* modals */}
        <FlowNode x={830} y={40}  w={170} h={70} title="CRUCIBLE" sub="modal · reference"/>
        <FlowNode x={830} y={140} w={170} h={70} title="ITEM CARD" sub="modal · use · equip"/>
        <FlowNode x={830} y={240} w={170} h={70} title="LEVEL-UP" sub="overlay · allot points" accent={AXM.sulfur}/>
        <FlowNode x={830} y={340} w={170} h={70} title="GAME OVER" sub="modal · restart"/>

        {/* edges */}
        <FlowArrow from={[220, 75]}  to={[290, 75]}  />
        <FlowArrow from={[500, 75]}  to={[570, 75]}  />
        <FlowArrow from={[500, 175]} to={[570, 75]}  color={AXM.rust} />
        <FlowArrow from={[670, 110]} to={[670, 130]} />
        <FlowArrow from={[670, 200]} to={[670, 220]} />
        <FlowArrow from={[670, 290]} to={[670, 310]} />
        <FlowArrow from={[670, 380]} to={[670, 420]} color={AXM.blood}/>

        {/* return arrows */}
        <path d="M770 455 Q 900 470 900 240 Q 900 110 500 110" stroke={AXM.parchment} strokeWidth="0.8" fill="none" strokeDasharray="3 3" markerEnd="url(#arr)"/>
        <text x="895" y="500" fontSize="10" fill={AXM.bone} fontFamily="var(--f-sans)" letterSpacing="1.5">RETURN</text>

        {/* paced → dialogue */}
        <FlowArrow from={[395, 310]} to={[395, 340]} color={AXM.rust} />
        <FlowArrow from={[500, 375]} to={[290, 375]} color={AXM.rust} dashed/>

        {/* modals from tabs */}
        <path d="M220 75 Q 380 -10 740 -10 Q 880 -10 880 40" stroke={AXM.parchment} strokeWidth="0.6" fill="none" strokeDasharray="2 4"/>
        <FlowArrow from={[770, 75]} to={[830, 75]} dashed/>
        <FlowArrow from={[220, 175]} to={[830, 175]} dashed/>

        {/* self → level-up */}
        <FlowArrow from={[220, 275]} to={[830, 275]} color={AXM.sulfur} dashed/>

        {/* combat → game over */}
        <FlowArrow from={[770, 455]} to={[830, 375]} color={AXM.blood}/>

        {/* legend */}
        <g transform="translate(50 530)">
          <text fontSize="10" fill={AXM.bone} fontFamily="var(--f-sans)" letterSpacing="2">LEGEND</text>
          <line x1="0" y1="20" x2="40" y2="20" stroke={AXM.parchment} strokeWidth="1" markerEnd="url(#arr)"/>
          <text x="50" y="24" fontSize="11" fill={AXM.parchment} fontFamily="var(--f-serif)">Linear flow</text>
          <line x1="170" y1="20" x2="210" y2="20" stroke={AXM.parchment} strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arr)"/>
          <text x="220" y="24" fontSize="11" fill={AXM.parchment} fontFamily="var(--f-serif)">Modal / overlay</text>
          <line x1="340" y1="20" x2="380" y2="20" stroke={AXM.blood} strokeWidth="1.5" markerEnd="url(#arr-rust)"/>
          <text x="390" y="24" fontSize="11" fill={AXM.parchment} fontFamily="var(--f-serif)">Combat path</text>
          <line x1="510" y1="20" x2="550" y2="20" stroke={AXM.sulfur} strokeWidth="1.5" markerEnd="url(#arr-sulfur)"/>
          <text x="560" y="24" fontSize="11" fill={AXM.parchment} fontFamily="var(--f-serif)">Reward / level path</text>
        </g>

        {/* seam call-out */}
        <g transform="translate(290 575)">
          <rect width="480" height="48" fill={AXM.panelBg} stroke={AXM.sulfur} strokeWidth="1"/>
          <text x="12" y="20" fontSize="10" fill={AXM.sulfur} fontFamily="var(--f-sans)" letterSpacing="2">✠ THE SEAM</text>
          <text x="12" y="36" fontSize="11" fill={AXM.parchment} fontFamily="var(--f-serif)" fontStyle="italic">
            Map → event → combat is one continuous arc · the map persists behind, dimmed, never unmounted.
          </text>
        </g>
      </svg>
    </div>
  );
}

function FlowNode({ x, y, w, h, title, sub, accent }) {
  const c = accent || AXM.parchment;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} fill={AXM.panelBg} stroke={c} strokeWidth="1"/>
      <line x1="0" y1="0" x2="0" y2={h} stroke={c} strokeWidth="3"/>
      <text x="12" y="26" fontSize="14" fill={c} fontFamily="var(--f-sans)" letterSpacing="2">{title}</text>
      <text x="12" y="50" fontSize="11" fill={AXM.bone} fontFamily="var(--f-serif)" fontStyle="italic">{sub}</text>
    </g>
  );
}

function FlowArrow({ from, to, color, dashed }) {
  const c = color || AXM.parchment;
  return (
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
      stroke={c} strokeWidth="1.2"
      strokeDasharray={dashed ? '3 3' : null}
      markerEnd={color === AXM.blood ? 'url(#arr-rust)' : color === AXM.sulfur ? 'url(#arr-sulfur)' : 'url(#arr)'}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// STRINGS — table per screen
// ─────────────────────────────────────────────────────────────────────
function StringsTable({ title, rows }) {
  return (
    <div style={{ width: 640, padding: 24, background: AXM.bg, color: AXM.parchment, fontFamily: 'var(--f-serif)' }}>
      <div className="axm-eyebrow" style={{ color: AXM.bone }}>✠ STRINGS · {title.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 24, color: AXM.parchment, marginTop: 4 }}>{title}</div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1.1fr 2fr 1.4fr', gap: 0, fontSize: 12 }}>
        <Hdr>VM KEY</Hdr><Hdr>VISIBLE</Hdr><Hdr>A11Y / NOTE</Hdr>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <Cell mono>{r[0]}</Cell>
            <Cell>{r[1]}</Cell>
            <Cell italic>{r[2] || '—'}</Cell>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
function Hdr({ children }) {
  return <div style={{ borderBottom: `1px solid ${AXM.parchment}`, padding: '6px 8px' }} className="axm-eyebrow">{children}</div>;
}
function Cell({ children, mono, italic }) {
  return (
    <div style={{
      borderBottom: `1px solid ${AXM.rule}`, padding: '7px 8px',
      fontFamily: mono ? 'var(--f-mono)' : 'var(--f-serif)',
      fontStyle: italic ? 'italic' : 'normal',
      color: italic ? AXM.bone : AXM.parchment,
      fontSize: 11.5, lineHeight: 1.4,
    }}>{children}</div>
  );
}

const STR_WILDS = [
  ['screen.title',           '(none — uses display below)',        'screen reader: "Exploration"'],
  ['eyebrow.region',         '✠ ASH MARCHES · DAY xii',            'day count + region. a11y: "Ash Marches, day twelve"'],
  ['display.zone',           'The Crow-Gate Wood',                  ''],
  ['restState.true',         'rested',                              ''],
  ['restState.false',        'unrested',                            ''],
  ['section.options',        'WHITHER, PILGRIM?',                   'eyebrow above step drawer'],
  ['nodeKind.encounter.hint','a stranger · likely strife',          'tone hint, never determinative'],
  ['nodeKind.rest.hint',     'rest · mend',                         ''],
  ['nodeKind.treasure.hint', 'loot · risk of trap',                 ''],
  ['leagues.label',          'LEAGUES',                             'distance to node'],
  ['mapKey.here',            'HERE',                                'a11y: "Current position"'],
  ['empty.message',          'the paths close.',                    'shown when no available nodes — italic gloss'],
  ['empty.eyebrow',          'NO ROADS',                            ''],
  ['loading.message',        '(no text — structure skeleton)',      'spinner forbidden'],
  ['error.title',            'THE STORE FELL SILENT',               ''],
  ['error.retry',            'TRY THE SILENCE AGAIN',               'a11y: "Retry loading exploration"'],
];

const STR_STRIFE = [
  ['eyebrow.enemy',          'WHAT WAITS',                          ''],
  ['display.enemy',          '{enemy.name}',                        'a11y: "Enemy: {name}, vitae {n} of {max}"'],
  ['bar.vitae',              'VITAE',                               'HP. value rendered as roman numeral'],
  ['bar.mana',               'MANA',                                ''],
  ['enemy.stance.label',     'STANDS',                              ''],
  ['round.label',            'ROUND',                               ''],
  ['phase.stance',           'I · STAND',                           ''],
  ['phase.action',           'II · DO',                             ''],
  ['phase.skill',            'III · CRAFT',                         ''],
  ['phase.resolve',          'IV · LET',                            ''],
  ['stance.heart.label',     'HEART',                               ''],
  ['stance.heart.gloss',     'parley, mercy',                       'tiny serif italic under glyph'],
  ['stance.body.gloss',      'iron, force',                         ''],
  ['stance.mind.gloss',      'cipher, ruse',                        ''],
  ['action.attack',          'STRIKE',                              ''],
  ['action.defend',          'WARD',                                ''],
  ['action.skill',           'CRAFT',                               ''],
  ['action.item',            'DRAW',                                'inventory; renamed from "ITEM"'],
  ['action.flee',            'FLEE',                                'currently no-op; shown dim'],
  ['advantage.label',        'ADVANTAGE',                           ''],
  ['advantage.tag.adv',      '{stance} vs {stance}',                 'e.g. "BODY vs HEART"'],
  ['advantage.gloss',        'iron over mercy.',                    'one of three; ↗ STRINGS · GLOSSES'],
  ['friendship.label',       'FRIENDSHIP',                          ''],
  ['crucible.label',         'CRUCIBLE',                            'strip header'],
  ['crucible.open',          'OPEN ▸',                              ''],
  ['resolve.you',            'YOU',                                 ''],
  ['resolve.vs',             'VS',                                  ''],
  ['resolve.commit',         'LET IT FALL ━━━━━ ▸',                ''],
  ['skill.locked',           'too few {token}',                     'e.g. "too few lune"'],
  ['log.empty',              'The air shivers. Combat begins.',     ''],
  ['victory.title',          'IT IS DONE',                          ''],
  ['defeat.title',           'YOU FALL',                            ''],
];

const STR_EVENT = [
  ['eyebrow.encounter',      'ENCOUNTER',                           ''],
  ['eyebrow.hazard',         'HAZARD',                              ''],
  ['eyebrow.interaction',    'INTERACTION',                         ''],
  ['eyebrow.rest',           'A FIRE LOWERS',                       ''],
  ['eyebrow.cutscene',       'A WITNESSING',                        ''],
  ['eyebrow.village',        'A SETTLEMENT',                        ''],
  ['eyebrow.gathering',      'A SMALL HARVEST',                     ''],
  ['eyebrow.lootCache',      'A FOUND THING',                       ''],
  ['banner.combatPending',   'STRIFE STIRS',                        'top-left flag on combat-adjacent shell'],
  ['choice.fight',           'FIGHT',                               ''],
  ['choice.flee',            'FLEE',                                ''],
  ['choice.walkOn',          'WALK ON',                             'paced default exit'],
  ['choice.witness',         'WITNESS',                             'cutscene only choice'],
  ['choice.take',            'TAKE IT',                             ''],
  ['choice.leave',           'LEAVE',                               'village/loot exit'],
  ['choice.so_be_it',        'SO BE IT',                            'dialogue confirm'],
  ['hint.noCost',            'no cost',                             'italic hint to right of choice row'],
  ['empty.title',            'NO EVENT IN PROGRESS',                'never visible in prod; design has it for QA'],
];

const STR_SELF = [
  ['eyebrow.title',          '✠ THE PILGRIM',                       ''],
  ['display.name',           '{character.name}',                    ''],
  ['display.level',          '· lvl. {n}',                          'lowercase roman in body'],
  ['bar.xp.label',           'WORK · LVL {next}',                   'plain a11y: "Experience to next level"'],
  ['stance.delta.signed',    '+{n} / -{n}',                         'shown only when ≠ 0'],
  ['points.banner',          '{n} POINTS UNSPENT',                  ''],
  ['points.action',          'ALLOT ▸',                             ''],
  ['acc.equipment',          'EQUIPMENT · WORN & WIELDED',          ''],
  ['acc.equipment.sub',      '{worn} of {total} slots',             ''],
  ['acc.states',             'STATES · AFFLICTIONS & BLESSINGS',    ''],
  ['acc.measures',           'MEASURES · ATTACK · SKILL · DEFENSE', ''],
  ['acc.trials',             'TRIALS · SAVES & TESTS',              ''],
  ['acc.skills',             'SKILLS · LEARNED',                    ''],
  ['acc.crucible',           'CRUCIBLE · POOL & ACCRUAL',           'link, opens modal'],
  ['acc.crucible.sub',       'open in modal',                       ''],
  ['slot.empty',             '—',                                   'a11y: "no item equipped"'],
];

const STR_SATCHEL = [
  ['eyebrow.title',          '✠ WHAT IS CARRIED',                   ''],
  ['display.title',          'The Satchel',                         ''],
  ['meta.shillings',         'SHILLINGS',                           ''],
  ['meta.burden',            'BURDEN',                              'a11y: "{n} of {max} carried"'],
  ['meta.slots',             'SLOTS',                               ''],
  ['tab.all',                'ALL',                                 ''],
  ['tab.phials',             'PHIALS',                              'consumable'],
  ['tab.iron',               'IRON',                                'equipment'],
  ['tab.matter',             'MATTER',                              'material'],
  ['tab.kept',               'KEPT',                                'quest items'],
  ['cat.phials',             'PHIALS · DRAUGHTS',                   ''],
  ['cat.iron',               'IRON · WORN & WIELDED',               ''],
  ['cat.matter',             'MATTER · STUFF',                      ''],
  ['cat.kept',               'KEPT · BOUND',                        ''],
  ['tag.worn',               'WORN',                                ''],
  ['tag.quest',              'QUEST',                               ''],
  ['empty.message',          'a hollow satchel.',                   ''],
  ['empty.eyebrow',          'EMPTY',                               ''],
];

const STR_CRUCIBLE = [
  ['nav.back',               '← BACK',                              ''],
  ['eyebrow.rules',          'RULES',                               'right-side cap'],
  ['eyebrow.title',          '✠ A POOL OF FIVE',                    ''],
  ['display.title',          'The Crucible',                        ''],
  ['body.intro',             'Five tokens fall and gather…',         'the only multi-line prose on this screen'],
  ['section.pool',           'POOL · NOW',                          ''],
  ['section.costs',          'SKILLS · COSTS',                      ''],
  ['token.ember',            'EMBER',                               'a11y: "Ember token, three of five"'],
  ['token.mire',             'MIRE',                                ''],
  ['token.ash',              'ASH',                                 ''],
  ['token.lune',             'LUNE',                                ''],
  ['token.pith',             'PITH',                                ''],
  ['accrual.ember',          'on dealing damage in body stance',    ''],
  ['accrual.mire',           'on enduring an affliction',           ''],
  ['accrual.ash',            'passive · one per round',             ''],
  ['accrual.lune',           'on parley or surrender taken',        ''],
  ['accrual.pith',           'on critical roll · vi+',              ''],
];

Object.assign(window, {
  DecisionsDoc, FlowMap, StringsTable,
  STR_WILDS, STR_STRIFE, STR_EVENT, STR_SELF, STR_SATCHEL, STR_CRUCIBLE,
});
