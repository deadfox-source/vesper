# Vesper Grimoire for iOS (Native Swift & SwiftUI)

## Architecture Overview
Vesper iOS is a native Swift 6 / SwiftUI application built for iOS 17+. It provides a cyber-occult tactical interface for Jungian Individuation, Tarot Oracle Synthesis, environmental telemetry ingestion, British-accented neural speech, on-device voice recognition, and custom CoreHaptics.

### Key Capabilities
- **Acid Design & Thumb-Zone Ergonomics**: Pure `#000000` absolute black background with high-contrast neon accents, monospaced typography, and touch ergonomics focused in the bottom 30% of the screen.
- **Hardware Integration**:
  - `CoreHaptics`: Heartbeat pulses, alert glitch buzzes, rigid tactical clicks.
  - `AVFoundation`: Neural British speech synthesis (`en-GB`) with live audio amplitude analysis.
  - `Speech` Framework: Real-time on-device speech-to-text dictation.
  - `CoreLocation`: GPS coordinates powering localized meteorological dignities via Open-Meteo.
  - `NOAA Space Weather`: Planetary K-Index space weather telemetry for geomagnetic storm modifiers.
  - `SceneKit` & `SwiftUI Canvas`: Dynamic 3D Octahedron / Egrego-Pet thoughtform.
- **Esoteric Engine**: Complete 78-Node Tarot system with Kabbalistic Tree of Life mappings, Elemental Dignities, Triad Calculus, and Individuation Matrix (Persona, Shadow, Anima, Self).
- **Gemini AI Companion**: Structured LLM synthesis adhering strictly to the Vesper v9.0 persona manifest.

---

## Dependencies & Package Setup

### 1. Swift Package Manager Dependencies
- **Google Generative AI Swift SDK**: `https://github.com/google-gemini/generative-ai-swift` (v0.5.6+)

### 2. Apple System Frameworks
- `SwiftUI` & `SwiftData`
- `SceneKit` & `Metal`
- `CoreHaptics` & `UIKit`
- `AVFoundation`
- `Speech`
- `CoreLocation`
- `Network` (NWPathMonitor)

---

## Opening and Running in Xcode

1. Open **Xcode 15+** on macOS.
2. Select **File > Open...** and choose the `VesperiOS` directory (or open `Package.swift` directly as a Swift Package, or create an iOS App project pointing to `VesperiOS/Sources`).
3. Set your Gemini API Key in `VesperConfig.swift` or via the runtime Settings in the app.
4. Select target **iOS 17.0+ Simulator** (e.g. iPhone 15/16 Pro) or physical iPhone.
5. Build and Run (**⌘R**).
