# Vesper iOS Native Client: System Architecture & Specifications

This specification suite defines the native iOS implementation for **Vesper Grimoire** (v9.0.2), translating the cyber-occult tactical terminal into an iPhone-optimized SwiftUI and CoreHaptics native client.

---

## Specification Index

1. [**01_DESIGN_SYSTEM_AND_AESTHETICS.md**](file:///Users/edgardosanchez/Library/CloudStorage/GoogleDrive-sanzeddie@gmail.com/My%20Drive/App%20Projects/VesperWeb/docs/ios-native-specs/01_DESIGN_SYSTEM_AND_AESTHETICS.md)  
   *Acid Design, Phosphor Palette, Absolute Black (#000000) Canvas, CRT Overlays, Monospaced Typography, and ASCII Card Frames.*

2. [**02_FLOW_AND_STATE_MACHINE.md**](file:///Users/edgardosanchez/Library/CloudStorage/GoogleDrive-sanzeddie@gmail.com/My%20Drive/App%20Projects/VesperWeb/docs/ios-native-specs/02_FLOW_AND_STATE_MACHINE.md)  
   *Screen State Machine, Navigation Routing, Bottom 30% Thumb-Zone Ergonomics, Modal Lifecycle, CoreHaptics Trigger Matrices, and Store Architecture.*

3. [**03_LANGUAGE_VOICE_AND_PERSONA.md**](file:///Users/edgardosanchez/Library/CloudStorage/GoogleDrive-sanzeddie@gmail.com/My%20Drive/App%20Projects/VesperWeb/docs/ios-native-specs/03_LANGUAGE_VOICE_AND_PERSONA.md)  
   *The Peer Operating Protocol, Elder British Voice Cadence, Realism Filler Words ("Ah", "Hmm"), Zero-Servitude Constraints, Shadow Integration, and Oracle Synthesis Directives.*

---

## Technical Stack

- **Target OS**: iOS 17.0+ (Optimized for iPhone 15/16/17 Pro form factors)
- **Framework**: SwiftUI + Combine
- **Haptics Engine**: Native `UIImpactFeedbackGenerator` & `UINotificationFeedbackGenerator` with tactical haptic patterns
- **Speech Engine**: Native `SFSpeechRecognizer` (on-device dictation) + `AVSpeechSynthesizer` (low-latency neural speech)
- **AI Backend**: Google Generative AI Swift SDK (`GoogleGenerativeAI` 0.5.6) + REST fallback
- **Telemetry**: `CoreLocation` + Open-Meteo & NOAA Space Weather integrations
