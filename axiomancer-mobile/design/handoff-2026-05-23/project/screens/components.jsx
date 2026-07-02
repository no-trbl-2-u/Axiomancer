// Component sheet + style guide artboards

function ComponentSheet() {
  return (
    <div style={{
      width: 720, padding: 24,
      background: AXM.bg, backgroundImage: PAPER_URI,
      color: AXM.parchment, fontFamily: AXM.serif,
    }}>
      <SectionLabel size={12} style={{ marginBottom: 8 }}>✠ COMPONENT SHEET — PARTS OF THE WORLD</SectionLabel>

      {/* row 1 — stat card + effect chips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <Caption>Status Card</Caption>
          <StatusCard />
          <Annot>Top of every gameplay screen. Exposes char.name, character.level, character.hp/maxHp, plus the live token pool (replaces mana).</Annot>
        </div>
        <div>
          <Caption>Effect Chips</Caption>
          <div style={{
            background:'#100d0a', backgroundImage:NOISE_URI, backgroundBlendMode:'multiply',
            border:`1px solid ${AXM.ash}`, padding:10, display:'flex', gap:6, flexWrap:'wrap',
          }}>
            <EffectChip effect={{ kind:'poison', name:'Poison', duration:3, intensity:2, tint:'debuff' }} />
            <EffectChip effect={{ kind:'bleed', name:'Bleed', duration:2, intensity:1, tint:'debuff' }} />
            <EffectChip effect={{ kind:'stun', name:'Stun', duration:1, intensity:1, tint:'debuff' }} />
            <EffectChip effect={{ kind:'burn', name:'Burn', duration:4, intensity:3, tint:'debuff' }} />
            <EffectChip effect={{ kind:'regen', name:'Regen', duration:5, intensity:1, tint:'buff' }} />
            <EffectChip effect={{ kind:'shield', name:'Warded', duration:2, intensity:1, tint:'buff' }} />
            <EffectChip effect={{ kind:'buff', name:'Buff', duration:3, intensity:1, tint:'buff' }} />
            <EffectChip effect={{ kind:'debuff', name:'Debuff', duration:2, intensity:1, tint:'debuff' }} />
          </div>
          <Annot>Effect.kind, effect.duration (rounds), effect.intensity (stack count), effect.tint (buff/debuff). Border color encodes danger.</Annot>
        </div>
      </div>

      {/* row 2 — stance, skill, item cards */}
      <SectionLabel size={11} style={{ marginTop: 18, marginBottom: 6 }}>STANCE · SKILL · ITEM CARDS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {/* stance */}
        <div>
          <Caption>Stance Card</Caption>
          <div style={{
            background: '#0a0a0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `2px solid ${AXM.parchment}`, padding: '8px 6px',
            clipPath: tornEdge({ width: 200, height: 178, jag: 4, seed: 250 }),
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
              <StanceGlyph kind="body" size={48} color={AXM.parchment} />
            </div>
            <div style={{ textAlign: 'center', fontFamily: AXM.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 1 }}>BODY</div>
            <div style={{ textAlign: 'center', fontFamily: AXM.mono, fontSize: 7, color: AXM.bone, marginBottom: 4 }}>BEATS MIND · WEAK HEART</div>
            <div style={{ borderTop: `1px solid ${AXM.ash}`, paddingTop: 3 }}>
              {Object.entries({ Attack: 13, Skill: 7, Defense: 10 }).map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: AXM.mono, fontSize: 9, color: AXM.parchment }}>
                  <span style={{ color: AXM.bone }}>{k.toUpperCase()}</span>
                  <span style={{ fontFamily: AXM.gothic, fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <Annot>Stance kind (heart/body/mind), counter relationship, derived combat stats (*Attack/*Skill/*Defense), live ADV/DIS vs enemy.lastStance.</Annot>
        </div>
        {/* skill */}
        <div>
          <Caption>Skill Card</Caption>
          <div style={{
            background: '#0a0a0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `2px solid ${AXM.sulfur}`, padding: '7px',
            clipPath: tornEdge({ width: 200, height: 138, jag: 4, seed: 251 }),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ padding: '1px 4px', fontFamily: AXM.sans, fontSize: 8, letterSpacing: 1.5, background: AXM.sulfur, color: '#0a0a0a' }}>PARADOX</span>
              <StanceGlyph kind="mind" size={14} color={AXM.bone} />
            </div>
            <div style={{ fontFamily: AXM.gothic, fontSize: 14, color: AXM.parchment, marginTop: 6 }}>OF THESEUS</div>
            <div style={{ fontFamily: AXM.serif, fontSize: 10, color: AXM.bone, marginTop: 4 }}>Replace foe limb. Disarm 2 rounds.</div>
            <div style={{ marginTop: 6, paddingTop: 4, borderTop: `1px solid ${AXM.ash}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone }}>cost</span>
              <TokenCost cost={{ mind: 1, paradox: 1 }} tokens={{ mind: 1, paradox: 1 }} size={14} />
            </div>
          </div>
          <Annot>Skill.category (Fallacy=dashed/Paradox=solid yellow), skill.philosophicalAspect (stance), skill.resourceCost (token pips), skill.tier (1/2/3). Greys when player lacks the tokens.</Annot>
        </div>
        {/* item */}
        <div>
          <Caption>Item Card</Caption>
          <div style={{
            background: '#100d0a', backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
            border: `2px solid ${AXM.sulfur}`, padding: 6, position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 2, left: 2, background: AXM.sulfur, color: '#0a0a0a', padding: '0 3px', fontFamily: AXM.sans, fontSize: 7, letterSpacing: 1 }}>WORN</div>
            <div style={{ position: 'absolute', top: 2, right: 2, background: AXM.parchment, color: '#0a0a0a', padding: '0 4px', fontFamily: AXM.mono, fontSize: 10 }}>×4</div>
            <div style={{
              width: '100%', height: 60, background: '#06050a', border: `1px dashed ${AXM.ash}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><ActionIcon kind="sword" size={36} color={AXM.parchment} /></div>
            <div style={{ fontFamily: AXM.gothic, fontSize: 13, color: AXM.parchment, marginTop: 6 }}>Long Blade</div>
            <div style={{ fontFamily: AXM.serif, fontSize: 10, color: AXM.bone, fontStyle: 'italic' }}>Iron, notched. Drinks blood.</div>
          </div>
          <Annot>Item.name, item.quantity (top-right), item.equipped (yellow border + WORN tag), item.category drives the icon.</Annot>
        </div>
      </div>

      {/* row 3 — bars, badges, advantage */}
      <SectionLabel size={11} style={{ marginTop: 18, marginBottom: 6 }}>BARS · BADGES · ADVANTAGE</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <Caption>HP Bar + Token Rack</Caption>
          <div style={{ background: '#100d0a', padding: 10, border: `1px solid ${AXM.ash}` }}>
            <StatBar value={22} max={38} color={AXM.blood} label="HP" height={10} />
            <div style={{ height: 8 }}/>
            <TokenRack tokens={{ body: 2, mind: 1, heart: 2, fallacy: 1, paradox: 1 }} />
            <div style={{ height: 8 }}/>
            <StatBar value={31} max={50} color={AXM.rust} label="BURDEN" height={10} />
          </div>
        </div>
        <div>
          <Caption>Difficulty + Advantage</Caption>
          <div style={{ background: '#100d0a', padding: 10, border: `1px solid ${AXM.ash}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <DifficultyBadge tier="simple" />
            <DifficultyBadge tier="normal" />
            <DifficultyBadge tier="elite" />
            <DifficultyBadge tier="boss" />
            <DifficultyBadge tier="unique" />
            <div style={{ width: '100%', height: 4 }} />
            <AdvBadge label="ADV" color={AXM.sulfur} />
            <AdvBadge label="—" color={AXM.parchment} />
            <AdvBadge label="DIS" color={AXM.blood} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvBadge({ label, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 6px', border: `1px solid ${color}`, color,
      fontFamily: AXM.gothic, fontSize: 14, letterSpacing: 2,
      background: '#0a0a0a',
    }}>{label === 'ADV' ? '✶ ' : label === 'DIS' ? '✶ ' : ''}{label}</div>
  );
}

function Caption({ children }) {
  return (
    <div style={{
      fontFamily: AXM.sans, fontSize: 9, letterSpacing: 2,
      color: AXM.bone, marginBottom: 4,
    }}>{children}</div>
  );
}
function Annot({ children }) {
  return (
    <div style={{
      marginTop: 4, paddingLeft: 8, borderLeft: `1px solid ${AXM.sulfur}`,
      fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, lineHeight: 1.3,
    }}>{children}</div>
  );
}

// ─── Style guide ───
function StyleGuide() {
  const swatches = [
    ['#0a0a0a', 'INK', 'bg'],
    ['#e8dfc8', 'PARCHMENT', 'fg'],
    ['#c0152a', 'BLOOD', 'damage · enemy'],
    ['#d4c026', 'SULFUR', 'skills · paradox'],
    ['#9e3a1a', 'RUST', 'buffs · 2°'],
    ['#1a0a2e', 'NIGHTSHADE', 'debuff tint'],
    ['#2a1f00', 'OLD GOLD', 'buff tint'],
    ['#8a8273', 'BONE', 'muted text'],
  ];
  return (
    <div style={{
      width: 540, padding: 24,
      background: AXM.bg, backgroundImage: PAPER_URI,
      color: AXM.parchment, fontFamily: AXM.serif,
    }}>
      <SectionLabel size={12} style={{ marginBottom: 8 }}>✠ STYLE GUIDE — INK &amp; LETTERS</SectionLabel>

      <Caption>Palette</Caption>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {swatches.map(([hex, name, use]) => (
          <div key={hex}>
            <div style={{ height: 56, background: hex, border: `1px solid ${AXM.ash}` }} />
            <div style={{ fontFamily: AXM.gothic, fontSize: 13, color: AXM.parchment, marginTop: 3, lineHeight: 1 }}>{name}</div>
            <div style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone }}>{hex}</div>
            <div style={{ fontFamily: AXM.serif, fontStyle: 'italic', fontSize: 9, color: AXM.bone }}>{use}</div>
          </div>
        ))}
      </div>

      <Caption style={{ marginTop: 14 }}>Type</Caption>
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TypeRow font={AXM.gothic} label="DISPLAY · Pirata One" sample="THE GUTTED KING WAKES" size={32} />
        <TypeRow font={AXM.gothic} label="HEADER · Pirata One" sample="Carrion Hierophant" size={20} />
        <TypeRow font={AXM.sans} label="LABEL · Bebas Neue" sample="CHOOSE THY STANCE · ROUND IV" size={14} />
        <TypeRow font={AXM.serif} label="BODY · IM Fell English" sample="It crawled out from under the cairn — patient as moss." size={14} />
        <TypeRow font={AXM.mono} label="STATS · JetBrains Mono" sample="HP 22/38   BDY 2  MND 1  HRT 2   LUCK 12" size={13} />
      </div>

      <Caption style={{ marginTop: 14 }}>Stance Glyphs</Caption>
      <div style={{ display: 'flex', gap: 12, padding: 8, background: '#0a0a0a', border: `1px solid ${AXM.ash}` }}>
        {['heart','body','mind'].map(k => (
          <div key={k} style={{ flex: 1, textAlign: 'center' }}>
            <StanceGlyph kind={k} size={48} />
            <div style={{ fontFamily: AXM.gothic, fontSize: 14, color: AXM.parchment, marginTop: 4 }}>{k.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <Caption style={{ marginTop: 14 }}>Effect Glyphs</Caption>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, padding: 8, background: '#0a0a0a', border: `1px solid ${AXM.ash}` }}>
        {[
          ['poison','POISON',AXM.blood],['bleed','BLEED',AXM.blood],['stun','STUN',AXM.sulfur],
          ['burn','BURN',AXM.rust],['regen','REGEN',AXM.sulfur],['shield','WARD',AXM.parchment],
          ['buff','BUFF',AXM.sulfur],['debuff','DEBUFF',AXM.blood],
        ].map(([k, label, c]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <EffectGlyph kind={k} size={22} color={c} />
            <div style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, marginTop: 2, letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      <Caption style={{ marginTop: 14 }}>Texture Recipe</Caption>
      <div style={{
        fontFamily: AXM.mono, fontSize: 10, color: AXM.bone, lineHeight: 1.4,
        padding: 8, background: '#0a0a0a', border: `1px dashed ${AXM.ash}`,
      }}>
        · paper bg = SVG fractalNoise (baseFreq 0.012) + grain layer (baseFreq 0.8)<br/>
        · panel edges = clip-path polygon w/ jagged ±6px noise<br/>
        · ink splatter = 28 randomly-placed circles, ±0.5–6r, 0.4–0.95 opacity<br/>
        · strokes never antialiased to roundness; favor 1.2 / 1.6 / 2.4 weights<br/>
        · all colors blend-mode: multiply over the noise layer
      </div>
    </div>
  );
}

function TypeRow({ font, label, sample, size }) {
  return (
    <div style={{ borderBottom: `1px solid ${AXM.ash}`, paddingBottom: 6 }}>
      <div style={{ fontFamily: AXM.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: font, fontSize: size, color: AXM.parchment, lineHeight: 1.05 }}>{sample}</div>
    </div>
  );
}

window.ComponentSheet = ComponentSheet;
window.StyleGuide = StyleGuide;
