/* screens-modal.jsx — Event modal (two shells) + Token Crucible + state variants. */

// ─────────────────────────────────────────────────────────────────────
// EVENT — combat-adjacent shell
// Used for: encounter, hazard. Tighter, taller illustration, two-axis
// choice row (commit / refuse), blood-tinged accents.
// ─────────────────────────────────────────────────────────────────────
function EventCombatAdjacent({ kind = 'encounter' }) {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden' }}>
      {/* map peek — dimmed exploration behind */}
      <MapPeek />
      {/* sheet rising over it */}
      <div style={{
        position: 'absolute', left: 16, right: 16, top: 60, bottom: 16,
        background: AXM.bg, border: `1px solid ${AXM.rust}`,
        boxShadow: `0 10px 40px ${AXM.bg}, inset 0 0 0 1px ${AXM.rule}`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* eyebrow strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderBottom: `1px solid ${AXM.rule}`,
        }}>
          <BloodGlyph />
          <span className="axm-eyebrow" style={{ color: AXM.blood }}>{kind === 'encounter' ? 'ENCOUNTER' : 'HAZARD'}</span>
          <div style={{ flex: 1 }} />
          <span className="axm-mono" style={{ color: AXM.bone, fontSize: 9 }}>node #xxiii</span>
        </div>
        {/* illustration */}
        <div style={{ height: 240, background: AXM.deepBg, position: 'relative', borderBottom: `1px solid ${AXM.rule}` }} className="axm-hatch-strong">
          <LarchStalkerIllustration />
          {/* corner banner */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            background: AXM.blood, padding: '3px 10px 3px 14px',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
          }}>
            <span className="axm-caption" style={{ color: AXM.bg, fontSize: 10 }}>STRIFE STIRS</span>
          </div>
        </div>
        {/* title + body */}
        <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="axm-eyebrow" style={{ color: AXM.bone }}>A figure waits among the larches.</div>
          <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 26, color: AXM.parchment, lineHeight: 1, marginTop: 4 }}>The Larch-Stalker</div>
          <div className="axm-body" style={{ color: AXM.parchment, marginTop: 8, fontSize: 13, lineHeight: 1.4 }}>
            <span className="axm-bodyit">It does not move. Long-limbed, ash-smeared, mouth too wide. A bell at the belt. No greeting.</span>
          </div>
          <div style={{ flex: 1 }} />
          {/* choices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <ChoiceRow label="FIGHT" tone="blood" hint="ix · vi vitae · adv. unknown" big/>
            <ChoiceRow label="FLEE"  tone="bone"  hint="forfeit the path · -ii morale"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function BloodGlyph() {
  return <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood}/></svg>;
}

function LarchStalkerIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 358 240" style={{ position: 'absolute', inset: 0 }}>
      {/* horizon */}
      <line x1="0" y1="180" x2="358" y2="180" stroke={AXM.bone} strokeWidth="0.6" opacity="0.4"/>
      {/* larches */}
      {[40, 75, 110, 160, 220, 260, 310].map((x, i) => (
        <g key={i} opacity={0.6 + (i % 2) * 0.2}>
          <line x1={x} y1={180} x2={x} y2={40 + (i * 7) % 30} stroke={AXM.parchment} strokeWidth="1"/>
          {[40, 70, 100, 130, 160].map((dy, j) => (
            <path key={j} d={`M${x - 8 + j * 1.5} ${dy} L ${x} ${dy - 6} L ${x + 8 - j * 1.5} ${dy} Z`} fill={AXM.parchment} opacity="0.4"/>
          ))}
        </g>
      ))}
      {/* moon */}
      <circle cx="280" cy="50" r="22" stroke={AXM.parchment} strokeWidth="0.8" fill="none" opacity="0.5"/>
      <circle cx="280" cy="50" r="22" fill={AXM.parchment} opacity="0.05"/>
      {/* figure - tall, gaunt */}
      <g transform="translate(178 90)">
        <path d="M0 0 L -4 12 L -3 26 L -10 48 L -8 70 L -5 90 L -3 60 L 3 60 L 5 90 L 8 70 L 10 48 L 3 26 L 4 12 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth="1.4"/>
        <path d="M-5 0 L -6 -16 A 6 6 0 0 1 6 -16 L 5 0 Z" fill={AXM.parchment}/>
        <path d="M-3 -10 L -3 -7 M 3 -10 L 3 -7" stroke={AXM.bg} strokeWidth="1"/>
        <path d="M-4 -4 L 4 -4" stroke={AXM.bg} strokeWidth="1"/>
        {/* outstretched arm holding bell */}
        <path d="M3 26 L 18 36 L 22 50" stroke={AXM.parchment} strokeWidth="1.4" fill="none"/>
        <path d="M-3 26 L -16 28" stroke={AXM.parchment} strokeWidth="1.4" fill="none"/>
        <path d="M22 50 L 25 56 L 19 56 Z" fill={AXM.parchment}/>
      </g>
      {/* ash drift */}
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={i * 13 + (i % 3) * 7} cy={210 + (i % 4) * 6} r={0.6 + (i % 3) * 0.4} fill={AXM.bone} opacity="0.5"/>
      ))}
    </svg>
  );
}

function ChoiceRow({ label, tone, hint, big }) {
  const c = tone === 'blood' ? AXM.blood : tone === 'sulfur' ? AXM.sulfur : tone === 'rust' ? AXM.rust : AXM.bone;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: big ? '12px 14px' : '10px 14px',
      background: AXM.bg, border: `1px solid ${c}`,
      borderLeft: `3px solid ${c}`,
    }}>
      <span className="axm-caption" style={{ color: c, fontSize: big ? 14 : 12, letterSpacing: '0.18em' }}>{label}</span>
      <span className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11, fontStyle: 'italic' }}>{hint}</span>
    </div>
  );
}

function MapPeek() {
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
      <ScreenWilds />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.6)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EVENT — paced shell
// Used for: interaction, rest, cutscene, village, gathering, loot-cache.
// Wider illustration, multi-choice tree, parchment voice.
// ─────────────────────────────────────────────────────────────────────
function EventPaced({ kind = 'interaction' }) {
  const kindMeta = {
    interaction: { eye: 'INTERACTION', title: 'The Wagoner',     ill: 'figure',  body: 'A man at a broken cart. One wheel split. He has not looked up.' },
    rest:        { eye: 'A FIRE LOWERS', title: 'The Stone Hearth', ill: 'fire',  body: 'Stones laid in a tight ring. Coals still red. No one tends them.' },
    cutscene:    { eye: 'A WITNESSING', title: '',                 ill: 'sky',    body: 'The sky takes on the colour of a struck bruise. Far off, a bell.' },
    village:     { eye: 'A SETTLEMENT', title: 'Ashfield',         ill: 'town',   body: 'Twelve roofs. A spire that has lost its cross. Smoke from three of them.' },
    gathering:   { eye: 'A SMALL HARVEST', title: 'A Stand of Mire-Mint', ill: 'plant', body: 'Bitter green. The leaves bruise easily. Worth the stoop.' },
    'loot-cache':{ eye: 'A FOUND THING', title: 'A Buried Chest',   ill: 'chest',  body: 'Iron-bound. The lock is rusted through. The wood, somehow, is not.' },
  };
  const m = kindMeta[kind];
  const choices = kindChoices(kind);
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, position: 'relative', overflow: 'hidden' }}>
      <MapPeek />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '88%',
        background: AXM.bg, borderTop: `1px solid ${AXM.parchment}`,
        boxShadow: `0 -10px 30px rgba(0,0,0,0.6)`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* eyebrow */}
        <div style={{ padding: '12px 20px 0' }}>
          <SectionLabel>{m.eye}</SectionLabel>
        </div>
        {/* illustration */}
        <div style={{ margin: '10px 16px', height: 180, background: AXM.deepBg, border: `1px solid ${AXM.ash}`, position: 'relative' }} className="axm-hatch">
          <PacedIllustration kind={m.ill}/>
        </div>
        {/* title */}
        <div style={{ padding: '0 20px' }}>
          {m.title && <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 26, color: AXM.parchment, lineHeight: 1 }}>{m.title}</div>}
          <div className="axm-body" style={{ color: AXM.parchment, marginTop: 8, fontSize: 14, lineHeight: 1.4 }}>
            <span className="axm-bodyit">{m.body}</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* choices */}
        <div style={{ padding: '12px 16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {choices.map((c, i) => <ChoiceRow key={i} {...c}/>)}
        </div>
      </div>
    </div>
  );
}

function kindChoices(kind) {
  if (kind === 'interaction') return [
    { label: 'OFFER A HAND',   tone: 'parchment', hint: 'heart · iii vitae spent' },
    { label: 'ASK HIS ERRAND', tone: 'parchment', hint: 'mind · perception' },
    { label: 'WALK ON',        tone: 'bone',      hint: 'no cost' },
  ];
  if (kind === 'rest') return [
    { label: 'REST UNTIL DAWN', tone: 'sulfur', hint: 'mend full · ii passes' },
    { label: 'KEEP THE COALS',  tone: 'parchment', hint: 'mend half · -i risk' },
    { label: 'WALK ON',         tone: 'bone',      hint: 'no cost' },
  ];
  if (kind === 'village') return [
    { label: 'ENTER THE INN',      tone: 'parchment', hint: 'rumor · trade' },
    { label: 'SEEK THE STEEPLE',   tone: 'parchment', hint: 'pray · quest' },
    { label: 'BUY IN THE MARKET',  tone: 'sulfur',    hint: 'shillings' },
    { label: 'LEAVE',              tone: 'bone',      hint: 'no cost' },
  ];
  if (kind === 'cutscene') return [
    { label: 'WITNESS', tone: 'parchment', hint: 'no cost' },
  ];
  if (kind === 'gathering') return [
    { label: 'STOOP TO GATHER', tone: 'parchment', hint: 'iii mire-mint' },
    { label: 'WALK ON',         tone: 'bone',      hint: 'no cost' },
  ];
  if (kind === 'loot-cache') return [
    { label: 'PRY IT OPEN',   tone: 'sulfur',    hint: 'body · iv test' },
    { label: 'PICK THE LOCK', tone: 'parchment', hint: 'mind · vi test' },
    { label: 'LEAVE IT',      tone: 'bone',      hint: 'no cost' },
  ];
  return [];
}

function PacedIllustration({ kind }) {
  if (kind === 'fire') return (
    <svg width="100%" height="100%" viewBox="0 0 358 180" style={{ position: 'absolute', inset: 0 }}>
      <ellipse cx="179" cy="150" rx="80" ry="10" fill={AXM.ash}/>
      {[140, 155, 170, 185, 200, 215].map((x, i) => (
        <path key={i} d={`M${x} 150 L ${x - 6} 138 L ${x + 6} 138 Z`} fill={AXM.bone} opacity="0.8"/>
      ))}
      <path d="M170 140 Q 175 110 179 100 Q 183 110 188 140 Z" fill={AXM.blood}/>
      <path d="M175 138 Q 178 122 179 116 Q 180 122 183 138 Z" fill={AXM.sulfur}/>
      {/* sparks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <circle key={i} cx={170 + (i * 7) % 30} cy={70 + (i * 11) % 50} r="0.8" fill={AXM.sulfur} opacity="0.6"/>
      ))}
    </svg>
  );
  if (kind === 'figure') return (
    <svg width="100%" height="100%" viewBox="0 0 358 180" style={{ position: 'absolute', inset: 0 }}>
      <line x1="0" y1="150" x2="358" y2="150" stroke={AXM.bone} opacity="0.4"/>
      {/* cart */}
      <g transform="translate(80 80)">
        <rect x="0" y="0" width="120" height="40" fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth="1.4"/>
        <circle cx="20" cy="50" r="14" stroke={AXM.parchment} strokeWidth="1.4" fill={AXM.deepBg}/>
        <circle cx="100" cy="50" r="14" stroke={AXM.parchment} strokeWidth="1.4" fill={AXM.deepBg}/>
        <path d="M20 50 L 20 42 M 20 50 L 26 56 M 20 50 L 14 56 M 20 50 L 12 50 M 20 50 L 28 50" stroke={AXM.parchment} strokeWidth="0.8"/>
        {/* broken wheel */}
        <path d="M100 50 L 100 36 M 100 50 L 92 56" stroke={AXM.parchment} strokeWidth="0.8"/>
        <path d="M86 58 L 110 64" stroke={AXM.parchment} strokeWidth="0.8"/>
      </g>
      {/* figure sitting */}
      <g transform="translate(230 90)">
        <path d="M-12 60 L -8 30 L -4 20 L 4 20 L 8 30 L 12 60 Z" fill={AXM.parchment}/>
        <circle cx="0" cy="14" r="8" fill={AXM.parchment}/>
        <path d="M-4 32 L -16 50 M 4 32 L 12 38" stroke={AXM.parchment} strokeWidth="1.4"/>
      </g>
    </svg>
  );
  if (kind === 'sky') return (
    <svg width="100%" height="100%" viewBox="0 0 358 180" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={AXM.debuff} stopOpacity="0.6"/>
          <stop offset="60%" stopColor={AXM.rust} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={AXM.bg} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <rect width="358" height="180" fill="url(#sky)"/>
      <circle cx="180" cy="60" r="28" fill={AXM.parchment} opacity="0.7"/>
      <circle cx="172" cy="56" r="26" fill={AXM.bg}/>
      {/* hills */}
      <path d="M0 150 Q 60 130 120 140 T 240 135 T 358 145 L 358 180 L 0 180 Z" fill={AXM.bg}/>
      <path d="M0 150 Q 60 130 120 140 T 240 135 T 358 145" stroke={AXM.parchment} strokeWidth="0.6" fill="none" opacity="0.4"/>
    </svg>
  );
  if (kind === 'town') return (
    <svg width="100%" height="100%" viewBox="0 0 358 180" style={{ position: 'absolute', inset: 0 }}>
      <line x1="0" y1="150" x2="358" y2="150" stroke={AXM.bone} opacity="0.4"/>
      {/* spire (cross-less) */}
      <path d="M180 60 L 200 130 L 160 130 Z" stroke={AXM.parchment} strokeWidth="1.4" fill={AXM.bg}/>
      <rect x="172" y="115" width="16" height="35" stroke={AXM.parchment} strokeWidth="1" fill={AXM.bg}/>
      {/* roofs around */}
      {[40, 80, 120, 220, 260, 300].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 130 L ${x + 14} 110 L ${x + 28} 130 Z`} stroke={AXM.parchment} strokeWidth="1" fill={AXM.deepBg}/>
          <rect x={x + 4} y="130" width="20" height="20" stroke={AXM.parchment} strokeWidth="1" fill={AXM.bg}/>
        </g>
      ))}
      {/* smoke from three */}
      {[40, 220, 300].map((x, i) => (
        <path key={i} d={`M${x + 14} 110 Q ${x + 10} 90 ${x + 18} 70`} stroke={AXM.bone} strokeWidth="1" fill="none" opacity="0.6"/>
      ))}
    </svg>
  );
  if (kind === 'plant') return (
    <svg width="100%" height="100%" viewBox="0 0 358 180" style={{ position: 'absolute', inset: 0 }}>
      <line x1="0" y1="150" x2="358" y2="150" stroke={AXM.bone} opacity="0.4"/>
      {[120, 160, 200, 240].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 150 Q ${x - 4} 120 ${x} 80`} stroke={AXM.parchment} strokeWidth="1" fill="none"/>
          {[90, 110, 130].map((y, j) => (
            <path key={j} d={`M${x} ${y} Q ${x + 12} ${y - 6} ${x + 16} ${y - 12}`} stroke={AXM.parchment} strokeWidth="0.8" fill="none"/>
          ))}
        </g>
      ))}
    </svg>
  );
  if (kind === 'chest') return (
    <svg width="100%" height="100%" viewBox="0 0 358 180" style={{ position: 'absolute', inset: 0 }}>
      <line x1="0" y1="150" x2="358" y2="150" stroke={AXM.bone} opacity="0.4"/>
      <g transform="translate(120 60)">
        <path d="M0 90 L 0 30 Q 0 0 60 0 Q 120 0 120 30 L 120 90 Z" stroke={AXM.parchment} strokeWidth="1.6" fill={AXM.deepBg}/>
        <path d="M0 50 L 120 50" stroke={AXM.parchment} strokeWidth="1.2"/>
        <rect x="55" y="40" width="10" height="20" stroke={AXM.parchment} strokeWidth="1" fill={AXM.bg}/>
        <circle cx="60" cy="50" r="2" fill={AXM.sulfur}/>
        {/* iron bands */}
        <line x1="20" y1="50" x2="20" y2="90" stroke={AXM.parchment} strokeWidth="1.4"/>
        <line x1="100" y1="50" x2="100" y2="90" stroke={AXM.parchment} strokeWidth="1.4"/>
      </g>
    </svg>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// TOKEN CRUCIBLE — modal
// ─────────────────────────────────────────────────────────────────────
function ScreenCrucible() {
  return (
    <div style={{ width: 390, height: 800, background: AXM.bg, overflow: 'auto', position: 'relative' }}>
      {/* header bar */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: AXM.bone, fontSize: 12 }}>← BACK</span>
          <div style={{ flex: 1 }} />
          <span className="axm-eyebrow" style={{ color: AXM.bone }}>RULES</span>
        </div>
        <div className="axm-eyebrow" style={{ color: AXM.bone, marginTop: 12 }}>✠ A POOL OF FIVE</div>
        <div style={{ fontFamily: 'var(--f-gothic)', fontSize: 28, color: AXM.parchment, lineHeight: 1, marginTop: 2 }}>The Crucible</div>
        <div className="axm-bodyit" style={{ color: AXM.bone, marginTop: 6, fontSize: 12 }}>
          Five tokens fall and gather. Skills spend them. The pool refills by what is done, not what is wished.
        </div>
      </div>

      {/* circular crucible diagram */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 8px' }}>
        <CrucibleDiagram/>
      </div>

      {/* token roster */}
      <div style={{ padding: '4px 16px' }}>
        <SectionLabel>POOL · NOW</SectionLabel>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TokenRow glyph="◐" color={AXM.blood} name="EMBER"  count={3} accrual="on dealing damage in body stance" />
          <TokenRow glyph="◒" color={AXM.rust}  name="MIRE"   count={1} accrual="on enduring an affliction" />
          <TokenRow glyph="◑" color={AXM.bone}  name="ASH"    count={4} accrual="passive · one per round" />
          <TokenRow glyph="◓" color={AXM.parchment} name="LUNE" count={2} accrual="on parley or surrender taken" />
          <TokenRow glyph="◉" color={AXM.sulfur} name="PITH"   count={0} accrual="on critical roll · vi+" />
        </div>
      </div>

      {/* cost matrix */}
      <div style={{ padding: '14px 16px 22px' }}>
        <SectionLabel>SKILLS · COSTS</SectionLabel>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <CostHead/>
          <CostRow name="Rending Strike"   row={[2, 0, 1, 0, 0]} />
          <CostRow name="Ironwall"          row={[0, 0, 2, 0, 0]} />
          <CostRow name="Sunder the Guard"  row={[1, 0, 0, 1, 0]} short />
          <CostRow name="Hymn of Mending"   row={[0, 0, 0, 2, 0]} />
          <CostRow name="Cipher Lash"       row={[0, 1, 0, 1, 1]} short />
        </div>
      </div>
    </div>
  );
}

function CrucibleDiagram() {
  const r = 60;
  const cx = 130, cy = 130;
  const tokens = [
    { a: -90, c: AXM.blood,     g: '◐', l: 'EMBER', n: 3 },
    { a: -18, c: AXM.rust,      g: '◒', l: 'MIRE',  n: 1 },
    { a: 54,  c: AXM.bone,      g: '◑', l: 'ASH',   n: 4 },
    { a: 126, c: AXM.parchment, g: '◓', l: 'LUNE',  n: 2 },
    { a: 198, c: AXM.sulfur,    g: '◉', l: 'PITH',  n: 0 },
  ];
  return (
    <svg width="260" height="260" viewBox="0 0 260 260">
      {/* outer ring */}
      <circle cx={cx} cy={cy} r="100" stroke={AXM.rule} fill="none"/>
      <circle cx={cx} cy={cy} r="80" stroke={AXM.ash} fill="none" strokeDasharray="2 4"/>
      {/* hub */}
      <circle cx={cx} cy={cy} r="22" stroke={AXM.parchment} strokeWidth="1.4" fill={AXM.bg}/>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill={AXM.parchment} fontFamily="var(--f-gothic)">✠</text>
      {/* spokes + tokens */}
      {tokens.map((t, i) => {
        const x = cx + Math.cos(t.a * Math.PI / 180) * r;
        const y = cy + Math.sin(t.a * Math.PI / 180) * r;
        const lx = cx + Math.cos(t.a * Math.PI / 180) * (r + 26);
        const ly = cy + Math.sin(t.a * Math.PI / 180) * (r + 26);
        return (
          <g key={i}>
            <line x1={cx + Math.cos(t.a * Math.PI / 180) * 22} y1={cy + Math.sin(t.a * Math.PI / 180) * 22}
                  x2={x - Math.cos(t.a * Math.PI / 180) * 14} y2={y - Math.sin(t.a * Math.PI / 180) * 14}
                  stroke={AXM.rule} />
            <circle cx={x} cy={y} r="14" stroke={t.c} strokeWidth="1.4" fill={AXM.bg}/>
            <text x={x} y={y + 4} textAnchor="middle" fontSize="14" fill={t.n > 0 ? t.c : AXM.ash} fontFamily="var(--f-gothic)">{t.g}</text>
            <text x={lx} y={ly} textAnchor="middle" fontSize="9" fill={AXM.bone} fontFamily="var(--f-sans)" letterSpacing="1">{t.l}</text>
            <text x={lx} y={ly + 12} textAnchor="middle" fontSize="14" fill={t.n > 0 ? t.c : AXM.bone} fontFamily="var(--f-mono)">{t.n}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TokenRow({ glyph, color, name, count, accrual }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderBottom: `1px solid ${AXM.rule}` }}>
      <div style={{ width: 28, height: 28, border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: AXM.deepBg }}>
        <span style={{ color: count > 0 ? color : AXM.ash, fontSize: 16, fontFamily: 'var(--f-gothic)' }}>{glyph}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="axm-caption" style={{ color, fontSize: 11, letterSpacing: '0.16em' }}>{name}</span>
        <div className="axm-bodyit" style={{ color: AXM.bone, fontSize: 11, marginTop: 1 }}>{accrual}</div>
      </div>
      <span className="axm-mono-lg" style={{ color: count > 0 ? color : AXM.bone, fontSize: 18 }}>{count}</span>
    </div>
  );
}

function CostHead() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr', gap: 4, padding: '4px 6px', borderBottom: `1px solid ${AXM.rule}` }}>
      <span className="axm-eyebrow" style={{ color: AXM.bone, fontSize: 9 }}>SKILL</span>
      {['◐','◒','◑','◓','◉'].map((g, i) => (
        <span key={i} style={{ textAlign: 'center', color: [AXM.blood, AXM.rust, AXM.bone, AXM.parchment, AXM.sulfur][i], fontSize: 12, fontFamily: 'var(--f-gothic)' }}>{g}</span>
      ))}
    </div>
  );
}

function CostRow({ name, row, short }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr', gap: 4, padding: '6px 6px', borderBottom: `1px solid ${AXM.rule}`, alignItems: 'center' }}>
      <span className="axm-body" style={{ color: AXM.parchment, fontSize: 12 }}>{name}</span>
      {row.map((n, i) => (
        <span key={i} style={{ textAlign: 'center' }} className="axm-mono">
          <span style={{ color: n === 0 ? AXM.ash : (short && i === 4 ? AXM.blood : AXM.parchment), fontSize: 11 }}>{n === 0 ? '·' : n}</span>
        </span>
      ))}
    </div>
  );
}

Object.assign(window, { EventCombatAdjacent, EventPaced, ScreenCrucible });
