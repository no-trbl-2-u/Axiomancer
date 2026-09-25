/**
 * Drives the board's REAL tap-to-power gesture for one tray die — the jest
 * stand-in for "the player chooses this die". The drag path needs
 * `measureInWindow`, which jest cannot run; the tap path goes through the
 * same `resolveDieDropTarget` gate (THE COLOR LAW + one die per card) and
 * only fires with exactly ONE card staged.
 *
 * `runOnJS` hands the call to the JS thread via `queueMicrotask`
 * (react-native-worklets), so the assignment lands after a flush — await it.
 */

import { act } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

export async function tapCombatDie(dieId: string): Promise<void> {
    fireGestureHandler(getByGestureTestId(`combat-die-tap-${dieId}`), [
        { state: State.BEGAN }, { state: State.ACTIVE }, { state: State.END },
    ]);
    await act(async () => { await Promise.resolve(); });
}
