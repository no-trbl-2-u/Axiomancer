import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cardEditorPlugin } from './src/server/cardEditorPlugin';

const dir = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Axiomancer Card (Action) Editor — local dev tool.
//
// Imports the REAL card + effect data live from ../src (the published mechanics
// package source) via the `@mechanics/*` alias, mirrored from tsconfig paths.
// server.host:true exposes the dev server on the LAN so the user can open the
// editor from their PHONE (e.g. http://<your-machine-ip>:5174). Vite prints the
// Network URL on `npm run dev`.
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [
    react(),

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║  Codegen write-back dev-server plugin (Build phase).                   ║
    // ║                                                                       ║
    // ║  Runs in Node (fs access). Mounts the card (Action) JSON API on the   ║
    // ║  dev server — GET/POST /api/cards, DELETE /api/cards/:id — rewriting  ║
    // ║  ../src/Cards/cards.library.ts: add/replace the card's               ║
    // ║  `const <ident>: Card = {…}` block (located by id) and keep it a     ║
    // ║  member of the exported `cardLibrary` array, matching the file's     ║
    // ║  existing formatting/indentation. See src/server/cardEditorPlugin.ts. ║
    // ╚═══════════════════════════════════════════════════════════════════════╝
    cardEditorPlugin(),
  ],
  resolve: {
    alias: {
      // Mirrors tsconfig `paths` so `@mechanics/...` resolves to the package src.
      '@mechanics': path.resolve(dir, '../src'),
    },
  },
  server: {
    host: true, // expose on LAN for phone testing
    port: 5174,
  },
});
