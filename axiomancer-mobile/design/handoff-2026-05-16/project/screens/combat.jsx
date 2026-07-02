// Screen 2 — Combat (interactive across phases)
// Phases: choosing_stance → choosing_action → choosing_skill → resolving

const COMBAT_PHASES = ['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving'];

// derived stat values per stance, exposed in stance card
const STANCE_DATA = {
  heart: {
    name: 'HEART',
    counters: 'BODY',
    weakTo: 'MIND',
    flavor: 'Fire of the will. Charm and fervour.',
    derived: { Attack: 11, Skill: 9, Defense: 6 },
    statKey: 'emotional',
  },
  body: {
    name: 'BODY',
    counters: 'MIND',
    weakTo: 'HEART',
    flavor: 'Meat & marrow. Bones that endure.',
    derived: { Attack: 13, Skill: 7, Defense: 10 },
    statKey: 'physical',
  },
  mind: {
    name: 'MIND',
    counters: 'HEART',
    weakTo: 'BODY',
    flavor: 'Cold reason. Patient cruelty.',
    derived: { Attack: 8, Skill: 14, Defense: 8 },
    statKey: 'mental',
  },
};

// SKILLS now live in screens/tokens.jsx as TOKEN_SKILLS (12 skills, per-resource cost).
// Current token pool — accumulated through play. exposed on player.tokens.
const DEMO_TOKENS = { body: 2, mind: 1, heart: 2, fallacy: 1, paradox: 1 };

function CombatScreen({ phase = 'choosing_stance', onPhase = () => {}, selectedStance = 'heart' }) {
  const enemy = {
    name: 'CARRION HIEROPHANT',
    tier: 'elite',
    hp: 38, hpMax: 60,
    friendship: 2, friendshipMax: 5,
    mindMarks: 3,
    lastStance: 'mind',
    effects: [
      { kind: 'bleed', name: 'Bleed', duration: 2, intensity: 1, tint: 'debuff' },
      { kind: 'buff',  name: 'Hymn', duration: 3, intensity: 1, tint: 'buff' },
    ],
  };
  const player = {
    hp: 22, hpMax: 38,
    // mana removed — replaced by per-resource token pool. each round of
    // combat trickles tokens into this pool depending on stance + outcome.
    tokens: DEMO_TOKENS,
    effects: [
      { kind: 'poison', name: 'Poison', duration: 1, intensity: 2, tint: 'debuff' },
      { kind: 'shield', name: 'Warded', duration: 1, intensity: 1, tint: 'buff' },
    ],
  };

  // stance vs lastStance — does our stance counter theirs?
  const advantage = (() => {
    const beats = { heart: 'body', body: 'mind', mind: 'heart' };
    if (beats[selectedStance] === enemy.lastStance) return 'ADV';
    if (beats[enemy.lastStance] === selectedStance) return 'DIS';
    return '—';
  })();

  return (
    <ScreenBg>
      {/* ENEMY PANEL */}
      <EnemyPanel enemy={enemy} />

      {/* BATTLE LOG */}
      <BattleLog phase={phase} />

      {/* PLAYER STATUS */}
      <PlayerStatusBar player={player} />

      {/* PHASE-DEPENDENT BOTTOM */}
      <div style={{ padding: '8px 10px 14px' }}>
        <PhaseHeader phase={phase} selectedStance={selectedStance} onPhase={onPhase} />
        {phase === 'choosing_stance'   && <StancePhase enemy={enemy} onPick={(s) => onPhase('choosing_action', s)} selected={selectedStance} />}
        {phase === 'choosing_action'   && <ActionPhase onSkill={() => onPhase('choosing_skill')} onAttack={() => onPhase('resolving')} />}
        {phase === 'choosing_skill'    && <SkillPhase tokens={player.tokens} stance={selectedStance} onPick={() => onPhase('resolving')} />}
        {phase === 'resolving'         && <ResolvePhase advantage={advantage} stance={selectedStance} enemy={enemy} outcome={selectedStance === 'heart' ? 'friendship' : 'damage'} onContinue={() => onPhase('choosing_stance')} />}
      </div>
    </ScreenBg>
  );
}

// ─── ENEMY PANEL ───
function EnemyPanel({ enemy }) {
  return (
    <div style={{ position: 'relative', padding: '6px 10px 0' }}>
      <div style={{
        position: 'relative',
        background: '#100d0a',
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        height: 200,
        clipPath: tornEdge({ width: 370, height: 200, jag: 6, seed: 51 }),
        overflow: 'hidden',
      }}>
        {/* placeholder enemy illustration: stylized hooded silhouette */}
        <svg viewBox="0 0 200 200" width="180" height="200" style={{ position: 'absolute', right: -10, bottom: -8, opacity: 0.95 }}>
          <defs>
            <radialGradient id="enemyGlow" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#c0152a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c0152a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="90" ry="80" fill="url(#enemyGlow)" />
          {/* hooded figure */}
          <path d="M100 30 C 60 30 40 70 50 130 L 30 200 L 170 200 L 150 130 C 160 70 140 30 100 30 Z"
            fill="#06050a" stroke={AXM.parchment} strokeWidth="1.5" />
          {/* hood opening */}
          <path d="M70 70 Q 100 50 130 70 L 130 110 Q 100 130 70 110 Z" fill="#000" />
          {/* eyes — twin red embers */}
          <circle cx="85" cy="90" r="3.5" fill={AXM.blood} />
          <circle cx="115" cy="90" r="3.5" fill={AXM.blood} />
          <circle cx="85" cy="90" r="1.2" fill={AXM.sulfur} />
          <circle cx="115" cy="90" r="1.2" fill={AXM.sulfur} />
          {/* mouth — stitched */}
          <path d="M82 110 L 88 112 L 92 109 L 98 113 L 104 109 L 110 113 L 116 110 L 120 113"
            stroke={AXM.parchment} strokeWidth="1.2" fill="none" />
          {/* drips */}
          <path d="M85 95 q 0 8 -1 14 M 115 95 q 0 8 1 14" stroke={AXM.blood} strokeWidth="1.2" fill="none" />
          {/* censer hanging */}
          <path d="M40 120 L 38 160 L 35 165 L 41 165 Z" stroke={AXM.parchment} fill="#06050a" strokeWidth="1.2" />
        </svg>
        <Splatter color={AXM.blood} size={120} seed={17} style={{ position: 'absolute', top: -10, left: -10, opacity: 0.6 }} />
        <Splatter color={AXM.blood} size={80} seed={31} style={{ position: 'absolute', bottom: -10, right: 90, opacity: 0.4 }} />

        {/* left side: name, hp, effects */}
        <div style={{ position: 'absolute', top: 10, left: 12, right: 110 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <DifficultyBadge tier={enemy.tier} />
            <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone }}>iv vs i</span>
          </div>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 22, lineHeight: 0.95,
            color: AXM.parchment, marginTop: 4,
            textShadow: `2px 2px 0 ${AXM.blood}`,
          }}>{enemy.name}</div>
          <div style={{
            fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 10,
            color: AXM.bone, marginTop: 2,
          }}>"…sings to the worms below."</div>
          <div style={{ marginTop: 8 }}>
            <StatBar value={enemy.hp} max={enemy.hpMax} color={AXM.blood} label="VITALS" height={10} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <FriendshipMeter value={enemy.friendship} max={enemy.friendshipMax} />
            <MindMark stacks={enemy.mindMarks} />
          </div>
          {/* effects */}
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {enemy.effects.map((e, i) => <EffectChip key={i} effect={e} />)}
          </div>
          {/* last stance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
            <SectionLabel size={9}>LAST STANCE →</SectionLabel>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 4px', background: '#000', border: `1px solid ${AXM.sulfur}` }}>
              <StanceGlyph kind={enemy.lastStance} size={12} color={AXM.sulfur} />
              <span style={{ fontFamily: AXM.sans, fontSize: 10, color: AXM.sulfur, letterSpacing: 1.5 }}>MIND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BATTLE LOG ───
function BattleLog({ phase }) {
  const lines = {
    choosing_stance: [
      'The Hierophant turns its head. Bone clicks.',
      'YOU smell wet wood and milk gone wrong.',
    ],
    choosing_action: [
      'You set your stance. The censer swings.',
      'POISON seeps. –2 HP.',
    ],
    choosing_skill: [
      'Tokens crackle in your bone-pouch.',
      'Choose a fallacy or a paradox.',
    ],
    resolving: [
      'Your blade bites the hood. ROLL 18 vs 14.',
      'CRIT — +1 BODY · +1 FALLACY banked.',
    ],
  };
  const cur = lines[phase] || lines.choosing_stance;
  return (
    <div style={{ padding: '6px 10px 0' }}>
      <div style={{
        background: '#06050a',
        border: `1px dashed ${AXM.ash}`,
        padding: '5px 8px',
        height: 44, overflow: 'hidden',
      }}>
        <SectionLabel size={8} color={AXM.bone}>⚜ BATTLE LOG · ROUND IV</SectionLabel>
        {cur.map((l, i) => (
          <div key={i} style={{
            fontFamily: AXM.serif, fontSize: 11, lineHeight: 1.15,
            color: i === 0 ? AXM.parchment : AXM.blood,
            marginTop: 1,
          }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ─── PLAYER STATUS BAR ───
// HP bar on top, token rack underneath (replaces MP). Effects stay on the side.
function PlayerStatusBar({ player }) {
  return (
    <div style={{ padding: '4px 10px 0' }}>
      <div style={{
        background: '#100d0a',
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        padding: '5px 8px 6px',
        border: `1px solid ${AXM.ash}`,
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <StatBar value={player.hp} max={player.hpMax} color={AXM.blood} label="HP" height={8} />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {player.effects.map((e, i) => <EffectChip key={i} effect={e} />)}
          </div>
        </div>
        <TokenRack tokens={player.tokens} compact={false} />
      </div>
    </div>
  );
}

// ─── PHASE HEADER ───
function PhaseHeader({ phase, selectedStance, onPhase }) {
  const labels = {
    choosing_stance: '✠ CHOOSE THY STANCE',
    choosing_action: '✠ DECLARE THY ACTION',
    choosing_skill:  '✠ INVOKE A SKILL',
    resolving:       '✠ FATE SETTLES',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 18, height: 18, background: AXM.sulfur,
          color: '#0a0a0a', fontFamily: AXM.gothic, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{COMBAT_PHASES.indexOf(phase) + 1}</div>
        <SectionLabel size={11} style={{ color: AXM.parchment }}>{labels[phase]}</SectionLabel>
      </div>
      {/* phase pips */}
      <div style={{ display: 'flex', gap: 3 }}>
        {COMBAT_PHASES.map((p, i) => (
          <div key={p} style={{
            width: 14, height: 4,
            background: COMBAT_PHASES.indexOf(phase) >= i ? AXM.sulfur : AXM.ash,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── PHASE: choosing_stance ───
function StancePhase({ enemy, selected, onPick }) {
  const stances = ['heart', 'body', 'mind'];
  const beats = { heart: 'body', body: 'mind', mind: 'heart' };
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {stances.map(k => {
        const d = STANCE_DATA[k];
        const isAdv = beats[k] === enemy.lastStance;
        const isDis = beats[enemy.lastStance] === k;
        const isSel = selected === k;
        const accent = isAdv ? AXM.sulfur : (isDis ? AXM.blood : AXM.parchment);
        return (
          <button key={k} onClick={() => onPick(k)} style={{
            flex: 1, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
            font: 'inherit', color: 'inherit', textAlign: 'left',
          }}>
            <div style={{
              position: 'relative',
              background: isSel ? '#1a1410' : '#0a0a0a',
              backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
              border: `2px solid ${isSel ? AXM.sulfur : accent}`,
              padding: '8px 6px 6px',
              minHeight: 178,
              clipPath: tornEdge({ width: 116, height: 178, jag: 4, seed: 70 + stances.indexOf(k) }),
            }}>
              <div style={{ position: 'absolute', top: 4, right: 4 }}>
                {isAdv && <span style={{ fontFamily: AXM.sans, fontSize: 8, letterSpacing: 1, color: AXM.sulfur, background: '#0a0a0a', padding: '1px 3px', border: `1px solid ${AXM.sulfur}` }}>ADV</span>}
                {isDis && <span style={{ fontFamily: AXM.sans, fontSize: 8, letterSpacing: 1, color: AXM.blood, background: '#0a0a0a', padding: '1px 3px', border: `1px solid ${AXM.blood}` }}>DIS</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, marginBottom: 2 }}>
                <StanceGlyph kind={k} size={48} color={accent} />
              </div>
              <div style={{
                textAlign: 'center', fontFamily: AXM.gothic, fontSize: 17,
                color: accent, letterSpacing: 1,
              }}>{d.name}</div>
              <div style={{
                textAlign: 'center', fontFamily: AXM.mono, fontSize: 7,
                color: AXM.bone, letterSpacing: 0.5, marginBottom: 4,
              }}>BEATS {d.counters} · WEAK {d.weakTo}</div>
              {/* derived stat table */}
              <div style={{ borderTop: `1px solid ${AXM.ash}`, paddingTop: 3 }}>
                {Object.entries(d.derived).map(([key, val]) => (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: AXM.mono, fontSize: 9,
                    color: AXM.parchment, lineHeight: 1.4,
                  }}>
                    <span style={{ color: AXM.bone }}>{key.toUpperCase()}</span>
                    <span style={{ color: accent, fontFamily: AXM.gothic, fontSize: 12 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── PHASE: choosing_action ───
function ActionPhase({ onSkill, onAttack }) {
  const actions = [
    { key: 'attack', label: 'ATTACK',  icon: 'sword',  hint: 'Deal damage by stance', accent: AXM.blood },
    { key: 'defend', label: 'DEFEND',  icon: 'shield', hint: 'Reduce next harm', accent: AXM.parchment },
    { key: 'skill',  label: 'SKILL',   icon: 'arcane', hint: 'Spend tokens · invoke', accent: AXM.sulfur },
    { key: 'item',   label: 'ITEM',    icon: 'bag',    hint: 'Use a consumable', accent: AXM.rust },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map(a => (
          <button key={a.key} onClick={a.key === 'skill' ? onSkill : (a.key === 'attack' ? onAttack : null)} style={{
            padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
            font: 'inherit', color: 'inherit', textAlign: 'left',
          }}>
            <div style={{
              background: '#0a0a0a',
              backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
              border: `2px solid ${a.accent}`,
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              clipPath: tornEdge({ width: 175, height: 64, jag: 4, seed: 80 + actions.indexOf(a) }),
            }}>
              <ActionIcon kind={a.icon} size={32} color={a.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: AXM.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 1, letterSpacing: 1 }}>{a.label}</div>
                <div style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 }}>{a.hint.toUpperCase()}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{
          fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 11,
          color: AXM.bone, borderBottom: `1px dashed ${AXM.bone}`, paddingBottom: 1, cursor: 'pointer',
        }}>or … flee like a craven (luck save)</span>
      </div>
    </div>
  );
}

// ─── PHASE: choosing_skill ───
function SkillPhase({ tokens, stance, onPick }) {
  const visible = TOKEN_SKILLS.filter(s => s.stance === stance);
  const ready = visible.filter(s => canAfford(s.cost, tokens)).length;
  return (
    <div>
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', padding: '2px',
      }}>
        {visible.map((s, i) => {
          const afford = canAfford(s.cost, tokens);
          return (
            <button key={s.id} onClick={afford ? onPick : null} style={{
              flex: '0 0 138px', padding: 0, border: 'none', background: 'transparent', cursor: afford ? 'pointer' : 'not-allowed',
              font: 'inherit', color: 'inherit', textAlign: 'left',
              opacity: afford ? 1 : 0.45,
            }}>
              <div style={{
                background: '#0a0a0a',
                backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
                border: s.cat === 'paradox' ? `2px solid ${AXM.sulfur}` : `2px dashed ${AXM.parchment}`,
                padding: '7px 7px 6px',
                minHeight: 152,
                clipPath: tornEdge({ width: 138, height: 152, jag: 3, seed: 90 + i }),
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '1px 4px', fontFamily: AXM.sans, fontSize: 8, letterSpacing: 1.5,
                    background: s.cat === 'paradox' ? AXM.sulfur : 'transparent',
                    color: s.cat === 'paradox' ? '#0a0a0a' : AXM.parchment,
                    border: s.cat === 'fallacy' ? `1px solid ${AXM.parchment}` : 'none',
                  }}>{s.cat.toUpperCase()}</span>
                  <span style={{
                    fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1,
                  }}>T{s.tier}</span>
                </div>
                <div style={{ fontFamily: AXM.gothic, fontSize: 14, lineHeight: 1.05, color: AXM.parchment, marginTop: 6 }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: AXM.serif, fontSize: 10, color: AXM.bone, marginTop: 4, flex: 1, lineHeight: 1.2 }}>
                  {s.desc}
                </div>
                <div style={{
                  marginTop: 4, paddingTop: 4, borderTop: `1px solid ${AXM.ash}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1 }}>COST</span>
                  <TokenCost cost={s.cost} tokens={tokens} size={14} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{
        textAlign: 'center', marginTop: 6,
        fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1,
      }}>
        <span style={{ color: ready > 0 ? AXM.sulfur : AXM.blood }}>{ready}</span>
        {' '}of {visible.length} CASTABLE · {stance.toUpperCase()} STANCE · {TOKEN_SKILLS.length} TOTAL
      </div>
    </div>
  );
}

// ─── PHASE: resolving ───
// outcome: 'damage' (default) | 'friendship' (engine: endCombatWithFriendship at FRIENDSHIP_COUNTER_MAX)
function ResolvePhase({ advantage, stance, enemy, outcome = 'damage', onContinue }) {
  const advColor = advantage === 'ADV' ? AXM.sulfur : advantage === 'DIS' ? AXM.blood : AXM.parchment;
  const advLabel = advantage === 'ADV' ? 'ADVANTAGE' : advantage === 'DIS' ? 'DISADVANTAGE' : 'NEUTRAL';
  const isCrit = advantage === 'ADV';
  const isFriend = outcome === 'friendship';
  return (
    <div>
      {/* stance vs stance row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        background: '#0a0a0a', border: `1px solid ${AXM.ash}`, padding: '6px 8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel size={8}>YOU</SectionLabel>
          <StanceGlyph kind={stance} size={36} color={advColor} />
        </div>
        <div style={{
          flex: 1, textAlign: 'center', position: 'relative', padding: '0 6px',
        }}>
          <div style={{
            fontFamily: AXM.gothic, fontSize: 22, color: advColor,
            letterSpacing: 2,
          }}>{advLabel}</div>
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            fontFamily: AXM.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1, marginTop: 1,
          }}>
            <span>YOU <b style={{ color: AXM.parchment, fontFamily: AXM.gothic, fontSize: 14 }}>18</b></span>
            <span style={{ color: AXM.ash }}>vs</span>
            <span>FOE <b style={{ color: AXM.parchment, fontFamily: AXM.gothic, fontSize: 14 }}>14</b></span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel size={8}>FOE</SectionLabel>
          <StanceGlyph kind={enemy.lastStance} size={36} color={AXM.bone} />
        </div>
      </div>

      {/* outcome panel — damage OR friendship */}
      <div style={{
        position: 'relative', marginTop: 6, padding: '14px 12px 12px',
        background: isFriend ? '#1a0d05' : '#1a0a0a',
        backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
        border: `2px solid ${isFriend ? AXM.rust : AXM.blood}`, textAlign: 'center', overflow: 'hidden',
        clipPath: tornEdge({ width: 358, height: 110, jag: 5, seed: 110 }),
      }}>
        <Splatter color={isFriend ? AXM.rust : AXM.blood} size={220} seed={5} style={{ position: 'absolute', top: -40, right: -40, opacity: 0.5 }} />
        <Splatter color={isFriend ? AXM.rust : AXM.blood} size={140} seed={11} style={{ position: 'absolute', bottom: -40, left: -30, opacity: 0.4 }} />
        <SectionLabel size={9} style={{ color: AXM.parchment, position: 'relative' }}>
          {isFriend ? '❦ PARLEY · HEART OPENS' : (isCrit ? '✶ CRIT · DOUBLE' : 'STRIKE LANDS')}
        </SectionLabel>
        <div style={{
          fontFamily: AXM.gothic, fontSize: isFriend ? 36 : 64, lineHeight: 1, color: AXM.parchment,
          textShadow: `3px 3px 0 ${isFriend ? AXM.rust : AXM.blood}, -1px -1px 0 ${AXM.sulfur}`,
          position: 'relative', marginTop: 2,
        }}>{isFriend ? 'FRIEND +1' : '–14'}</div>
        <div style={{
          fontFamily: AXM.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 1, position: 'relative',
        }}>
          {isFriend ? 'FRIENDSHIP 3/5  ·  AT 5: endCombatWithFriendship()' : 'BLEED · 2 ROUNDS APPLIED  ·  HIEROPHANT WOUNDED'}
        </div>
      </div>

      <button onClick={onContinue} style={{
        width: '100%', marginTop: 8, padding: '10px 12px',
        background: '#0a0a0a', border: `2px solid ${AXM.parchment}`,
        color: AXM.parchment, fontFamily: AXM.gothic, fontSize: 16, letterSpacing: 2,
        cursor: 'pointer',
      }}>
        ✠ NEXT ROUND
      </button>
    </div>
  );
}

window.CombatScreen = CombatScreen;
window.COMBAT_PHASES = COMBAT_PHASES;
