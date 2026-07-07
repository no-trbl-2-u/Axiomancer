# Labyrinth CLI scripts

`truepath.script.json` is the acceptance walkthrough for THE APORIA
(W-01): the exact true path through all three acts — every honest
fragment, both Gates of Assent, the Foundation's thirteen-word
passphrase (eight sockets arrive pre-confirmed), and the naming fork
at the finale. SPOILERS by nature; the answers are laid bare in the
script, so treat it like the `plan/labyrinth/acts/*.solution.md`
files.

Run it headless from `axiomancer-mechanics/`:

```bash
npx ts-node src/CLI/game.cli.ts labyrinth \
  --preset kid-l30 --combat-seed 7 \
  --script docs/labyrinth/truepath.script.json
```

Expected terminal event: `cli:exit` with reason
`labyrinth-complete`. Interactive play: `npm run labyrinth`
(add `--act act2|act3` to start deeper, `--level <n>` or
`--preset <id>` for the walker's build).
