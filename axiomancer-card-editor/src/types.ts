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
export function toDraft(card: Card): CardDraft {
    return {
        id: card.id,
        name: card.name,
        category: card.category,
        philosophicalAspect: card.philosophicalAspect,
        description: card.description,
        tier: card.tier,
        targetType: card.targetType,
        rank: card.rank,
        cardType: card.cardType,
        free: card.free ? { ...card.free } : undefined,
        threshold: card.threshold ? { ...card.threshold } : undefined,
        dieBonus: card.dieBonus ? { ...card.dieBonus } : undefined,
        fate: card.fate ? { ...card.fate } : undefined,
        fallen: card.fallen ? { ...card.fallen } : undefined,
        combatEffects: (card.combatEffects ?? []).map((e) => ({ ...e })),
        specialMechanics: (card.specialMechanics ?? []).map((m) => ({ ...m })),
        learningRequirement: card.learningRequirement
            ? { ...card.learningRequirement }
            : undefined,
        synergy: card.synergy ? { ...card.synergy } : undefined,
        incrementsFriendship: card.incrementsFriendship,
        addedIn: card.addedIn,
        tags: card.tags ? [...card.tags] : [],
    };
}

const isBlank = (s: string | undefined): boolean => s == null || s.trim() === '';

/** Editable `CardDraft` → real `Card` (prunes empty arrays / blank optionals). */
export function fromDraft(draft: CardDraft): Card {
    const card: Card = {
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

    if (draft.free != null) card.free = { ...draft.free };
    if (draft.threshold != null) card.threshold = { ...draft.threshold };
    if (draft.dieBonus != null) card.dieBonus = { ...draft.dieBonus };
    if (draft.fate != null) card.fate = { ...draft.fate };
    if (draft.fallen != null) card.fallen = { ...draft.fallen };
    if (draft.combatEffects.length > 0) {
        card.combatEffects = draft.combatEffects.map((e) => ({ ...e }));
    }
    if (draft.specialMechanics.length > 0) {
        card.specialMechanics = draft.specialMechanics.map((m) => ({ ...m }));
    }
    if (draft.learningRequirement != null) {
        card.learningRequirement = { ...draft.learningRequirement };
    }
    if (draft.synergy != null) card.synergy = { ...draft.synergy };
    if (draft.incrementsFriendship != null) {
        card.incrementsFriendship = draft.incrementsFriendship;
    }
    if (!isBlank(draft.addedIn)) card.addedIn = draft.addedIn!.trim();
    if (draft.tags.length > 0) card.tags = [...draft.tags];

    return card;
}
