/**
 * Hermetic tests for the TitleScreen component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TitleScreen } from '../TitleScreen';
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
});
