// Screen 1 — Exploration / World Map
// Hand-drawn node graph + bottom action drawer + status card.

function ExplorationScreen({ encounter = null, onTriggerEncounter = null, onResolveEncounter = null }) {
  // encounter prop = null | 'encounter' | 'boss'
  // when set, an EncounterModal is mounted on top — non-dismissible.
  const [internalEnc, setInternalEnc] = React.useState(encounter);
  React.useEffect(() => { setInternalEnc(encounter); }, [encounter]);
  const trigger = (kind) => {
    if (onTriggerEncounter) onTriggerEncounter(kind);
    else setInternalEnc(kind);
  };
  const resolve = (choice) => {
    if (onResolveEncounter) onResolveEncounter(choice);
    else setInternalEnc(null);
  };
  // node graph layout — coords in 360x440 viewbox
  const nodes = [
    { id: 'n0', x: 60,  y: 380, kind: 'completed', label: 'Hovel', type: 'rest' },
    { id: 'n1', x: 130, y: 320, kind: 'completed', label: 'Crossing', type: 'gather' },
    { id: 'n2', x: 200, y: 250, kind: 'current',   label: 'Hanged Wood', type: 'current' },
    { id: 'n3', x: 290, y: 200, kind: 'available', label: 'Black Cairn', type: 'encounter' },
    { id: 'n4', x: 130, y: 180, kind: 'available', label: 'Drowned Shrine', type: 'treasure' },
    { id: 'n5', x: 250, y: 110, kind: 'locked',    label: '???', type: 'boss' },
    { id: 'n6', x: 70,  y: 100, kind: 'locked',    label: 'Ash Mire', type: 'quest' },
  ];
  const edges = [
    ['n0','n1'], ['n1','n2'], ['n2','n3'], ['n2','n4'],
    ['n3','n5'], ['n4','n5'], ['n4','n6'],
  ];
  const get = id => nodes.find(n => n.id === id);

  const eventBadge = (type) => {
    const map = {
      encounter: { icon: 'eye',  c: AXM.blood,  label: 'ENCOUNTER' },
      treasure:  { icon: 'chest',c: AXM.sulfur, label: 'TREASURE' },
      boss:      { icon: 'crown',c: AXM.blood,  label: 'BOSS' },
      quest:     { icon: 'scroll',c: AXM.sulfur,label: 'QUEST' },
      rest:      { icon: 'flame',c: AXM.rust,   label: 'REST' },
      gather:    { icon: 'bag',  c: AXM.bone,   label: 'GATHER' },
    };
    return map[type] || map.encounter;
  };

  // actions at current node
  const actions = [
    { label: 'Venture\nNorth', icon: 'flee', tag: 'TRAVEL · 1 TURN' },
    { label: 'Search\nthe Hanged', icon: 'eye', tag: 'SKILL · MIND' },
    { label: 'Gather\nFungi', icon: 'bag', tag: 'NODE · GATHER' },
    { label: 'Rest by\nFire', icon: 'flame', tag: 'HEAL · COSTLY' },
    { label: 'Read\nRunes', icon: 'scroll', tag: 'LORE' },
  ];

  return (
    <ScreenBg>
      {/* status card */}
      <StatusCard />

      {/* region header */}
      <div style={{ padding: '12px 14px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <SectionLabel size={9} style={{ color: AXM.bone }}>CONTINENT · IRON SKY</SectionLabel>
          <div style={{ fontFamily: AXM.gothic, fontSize: 26, lineHeight: 0.95, color: AXM.parchment, marginTop: 2 }}>
            The Hanged Wood
          </div>
          <div style={{ fontFamily: AXM.serif, fontSize: 11, color: AXM.bone, fontStyle: 'italic', marginTop: 1 }}>
            Map ii of vii · 4 paths remain
          </div>
        </div>
        <div style={{
          fontFamily: AXM.mono, fontSize: 10, color: AXM.bone, textAlign: 'right',
        }}>
          DAY<br/>
          <span style={{ fontFamily: AXM.gothic, fontSize: 22, color: AXM.sulfur }}>XXIV</span>
        </div>
      </div>

      {/* the node graph */}
      <div style={{ position: 'relative', margin: '6px 10px 8px', height: 380 }}>
        {/* parchment panel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#16130d',
          backgroundImage: NOISE_URI,
          backgroundBlendMode: 'multiply',
          clipPath: tornEdge({ width: 370, height: 380, jag: 7, seed: 21 }),
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.7)',
        }} />
        {/* ink splatters */}
        <Splatter color={AXM.blood} size={170} seed={3} style={{ position: 'absolute', top: -10, right: -10, opacity: 0.35 }} />
        <Splatter color={AXM.sulfur} size={130} seed={9} style={{ position: 'absolute', bottom: 30, left: -20, opacity: 0.18 }} />

        {/* compass + meta in corners */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1,
        }}>N ↑ · scale: leagues</div>
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontFamily: AXM.gothic, fontSize: 14, color: AXM.parchment,
          opacity: 0.6, letterSpacing: 2,
        }}>NODE GRAPH</div>

        {/* SVG paths */}
        <svg viewBox="0 0 360 380" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="dotline" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.1" fill={AXM.bone} />
            </pattern>
          </defs>
          {edges.map(([a, b], i) => {
            const A = get(a), B = get(b);
            const isLocked = A.kind === 'locked' || B.kind === 'locked';
            const traveled = A.kind === 'completed' && (B.kind === 'completed' || B.kind === 'current');
            // jagged hand-drawn line via a few mid points
            const mx = (A.x + B.x) / 2 + Math.sin(i * 3) * 12;
            const my = (A.y + B.y) / 2 + Math.cos(i * 5) * 10;
            const d = `M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`;
            return (
              <g key={i}>
                <path d={d} stroke={traveled ? AXM.parchment : (isLocked ? AXM.ash : AXM.bone)}
                  strokeWidth={traveled ? 2.5 : 1.6}
                  strokeDasharray={isLocked ? '4 4' : 'none'}
                  fill="none" opacity={traveled ? 0.9 : 0.6}
                  strokeLinecap="round" />
                {/* hatch tick across */}
                {traveled && <circle cx={mx} cy={my} r="2" fill={AXM.sulfur} />}
              </g>
            );
          })}
          {/* hand-drawn region scribbles */}
          <g opacity="0.4" stroke={AXM.bone} strokeWidth="1" fill="none">
            <path d="M40 250 q 20 -20 40 -10 q 10 12 -10 18 q -22 4 -30 -8 z" />
            <path d="M250 280 q 30 -20 60 -5 q 8 18 -20 22 q -38 -2 -40 -17 z" />
            <path d="M180 60 q 30 5 50 25" strokeDasharray="2 3" />
          </g>
        </svg>

        {/* nodes */}
        {nodes.map(n => {
          const ev = eventBadge(n.type);
          // map movement to an encounter/boss node triggers the locked modal
          const tappable = n.kind === 'available' && (n.type === 'encounter' || n.type === 'boss');
          return (
            <div key={n.id}
              onClick={tappable ? () => trigger(n.type === 'boss' ? 'boss' : 'encounter') : undefined}
              style={{
                position: 'absolute', left: n.x - 18, top: n.y - 18,
                width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: tappable ? 'pointer' : 'default',
              }}>
              <div style={{ position: 'relative' }}>
                <NodeMark kind={n.kind} size={36} />
                {n.kind === 'available' && (
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    border: `1.5px solid ${ev.c}`, opacity: 0.6,
                    animation: 'axmPulse 1.6s ease-in-out infinite',
                  }} />
                )}
              </div>
              <div style={{
                marginTop: 2, padding: '1px 4px',
                background: 'rgba(10,10,10,0.85)',
                fontFamily: AXM.sans, fontSize: 9, letterSpacing: 1.4,
                color: n.kind === 'locked' ? AXM.ash : AXM.parchment,
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{n.label}</div>
              {n.kind === 'available' && (
                <div style={{
                  marginTop: 1, padding: '1px 3px',
                  background: ev.c, color: '#0a0a0a',
                  fontFamily: AXM.sans, fontSize: 8, letterSpacing: 1,
                }}>{ev.label}</div>
              )}
            </div>
          );
        })}

        {/* floating event indicator (top-right callout) */}
        <div style={{
          position: 'absolute', top: 50, right: 12,
          width: 130,
          background: '#0a0a0a',
          border: `1px solid ${AXM.blood}`,
          padding: '6px 8px',
          clipPath: tornEdge({ width: 130, height: 70, jag: 4, seed: 33 }),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ActionIcon kind="eye" size={20} color={AXM.blood} />
            <SectionLabel size={9} color={AXM.blood}>NEW EVENT</SectionLabel>
          </div>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 13, color: AXM.parchment, marginTop: 2, lineHeight: 1.05,
          }}>Something watches from Black Cairn.</div>
        </div>

        {/* legend */}
        <div style={{
          position: 'absolute', bottom: 8, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between',
          fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1,
        }}>
          <span>● TRODDEN  ◌ OPEN  ✕ SHUT</span>
          <span>vii nodes · iii sealed</span>
        </div>
      </div>

      {/* action drawer */}
      <div style={{ padding: '0 10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 4px' }}>
          <SectionLabel size={10}>★ At Hanged Wood</SectionLabel>
          <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone }}>swipe →</span>
        </div>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 2px 2px',
        }}>
          {actions.map((a, i) => (
            <div key={i} style={{
              flex: '0 0 110px', height: 100,
              background: i === 0 ? '#1a1410' : '#100d0a',
              backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
              border: i === 0 ? `2px solid ${AXM.sulfur}` : `1px solid ${AXM.ash}`,
              padding: '8px 8px 6px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              clipPath: tornEdge({ width: 110, height: 100, jag: 4, seed: 40 + i }),
            }}>
              <ActionIcon kind={a.icon} size={22} color={i === 0 ? AXM.sulfur : AXM.parchment} />
              <div style={{
                fontFamily: AXM.gothic, fontSize: 13, lineHeight: 1.05,
                color: AXM.parchment, whiteSpace: 'pre-line',
              }}>{a.label}</div>
              <div style={{
                fontFamily: AXM.mono, fontSize: 8, letterSpacing: 1,
                color: i === 0 ? AXM.sulfur : AXM.bone,
              }}>{a.tag}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes axmPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
      `}</style>

      {/* Encounter modal — triggered by tapping an encounter/boss node.
          Non-dismissible: no close button, taps on backdrop are swallowed. */}
      {internalEnc && (
        <EncounterModal variant={internalEnc} onChoice={resolve} />
      )}
    </ScreenBg>
  );
}

window.ExplorationScreen = ExplorationScreen;
