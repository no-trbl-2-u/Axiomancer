/**
 * The editor's working-draft card type and the Card ⇄ CardDraft mappers.
 *
 * A `CardDraft` mirrors EVERY editable field of the real `Card` (full
 * fidelity) but normalizes the three "list-ish" optionals (`combatEffects`,
 * `specialMechanics`, `tags`) into always-present arrays so the form code never
 * has to null-check them. `fromDraft` prunes empty arrays / blank optionals
 * back out so the value written to cards.library.ts stays minimal and matches
 * the existing hand-authored style.
 *
 * NOTE: the user-facing UI calls these "Cards" / "Actions". The literal type
 * name `Card` survives only here, where it is the real TS type.
 */
import type {
    Card,
    CardCategory,
    StatType,
    CardTier,
    CardTarget,
    CardRank,
    CardType,
    CardRider,
    CardCombatEffects,
    CardSpecialMechanic,
    CardLearningRequirement,
    CardSynergy,
} from '@mechanics/Cards/types';

/**
 * Full-fidelity editable draft of a card (`Card`). Every editable `Card`
 * field is represented. The three array fields are non-optional in the draft
 * (default `[]`); everything else mirrors `Card` exactly.
 */
export interface CardDraft {
    id: string;
    name: string;
    category: CardCategory;
    philosophicalAspect: StatType;
    description: string;
    tier: CardTier;
    targetType: CardTarget;
    /** Spec 32 v3 — the rank ladder (1 Doxa … 6 Aporia); rarity derives from it. */
    rank: CardRank;
    /** Spec 32 v3 — spell / enchantment / disenchant. */
    cardType: CardType;
    /** Spec 32 v3 — the authored FREE (dieless) line. Round-tripped verbatim;
     *  edited in source (the rider is a real-unit bundle, not a form field). */
    free?: CardRider;
    /** Fate Engine P1 die-interaction lines — round-tripped verbatim so an
     *  editor save never silently deletes a card's printed die lines. */
    threshold?: Card['threshold'];
    dieBonus?: Card['dieBonus'];
    fate?: Card['fate'];
    fallen?: Card['fallen'];
    /** Always an array in the draft (default `[]`). */
    combatEffects: CardCombatEffects[];
    /** Always an array in the draft (default `[]`). */
    specialMechanics: CardSpecialMechanic[];
    learningRequirement?: CardLearningRequirement;
    synergy?: CardSynergy;
    incrementsFriendship?: number;
    addedIn?: string;
    /** Always an array in the draft (default `[]`). */
    tags: string[];
}

/** A fresh, valid blank card ready for the CREATE tab. */
export function blankCard(): CardDraft {
    return {
        id: '',
        name: '',
        category: 'fallacy',
        philosophicalAspect: 'body',
        description: '',
        tier: 1,
        targetType: 'enemy',
        rank: 1,
        cardType: 'spell',
        free: undefined,
        threshold: undefined,
        dieBonus: undefined,
        fate: undefined,
        fallen: undefined,
        combatEffects: [],
        specialMechanics: [],
        learningRequirement: undefined,
        synergy: undefined,
        incrementsFriendship: undefined,
        addedIn: undefined,
        tags: [],
    };
}

/** Real `Card` → editable `CardDraft` (fills the array fields with defaults). */
export function toDraft(skill: Card): CardDraft {
    return {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        philosophicalAspect: skill.philosophicalAspect,
        description: skill.description,
        tier: skill.tier,
        targetType: skill.targetType,
        rank: skill.rank,
        cardType: skill.cardType,
        free: skill.free ? { ...skill.free } : undefined,
        threshold: skill.threshold ? { ...skill.threshold } : undefined,
        dieBonus: skill.dieBonus ? { ...skill.dieBonus } : undefined,
        fate: skill.fate ? { ...skill.fate } : undefined,
        fallen: skill.fallen ? { ...skill.fallen } : undefined,
        combatEffects: (skill.combatEffects ?? []).map((e) => ({ ...e })),
        specialMechanics: (skill.specialMechanics ?? []).map((m) => ({ ...m })),
        learningRequirement: skill.learningRequirement
            ? { ...skill.learningRequirement }
            : undefined,
        synergy: skill.synergy ? { ...skill.synergy } : undefined,
        incrementsFriendship: skill.incrementsFriendship,
        addedIn: skill.addedIn,
        tags: skill.tags ? [...skill.tags] : [],
    };
}

const isBlank = (s: string | undefined): boolean => s == null || s.trim() === '';

/** Editable `CardDraft` → real `Card` (prunes empty arrays / blank optionals). */
export function fromDraft(draft: CardDraft): Card {
    const skill: Card = {
        id: draft.id.trim(),
        name: draft.name.trim(),
        category: draft.category,
        philosophicalAspect: draft.philosophicalAspect,
        description: draft.description,
        tier: draft.tier,
        targetType: draft.targetType,
        rank: draft.rank,
        cardType: draft.cardType,
    };

    if (draft.free != null) skill.free = { ...draft.free };
    if (draft.threshold != null) skill.threshold = { ...draft.threshold };
    if (draft.dieBonus != null) skill.dieBonus = { ...draft.dieBonus };
    if (draft.fate != null) skill.fate = { ...draft.fate };
    if (draft.fallen != null) skill.fallen = { ...draft.fallen };
    if (draft.combatEffects.length > 0) {
        skill.combatEffects = draft.combatEffects.map((e) => ({ ...e }));
    }
    if (draft.specialMechanics.length > 0) {
        skill.specialMechanics = draft.specialMechanics.map((m) => ({ ...m }));
    }
    if (draft.learningRequirement != null) {
        skill.learningRequirement = { ...draft.learningRequirement };
    }
    if (draft.synergy != null) skill.synergy = { ...draft.synergy };
    if (draft.incrementsFriendship != null) {
        skill.incrementsFriendship = draft.incrementsFriendship;
    }
    if (!isBlank(draft.addedIn)) skill.addedIn = draft.addedIn!.trim();
    if (draft.tags.length > 0) skill.tags = [...draft.tags];

    return skill;
}
