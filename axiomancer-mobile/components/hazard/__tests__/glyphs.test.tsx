import React from 'react';
import { render } from '@testing-library/react-native';

import { DieGlyph, ProgGlyph, LedgerMark, BoonIcon, Cracks, CastShadow } from '../glyphs';

describe('DieGlyph', () => {
    const glyphTypes = ['blade', 'eye', 'crescent', 'sun', 'cross', 'path'] as const;

    it('renders all die glyph types', () => {
        glyphTypes.forEach(kind => {
            const { root } = render(<DieGlyph kind={kind} />);
            expect(root).toBeTruthy();
        });
    });

    it('renders with custom size and color', () => {
        const { root } = render(
            <DieGlyph kind="blade" size={32} color="#ff0000" />
        );
        expect(root).toBeTruthy();
    });

    it('renders with default props', () => {
        const { root } = render(<DieGlyph kind="eye" />);
        expect(root).toBeTruthy();
    });
});

describe('ProgGlyph', () => {
    const progressTypes = ['force', 'escape', 'passage'] as const;

    it('renders all progress glyph types', () => {
        progressTypes.forEach(kind => {
            const { root } = render(<ProgGlyph kind={kind} />);
            expect(root).toBeTruthy();
        });
    });

    it('renders with custom size and color', () => {
        const { root } = render(
            <ProgGlyph kind="force" size={24} color="#00ff00" />
        );
        expect(root).toBeTruthy();
    });
});

describe('LedgerMark', () => {
    const markTypes = ['O', 'X', 'pending'] as const;

    it('renders all ledger mark types', () => {
        markTypes.forEach(kind => {
            const { root } = render(<LedgerMark kind={kind} />);
            expect(root).toBeTruthy();
        });
    });

    it('renders with custom size', () => {
        const { root } = render(<LedgerMark kind="O" size={20} />);
        expect(root).toBeTruthy();
    });
});

describe('BoonIcon', () => {
    const boonTypes = ['chest', 'relic', 'heart', 'paradox', 'tokens', 'deadcard', 'maxhp', 'minhp', 'curse'] as const;

    it('renders all boon icon types', () => {
        boonTypes.forEach(icon => {
            const { root } = render(<BoonIcon icon={icon} />);
            expect(root).toBeTruthy();
        });
    });

    it('renders with custom size', () => {
        const { root } = render(<BoonIcon icon="heart" size={28} />);
        expect(root).toBeTruthy();
    });
});

describe('Cracks', () => {
    it('renders crack pattern with default props', () => {
        const { root } = render(<Cracks />);
        expect(root).toBeTruthy();
    });

    it('renders crack pattern with custom seed and opacity', () => {
        const { root } = render(<Cracks seed={5} opacity={0.8} />);
        expect(root).toBeTruthy();
    });

    it('renders different crack patterns with different seeds', () => {
        [1, 2, 3, 4, 5].forEach(seed => {
            const { root } = render(<Cracks seed={seed} />);
            expect(root).toBeTruthy();
        });
    });
});

describe('CastShadow', () => {
    it('renders cast shadow with specified dimensions', () => {
        const { root } = render(<CastShadow width={100} height={60} />);
        expect(root).toBeTruthy();
    });

    it('renders cast shadow with different dimensions', () => {
        const dimensions = [
            { width: 50, height: 30 },
            { width: 120, height: 80 },
            { width: 200, height: 100 }
        ];
        
        dimensions.forEach(({ width, height }) => {
            const { root } = render(<CastShadow width={width} height={height} />);
            expect(root).toBeTruthy();
        });
    });
});