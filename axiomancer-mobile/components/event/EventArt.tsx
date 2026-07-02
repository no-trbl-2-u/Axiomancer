import type { EventArtSlug } from '@/state/presenters/event-assets';

import { PlaceholderIllustration } from './PlaceholderIllustration';
import { EnemyIllustration } from './enemy-art/EnemyIllustration';

/**
 * Renders the procedural SVG illustration for an event by its art
 * slug. Spec 08 Q3 = B: slug → component map is mobile-local.
 *
 * Combat slugs ('encounter' / 'boss') route through `EnemyIllustration`,
 * which picks a bespoke archetype drawing from `enemyArtKey` (falling
 * back to the generic moonlit creature / boss throne when absent).
 */
export function EventArt({ slug, enemyArtKey }: { slug: EventArtSlug; enemyArtKey?: string | null }) {
    if (slug === 'encounter') return <EnemyIllustration enemyArtKey={enemyArtKey} isBoss={false} />;
    if (slug === 'boss') return <EnemyIllustration enemyArtKey={enemyArtKey} isBoss={true} />;
    return <PlaceholderIllustration slug={slug} />;
}
