/**
 * Presenter for determining if the player needs onboarding/title screen.
 * 
 * A player is considered "new" if they are at level 1, at the starting
 * location (fv-1), and haven't made meaningful progress yet.
 */

import type { AppStoreState } from '../store';
import { readCurrentNodeId } from '../actions';

export interface OnboardingViewModel {
  /** True if the player should see the title screen */
  showTitleScreen: boolean;
  /** True if this appears to be a fresh game start */
  isNewPlayer: boolean;
}

const FRESH_ONBOARDING_VM: OnboardingViewModel = Object.freeze({
  showTitleScreen: true,
  isNewPlayer: true,
});

const SETTLED_ONBOARDING_VM: OnboardingViewModel = Object.freeze({
  showTitleScreen: false,
  isNewPlayer: false,
});

export function selectOnboardingViewModel(state: AppStoreState): OnboardingViewModel {
  const player = state.player;
  const world = state.world;
  
  // Consider a player "new" if:
  // 1. They are level 1
  // 2. They are at the starting node (fv-1)  
  // 3. They have no completed nodes yet (only the current starting node discovered)
  const isLevel1 = player.level === 1;
  const isAtStartingNode = world ? readCurrentNodeId(world) === 'fv-1' : false;
  const hasMinimalProgress = world?.currentMap?.name === 'fishing-village' && 
    (world.currentMap.availableNodes?.length || 0) + (world.currentMap.completedNodes?.length || 0) <= 2;
  
  const isNewPlayer = isLevel1 && isAtStartingNode && hasMinimalProgress;
  
  // Show title screen only for truly new players who haven't seen it yet
  // (we could add a flag to track this, but for now just use the heuristic)
  const showTitleScreen = isNewPlayer;
  
  return showTitleScreen && isNewPlayer ? FRESH_ONBOARDING_VM : SETTLED_ONBOARDING_VM;
}
