# REDESIGN SPECIFICATION: Moments V2 (Tactile 2.0)

## Goal
Redesign the "Moments" application to a "Modern Neumorphism" (21st.dev style) aesthetic, moving away from the light beige theme to a sophisticated, deep-zinc/glassmorphic interface.

## Visual Standards
- **Color Palette**: 
  - Primary Background: Deep Zinc (`#09090B`)
  - Elevated Surfaces: Zinc-900/800
  - Shadows: Soft, tiered elevation shadows (not harsh light/dark offsets)
  - Accents: Glassmorphic borders and subtle gradients
- **Typography**: 
  - Geist Sans (Primary)
  - Geist Mono (Technical/Admin)
- **Aesthetic**:
  - High-end glassmorphism (backdrop-blur)
  - Bento-grid layouts (especially for Admin)
  - Tactile feedback via soft transitions and micro-animations

## Component Refactor (Neumorphic.tsx)
- Upgrade `NeuCard`, `NeuButton`, and `NeuInput` to the **Tactile 2.0** system.
- Transition from harsh CSS `box-shadow` offsets to subtle inner-glows and outer-shadows.
- Implement glassmorphic variants for overlays.

## Admin Dashboard Redesign
- Redesign `AdminScreen.tsx` into a **Bento Grid**.
- Group analytics into modular, responsive tiles.
- Use Geist Mono for data displays.

## Verification
- Screenshot capture of all modified screens: `HomeScreen`, `AdminLoginScreen`, `AdminScreen`.
- Visual comparison with 21st.dev reference styles.
