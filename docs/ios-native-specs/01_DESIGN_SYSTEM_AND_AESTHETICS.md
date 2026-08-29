# Spec 01: Design System, Phosphor Palette & Aesthetics

## 1. Core Principles: Acid Design & Technomantic Minimalism

1. **Absolute Black Canvas (`#000000`)**:
   - The entire background hierarchy MUST use pure `#000000` (or `#05070A` void black).
   - Never use generic iOS gray cards or Material Design rounded shadow surfaces.
   - All panels, modals, and frames use crisp 1px borders with sharp or subtle 2px corners and dark translucent backdrops.

2. **Phosphor Color Hierarchy**:
   | Semantic Token | Hex / RGB Value | Purpose |
   | :--- | :--- | :--- |
   | `voidBlack` | `#000000` / `#05070A` | Absolute background canvas |
   | `evaCyan` / `vesperCyan` | `#00F0FF` | Primary active vector, selected states, high-contrast readout |
   | `vesperBlue` | `#2B8CFF` | Communication link, AI presence header, system status |
   | `magiViolet` | `#9B72FA` | Individuation Matrix, Shadow work, Archetype logs |
   | `magiOrange` / `vesperOrange` | `#FF6600` | Elemental Fire, Active alerts, Destructive resets |
   | `warningAmber` / `vesperAmber` | `#FFB800` | Guided step indicators, telemetry warnings, draw prompts |
   | `biosGreen` / `vesperGreen` | `#00FF41` | Battery status, GPS lock, successful handshake |
   | `ghostWhite` / `vesperGhost` | `#E6EDF3` | Primary body text, high-contrast readability |

3. **Typography**:
   - Monospaced system typography (`Menlo`, `Courier New`, or `SF Mono`).
   - Font scales:
     - `telemetryTag`: 8pt - 10pt (uppercase, tracked +0.5)
     - `terminalBody`: 11pt - 13pt (line height 1.35)
     - `terminalHeader`: 13pt - 15pt (bold, uppercase)
     - `bannerLarge`: 16pt - 20pt (bold header)

4. **Visual Artifacts & Textures**:
   - **40px Grid Pattern**: Subtle vector grid overlay in background (`Color.white.opacity(0.025)`).
   - **CRT Scanlines**: 1px alternating horizontal scanlines (`Color.black.opacity(0.15)`).
   - **Chromatic Aberration / FeTurbulence**: Visual jitter on high-emotional dialogue or synthesis complete states.
   - **NO RETICLE MECHANICS**: Center-screen crosshair reticles are strictly deprecated and removed.

5. **ASCII Card Frames**:
   - All 78 Tarot cards rendered as authentic 30x10 ASCII matrix blocks with DOS single/double-line borders (`+---+---`, `|`, `=`).
