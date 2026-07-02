/**
 * Aftermath modals - Phase 114 exports
 * 
 * Post-combat modal system for all resolution outcomes.
 * Replaces the legacy AftermathBanner toast pattern.
 */

export { default as VictoryModal } from './VictoryModal';
export { default as FriendshipModal } from './FriendshipModal';
export { default as DefeatModal } from './DefeatModal';
export { default as ErrorFallbackModal } from './ErrorFallbackModal';
export { default as AftermathBackdrop } from './AftermathBackdrop';
export { default as PixelHeartEmblem } from './PixelHeartEmblem';

// Type exports
export type { VictoryModalProps } from './VictoryModal';
export type { FriendshipModalProps } from './FriendshipModal';
export type { DefeatModalProps } from './DefeatModal';
export type { ErrorFallbackModalProps } from './ErrorFallbackModal';
export type { AftermathBackdropProps } from './AftermathBackdrop';
export type { PixelHeartEmblemProps } from './PixelHeartEmblem';