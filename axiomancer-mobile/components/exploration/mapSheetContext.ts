import React from 'react';
import { LEGACY_SHEET_SIZE } from '@/state/exploration-maps/sheet';

/** The part of a map sheet a node needs to place itself: the coordinate space. */
export interface SheetSize {
    width: number;
    height: number;
    scale: number;
}

/**
 * The current map's sheet size, provided by `<MapCanvas>` to the nodes drawn
 * inside it. A node positions itself as a percentage of the canvas, so it has
 * to know the sheet its `x` / `y` are measured on (sheets differ per map).
 * Defaults to `LEGACY_SHEET_SIZE` (360×400).
 */
export const MapSheetContext = React.createContext<SheetSize>(LEGACY_SHEET_SIZE);
