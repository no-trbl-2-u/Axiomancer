/**
 * The editor's working-draft card type and the Card ⇄ CardDraft mappers.
 *
 * A `CardDraft` mirrors EVERY field of the real `Card` — phase 69 made that
 * true; it had carried 19 of 24, so an upsert of an existing card silently
 * deleted `theme`, `persistentEffect`, `paidSummary`,
 * `intentionallyAsymmetric` and `glyph`. `round-trip.test.ts` now holds the
 * claim to its word against the whole live library. It normalizes the three
 * "list-ish" optionals (`combatEffects`, `specialMechanics`, `tags`) into
 * always-present arrays so the form code never has to null-check them. `fromDraft` prunes empty arrays / blank optionals
 * back out so the value written to cards.library.ts stays minimal and matches
 * the existing hand-authored style.
 *
 * NOTE: the user-facing UI calls these "Cards" / "Actions". The literal type
 * name `Card` survives only here, where it is the real TS type.
 */
import type {
    Card,
    CardAspect,
    CardTier,
    CardTarget,
    CardRank,
    CardType,
    CardRider,
    CardCombatEffects,
    CardSpecialMechanic,
    CardSynergy,
} from '@mechanics/Cards/types';
import type { CardTheme } from '@mechanics/Cards/card-themes';

/**
 * Full-fidelity editable draft of a card (`Card`). Every `Card` field is
 * represented — `round-trip.test.ts` fails if one is added upstream and not
 * mirrored here. The three array fields are non-optional in the draft
 * (default `[]`); everything else mirrors `Card` exactly.
 */
export interface CardDraft {
    id: string;
    name: string;
    philosophicalAspect: CardAspect;
    description: string;
    tier: CardTier;
    targetType: CardTarget;
    /** Spec 32 v3 — the rank ladder (1 Ash … 6 Saint); rarity derives from it. */
    rank: CardRank;
    /** Spec 32 v3 — spell / oath / hex. */
    cardType: CardType;
    /** The archetype package this card belongs to. Drives draft weights and
     *  the theme-parity lints — an upsert that dropped it silently unthemed
     *  the card (phase 69). */
    theme?: CardTheme;
    /** Spec 32 v3 — the authored FREE (dieless) line. Round-tripped verbatim;
     *  edited in source (the rider is a real-unit bundle, not a form field). */
    free?: CardRider;
    /** The oath/hex payload — the whole point of a persistent card. */
    persistentEffect?: string;
    /** The paid line the card FACE prints. Round-tripped verbatim. */
    paidSummary?: string;
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
    synergy?: CardSynergy;
    incrementsFriendship?: number;
    addedIn?: string;
    /** Always an array in the draft (default `[]`). */
    tags: string[];
    /** Marks a deliberate free/paid asymmetry so the symmetry lint skips it. */
    intentionallyAsymmetric?: boolean;
}

/** A fresh, valid blank card ready for the CREATE tab. */
export function blankCard(): CardDraft {
    return {
        id: '',
        name: '',
        philosophicalAspect: 'body',
        description: '',
        tier: 1,
        targetType: 'enemy',
        rank: 1,
        cardType: 'spell',
        theme: undefined,
        free: undefined,
        persistentEffect: undefined,
        paidSummary: undefined,
        threshold: undefined,
        dieBonus: undefined,
        fate: undefined,
        fallen: undefined,
        combatEffects: [],
        specialMechanics: [],
        synergy: undefined,
        incrementsFriendship: undefined,
        addedIn: undefined,
        tags: [],
        intentionallyAsymmetric: undefined,
    };
}

/** Real `Card` → editable `CardDraft` (fills the array fields with defaults). */
export function toDraft(card: Card): CardDraft {
    return {
        id: card.id,
        name: card.name,
        philosophicalAspect: card.philosophicalAspect,
        description: card.description,
        tier: card.tier,
        targetType: card.targetType,
        rank: card.rank,
        cardType: card.cardType,
        theme: card.theme,
        free: card.free ? { ...card.free } : undefined,
        persistentEffect: card.persistentEffect,
        paidSummary: card.paidSummary,
        threshold: card.threshold ? { ...card.threshold } : undefined,
        dieBonus: card.dieBonus ? { ...card.dieBonus } : undefined,
        fate: card.fate ? { ...card.fate } : undefined,
        fallen: card.fallen ? { ...card.fallen } : undefined,
        combatEffects: (card.combatEffects ?? []).map((e) => ({ ...e })),
        specialMechanics: (card.specialMechanics ?? []).map((m) => ({ ...m })),
        synergy: card.synergy ? { ...card.synergy } : undefined,
        incrementsFriendship: card.incrementsFriendship,
        addedIn: card.addedIn,
        tags: card.tags ? [...card.tags] : [],
        intentionallyAsymmetric: card.intentionallyAsymmetric,
    };
}

const isBlank = (s: string | undefined): boolean => s == null || s.trim() === '';

/** Editable `CardDraft` → real `Card` (prunes empty arrays / blank optionals). */
export function fromDraft(draft: CardDraft): Card {
    const card: Card = {
        id: draft.id.trim(),
        name: draft.name.trim(),
        philosophicalAspect: draft.philosophicalAspect,
        description: draft.description,
        tier: draft.tier,
        targetType: draft.targetType,
        rank: draft.rank,
        cardType: draft.cardType,
    };

    if (draft.theme != null) card.theme = draft.theme;
    if (draft.free != null) card.free = { ...draft.free };
    if (!isBlank(draft.persistentEffect)) card.persistentEffect = draft.persistentEffect;
    if (!isBlank(draft.paidSummary)) card.paidSummary = draft.paidSummary;
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
    if (draft.synergy != null) card.synergy = { ...draft.synergy };
    if (draft.incrementsFriendship != null) {
        card.incrementsFriendship = draft.incrementsFriendship;
    }
    if (!isBlank(draft.addedIn)) card.addedIn = draft.addedIn!.trim();
    if (draft.tags.length > 0) card.tags = [...draft.tags];
    if (draft.intentionallyAsymmetric != null) {
        card.intentionallyAsymmetric = draft.intentionallyAsymmetric;
    }

    return card;
}
