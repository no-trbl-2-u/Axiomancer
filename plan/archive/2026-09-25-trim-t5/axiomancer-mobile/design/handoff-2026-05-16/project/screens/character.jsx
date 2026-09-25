// Screen 3 — Character Sheet

function CharacterScreen() {
  const xp = 412, xpMax = 600;
  const base = { Heart: 12, Body: 14, Mind: 10 };
  const derived = {
    Physical:  { Attack: 13, Skill:  7, Defense: 10 },
    Mental:    { Attack:  8, Skill: 14, Defense:  8 },
    Emotional: { Attack: 11, Skill:  9, Defense:  6 },
  };
  const luck = 12;
  const saves = [
    { k: 'Body Save', v: 14 }, { k: 'Mind Save', v: 12 },
    { k: 'Heart Save', v: 10 }, { k: 'Body Test', v: '+2' },
    { k: 'Mind Test', v: '+1' }, { k: 'Heart Test', v: '+0' },
  ];
  const effects = [
    { kind: 'poison', name: 'WORM ROT', dur: 4, intensity: 2, tier: 2, desc: 'Lose 3 HP at round end. Bypasses defence.' },
    { kind: 'buff',   name: 'PILGRIM\'S OATH', dur: 99, intensity: 1, tier: 1, desc: '+1 Heart while at <50% HP.' },
    { kind: 'debuff', name: 'BROKEN TONGUE', dur: 2, intensity: 1, tier: 3, desc: 'Block all Heart skills.' },
  ];
  const slots = [
    { name: 'Head',    item: 'Antler Hood'},
    { name: 'Body',    item: 'Saint\'s Rags'},
    { name: 'Hands',   item: '—'},
    { name: 'Feet',    item: 'Coffin Boots'},
    { name: 'Weapon',  item: 'The Long Blade'},
    { name: 'Armor',   item: 'Iron Yoke'},
    { name: 'Accessory', item: 'Tooth of a Saint'},
  ];
  const skills = [
    { name: 'AD HOMINEM', cat: 'fallacy', stance: 'heart' },
    { name: 'ZENO\'S BLADE', cat: 'paradox', stance: 'body' },
    { name: 'CIRCULAR LOGIC', cat: 'fallacy', stance: 'mind' },
    { name: 'OF THESEUS', cat: 'paradox', stance: 'mind' },
  ];

  return (
    <ScreenBg>
      {/* header */}
      <div style={{ padding: '14px 14px 0' }}>
        <SectionLabel size={9} color={AXM.bone}>HOMO MORIENS · PILGRIM</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: AXM.gothic, fontSize: 26, lineHeight: 0.95, marginTop: 2 }}>
            WORM-EATEN<br/>PILGRIM
          </div>
          <div style={{
            width: 50, height: 50, border: `2px solid ${AXM.parchment}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: AXM.gothic, fontSize: 30, color: AXM.sulfur, background: '#000',
          }}>7</div>
        </div>
        {/* xp chain */}
        <div style={{ marginTop: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1, marginBottom: 2,
          }}>
            <span>XP CHAIN TO LVL 8</span>
            <span style={{ color: AXM.sulfur }}>{xp} / {xpMax}</span>
          </div>
          <XpChain value={xp} max={xpMax} />
        </div>
      </div>

      {/* base stats */}
      <div style={{ padding: '12px 14px 0' }}>
        <SectionLabel size={10}>✠ BASE</SectionLabel>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {Object.entries(base).map(([k, v]) => (
            <div key={k} style={{
              flex: 1, padding: '8px 6px',
              background: '#100d0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
              border: `1px solid ${AXM.ash}`,
              textAlign: 'center',
              clipPath: tornEdge({ width: 110, height: 88, jag: 3, seed: 130 + k.length }),
            }}>
              <StanceGlyph kind={k.toLowerCase()} size={28} color={AXM.parchment} />
              <div style={{ fontFamily: AXM.sans, fontSize: 10, letterSpacing: 2, color: AXM.bone, marginTop: 2 }}>{k.toUpperCase()}</div>
              <div style={{ fontFamily: AXM.gothic, fontSize: 28, color: AXM.sulfur, lineHeight: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* derived */}
      <div style={{ padding: '10px 14px 0' }}>
        <SectionLabel size={10}>✠ DERIVED</SectionLabel>
        <div style={{
          marginTop: 4,
          background: '#100d0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
          border: `1px solid ${AXM.ash}`, padding: '6px 8px',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
            fontFamily: AXM.mono, fontSize: 10, color: AXM.bone,
            paddingBottom: 3, borderBottom: `1px dashed ${AXM.ash}`, letterSpacing: 1,
          }}>
            <span></span><span style={{ textAlign: 'right' }}>ATK</span><span style={{ textAlign: 'right' }}>SKL</span><span style={{ textAlign: 'right' }}>DEF</span>
          </div>
          {Object.entries(derived).map(([row, vs]) => (
            <div key={row} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
              fontFamily: AXM.gothic, fontSize: 14, color: AXM.parchment,
              padding: '3px 0', borderBottom: `1px solid #1a1814`,
            }}>
              <span style={{ fontFamily: AXM.sans, fontSize: 11, color: AXM.parchment, letterSpacing: 1.5, alignSelf: 'center' }}>{row.toUpperCase()}</span>
              <span style={{ textAlign: 'right' }}>{vs.Attack}</span>
              <span style={{ textAlign: 'right' }}>{vs.Skill}</span>
              <span style={{ textAlign: 'right' }}>{vs.Defense}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontFamily: AXM.sans, fontSize: 11, color: AXM.bone, letterSpacing: 1.5 }}>LUCK · AVG OF THREE</span>
            <span style={{ fontFamily: AXM.gothic, fontSize: 18, color: AXM.sulfur }}>{luck}</span>
          </div>
        </div>
      </div>

      {/* saves & tests */}
      <div style={{ padding: '10px 14px 0' }}>
        <SectionLabel size={10}>✠ SAVES &amp; TESTS</SectionLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 4,
          fontFamily: AXM.mono, fontSize: 10,
        }}>
          {saves.map(s => (
            <div key={s.k} style={{
              border: `1px dashed ${AXM.ash}`, padding: '3px 5px',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: AXM.bone }}>{s.k}</span>
              <span style={{ color: AXM.parchment }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* active effects */}
      <div style={{ padding: '10px 14px 0' }}>
        <SectionLabel size={10}>✠ AFFLICTIONS &amp; BLESSINGS</SectionLabel>
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {effects.map(e => (
            <div key={e.name} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: e.tint === 'buff' ? AXM.buff : AXM.debuff,
              border: `1px solid ${e.kind === 'poison' || e.kind === 'debuff' ? AXM.blood : AXM.sulfur}`,
              padding: '5px 7px',
            }}>
              <EffectGlyph kind={e.kind} size={20} color={e.kind === 'buff' ? AXM.sulfur : AXM.blood} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: AXM.gothic, fontSize: 13, color: AXM.parchment, letterSpacing: 1 }}>{e.name}</span>
                  <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone }}>
                    {e.dur === 99 ? '∞' : `${e.dur}r`} · ×{e.intensity} · T{e.tier}
                  </span>
                </div>
                <div style={{ fontFamily: AXM.serif, fontSize: 10, color: AXM.bone, lineHeight: 1.2, marginTop: 1 }}>{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* equipment */}
      <div style={{ padding: '10px 14px 0' }}>
        <SectionLabel size={10}>✠ WORN &amp; WIELDED</SectionLabel>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'flex-start' }}>
          {/* body silhouette */}
          <div style={{ width: 88, flexShrink: 0 }}>
            <BodyDiagram />
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {slots.map(s => (
              <div key={s.name} style={{
                border: s.item === '—' ? `1px dashed ${AXM.ash}` : `1px solid ${AXM.ash}`,
                padding: '3px 5px', minHeight: 32,
                background: s.item === '—' ? 'transparent' : '#100d0a',
              }}>
                <div style={{ fontFamily: AXM.sans, fontSize: 8, letterSpacing: 1.5, color: AXM.bone }}>{s.name.toUpperCase()}</div>
                <div style={{ fontFamily: AXM.serif, fontSize: 11, color: s.item === '—' ? AXM.ash : AXM.parchment, lineHeight: 1.1 }}>{s.item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* skills */}
      <div style={{ padding: '10px 14px 14px' }}>
        <SectionLabel size={10}>✠ FALLACIES &amp; PARADOXES</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
          {skills.map(s => (
            <div key={s.name} style={{
              border: s.cat === 'paradox' ? `2px solid ${AXM.sulfur}` : `2px dashed ${AXM.parchment}`,
              padding: '4px 6px', background: '#0a0a0a',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <StanceGlyph kind={s.stance} size={16} color={AXM.bone} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: AXM.gothic, fontSize: 12, color: AXM.parchment, lineHeight: 1 }}>{s.name}</div>
                <div style={{ fontFamily: AXM.mono, fontSize: 8, color: s.cat === 'paradox' ? AXM.sulfur : AXM.parchment, letterSpacing: 1 }}>{s.cat.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenBg>
  );
}

function XpChain({ value, max }) {
  const links = 16;
  const filled = Math.round((value / max) * links);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: links }).map((_, i) => (
        <svg key={i} viewBox="0 0 12 14" width="100%" height="14" style={{ flex: 1 }}>
          <ellipse cx="6" cy="7" rx="4" ry="6" fill="none"
            stroke={i < filled ? AXM.sulfur : AXM.ash} strokeWidth="1.5" />
          <ellipse cx="6" cy="7" rx="2" ry="3" fill={i < filled ? AXM.sulfur : 'transparent'} />
        </svg>
      ))}
    </div>
  );
}

function BodyDiagram() {
  return (
    <svg viewBox="0 0 88 220" width="88" height="220">
      {/* head */}
      <circle cx="44" cy="20" r="13" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      {/* torso */}
      <path d="M30 36 L 58 36 L 60 100 L 28 100 Z" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      {/* arms */}
      <path d="M30 38 L 18 80 L 22 110" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      <path d="M58 38 L 70 80 L 66 110" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      {/* hands */}
      <circle cx="22" cy="115" r="4" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      <circle cx="66" cy="115" r="4" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      {/* legs */}
      <path d="M34 100 L 32 180" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      <path d="M54 100 L 56 180" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      {/* feet */}
      <ellipse cx="32" cy="190" rx="8" ry="4" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      <ellipse cx="56" cy="190" rx="8" ry="4" fill="none" stroke={AXM.parchment} strokeWidth="1.5" />
      {/* slot dots */}
      {[
        [44, 20, 'HD'], [44, 60, 'BD'], [22, 115, 'HD'], [66, 115, 'HD'],
        [44, 100, 'AR'], [78, 80, 'WP'], [44, 195, 'FT'],
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3" fill={AXM.sulfur} />
        </g>
      ))}
    </svg>
  );
}

window.CharacterScreen = CharacterScreen;
