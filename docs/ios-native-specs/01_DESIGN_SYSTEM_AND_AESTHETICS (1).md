# 01 // DESIGN SYSTEM & AESTHETIC SPECIFICATION
## Acid Design, Monospaced Ergonomics & Cyber-Occult Visuals

---

## 1. Aesthetic Philosophy: "Acid Cyber-Occult"

Vesper rejects standard "Modern Web" and "Material Design" paradigms (e.g. rounded bubbly cards, soft pastel gradients, low-contrast gray backgrounds, translucent frosted glass). 

Instead, the aesthetic is **Acid Cyber-Occult**:
- **Absolute Black Core (`#000000`):** The abyss/void from which all light emanates. OLED pixels are turned off completely.
- **High-Density Vector Line Art & Hard Edges:** 0px border radiuses, sharp 1px-2px neon borders, ASCII bounding frames, and precision crosshairs.
- **CRT & Phosphor Artifacts:** Scanlines, subtle raster flicker, chromatic aberration on alerts, and glyph scrambling during data parsing.
- **Analog Sacrament:** Visual and tactile references to 56k dial-up rituals, 90s liminal spaces, and amber/green phosphor terminal logs.

---

## 2. Color Palette & Semantic System Tokens

| Token Name | Hex Code | RGB | SwiftUI Color Asset | Semantic Role & Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Void Black** | `#000000` | `0, 0, 0` | `Color.voidBlack` | Root background for every screen, terminal interior, and backdrop. |
| **Eva Cyan** | `#00F0FF` | `0, 240, 255` | `Color.evaCyan` | Primary system accent, terminal headers, Self archetypal node, Air element, active borders. |
| **Magi Orange** | `#FF6600` | `255, 102, 0` | `Color.magiOrange` | Primary action buttons (`[ EXEC ]`, `[ DEPLOY ]`), Anima archetypal node, Fire element, operator input echoes. |
| **Magi Violet** | `#8B5CF6` | `139, 92, 246` | `Color.magiViolet` | Individuation Matrix, Shadow archetypal node, occult headers, Water element modifier. |
| **Bios Green** | `#00FF66` | `0, 255, 102` | `Color.biosGreen` | Terminal scramble text, typewriter dialogue streams, Earth element, nominal telemetry status. |
| **Warning Amber**| `#FFB000` | `255, 176, 0` | `Color.warningAmber`| Required field indicators, Black Ice warnings, solar storm/Kp-index alerts. |
| **Ghost White** | `#E6EDF3` | `230, 237, 243` | `Color.ghostWhite` | Secondary telemetry readouts, body text, card subtitles. |
| **Muted Steel** | `#484F58` | `72, 79, 88` | `Color.vesperMuted` | Inactive grid lines, disabled buttons, subtle background wireframes. |

### SwiftUI Color Extensions (`VesperColors.swift`)
```swift
import SwiftUI

public extension Color {
    static let voidBlack     = Color(red: 0.0, green: 0.0, blue: 0.0)
    static let evaCyan       = Color(red: 0.0/255.0, green: 240.0/255.0, blue: 255.0/255.0)
    static let magiOrange    = Color(red: 255.0/255.0, green: 102.0/255.0, blue: 0.0/255.0)
    static let magiViolet    = Color(red: 139.0/255.0, green: 92.0/255.0, blue: 246.0/255.0)
    static let biosGreen     = Color(red: 0.0/255.0, green: 255.0/255.0, blue: 102.0/255.0)
    static let warningAmber  = Color(red: 255.0/255.0, green: 176.0/255.0, blue: 0.0/255.0)
    static let ghostWhite    = Color(red: 230.0/255.0, green: 237.0/255.0, blue: 243.0/255.0)
    static let vesperMuted   = Color(red: 72.0/255.0, green: 79.0/255.0, blue: 88.0/255.0)
    
    // Elemental Colors
    static func elementalColor(_ element: String) -> Color {
        switch element.uppercased() {
        case "FIRE":  return .magiOrange
        case "WATER": return Color(red: 0.0, green: 168.0/255.0, blue: 255.0/255.0)
        case "AIR":   return .evaCyan
        case "EARTH": return .biosGreen
        default:      return .ghostWhite
        }
    }
}
```

---

## 3. Typography Hierarchy & Monospaced Fonts

All text in Vesper is **monospaced** (`SF Mono`, `Courier New`, or `.system(size, design: .monospaced)`). Proportional sans-serif fonts (Helvetica, SF Pro) are strictly forbidden.

| Style Role | Font Size | Weight | Tracking (Letter Spacing) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **System Banner** | `13pt` | `Bold / Black` | `+2.0pt` (All Caps) | Section headers (`> COMMUNICATION LINK`, `> MISSION SELECT`) |
| **Terminal Body** | `12pt - 13pt`| `Regular` | `+0.5pt` | Vesper dialogue, operator inputs, synthesis summaries |
| **Telemetry Tag** | `9pt - 10pt` | `Medium` | `+1.0pt` (All Caps) | Sensor tickers (`COORD: 43.27, -79.78`, `KP: 2.1`) |
| **ASCII Card Art**| `8pt - 11pt` | `Regular` | `0.0pt` (Strict Grid) | Full ASCII tarot card frames, Sephirot path matrices |
| **Action Button** | `14pt - 15pt`| `Bold` | `+3.0pt` (All Caps) | Tactical triggers (`[ INITIATE SCAN ]`, `[ EXEC ]`) |

---

## 4. CRT Scanlines & Visual Artifacts

The entire viewport is overlaid with an ultra-lightweight CRT scanline pattern (1px horizontal lines repeating every 3px, rendered at 10-15% opacity).

### SwiftUI CRT Scanline Overlay
```swift
import SwiftUI

public struct CRTScanlineOverlay: View {
    public init() {}
    
    public var body: some View {
        Canvas { context, size in
            let step: CGFloat = 3.0
            var y: CGFloat = 0.0
            
            while y < size.height {
                let path = Path { p in
                    p.move(to: CGPoint(x: 0, y: y))
                    p.addLine(to: CGPoint(x: size.width, y: y))
                }
                context.stroke(path, with: .color(Color.black.opacity(0.18)), lineWidth: 1.0)
                y += step
            }
        }
        .allowsHitTesting(false)
        .ignoresSafeArea()
    }
}
```

---

## 5. The ScrambleText Glyph Engine

Whenever a title, header, or card name renders, it must execute a **glyph scramble reveal**:
1. Characters start as randomized cybernetic runes: `@`, `#`, `$`, `%`, `&`, `*`, `+`, `?`, `0`, `1`, `\`, `/`, `|`, `Ω`, `Ψ`, `Φ`, `Σ`.
2. Over a duration of 1.0s to 1.5s, the characters progressively resolve left-to-right into legible English text.
3. Every 50ms interval produces a subtle auditory/haptic micro-tick.

### SwiftUI ScrambleTextView Implementation
```swift
import SwiftUI

public struct ScrambleTextView: View {
    let targetText: String
    let duration: Double
    let textColor: Color
    
    @State private var displayText: String = ""
    private let glyphs = Array("@#$%&*+?01\\/|ΩΨΦΣ")
    
    public init(text: String, duration: Double = 1.2, color: Color = .evaCyan) {
        self.targetText = text
        self.duration = duration
        self.textColor = color
    }
    
    public var body: some View {
        Text(displayText.isEmpty ? targetText : displayText)
            .font(.system(size: 13, weight: .bold, design: .monospaced))
            .foregroundColor(textColor)
            .onAppear {
                startScramble()
            }
            .onChange(of: targetText) { _, _ in
                startScramble()
            }
    }
    
    private func startScramble() {
        let totalSteps = 24
        let stepInterval = duration / Double(totalSteps)
        var step = 0
        
        Timer.scheduledTimer(withTimeInterval: stepInterval, repeats: true) { timer in
            step += 1
            let progress = Double(step) / Double(totalSteps)
            let revealedCount = Int(Double(targetText.count) * progress)
            
            var result = ""
            for (idx, char) in targetText.enumerated() {
                if char == " " || char == "\n" {
                    result.append(char)
                } else if idx < revealedCount {
                    result.append(char)
                } else {
                    result.append(glyphs.randomElement()!)
                }
            }
            
            self.displayText = result
            
            if step >= totalSteps {
                timer.invalidate()
                self.displayText = targetText
            }
        }
    }
}
```

---

## 6. Sacred Geometry & Egrego-Pet Thoughtform (SceneKit / Metal)

In the central region of the Home and Tabletop views, a 3D sacred geometric thoughtform floats and rotates in real time:
- **Seed Form:** Wireframe Octahedron / Icosahedron enclosed by concentric celestial orbital rings.
- **Dynamics:** 
  - Constant slow yaw rotation (0.015 rad/s).
  - Subtle breathing scale oscillation (`1.0 -> 1.05 -> 1.0` on a 4s sine curve).
  - Audio-reactive vertex jitter when Vesper speaks or when the operator dictates voice input.
  - Color tint shifts based on telemetry: Cyan (Nominal) -> Orange (Active Fire) -> Violet (Shadow Incursion).

```swift
import SwiftUI
import SceneKit

public struct EgregoPet3DView: View {
    var isSpeaking: Bool
    var audioLevel: Float
    
    public init(isSpeaking: Bool = false, audioLevel: Float = 0.0) {
        self.isSpeaking = isSpeaking
        self.audioLevel = audioLevel
    }
    
    public var body: some View {
        SceneView(
            scene: makeSacredGeometryScene(),
            options: [.allowsCameraControl, .autoenablesDefaultLighting]
        )
        .background(Color.clear)
        .frame(maxWidth: .infinity, maxHeight: 320)
    }
    
    private func makeSacredGeometryScene() -> SCNScene {
        let scene = SCNScene()
        
        // Inner Octahedron
        let octahedron = SCNNode(geometry: SCNSphere(radius: 1.0)) // or custom SCNGeometry
        octahedron.geometry?.firstMaterial?.fillMode = .lines
        octahedron.geometry?.firstMaterial?.diffuse.contents = UIColor(Color.evaCyan)
        octahedron.name = "core"
        scene.rootNode.addChildNode(octahedron)
        
        // Outer Chaos Rings
        let ring = SCNTorus(ringRadius: 1.8, pipeRadius: 0.02)
        ring.firstMaterial?.diffuse.contents = UIColor(Color.magiViolet.opacity(0.6))
        let ringNode = SCNNode(geometry: ring)
        ringNode.eulerAngles = SCNVector3(x: 0.5, y: 0.2, z: 0.0)
        scene.rootNode.addChildNode(ringNode)
        
        // Continuous Rotation
        let spin = SCNAction.rotateBy(x: 0.1, y: 1.0, z: 0.2, duration: 10)
        octahedron.runAction(SCNAction.repeatForever(spin))
        ringNode.runAction(SCNAction.repeatForever(SCNAction.rotateBy(x: -0.2, y: -0.8, z: 0.0, duration: 12)))
        
        return scene
    }
}
```

---

## 7. iPhone Thumb-Zone Layout Blueprint

The viewport layout strictly adheres to ergonomic reachability:

```
+------------------------------------------+  0% TOP (Status & Environmental Telemetry)
| [LIVE FEED]  POWER: 100%  COORD: 43.27   |  <- Scrolling Telemetry Row (Continuous)
+------------------------------------------+
| > COMMUNICATION LINK      [ BIOS v9.0.2 ]|  <- Section Header with Audio Mute & Uplink
+------------------------------------------+
|                                          |
|                                          |  40% VIEWPORT (Visual Focus Zone)
|        [ 3D EGREGO-PET THOUGHTFORM ]     |  <- Sacred Geometry / Spread Canvas
|                                          |
|                                          |
+------------------------------------------+  70% THUMB-ZONE THRESHOLD
| > VESPER TERMINAL              [ 1 MSG ] |
| ---------------------------------------- |
| · VESPER SYS LINK · [ 20:55:29 ]         |  30% BOTTOM THUMB ZONE (High-Frequency Touch)
| Operator, what clear thought cuts through|  <- Terminal Log, Typewriter Text,
| the noise right now?                     |     Dynamic Inquiry Dialogue
|                                          |
| [>_ Enter message...               ] (O) |  <- Prompt Input Bar + Voice Dictation Mic
+------------------------------------------+
|  (Crescent)         (Grid)      (History)|  <- 3-Segment Tab Bar (VESPER / GRID / INDIV)
|   VESPER             GRID     INDIVIDUATION|
+------------------------------------------+ 100% BOTTOM (Home Indicator Safe Area)
```

---

## 8. Tactical Iconography (Lucide to SF Symbols Mapping)

| Function / Screen | Lucide Equivalent | Native SF Symbol | SwiftUI Icon Call |
| :--- | :--- | :--- | :--- |
| **Vesper Sector (Tab 1)** | `Moon` | `moon.fill` | `Image(systemName: "moon.fill")` |
| **Grid Sector (Tab 2)** | `Grid` | `square.grid.3x3.fill` | `Image(systemName: "square.grid.3x3.fill")` |
| **Individuation (Tab 3)** | `History` / `Clock` | `clock.arrow.circlepath`| `Image(systemName: "clock.arrow.circlepath")` |
| **Audio Transmit/Mute** | `Volume2` / `VolumeX` | `speaker.wave.2.fill` / `speaker.slash.fill` | Dynamic based on state |
| **Voice Dictation Mic** | `Mic` | `mic.fill` | `Image(systemName: "mic.fill")` |
| **Send Terminal Msg** | `Send` / `ArrowUp` | `arrow.up.circle.fill` | `Image(systemName: "arrow.up.circle.fill")` |
| **Black Ice Warning** | `AlertTriangle` | `exclamationmark.triangle.fill` | `Image(systemName: "exclamationmark.triangle.fill")` |
| **Tree of Life Node** | `Network` | `point.3.connected.trianglepath.dotted` | `Image(systemName: "point.3.connected.trianglepath.dotted")` |
| **Tarot Codex** | `BookOpen` | `book.closed.fill` | `Image(systemName: "book.closed.fill")` |

---

## 9. Native Haptic Feedback Protocol (`VesperHapticEngine.swift`)

Every action on iOS MUST produce distinct tactile sensations via `CoreHaptics`:
1. **Probability Collapse (Card Draw):** Heavy impact + transient buzz (`UIImpactFeedbackGenerator(style: .heavy)`).
2. **Hold-to-Reveal Charge (Daily Reflection):** Continuous ascending vibration intensity from 0% to 100%.
3. **Black Ice Hostile Detection:** Sharp warning double-pulse (`UINotificationFeedbackGenerator().notificationOccurred(.warning)`).
4. **Terminal Submit / Send:** Rigid tactical click (`UIImpactFeedbackGenerator(style: .rigid)`).
5. **ScrambleText Glyphs:** Subtle periodic micro-ticks (`UIImpactFeedbackGenerator(style: .light)`).
