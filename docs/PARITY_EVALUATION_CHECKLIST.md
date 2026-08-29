# Vesper: Web vs Native iOS Parity Matrix & Evaluation Checklist

This document tracks the feature, visual, interaction, and architectural parity between the **Vesper Web Application** (`src/`) and the **Native iOS Swift/SwiftUI Application** (`VesperiOS/`).

---

## 1. Visual & Aesthetic Parity (The Acid Design & OCCULT Aesthetic)

| Component / Token | Web App (`src/index.css`) | iOS Native (`VesperColors.swift` / `VesperFont.swift`) | Parity Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Void Black** | `#000000` / `#05070a` | `Color.black` (`#000000`) | ✅ **MATCHED** | Strict adherence to absolute black backgrounds per `.agents/rules/visualist.md`. |
| **Eva Cyan** | `#00F0FF` | `Color(red: 0.0, green: 0.94, blue: 1.0)` | ✅ **MATCHED** | Primary tactical HUD & terminal telemetry accent. |
| **Magi Orange** | `#FF6600` | `Color(red: 1.0, green: 0.40, blue: 0.0)` | ✅ **MATCHED** | Warning & operator accent color. |
| **Magi Violet** | `#8B5CF6` | `Color(red: 0.55, green: 0.36, blue: 0.96)` | ✅ **MATCHED** | Individuation & shadow integration accent. |
| **Vesper Blue** | `#0070FF` | `Color(red: 0.0, green: 0.44, blue: 1.0)` | ✅ **MATCHED** | Communication link & avatar wireframe color. |
| **Warning Amber** | `#FFB800` | `Color(red: 1.0, green: 0.72, blue: 0.0)` | ✅ **MATCHED** | Synthesis trigger & active node illumination. |
| **Bios Green** | `#00FF41` | `Color(red: 0.0, green: 1.0, blue: 0.25)` | ✅ **MATCHED** | Sync completion & uplink online indicators. |
| **CRT Scanlines** | CSS overlay with repeating gradient | `CRTScanlineOverlay` SwiftUI Canvas Shader | ✅ **MATCHED** | Subpixel hardware-accelerated scanline artifacts. |
| **Scramble Text** | Custom JS decoding stream | `ScrambleTextView` with `TimelineView` / Timer | ✅ **MATCHED** | Glitch character scramble decoding. |
| **ASCII Tarot Art** | Monospace ASCII art rendering | `VesperAsciiCardView` | ✅ **MATCHED** | Dynamic ASCII card generation for all 78 nodes. |

---

## 2. Core Screen & Navigation Flows

| Flow / Screen | Web App (`src/screens/`) | iOS Native (`VesperiOS/Sources/Views/`) | Parity Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Onboarding / Boot** | `BootConsole.tsx` | `BootConsoleView.swift` | ✅ **MATCHED** | Fullscreen CRT scramble takeover card, gibberish stream, audio glitch, and connection trigger. |
| **Home (Comms Link)** | `HomeView.tsx` | `HomeView.swift` | ✅ **MATCHED** | 3D Octahedron avatar, chat stream, quick suggestion deployment, option pills, speech dictation, live affect telemetry. |
| **Tabletop: Mission Select**| `TabletopView.tsx` (Phase 1) | `TabletopView.swift` (Phase 1) | ✅ **MATCHED** | Intent query validation, 3 spread templates (`GRID_INFILTRATION`, `GRID_EXFILTRATION`, `GRID_MACRO_SYSTEM`), and sticky deployment. |
| **Tabletop: Guided Reading**| `TabletopView.tsx` (Phase 2) | `TabletopView.swift` (Phase 2) | ✅ **MATCHED** | Turn-by-turn node illumination, tap-to-draw, conversational reflection terminal with Vesper, card inspector modal. |
| **Tabletop: Full Synthesis**| `SynthesisTerminal.tsx` | `SynthesisTerminalView.swift` | ✅ **MATCHED** | Elemental dignity breakdown, triad analysis, storm friction detection, spoken concise summary, archive button. |
| **Individuation Profile** | `ProfileArchiveView.tsx` | `ProfileArchiveView.swift` | ✅ **MATCHED** | 4-variable Individuation Matrix (Persona, Shadow, Anima, Self), proportional progress bar, 3-tab filtering (Inquiries, Journal, Saved Conversations). |
| **Daily Archetype Log** | `DailyReflectionModal.tsx` | `DailyReflectionModalView.swift` | ✅ **MATCHED** | Random archetype draw, reflective prompt, operator notes submission, and matrix update. |
| **Saved Transcripts** | Web localStorage transcripts | `SavedConversationsView.swift` + `ProfileStore` | ✅ **MATCHED** | Modal inspection of past Vesper-Operator conversation transcripts. |

---

## 3. Telemetry & Occult Backend Parity

| Engine / Service | Web Implementation | iOS Native Implementation | Parity Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **78-Node Tarot Deck** | `src/types/tarot.ts` | `TarotDeck.swift` | ✅ **MATCHED** | All 78 Major & Minor Arcana with elemental dignities, Platonic solids, and Jungian concepts. |
| **Tree of Life Mapping** | 10-node coordinate system | `SpreadLibrary.swift` (`macroSystem`) | ✅ **MATCHED** | 10 Sephirot coordinates mapped with vector connection paths. |
| **Individuation Matrix** | `profileStore.ts` | `IndividuationMatrix.swift` + `ProfileStore.swift` | ✅ **MATCHED** | Dynamic recalculation based on elemental card distribution in logs. |
| **Environmental Telemetry**| Web Geolocation + Open-Meteo | `TelemetryStore.swift` + CoreLocation + NOAA/SWPC + UIDevice | 🚀 **IMPROVED** | Native battery monitoring, real-time NOAA Kp-index space weather, and local barometric weather. |
| **British Neural TTS** | Web SpeechSynthesis API (`en-GB`) | `VesperSpeechSynthesizer.swift` (`AVSpeechSynthesizer` `en-GB`) | 🚀 **IMPROVED** | Native AVFoundation audio session management and volume/rate tuning. |
| **Tactile Feedback** | Web Vibration API | `VesperHapticEngine.swift` (`UIImpactFeedbackGenerator` & `UINotificationFeedbackGenerator`) | 🚀 **IMPROVED** | Multi-tiered haptics (card draw tick, heartbeat pulse, tactical error/success). |
| **AI Oracle & Reflection** | `geminiService.ts` | `GeminiClient.swift` | ✅ **MATCHED** | Multi-turn chat, card reflection analysis, and full oracle synthesis using Gemini API. |

---

## 4. Native iOS Ergonomics & Platform Standards

- **Thumb-Zone Optimization**: All primary action buttons (`[ INITIATE SCAN ]`, `[ ENGAGE FULL SYNTHESIS ]`, Chat Dictation, Option Pills) are positioned within the bottom 30% of the screen.
- **Safe Area Insets & Dynamic Type**: Views adapt gracefully to iOS Dynamic Island, Home Indicator, and device safe area bounds.
- **Strict Accessibility & Offline Resilience**: In the event of network drop, local deterministic synthesis engines and fallback protocols activate immediately with radical transparency.
