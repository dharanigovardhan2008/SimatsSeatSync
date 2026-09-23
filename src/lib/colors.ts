/**
 * SeatSync Color System
 *
 * STRICT RULE: NO purple, violet, periwinkle, or lavender colors
 *
 * Primary Palette:
 * - Sky Blue: #3B9EFF (primary actions, highlights)
 * - Deep Blue: #007AFF (secondary actions, links)
 * - Ocean Blue: #0066CC (hover states)
 *
 * Accent Palette:
 * - Teal: #38B2AC (success states, badges)
 * - Green: #34C759 (confirmations, positive feedback)
 * - Emerald: #10B981 (secondary accents)
 *
 * Neutral Palette:
 * - White: #FFFFFF
 * - Soft Gray: #F5F5F7
 * - Light Gray: #E0E5EC
 * - Medium Gray: #5E6C84
 * - Charcoal: #1D1D1F
 * - Dark: #000000
 *
 * Usage Guidelines:
 * - Primary actions: Sky Blue (#3B9EFF)
 * - Links & navigation: Deep Blue (#007AFF)
 * - Success & badges: Teal (#38B2AC) or Green (#34C759)
 * - Hover states: Ocean Blue (#0066CC)
 * - Loading animations: Sky Blue gradients
 * - Backgrounds: White, Soft Gray
 * - Text: Charcoal, Medium Gray
 *
 * Forbidden:
 * - #6C63FF (purple)
 * - #8B84FF (lavender)
 * - #7770FF (violet)
 * - Any purple/violet/periwinkle variations
 */

export const SEATSYNC_COLORS = {
  // Primary
  skyBlue: '#3B9EFF',
  deepBlue: '#007AFF',
  oceanBlue: '#0066CC',

  // Accent
  teal: '#38B2AC',
  green: '#34C759',
  emerald: '#10B981',

  // Neutral
  white: '#FFFFFF',
  softGray: '#F5F5F7',
  lightGray: '#E0E5EC',
  mediumGray: '#5E6C84',
  charcoal: '#1D1D1F',
  dark: '#000000',

  // Semantic
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
} as const;

export type SeatSyncColor = keyof typeof SEATSYNC_COLORS;
