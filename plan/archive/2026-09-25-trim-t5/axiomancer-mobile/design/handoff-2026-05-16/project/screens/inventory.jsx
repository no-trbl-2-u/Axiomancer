// Screen 4 — Inventory
// UX upgrade: paper-doll Equipment Dock at top shows all 7 slots,
// each item card shows its slot + equip-preview (delta vs currently worn).

const ITEMS = [
  { id:1,  name:'Long Blade',     cat:'equipment', sub:'Weapon',    qty:1, equipped:true,  desc:'Iron, notched. Drinks blood.',
    stats:{ 'ATTACK':+4, 'STAMINA':-1 } },
  { id:2,  name:"Saint's Rags",   cat:'equipment', sub:'Body',      qty:1, equipped:true,  desc:'Coarse linen, stained by chrism.',
    stats:{ 'HEART DEF':+2 } },
  { id:3,  name:'Antler Hood',    cat:'equipment', sub:'Head',      qty:1, equipped:true,  desc:'Tines crossed in mourning.',
    stats:{ 'MIND SKILL':+1, 'STEALTH':-1 } },
  { id:4,  name:'Coffin Boots',   cat:'equipment', sub:'Feet',      qty:1, equipped:true,  desc:'Pried from a dead man. Silent on stone.',
    stats:{ 'STEALTH':+2 } },
  { id:5,  name:'Iron Yoke',      cat:'equipment', sub:'Armor',     qty:1, equipped:true,  desc:'A penitent\'s burden, also a shield.',
    stats:{ 'BODY DEF':+3, 'MIND':-1 } },
  // unworn equipment — for the new equip flow
  { id:6,  name:'Reliquary Ring', cat:'equipment', sub:'Accessory', qty:1, equipped:false, desc:'Holds the thumb-bone of a forgotten saint.',
    stats:{ 'HEART':+1, 'PARADOX TOKEN':+1 } },
  { id:7,  name:'Pyre Gauntlets', cat:'equipment', sub:'Hands',     qty:1, equipped:false, desc:'Soot-blackened. Warm to the touch.',
    stats:{ 'ATTACK':+1, 'BURN RESIST':+2 } },
  { id:8,  name:'Steel Cuirass',  cat:'equipment', sub:'Armor',     qty:1, equipped:false, desc:'Stripped from a slain captain. Heavy.',
    stats:{ 'BODY DEF':+5, 'STAMINA':-2 } },
  // consumables, materials, quest unchanged
  { id:10, name:'Black Bread',         cat:'consumable', qty:4, desc:'Restore 6 HP. Stale.' },
  { id:11, name:'Worm Wine',           cat:'consumable', qty:2, desc:'+1 of every TOKEN. Applies POISON 1.' },
  { id:12, name:'Stitch Kit',          cat:'consumable', qty:1, desc:'Cure BLEED. Heal 4 HP.' },
  { id:13, name:'Blood Censer',        cat:'consumable', qty:1, desc:'Inflict BURN 3 to foe.' },
  { id:20, name:'Ash',                 cat:'material',   qty:23, desc:'For warding lines.' },
  { id:21, name:'Bone Dust',           cat:'material',   qty:7,  desc:'Catalyst for Body skills.' },
  { id:22, name:"Saint's Tears",       cat:'material',   qty:1,  desc:'A relic. Trade only.' },
  { id:30, name:"Hierophant's Tooth",  cat:'quest',      qty:1,  desc:'Token from a slain priest. Reek of incense.' },
  { id:31, name:'Sealed Letter',       cat:'quest',      qty:1,  desc:'For the woman in Ash Mire.' },
];

// equip-item sub-category → engine slot key
const SLOT_OF = { Weapon:'weapon', Head:'head', Body:'body', Hands:'hands', Feet:'feet', Armor:'armor', Accessory:'accessory' };
const SLOT_LABEL = { weapon:'WEAPON', head:'HEAD', body:'BODY', hands:'HANDS', feet:'FEET', armor:'ARMOR', accessory:'TRINKET' };
// rows for the dock layout — 4 rows × {left, right}; silhouette spans the middle column
const DOCK_ROWS = [
  ['head',   'body'],
  ['weapon', 'armor'],
  ['hands',  'accessory'],
  ['feet',   null],
];

// ── the paper-doll equipment dock ───────────────────────────────────
function EquipmentDock({ worn, selectedSlot, onSelectSlot }) {
  const slotByKey = worn; // { weapon: item, head: item, ... }

  const SlotCard = ({ slotKey }) => {
    if (!slotKey) return <div style={{ height: 34 }} />;
    const item = slotByKey[slotKey];
    const filled = !!item;
    const selected = selectedSlot === slotKey;
    return (
      <button
        onClick={() => onSelectSlot(selected ? null : slotKey)}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 5px', height: 34, boxSizing: 'border-box',
          background: selected ? '#1f1a0a' : (filled ? '#100d0a' : 'transparent'),
          backgroundImage: filled ? NOISE_URI : 'none',
          backgroundBlendMode: 'multiply',
          border: selected
            ? `2px solid ${AXM.sulfur}`
            : filled
              ? `1.5px solid ${AXM.sulfur}`
              : `1.5px dashed ${AXM.ash}`,
          boxShadow: selected ? `0 0 0 1px #0a0a0a, 0 0 8px rgba(212,192,38,0.4)` : 'none',
        }}>
        <div style={{
          width: 22, height: 22, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: filled ? '#06050a' : 'transparent',
          border: filled ? `1px solid ${AXM.ash}` : `1px dashed ${AXM.ash}`,
        }}>
          {filled
            ? <ItemGlyph cat="equipment" sub={item.sub} size={14} />
            : <span style={{ fontFamily: AXM.gothic, fontSize: 12, color: AXM.ash }}>∅</span>}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: AXM.mono, fontSize: 6.5, letterSpacing: 1.3, color: AXM.bone, lineHeight: 1 }}>
            {SLOT_LABEL[slotKey]}
          </div>
          <div style={{
            fontFamily: filled ? AXM.gothic : AXM.serif,
            fontStyle: filled ? 'normal' : 'italic',
            fontSize: filled ? 10.5 : 9,
            color: filled ? AXM.parchment : AXM.ash,
            lineHeight: 1.05, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {filled ? item.name : '— bare —'}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div style={{
      margin: '8px 10px 0',
      background: '#0d0a08', backgroundImage: PAPER_URI, backgroundBlendMode: 'multiply',
      border: `1px solid ${AXM.ash}`,
      padding: '8px 10px 10px',
      position: 'relative',
    }}>
      {/* iron rivet decoration */}
      {[[4,4],['calc(100% - 12px)',4],[4,'calc(100% - 12px)'],['calc(100% - 12px)','calc(100% - 12px)']].map((p,i) => (
        <div key={i} style={{
          position: 'absolute', left: p[0], top: p[1], width: 6, height: 6, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #6a625a, #2a2520 70%, #0a0a0a)',
        }} />
      ))}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <SectionLabel size={9}>✠ WORN UPON THE BODY</SectionLabel>
        <span style={{ fontFamily: AXM.mono, fontSize: 7, color: AXM.bone, letterSpacing: 1.4 }}>
          TAP A SLOT TO BROWSE / UNEQUIP
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 60px 1fr',
        gridTemplateRows: 'repeat(4, 34px)',
        rowGap: 4, columnGap: 5,
        alignItems: 'center',
      }}>
        {DOCK_ROWS.map(([L, R], r) => (
          <React.Fragment key={r}>
            <SlotCard slotKey={L} />
            {r === 0 && (
              <div style={{
                gridColumn: 2, gridRow: '1 / span 4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%',
              }}>
                <PaperDoll />
              </div>
            )}
            <SlotCard slotKey={R} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── the silhouette in the middle of the dock ────────────────────────
function PaperDoll() {
  return (
    <svg viewBox="0 0 70 180" width="52" height="140" style={{ display: 'block', opacity: 0.9 }}>
      {/* halo */}
      <circle cx="35" cy="22" r="20" fill="none" stroke={AXM.sulfur} strokeWidth="0.6" opacity="0.4" strokeDasharray="1 2" />
      {/* hood */}
      <path d="M35 6 C 16 6 12 26 16 46 L 54 46 C 58 26 54 6 35 6 Z"
        fill="#0a0807" stroke={AXM.parchment} strokeWidth="1.2" />
      {/* face shadow */}
      <ellipse cx="35" cy="34" rx="11" ry="13" fill="#000" stroke={AXM.parchment} strokeWidth="0.6" />
      {/* eye hollows */}
      <circle cx="30" cy="32" r="1" fill={AXM.blood} />
      <circle cx="40" cy="32" r="1" fill={AXM.blood} />
      {/* shoulders / cloak */}
      <path d="M14 46 L 6 80 L 6 96 L 16 90 L 16 170 L 54 170 L 54 90 L 64 96 L 64 80 L 56 46 Z"
        fill="#0a0807" stroke={AXM.parchment} strokeWidth="1.2" />
      {/* central robe seam */}
      <line x1="35" y1="46" x2="35" y2="170" stroke={AXM.parchment} strokeWidth="0.6" opacity="0.5" />
      {/* belt */}
      <line x1="16" y1="110" x2="54" y2="110" stroke={AXM.parchment} strokeWidth="1" />
      <rect x="32" y="107" width="6" height="6" fill={AXM.sulfur} stroke="#0a0a0a" strokeWidth="0.5" />
      {/* hands suggestion */}
      <ellipse cx="14" cy="118" rx="4" ry="6" fill="#0a0807" stroke={AXM.parchment} strokeWidth="0.8" />
      <ellipse cx="56" cy="118" rx="4" ry="6" fill="#0a0807" stroke={AXM.parchment} strokeWidth="0.8" />
      {/* feet */}
      <ellipse cx="24" cy="172" rx="6" ry="3" fill={AXM.parchment} opacity="0.7" />
      <ellipse cx="46" cy="172" rx="6" ry="3" fill={AXM.parchment} opacity="0.7" />
    </svg>
  );
}

// ── stat diff row ───────────────────────────────────────────────────
function StatDiff({ stats, sign = '+', label }) {
  if (!stats) return null;
  const entries = Object.entries(stats);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {label && (
        <span style={{
          fontFamily: AXM.mono, fontSize: 7, color: AXM.bone, letterSpacing: 1.4,
          alignSelf: 'center', marginRight: 2,
        }}>{label}</span>
      )}
      {entries.map(([k, v]) => {
        const positive = v > 0;
        return (
          <span key={k} style={{
            fontFamily: AXM.mono, fontSize: 9, letterSpacing: 0.8,
            padding: '1px 4px',
            background: positive ? 'rgba(212,192,38,0.12)' : 'rgba(192,21,42,0.14)',
            border: `1px solid ${positive ? AXM.sulfur : AXM.blood}`,
            color: positive ? AXM.sulfur : AXM.blood,
          }}>
            {positive ? '+' : ''}{v} {k}
          </span>
        );
      })}
    </div>
  );
}

// ── compute net stat delta between two equipment items ──────────────
function computeDelta(newItem, oldItem) {
  if (!newItem?.stats) return null;
  const out = { ...newItem.stats };
  if (oldItem?.stats) {
    for (const [k, v] of Object.entries(oldItem.stats)) {
      out[k] = (out[k] || 0) - v;
    }
  }
  // remove zeros
  for (const k of Object.keys(out)) if (out[k] === 0) delete out[k];
  return Object.keys(out).length ? out : null;
}

// ── main inventory screen ───────────────────────────────────────────
function InventoryScreen({
  activeTab = 'all',
  onTab = () => {},
  expandedId = null,
  onExpand = () => {},
  selectedSlot = null,
  onSelectSlot = () => {},
  fromCombat = false,
}) {
  const tabs = [
    { k: 'all',         l: 'ALL' },
    { k: 'equipment',   l: 'GEAR' },
    { k: 'consumable',  l: 'PHIALS' },
    { k: 'material',    l: 'STUFF' },
    { k: 'quest',       l: 'SEALED' },
  ];

  // worn-by-slot map for the dock
  const worn = {};
  for (const it of ITEMS) {
    if (it.cat === 'equipment' && it.equipped) worn[SLOT_OF[it.sub]] = it;
  }

  // when a slot is selected, filter the sack to compatible items (cat=equipment AND sub matches)
  let filtered;
  if (selectedSlot) {
    const targetSub = Object.keys(SLOT_OF).find(k => SLOT_OF[k] === selectedSlot);
    filtered = ITEMS.filter(i => i.cat === 'equipment' && i.sub === targetSub);
  } else {
    filtered = activeTab === 'all' ? ITEMS : ITEMS.filter(i => i.cat === activeTab);
  }

  return (
    <ScreenBg style={{ display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '12px 14px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <SectionLabel size={8} color={AXM.bone}>SACK · WALLET · BURDEN</SectionLabel>
            <div style={{ fontFamily: AXM.gothic, fontSize: 22, lineHeight: 0.95, marginTop: 1 }}>
              INVENTORY
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1 }}>SHILLING</div>
            <div style={{ fontFamily: AXM.gothic, fontSize: 20, color: AXM.sulfur, lineHeight: 1 }}>⚜ 47</div>
          </div>
        </div>
        <div style={{ marginTop: 6 }}>
          <StatBar value={31} max={50} color={AXM.rust} label="BURDEN · STONE" height={7} />
        </div>
      </div>

      {/* the new dock */}
      <div style={{ flexShrink: 0 }}>
        <EquipmentDock
          worn={worn}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />
      </div>

      {/* tabs */}
      <div style={{
        display: 'flex', gap: 0, padding: '8px 10px 0',
        marginBottom: 6, opacity: selectedSlot ? 0.4 : 1, flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.k}
            onClick={() => { onSelectSlot(null); onTab(t.k); }}
            style={{
              flex: 1, padding: '5px 4px',
              background: activeTab === t.k && !selectedSlot ? AXM.parchment : 'transparent',
              border: `1px solid ${AXM.ash}`,
              borderRight: 'none', cursor: 'pointer',
              fontFamily: AXM.gothic, fontSize: 11, letterSpacing: 1,
              color: activeTab === t.k && !selectedSlot ? '#0a0a0a' : AXM.parchment,
            }}>{t.l}</button>
        ))}
      </div>

      {/* slot filter banner */}
      {selectedSlot && (
        <div style={{
          margin: '0 10px 6px', padding: '5px 10px', flexShrink: 0,
          background: '#1f1a0a', border: `1.5px solid ${AXM.sulfur}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1.4 }}>FITTING SLOT </span>
            <span style={{ fontFamily: AXM.gothic, fontSize: 14, color: AXM.sulfur, letterSpacing: 1.5 }}>
              ✦ {SLOT_LABEL[selectedSlot]}
            </span>
          </div>
          <button onClick={() => onSelectSlot(null)} style={{
            all: 'unset', cursor: 'pointer',
            fontFamily: AXM.mono, fontSize: 9, letterSpacing: 1.4,
            color: AXM.parchment,
            padding: '3px 6px', border: `1px solid ${AXM.parchment}`,
          }}>CLEAR ✕</button>
        </div>
      )}

      {/* combat CTA */}
      {fromCombat && (
        <div style={{ padding: '0 10px 6px', flexShrink: 0 }}>
          <div style={{
            background: AXM.blood, color: '#0a0a0a',
            padding: '5px 8px', textAlign: 'center',
            fontFamily: AXM.gothic, fontSize: 12, letterSpacing: 2,
          }}>✠ USE IN COMBAT — 1 ACTION</div>
        </div>
      )}

      {/* item grid — scrolls inside the phone bounds */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
        padding: '0 10px 14px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
        gridAutoRows: 'min-content',
        scrollbarWidth: 'thin',
      }}>
        {filtered.map(it => {
          const isExp = expandedId === it.id;
          const isEquipment = it.cat === 'equipment';
          const itsSlot = isEquipment ? SLOT_OF[it.sub] : null;
          const currentInSlot = itsSlot ? worn[itsSlot] : null;
          const isReplacing = isEquipment && !it.equipped && currentInSlot;
          const delta = isReplacing ? computeDelta(it, currentInSlot) : null;
          return (
            <div key={it.id} onClick={() => onExpand(isExp ? null : it.id)} style={{
              gridColumn: isExp ? 'span 3' : 'span 1',
              cursor: 'pointer',
              background: it.equipped ? '#1a1610' : '#100d0a',
              backgroundImage: NOISE_URI, backgroundBlendMode: 'multiply',
              border: it.equipped ? `2px solid ${AXM.sulfur}` : `1px solid ${AXM.ash}`,
              padding: '6px',
              minHeight: isExp ? 'auto' : 92,
              position: 'relative',
            }}>
              {/* icon area */}
              <div style={{
                width: '100%', height: 46,
                background: '#06050a',
                border: `1px dashed ${AXM.ash}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ItemGlyph cat={it.cat} sub={it.sub} />
              </div>
              <div style={{
                fontFamily: AXM.gothic, fontSize: 11, color: AXM.parchment,
                lineHeight: 1.05, marginTop: 4,
              }}>{it.name}</div>
              {/* slot mini-tag on equipment */}
              {isEquipment && !isExp && (
                <div style={{
                  fontFamily: AXM.mono, fontSize: 7, color: AXM.bone, letterSpacing: 1.2,
                  marginTop: 1,
                }}>SLOT · {SLOT_LABEL[itsSlot]}</div>
              )}
              {it.qty > 1 && (
                <div style={{
                  position: 'absolute', top: 2, right: 2,
                  background: AXM.parchment, color: '#0a0a0a',
                  padding: '0 4px', fontFamily: AXM.mono, fontSize: 10,
                }}>×{it.qty}</div>
              )}
              {it.equipped && (
                <div style={{
                  position: 'absolute', top: 2, left: 2,
                  background: AXM.sulfur, color: '#0a0a0a',
                  padding: '0 3px', fontFamily: AXM.sans, fontSize: 7, letterSpacing: 1,
                }}>✦ WORN</div>
              )}

              {/* expanded panel */}
              {isExp && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${AXM.ash}` }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: AXM.serif, fontSize: 11, color: AXM.bone, fontStyle: 'italic' }}>
                        "{it.desc}"
                      </div>

                      {/* equipment-specific preview */}
                      {isEquipment && (
                        <div style={{ marginTop: 8 }}>
                          {/* its own stats */}
                          <StatDiff stats={it.stats} label="STATS" />
                          {/* what slot it fills */}
                          <div style={{
                            marginTop: 8, padding: '6px 8px',
                            background: '#06050a', border: `1px solid ${AXM.ash}`,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            <div style={{ fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1.4 }}>
                              {it.equipped ? 'EQUIPPED IN' : 'WOULD EQUIP TO'}
                            </div>
                            <div style={{ fontFamily: AXM.gothic, fontSize: 14, color: AXM.sulfur, letterSpacing: 1.5 }}>
                              ✦ {SLOT_LABEL[itsSlot]}
                            </div>
                          </div>

                          {/* replacement preview */}
                          {isReplacing && (
                            <div style={{
                              marginTop: 6, padding: '6px 8px',
                              borderLeft: `2px solid ${AXM.blood}`,
                              background: 'rgba(192,21,42,0.06)',
                            }}>
                              <div style={{
                                fontFamily: AXM.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1.4,
                                marginBottom: 4,
                              }}>REPLACES</div>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontFamily: AXM.gothic, fontSize: 13, color: AXM.parchment,
                              }}>
                                <span style={{ color: AXM.bone, textDecoration: 'line-through' }}>
                                  {currentInSlot.name}
                                </span>
                                <span style={{ color: AXM.sulfur, fontSize: 16 }}>→</span>
                                <span>{it.name}</span>
                              </div>
                              {delta && <StatDiff stats={delta} label="NET" />}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* action buttons — big and obvious */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {isEquipment && it.equipped && (
                      <button style={{ ...inventoryActionStyle, ...primaryAction(AXM.parchment, true) }}>
                        ◌ UNEQUIP
                      </button>
                    )}
                    {isEquipment && !it.equipped && (
                      <button style={{ ...inventoryActionStyle, ...primaryAction(AXM.sulfur) }}>
                        ✦ EQUIP {isReplacing ? `· REPLACE ${currentInSlot.name.toUpperCase()}` : ''}
                      </button>
                    )}
                    {it.cat === 'consumable' && (
                      <button style={{ ...inventoryActionStyle, ...primaryAction(AXM.sulfur) }}>
                        ☩ USE {fromCombat ? '· IN COMBAT' : ''}
                      </button>
                    )}
                    {it.cat !== 'quest' && (
                      <button style={{
                        ...inventoryActionStyle, flex: 0, padding: '7px 10px',
                        color: AXM.blood, borderColor: AXM.blood,
                      }}>DISCARD</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScreenBg>
  );
}

const inventoryActionStyle = {
  flex: 1, padding: '7px 8px',
  background: 'transparent',
  border: `1px solid ${AXM.parchment}`,
  color: AXM.parchment, fontFamily: AXM.gothic, fontSize: 13, letterSpacing: 1.5,
  cursor: 'pointer',
};

const primaryAction = (color, outline) => ({
  background: outline ? 'transparent' : color,
  color: outline ? color : '#0a0a0a',
  borderColor: color,
  borderWidth: 2,
});

function ItemGlyph({ cat, sub, size = 32 }) {
  if (cat === 'equipment' && sub === 'Weapon') return <ActionIcon kind="sword" size={size} color={AXM.parchment} />;
  if (cat === 'equipment' && sub === 'Armor')  return <ActionIcon kind="shield" size={size} color={AXM.parchment} />;
  if (cat === 'equipment' && sub === 'Head')   return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <path d="M6 18 C 6 8 26 8 26 18 L 24 26 L 8 26 Z" />
      <path d="M10 6 L 8 14 M 22 6 L 24 14" />
    </svg>
  );
  if (cat === 'equipment' && sub === 'Hands')  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <path d="M10 6 L 10 18 L 8 22 L 8 28 L 22 28 L 22 22 L 24 18 L 24 6" />
      <path d="M14 4 L 14 18 M 18 4 L 18 18" strokeWidth="1.5" />
    </svg>
  );
  if (cat === 'equipment' && sub === 'Feet')   return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <path d="M8 8 L 14 8 L 14 18 L 26 22 L 26 26 L 8 26 Z" />
    </svg>
  );
  if (cat === 'equipment' && sub === 'Body')   return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <path d="M8 6 L 4 10 L 10 14 L 10 28 L 22 28 L 22 14 L 28 10 L 24 6 L 20 6 L 16 9 L 12 6 Z" />
    </svg>
  );
  if (cat === 'equipment' && sub === 'Accessory') return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <circle cx="16" cy="18" r="8" />
      <circle cx="16" cy="18" r="3" fill={AXM.sulfur} />
      <path d="M16 4 L 18 10 L 14 10 Z" fill={AXM.parchment} />
    </svg>
  );
  if (cat === 'equipment') return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <path d="M6 8 L 26 8 L 22 26 L 10 26 Z" />
    </svg>
  );
  if (cat === 'consumable') return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={AXM.parchment} strokeWidth="2">
      <path d="M12 4 H 20 V 12 L 24 24 C 24 27 22 28 16 28 C 10 28 8 27 8 24 L 12 12 Z" fill={AXM.parchment} fillOpacity="0.2" />
      <path d="M12 4 H 20" strokeWidth="3" />
    </svg>
  );
  if (cat === 'material') return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill={AXM.parchment}>
      <circle cx="10" cy="14" r="3" /><circle cx="20" cy="10" r="2.5" />
      <circle cx="22" cy="20" r="3.5" /><circle cx="12" cy="22" r="2" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  );
  if (cat === 'quest') return <ActionIcon kind="scroll" size={size} color={AXM.sulfur} />;
  return null;
}

window.InventoryScreen = InventoryScreen;
