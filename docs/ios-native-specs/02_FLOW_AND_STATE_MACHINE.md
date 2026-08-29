# Spec 02: Flow, State Machine & Ergonomics

## 1. Screen State Flow & Navigation Routing

The application flows through 4 distinct navigation modes:

```
[BOOT_ONBOARDING] -> [HOME_TERMINAL] <-> [TABLETOP_GRID] <-> [INDIVIDUATION_PROFILE]
```

1. **Boot Console (`.onboarding`)**:
   - Initial kernel boot sequence, memory diagnostics, and "Vesper Daemon Override" takeover.
   - Tap `[ INITIALIZE LINK ]` to transition state to `.home`.

2. **Communication Link (`.home`)**:
   - Central visual core with rotating 3D avatar octahedron.
   - Pinned lower terminal frame (36% screen height).
   - Real-time voice dictation (`VesperSpeechRecognizer`) & streaming speech synthesis.
   - Latent Bridge Sync Bar displaying packet exchange progress.

3. **Tactical Tabletop (`.tabletop`)**:
   - **Phase 1: Mission Select**: Spread selection guide (Grid Infiltration 3-Node, Decision Matrix 5-Node, Tree of Life 10-Node).
   - **Phase 2: Active Tactical Grid**: Dynamic node canvas with vector pathway lines, step-by-step card drawing, node focus inspection modal, and `[ ENGAGE SYNTHESIS ]` trigger.

4. **Individuation Profile (`.profile`)**:
   - Top 4-metric matrix bar (Persona, Shadow, Anima, Self).
   - Archetype journal logger with prompt integration.
   - History archive of completed Oracle reading records.

---

## 2. iPhone Thumb-Zone Ergonomics

All high-frequency interactive triggers MUST reside within the **bottom 30% of the screen**:

1. **Persistent DOS Tab Bar**: Anchored to the bottom safe area with 3 tactile triggers:
   - `[01 // COMM_LINK]`
   - `[02 // TABLETOP]`
   - `[03 // ARCHIVE]`
2. **Terminal Input Bar**: Pinned to the lower screen boundary with large touch targets for microphone and send buttons.
3. **Tabletop Actions**:
   - `[ DRAW ]` button in lower guidance terminal.
   - Floating `[ ENGAGE SYNTHESIS ]` button positioned above the bottom tab bar.
4. **Modal Dismiss & Save Buttons**: Anchored in the bottom action bar of each modal for easy single-thumb reach.

---

## 3. Tactility & CoreHaptics Trigger Matrix

| Event | Haptic Pattern | Sound Effect |
| :--- | :--- | :--- |
| Keystroke / Button Tap | Light Tactical Click (`impact(light)`) | System Blip (`1104`) |
| Card Revealed / Drawn | Medium Rigidity (`impact(medium)`) | Card Swish (`1105`) |
| Oracle Synthesis Complete | Heavy Heartbeat Pulse (`impact(heavy)` + double pulse) | Synthesis Chime (`1025`) |
| Error / Key Missing | Warning Notification (`notification(warning)`) | Low Alarm Tone (`1053`) |
| Session Save | Success Confirmation (`notification(success)`) | Terminal Confirm |
