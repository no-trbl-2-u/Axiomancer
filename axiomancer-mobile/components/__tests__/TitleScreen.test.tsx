/**
 * Hermetic tests for the TitleScreen component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TitleScreen, titleScrimStops } from '../TitleScreen';
import { createAppStore } from '@/state/store';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

// Mock the debug seed action since we're not testing the actual seeding behavior
jest.mock('@/state/actions', () => ({
  ...jest.requireActual('@/state/actions'),
  createAppActions: () => ({
    debugSeed: jest.fn(),
  }),
}));

describe('TitleScreen', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return <GameStoreProvider store={store}>{children}</GameStoreProvider>;
  };

  it('renders the tagline and footer flavor text', () => {
    const mockOnContinue = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    expect(getByText(/The cursed lands await/)).toBeTruthy();
    // A new game starts on the Breakwater, at the windmill.
    expect(getByText(/windmill above the\s+breakwater/)).toBeTruthy();
  });

  it('renders embark button with accessibility', () => {
    const mockOnContinue = jest.fn();
    const { getByRole, getByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Embark on your journey');
    expect(getByText('EMBARK…')).toBeTruthy();
  });

  /**
   * The title screen has no map, so the sub-line under its only button has
   * to describe what EMBARK does, not give map instructions.
   */
  it('sub-labels EMBARK with what EMBARK does, not with map instructions', () => {
    const mockOnContinue = jest.fn();
    const { getByText, queryByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    expect(getByText('begin the pilgrimage')).toBeTruthy();
    expect(queryByText(/glowing node/i)).toBeNull();
    expect(queryByText(/map/i)).toBeNull();
  });

  /**
   * `leagues` is a unit of distance, not a proper noun, so the tagline
   * writes it lower case like the map compass hint. Lower case in prose is
   * the rule; the step-card column header keeps its
   * all-caps LEAGUES because a header is not prose.
   */
  it('writes leagues as a lowercase unit in the tagline', () => {
    const mockOnContinue = jest.fn();
    const { getByText, queryByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    expect(getByText(/cold iron into the leagues beyond\./)).toBeTruthy();
    expect(queryByText(/LEAGUES/)).toBeNull();
  });

  it('calls onContinue when embark button is pressed', () => {
    const mockOnContinue = jest.fn();
    const { getByRole } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it('applies the embark button styling and theme colors', () => {
    const mockOnContinue = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    const label = getByText('EMBARK…');
    expect(label.props.style).toMatchObject({
      fontFamily: expect.any(String),
      fontSize: 20,
      color: expect.any(String),
    });
  });

  /**
   * The scrim is a continuous ramp, not flat bands: three bands drew two
   * hard seams across the art on desktop (CRITIQUE pass 74). It starts
   * clear so its top edge has no seam, never lightens on the way down, and
   * keeps the CTA panel at least as dark as the old bottom band (0.9).
   */
  it('ramps the bottom scrim from clear to the CTA darkness with no step', () => {
    const stops = titleScrimStops();
    expect(stops[0]).toEqual({ offset: 0, opacity: 0 });
    expect(stops[stops.length - 1].offset).toBe(1);
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].offset).toBeGreaterThan(stops[i - 1].offset);
      expect(stops[i].opacity).toBeGreaterThanOrEqual(stops[i - 1].opacity);
    }
    for (const st of stops.filter((s) => s.offset >= 0.8)) {
      expect(st.opacity).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('draws the scrim as one gradient layer', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TitleScreen onContinue={jest.fn()} />
      </TestWrapper>
    );

    expect(getByTestId('title-scrim')).toBeTruthy();
  });
});
