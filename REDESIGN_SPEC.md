# REDESIGN SPEC: Tactile 2.0 (Moments V2)

## 1. Design Vision
Transform the legacy Neumorphic dashboard into a **Tactile 2.0** administrative "Nexus." The aesthetic prioritizes depth, clarity, and architectural organization using Bento-grid primitives.

## 2. Palette (Deep Zinc)
- **Background**: `#09090B` (Rich black with subtle depth).
- **Surface**: `#18181B` (Tactile raised cards).
- **Accent A**: `#D97757` (Terracotta) - Primary action/emphasis.
- **Accent B**: `#8A9A5B` (Sage) - Success/Growth indicators.
- **Text Main**: `#FAFAFA` (High contrast).
- **Text Muted**: `#A1A1AA` (Low-profile metadata).

## 3. Tactile Primitives
### 3.1 Shadows
- `neu-extruded`: `box-shadow: 6px 6px 12px rgba(0,0,0,0.5), -4px -4px 10px rgba(255,255,255,0.02)`.
- `neu-depressed`: `box-shadow: inset 4px 4px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.01)`.

### 3.2 Utilities
- `tact-glow`: `box-shadow: 0 0 15px rgba(217,119,87,0.15)`.
- `tact-border`: `border: 1px solid rgba(217,119,87,0.3)`.

## 4. Layout Architecture: Nexus Bento
- **Grid Level 1**: 2x2 or 3x2 Grid for high-level metrics.
- **Grid Level 2**: Vertical lists for registry data.
- **Navigation**: Sidebar/Tactical top-bar with `AnimatePresence` transitions.

## 5. Interactions
- **Micro-animations**: `motion/react` spring-based transitions (stiffness: 200, damping: 25).
- **Active States**: Transition from `neu-extruded` to `neu-depressed`.
