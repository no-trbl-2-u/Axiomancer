# Encounter Pilot — The Borrowed Blaze

> **Status:** narrative pilot, not implemented content. Setting: the existing
> **Northern Forest**, between its marked paths and Bone Hollow. Numbers and
> state keys below are an authoring proposal and must be reconciled with the
> Hazard engine before implementation.

## Player-facing encounter

### THE BORROWED BLAZE

A beech has fallen across the spring run. Its root plate lifted a stone bearing
three survey cuts; fresh resin fills the lowest cut. Beyond it, the path divides.
The official blaze points uphill. Boot wear and a dragged charcoal sack lead
under the trunk toward the water.

A charcoal burner kneels beside the exposed stone. She has a mallet in one hand
and the forest warden's brass proofmark in the other.

> **Burner:** “The mark says uphill. The water says he moved it.”
>
> **Warden:** “The mark says this road was measured.”
>
> **Burner:** “Then measure who gets wet.”

**Hazard: Split Run**  
If unresolved, crossing costs **3 VITAE** and applies **ROOT (1 round)**.

#### Choose

1. **Brace the fallen beech**  
   Spend **1 BODY die**. Prevent the VITAE loss and ROOT. Leave the warden's
   blaze unchanged.  
   **Known result:** the upper path remains the registered route.

2. **Follow the charcoal drag**  
   Take **3 VITAE** loss and apply **ROOT (1 round)**. Reach the lower bank
   without moving either mark.  
   **Known result:** find **1 Charcoal Bundle**. The route dispute remains open.

3. **Set the proofmark beside the spring**  
   Spend **1 MIND die**. No VITAE loss. Move the registered blaze to the lower
   path.  
   **Known result:** the lower route opens; the upper route closes. The warden
   records your name.

4. **Ask them to test both crossings**  
   Spend **1 HEART die**. **Unknown outcome:** each witness may refuse.  
   If both agree: no VITAE loss; add **Joint Measure** to the codex.  
   If either refuses: take **3 VITAE** loss; the route dispute remains open.

### Resolution samples

**Brace:** The burner drives your wedge beneath the trunk. Water passes under
new bark and around the old stone. The brass mark stays uphill.

**Follow:** The sack groove ends at a dry clamp screened by hazel. When you
return, the two of them are still arguing over the lifted stone.

**Move the mark:** The warden presses your name into his wax tablet before he
lets go of the brass. By dusk, travelers have begun wearing a second line into
the lower bank.

**Joint measure — agreement:** They cross once uphill and once beside the
spring. The warden writes two times. The burner makes him write who carried the
sack.

**Joint measure — refusal:** No shared test occurs. You choose your footing
without their help; the root fibres tighten around your boot.

## Proposed state residue

These names document intent only; implementation must use approved state and
item identifiers.

| Choice | Immediate mechanics | Persistent authored residue |
|---|---|---|
| Brace | spend 1 BODY die; prevent 3 VITAE loss and ROOT | `nf.borrowed-blaze.braced`; upper route retained |
| Follow | lose 3 VITAE; ROOT (1); gain Charcoal Bundle | `nf.borrowed-blaze.passed`; dispute unresolved |
| Move | spend 1 MIND die; prevent loss | `nf.borrowed-blaze.moved`; lower open, upper closed; warden records player |
| Test | spend 1 HEART die; branch on witness consent | agreement unlocks codex; refusal applies crossing cost |

No choice is labeled merciful, rational, selfish, or correct. The player sees
who benefits and what changes, while later content may complicate any route.

## Rule-test annotations

| Marker | Rule under test | Evidence in pilot |
|---|---|---|
| A | Claim → object → consequence | disputed measurement → brass proofmark/lifted survey stone → route and record change |
| B | Landscape agency | windthrow and spring physically create route pressure; weather does not mirror mood |
| C | Historical scale through layers | old survey cuts, fresh resin, boot wear, and new traffic lines expose revisions over time |
| D | Moral ambiguity through event | every option assigns risk, labor, access, and authority without narrator judgment |
| E | Restrained interiority | positions emerge through work speech, tools, refusal, and recordkeeping |
| F | Concrete object focus | wedge, stone, charcoal sack, brass mark, and wax tablet each affect evidence or outcome |
| G | Distinct dialogue voices | burner tests rules against labor; warden answers through institutional procedure |
| H | Choice-register clarity | verb-led choices separate flavor from exact die, VITAE, ROOT, item, and route effects |
| I | Canon doctrine | VITAE and STANCE-era stat dice are used without narrative substitutes; status consequence is explicit |
| J | Honest uncertainty | HEART outcome says `Unknown` and gives both branches rather than manufacturing certainty |
| K | Residue | proposed flags, route state, item, record, and codex preserve different consequences |
| L | Original imagery | Northern Forest craft/survey vocabulary and Axiomancer claim/seam cosmology drive the scene |

## Evaluation notes

Before any implementation, confirm that encounter-context die spending, ROOT's
exact duration display, route locking, item grant, and witness-consent branch
all exist or revise the preview to match available mechanics. Mechanics and UI
clarity override this pilot's prose. Run the full
[Evaluation rubric](../EVALUATION.md) and [anti-imitation review](../ANTI_IMITATION.md)
after the mechanics are fixed, then remove annotations from shipped copy.
