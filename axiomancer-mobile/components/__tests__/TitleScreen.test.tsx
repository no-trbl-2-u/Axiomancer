/**
 * Hermetic tests for the TitleScreen component: the launch sequence's copy,
 * EMBARK's hand-off to the menu in place, and the `?menu=1` entry.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { TitleScreen } from '../TitleScreen';
import { createAppStore } from '@/state/store';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { TITLE_COPY } from '@/state/presenters/title.engine';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const MENU = <Text testID="stub-menu">menu</Text>;

function TestWrapper({ children }: { children: React.ReactNode }) {
  const store = createAppStore({ adapter: createMemoryAdapter() });
  return <GameStoreProvider store={store}>{children}</GameStoreProvider>;
}

function mount(props: Partial<React.ComponentProps<typeof TitleScreen>> = {}) {
  return render(
    <TestWrapper>
      <TitleScreen menu={MENU} {...props} />
    </TestWrapper>,
  );
}

describe('TitleScreen', () => {
  it('prints the game\'s name as the wordmark, never the old title', () => {
    const { getByTestId, queryByText } = mount();
    expect(getByTestId('title-wordmark').props.children).toBe('Miserere Mei, Deus');
    expect(queryByText(/axiomancer/i)).toBeNull();
  });

  it('prints the psalm line, its source and the footer', () => {
    const { getByText } = mount();
    expect(getByText(TITLE_COPY.psalm)).toBeTruthy();
    expect(getByText(TITLE_COPY.psalmSource)).toBeTruthy();
    // A new game starts on the Breakwater, at the windmill.
    expect(getByText(/windmill above the breakwater/)).toBeTruthy();
  });

  /**
   * The title screen has no map, so the sub-line under its only button has
   * to describe what EMBARK does, not give map instructions.
   */
  it('labels EMBARK with what it does', () => {
    const { getByRole, getByText, queryByText } = mount();
    expect(getByRole('button').props.accessibilityLabel).toBe(TITLE_COPY.embarkLabel);
    expect(getByText(TITLE_COPY.embark)).toBeTruthy();
    expect(getByText(TITLE_COPY.embarkHint)).toBeTruthy();
    expect(queryByText(/glowing node/i)).toBeNull();
  });

  it('describes the plate for screen readers', () => {
    const { getByLabelText } = mount();
    expect(getByLabelText(TITLE_COPY.plateLabel)).toBeTruthy();
  });

  it('brings the menu up in place when EMBARK is pressed, keeping the wordmark', () => {
    const { getByRole, queryByTestId, getByTestId } = mount();
    expect(queryByTestId('stub-menu')).toBeNull();
    fireEvent.press(getByRole('button'));
    expect(getByTestId('stub-menu')).toBeTruthy();
    expect(getByTestId('title-wordmark')).toBeTruthy();
    expect(getByTestId('title-plate')).toBeTruthy();
  });

  it('opens on the menu when asked to (RETURN TO TITLE lands on ?menu=1)', () => {
    const { getByTestId } = mount({ startAtMenu: true });
    expect(getByTestId('stub-menu')).toBeTruthy();
    expect(getByTestId('title-wordmark')).toBeTruthy();
  });

  it('keeps the EMBARK label in the button face style', () => {
    const { getByText } = mount();
    expect(getByText(TITLE_COPY.embark).props.style).toMatchObject({
      fontFamily: expect.any(String),
      fontSize: 20,
      color: expect.any(String),
    });
  });
});
