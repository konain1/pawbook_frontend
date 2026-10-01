// Pawbook "Crimson & Obsidian" Luxury Theme (Black #0B0B0B, Crimson Red #8B0D1A, Off White #F5F2ED)
export const THEME = {
  colors: {
    // Primary Crimson Palette
    primary: '#8B0D1A',         // Crimson Red
    primaryDark: '#5E0811',     // Deep Crimson for pressed/dark states
    primaryLight: '#A81324',    // Vibrant Crimson for highlights
    primaryGlow: 'rgba(139, 13, 26, 0.45)',
    primaryTint: '#26060A',     // Deep Crimson Tint

    secondary: '#C01B2E',       // Ruby Crimson Accent
    secondaryLight: '#1E0A0D',  // Subtle crimson dark surface
    
    // Core Backgrounds
    background: '#0B0B0B',      // Luxury Deep Black
    surface: '#151515',         // Obsidian Card Surface
    surfaceWarm: '#1C1C1C',     // Elevated Dark Surface
    surfaceElevated: '#242424', // Highest elevation surface
    
    // Typography (Off White & Slate Muted)
    text: '#F5F2ED',            // Crisp Off White Primary
    textSecondary: '#B5B0A8',   // Warm Muted Off White
    textLight: '#757068',       // Dimmed Slate Text
    textInverse: '#0B0B0B',     // Black text for white/bright elements
    
    // Borders & Dividers
    border: '#262626',          // Dark Border
    borderFocus: '#8B0D1A',     // Crimson Red Border Focus
    borderLight: '#1C1C1C',     // Subtle Divider
    borderCrimson: '#4D0E15',   // Crimson-tinted border
    
    // Accents & Named Tokens
    accent: '#8B0D1A',          // Crimson Pill / Highlight
    accentLight: '#2D080D',     // Pill Background
    offWhite: '#F5F2ED',        // Pure Off White
    black: '#0B0B0B',           // Pure Luxury Black
    crimson: '#8B0D1A',         // Pure Crimson Red
    
    // Functional States
    success: '#3FA36C',         // Muted Emerald
    error: '#D32F2F',           // Crimson Error
    warning: '#D68910',         // Amber Warning
  },
  
  shadows: {
    soft: {
      shadowColor: '#8B0D1A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 4,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 3,
    },
    button: {
      shadowColor: '#8B0D1A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 5,
    },
  },
  
  radii: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
};
