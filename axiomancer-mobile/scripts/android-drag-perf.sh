#!/usr/bin/env bash
# scripts/android-drag-perf.sh
#
# The combat-drag perf protocol on a real Android device running the RELEASE
# APK (EAS `preview` profile). This is the acceptance measurement: the web
# harness (scripts/combat-drag-perf.mjs) only bisects. Results go into the
# blank tables in docs/perf/combat-drag-baseline.md.
#
# What it does, per drag set (5 drags each):
#   1. `dumpsys gfxinfo <pkg> reset`
#   2. five scripted `input swipe` drags between two on-screen testIDs
#      (RN exposes `testID` as the view's resource-id, so `uiautomator dump`
#      finds them)
#   3. `dumpsys gfxinfo <pkg>` → out/<set>.gfxinfo.txt, summary lines printed
# and records a Perfetto trace during drag set (b).
#
# Prerequisites:
#   * USB debugging on, one device attached (`adb devices`)
#   * the preview APK installed, a live fight's combat board on screen
#     (/dev → ENCOUNTERS → a quick trigger), dice rolled and settled
#   * Developer options → "Profile HWUI rendering: In adb shell dumpsys gfxinfo"
#
# Usage:
#   scripts/android-drag-perf.sh a     # (a) hand card → play region, 5×
#   scripts/android-drag-perf.sh c     # (c) staged card → hand, 5× (stage one card first)
#   scripts/android-drag-perf.sh b     # (b) die → staged card, 5×, with Perfetto
#                                      #     (stage 3 cards first)
#   env: PKG (com.axiomancer.mobile), REPS (5), SWIPE_MS (600), OUT (./drag-perf-out)

set -euo pipefail

PKG="${PKG:-com.axiomancer.mobile}"
REPS="${REPS:-5}"
SWIPE_MS="${SWIPE_MS:-600}"
OUT="${OUT:-./drag-perf-out}"
SET="${1:-}"
mkdir -p "$OUT"

die() { echo "android-drag-perf: $*" >&2; exit 1; }
[ -n "$SET" ] || die "usage: $0 a|b|c"
adb get-state >/dev/null 2>&1 || die "no device (adb get-state failed)"

# Centre of the first on-screen view whose resource-id starts with $1.
center_of() {
    adb shell uiautomator dump /sdcard/axm-ui.xml >/dev/null 2>&1
    adb shell cat /sdcard/axm-ui.xml \
        | tr '>' '\n' \
        | grep -o "resource-id=\"$1[^\"]*\"[^/]*bounds=\"\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]\"" \
        | head -1 \
        | sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/' \
        | awk '{ printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 }'
}

# The gfxinfo summary lines the baseline tables ask for.
summarise() {
    grep -E "Total frames rendered|Janky frames|50th percentile|90th percentile|95th percentile|99th percentile|Number Missed Vsync|Number High input latency|Number Slow UI thread|Number Slow bitmap uploads|Number Slow issue draw commands|Number Frame deadline missed" "$1" | head -12
}

case "$SET" in
    a) FROM="combat-hand-";   TO="combat-play-area" ;;
    c) FROM="combat-staged-"; TO="combat-hand" ;;
    b) FROM="combat-die-";    TO="combat-staged-" ;;
    *) die "unknown set '$SET' (a|b|c)" ;;
esac

TRACE=""
if [ "$SET" = b ]; then
    # Perfetto: scheduling, frequency, graphics (RenderThread / UI thread
    # frames), input, view, dalvik + the app's own atrace sections (React
    # Native / Hermes / Reanimated slices). 15s covers five drags.
    TRACE="/data/misc/perfetto-traces/axm-drag-b.pftrace"
    adb shell perfetto -o "$TRACE" -t 15s -b 64mb \
        sched freq idle gfx view input am wm dalvik hal res -a "$PKG" >/dev/null 2>&1 &
    PERFETTO_PID=$!
    sleep 1
fi

adb shell dumpsys gfxinfo "$PKG" reset >/dev/null
for i in $(seq 1 "$REPS"); do
    read -r FX FY < <(center_of "$FROM") || die "no view with id prefix $FROM on screen"
    read -r TX TY < <(center_of "$TO")   || die "no view with id prefix $TO on screen"
    echo "android-drag-perf: ($SET) drag $i: $FX,$FY → $TX,$TY"
    adb shell input swipe "$FX" "$FY" "$TX" "$TY" "$SWIPE_MS"
    sleep 1.2
done
adb shell dumpsys gfxinfo "$PKG" > "$OUT/$SET.gfxinfo.txt"
echo "android-drag-perf: ($SET) gfxinfo → $OUT/$SET.gfxinfo.txt"
summarise "$OUT/$SET.gfxinfo.txt"

if [ -n "$TRACE" ]; then
    wait "$PERFETTO_PID" || true
    adb pull "$TRACE" "$OUT/axm-drag-b.pftrace" >/dev/null
    echo "android-drag-perf: Perfetto trace → $OUT/axm-drag-b.pftrace (open at https://ui.perfetto.dev)"
fi
