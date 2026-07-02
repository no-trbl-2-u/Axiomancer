# Combat UX Legibility Overhaul — Design Brief

> **Design-first phase output.** This document addresses AUDIT [4.5] Combat UX unintuitive and playtest findings [F02-F06] through systematic design improvements. Implementation follows in subsequent phases.

## Executive Summary

### Problems Identified
Current combat UI suffers from comprehension barriers identified in user testing:
- **[F02] Encounter jargon unclear:** Technical terms confuse players 
- **[F04] Battle log ability names confusing:** Engine terminology doesn't match player expectations
- **[F05] LET phase numbers meaningless:** Round progression lacks clear meaning
- **[F06] CRUCIBLE symbols incomprehensible:** Icons require mental translation

### Design Solution Approach
Transform combat from "decode the interface" to "understand the tactical situation" through:
1. **Player-centric terminology** replacing engine jargon
2. **Intuitive iconography** that communicates meaning at a glance
3. **Clear information hierarchy** emphasizing decision-relevant data
4. **Progressive disclosure** of complex mechanics

---

## 1. Terminology Clarification

### Core Combat Vocabulary

| **Current Engine Term** | **Player-Friendly Term** | **Context** |
|---|---|---|
| `choosingStance` | "Choose a Stance" | Phase picker label |
| `choosingAction` | "Your Move" | Phase picker label |
| `choosingSkill` | "Select Technique" | Phase picker label |
| `resolving` | "Strike Unfolds" | Phase picker label |
| "LET IT FALL" | "COMMIT" | Action confirmation button |
| "CRUCIBLE" | "TECHNIQUES" | Skill panel header |
| "VITAE" | "VITAE" | HP bar label; keep Axiomancer's canon term |
| "MIND MARKS" | "FOCUS" | Mental state indicator |
| "STRIFE STIRS" | "BATTLE BEGINS" | Encounter modal sash |

### Battle Log Language Standards

**Before (Engine Terms):**
- "Player executes REND with stance BODY"
- "Enemy applies WITHER effect duration 3"
- "Friendship counter increments by 2"

**After (Player-Friendly):**
- "You strike with [REND] from a defensive stance"
- "Foe weakens you for 3 rounds"  
- "Your bond deepens"

### Glossary Integration

Add contextual help for key concepts without cluttering the UI:
- **Stance:** Your combat posture (tap stance glyphs for brief description)
- **Techniques:** Special abilities beyond basic strikes
- **Focus:** Mental energy affecting ability use
- **Bond:** Relationship strength with the current foe

---

## 2. Iconography System

### Visual Symbol Standards

#### Stance Glyphs (Keep Current Design, Improve Context)
- **Body stance:** Shield-like symbol = Defensive positioning
- **Heart stance:** Organic curves = Emotional/social approach  
- **Mind stance:** Geometric angles = Analytical/magical focus
- **Add context on hover/press:** Brief tooltip explaining stance benefits

#### Combat Action Icons
| **Action** | **Icon Treatment** | **Visual Cue** |
|---|---|---|
| Attack | Crossed weapons | Sharp, angular shapes in rust |
| Defend | Shield outline | Solid, protective geometry in bone |
| Skill/Technique | Stylized star | Dynamic burst shape in sulfur |
| Item | Pouch/bottle | Curved, container-like in parchment |
| Flee | Exit arrow | Directional movement in ash |

#### Status Effect Chips
- **Beneficial effects:** Subtle upward-pointing triangle accent
- **Harmful effects:** Subtle downward-pointing triangle accent  
- **Neutral effects:** No directional accent
- **Duration indication:** Pip count or fading opacity gradient

#### Progress Indicators
- **Round counter:** Roman numerals (I, II, III) instead of raw numbers
- **Phase progression:** Connected dots showing current step
- **Health bars:** Maintain current design but add clearer labeling

### Icon Accessibility
- **No color-only communication:** Every icon has shape/pattern differentiation
- **High contrast mode support:** All symbols readable against any background
- **Touch target sizing:** Minimum 44pt for interactive elements

---

## 3. Information Hierarchy

### Primary Information (Always Prominent)
1. **Current player health** — Largest, clearest bar
2. **Available actions** — Central, well-spaced buttons  
3. **Current phase** — Clear state indicator
4. **Enemy health** — Secondary but visible

### Secondary Information (Contextual Display)
1. **Effect chips** — Grouped by beneficial/harmful
2. **Round count** — Present but not dominant
3. **Friendship meter** — Visible when relevant to encounter
4. **Stance indicators** — Active during stance selection

### Tertiary Information (Progressive Disclosure)
1. **Battle log detail** — Scrollable, condensed by default
2. **Technique descriptions** — On-demand via tap/press
3. **Effect descriptions** — Tooltip system
4. **Combat statistics** — Hidden unless explicitly requested

### Visual Grouping Principles
- **Related information clusters together** — All player stats in one area
- **Action-consequence proximity** — Buttons near their result displays
- **Consistent positioning** — Same info types always in same screen regions
- **Breathing room** — Adequate spacing prevents visual crowding

---

## 4. Specific Fixes for Playtest Findings

### [F02] Encounter Jargon → Player-Friendly Terminology

**Problem:** Technical language creates barrier to entry
**Solution:** Replace all engine terminology with natural language

**Implementation Guide:**
- Update all presenter copy constants to use player-friendly terms
- Maintain engine terminology in code, translate at presentation layer
- Add brief contextual hints for complex concepts

### [F04] Battle Log Ability Names → Clear, Consistent Naming

**Problem:** Engine ability IDs show up as uppercase technical names
**Solution:** Create display name mapping system

**Implementation Guide:**
- Map engine skill IDs to descriptive names ("REND" → "Savage Strike")
- Use consistent naming patterns (Action + Target: "Strike Enemy", "Heal Self")
- Show technique effects in parentheses ("Heal Self (+5 Health)")

### [F05] LET Phase Numbers → Meaningful Progress Indicators

**Problem:** "LET IT FALL" and phase numbers confuse players
**Solution:** Replace with clear action language and visual progress

**Implementation Guide:**
- "LET IT FALL" → "COMMIT" (direct action language)
- Phase numbers → Progress dots or step indicators
- Current phase highlighted, future phases dimmed
- Past phases collapsed with summary of choice made

### [F06] CRUCIBLE Symbols → Comprehensible Iconography

**Problem:** Technical symbols require mental translation
**Solution:** Self-explanatory icons with consistent visual language

**Implementation Guide:**
- Replace abstract symbols with recognizable icons
- Ensure each technique type has distinctive visual character
- Add brief descriptions on long-press for complex techniques
- Group similar techniques visually (offensive, defensive, utility)

---

## 5. Layout Recommendations

### Current Layout Strengths (Preserve)
- **Three-panel combat structure** — Enemy panel, log, player actions work well
- **Vertical phase progression** — Natural top-to-bottom flow
- **Player HUD at bottom** — Familiar mobile game pattern

### Recommended Improvements

#### Enemy Panel Enhancements
- **Larger health bar** — Make enemy HP more prominent for tactical decisions
- **Grouped status effects** — Beneficial and harmful effects in separate clusters
- **Stance indicator clarity** — Bigger stance glyph, clearer labeling

#### Battle Log Optimization
- **Condensed default view** — Show only last 2-3 actions by default
- **Expandable detail** — Tap to see full log history
- **Color coding** — Use existing severity colors but with better contrast
- **Auto-scroll** — New entries always visible

#### Action Selection Improvements  
- **Larger touch targets** — Especially for technique selection
- **Clear action flow** — Visual connection between phases
- **Undo capability** — Visual indication when choices can be changed
- **Confirmation clarity** — Make "commit" action unmistakable

#### Mobile-Specific Considerations
- **Thumb-friendly zones** — Most-used actions in comfortable reach
- **Landscape orientation** — Maintain usability when device rotated
- **Safe area compliance** — No critical UI in notch/gesture areas

---

## Implementation Guidance

### Development Phases

#### Phase 97: Combat Terminology Implementation
- Update all presenter constants with player-friendly terms
- Implement display name mapping for battle log entries  
- Add contextual tooltips for key concepts
- **Files affected:** `state/presenters/combat.engine.ts`, battle log components

#### Phase 98: Combat Iconography Implementation  
- Replace or enhance existing combat icons
- Implement status effect visual categorization
- Update progress indicators and phase displays
- **Files affected:** Stance components, effect chips, phase indicators

#### Phase 99: Combat Information Hierarchy Implementation
- Adjust visual prominence based on hierarchy design
- Implement progressive disclosure patterns
- Optimize mobile layout and touch targets
- **Files affected:** Main combat layout, enemy panel, player HUD

### Design System Integration
- **Theme compliance:** All changes use existing `theme/axm.ts` color tokens
- **Typography consistency:** Maintain current font choices and sizes
- **Component reusability:** Leverage existing components where possible
- **Accessibility baseline:** Maintain current screen reader support

### Testing Approach
- **Before/after usability testing** — Measure comprehension improvement
- **Accessibility validation** — Screen reader and color contrast testing
- **Mobile device testing** — Various screen sizes and orientations
- **Performance impact** — Ensure design changes don't affect render performance

---

## Success Metrics

### Comprehension Improvements
- **Reduced time-to-understand** — Players grasp combat options faster
- **Fewer confused user actions** — Less trial-and-error behavior
- **Better tactical decision-making** — Players make informed choices

### Accessibility Gains  
- **WCAG 2.1 AA compliance** — All critical information accessible
- **Color-independent design** — No essential info lost without color
- **Screen reader optimization** — Clear semantic structure for assistive tech

### Development Efficiency
- **Maintainable terminology system** — Easy updates to player-facing language
- **Consistent iconography** — Reusable symbols across combat features
- **Scalable information design** — Pattern supports future combat additions

---

*This design brief provides the foundation for three implementation phases that will systematically address the combat UX legibility issues identified in user testing while preserving the existing combat functionality and maintaining the gothic atmosphere of Axiomancer Mobile.*