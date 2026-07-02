/**
 * Hermetic e2e tests for the onboarding presenter.
 */

import { createAppStore, type AppStore } from '@/state/store';
import { selectOnboardingViewModel } from '../onboarding.engine';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

describe('selectOnboardingViewModel', () => {
  let store: AppStore;

  beforeEach(() => {
    const adapter = createMemoryAdapter();
    store = createAppStore({ adapter });
  });

  it('shows title screen for brand new player (level 1, fv-1, minimal discovery)', () => {
    // Fresh game state: level 1, at fv-1, only starting node discovered
    const vm = selectOnboardingViewModel(store.getState());
    
    expect(vm.isNewPlayer).toBe(true);
    expect(vm.showTitleScreen).toBe(true);
  });

  it('returns a stable reference for unchanged fresh-player state', () => {
    const first = selectOnboardingViewModel(store.getState());
    const second = selectOnboardingViewModel(store.getState());

    expect(second).toBe(first);
  });

  it('hides title screen for leveled player even at starting location', () => {
    const state = store.getState();
    
    // Level up the player but keep them at fv-1
    store.setState({
      player: {
        ...state.player,
        level: 2,
      }
    });
    
    const vm = selectOnboardingViewModel(store.getState());
    
    expect(vm.isNewPlayer).toBe(false);
    expect(vm.showTitleScreen).toBe(false);
  });
});