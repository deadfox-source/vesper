// Sources/Views/Profile/DailyReflectionModalView.swift
import SwiftUI

public struct DailyReflectionModalView: View {
    public let onSave: (String, String, String) -> Void
    public let onClose: () -> Void
    
    @State private var drawnCard: TarotCardDescriptor?
    @State private var reflectionText: String = ""
    
    public init(onSave: @escaping (String, String, String) -> Void, onClose: @escaping () -> Void) {
        self.onSave = onSave
        self.onClose = onClose
    }
    
    public var body: some View {
        GeometryReader { geo in
            ZStack {
                // Fullscreen Semi-Transparent Frosted Glass Background
                ZStack {
                    Color.voidBlack.opacity(0.60)
                    Rectangle().fill(.ultraThinMaterial.opacity(0.85))
                }
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // ── Top Navigation Header ────────────────────────────
                    HStack {
                        HStack(spacing: 6) {
                            Rectangle()
                                .fill(Color.vesperViolet)
                                .frame(width: 4, height: 14)
                            Text("CODEX [ DAILY.ARCHETYPE ]")
                                .font(VesperFont.terminalHeader(size: 12))
                                .fontWeight(.bold)
                                .foregroundColor(.vesperViolet)
                                .lineLimit(1)
                            Text("· [ LOG ]")
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.ghostWhite.opacity(0.6))
                                .lineLimit(1)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            VesperHapticEngine.shared.triggerTacticalClick()
                            onClose()
                        }) {
                            HStack(spacing: 4) {
                                Text("[ DISMISS ]")
                                    .font(VesperFont.telemetryTag(size: 9))
                                    .foregroundColor(.ghostWhite.opacity(0.8))
                                Image(systemName: "xmark")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.ghostWhite)
                            }
                            .padding(.horizontal, 10)
                            .frame(height: 32)
                            .background(Color.voidBlack)
                            .border(Color.white.opacity(0.3), width: 1)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Close daily reflection protocol")
                        .accessibilityHint("Dismisses this reflection modal")
                        .accessibilityAddTraits(.isButton)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.voidBlack.opacity(0.6))
                    
                    Rectangle()
                        .fill(Color.vesperViolet.opacity(0.35))
                        .frame(height: 1)
                        .accessibilityHidden(true)
                    
                    // ── Main Single-View Content (Adaptive Top Area) ──────
                    VStack(spacing: 4) {
                        // Section 1: Tactical Diagnostic Header
                        HStack {
                            Text("DIAGNOSTIC VECTOR:")
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.vesperViolet)
                            Text("DAILY ARCHETYPE PROTOCOL")
                                .font(VesperFont.terminalHeader(size: 11))
                                .foregroundColor(.magiOrange)
                            Spacer()
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        
                        if let card = drawnCard {
                            // Section 2: Ascii Card Art
                            VesperAsciiCardView(
                                cardName: card.name,
                                element: card.element,
                                accentColor: elementColor(card.element),
                                cardHeight: min(geo.size.height * 0.22, 155),
                                fontSize: 7.6
                            )
                            .padding(.vertical, 1)
                            
                            // Section 3: Card Information Text on Window
                            HStack(alignment: .center, spacing: 8) {
                                Text(card.name.uppercased())
                                    .font(VesperFont.bannerLarge(size: 14))
                                    .fontWeight(.bold)
                                    .foregroundColor(.vesperGhost)
                                
                                Spacer()
                                
                                HStack(spacing: 6) {
                                    Text("[\(card.element.rawValue.uppercased())]")
                                        .font(VesperFont.terminalHeader(size: 9))
                                        .foregroundColor(elementColor(card.element))
                                        .padding(.horizontal, 5)
                                        .frame(height: 20)
                                        .border(elementColor(card.element), width: 0.8)
                                    
                                    Text("[ \(card.element.platonicSolid.uppercased()) ]")
                                        .font(VesperFont.telemetryTag(size: 8))
                                        .foregroundColor(.biosGreen)
                                }
                            }
                            
                            // Section 4: Tactical Interpretation (Inline)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("> TACTICAL INTERPRETATION:")
                                    .font(VesperFont.telemetryTag(size: 7.5))
                                    .foregroundColor(.ghostWhite.opacity(0.6))
                                Text(card.meaning)
                                    .font(VesperFont.terminalBody(size: 10.5))
                                    .foregroundColor(.ghostWhite)
                                    .lineLimit(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            
                            // Section 5: Vesper's Inquiry Prompt (Inline)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("> VESPER INQUIRY PROMPT:")
                                    .font(VesperFont.telemetryTag(size: 8))
                                    .fontWeight(.bold)
                                    .foregroundColor(.vesperAmber)
                                
                                Text(card.reflectionPrompt)
                                    .font(VesperFont.terminalBody(size: 10.5))
                                    .foregroundColor(.vesperAmber)
                                    .lineLimit(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        } else {
                            // Card Draw Trigger
                            VStack(spacing: 14) {
                                Text("INITIALIZE DAILY PSYCHO-DIAGNOSTIC")
                                    .font(VesperFont.terminalBody(size: 11))
                                    .foregroundColor(.vesperMuted)
                                
                                Button(action: {
                                    drawnCard = TarotDeck.cards.randomElement()
                                    VesperHapticEngine.shared.triggerCardDrawn()
                                    VesperSoundEffects.shared.playCardDraw()
                                }) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "sparkles")
                                            .accessibilityHidden(true)
                                        Text("[ DRAW DAILY ARCHETYPE ]")
                                    }
                                    .font(VesperFont.terminalHeader(size: 11))
                                    .foregroundColor(.vesperViolet)
                                    .padding(.horizontal, 16)
                                    .frame(height: 36)
                                    .background(Color.vesperViolet.opacity(0.12))
                                    .overlay(
                                        Rectangle().strokeBorder(Color.vesperViolet, lineWidth: 1.2)
                                    )
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Draw Daily Archetype Card")
                                .accessibilityHint("Draws a random archetype card for reflection")
                                .accessibilityAddTraits(.isButton)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.top, 4)
                    
                    Spacer(minLength: 0)
                    
                    // ── Anchored Sticky Bottom Reflection Input Dock (Thumb Zone) ──
                    if let card = drawnCard {
                        VStack(spacing: 4) {
                            Rectangle()
                                .fill(Color.vesperViolet.opacity(0.35))
                                .frame(height: 1)
                                .accessibilityHidden(true)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("> OPERATOR REFLECTION & LOG:")
                                        .font(VesperFont.telemetryTag(size: 8.5))
                                        .fontWeight(.bold)
                                        .foregroundColor(.vesperViolet)
                                    Spacer()
                                    
                                    Button(action: {
                                        if !reflectionText.contains("Integration") {
                                            reflectionText += (reflectionText.isEmpty ? "" : " ") + "Resonates with current polarity and archetype integration."
                                        }
                                    }) {
                                        Text("+ [ POLARITY ]")
                                            .font(VesperFont.telemetryTag(size: 8))
                                            .foregroundColor(.vesperViolet)
                                            .padding(.horizontal, 6)
                                            .frame(height: 24)
                                            .background(Color.voidBlack)
                                            .border(Color.vesperViolet.opacity(0.4), width: 1)
                                            .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel("Insert polarity assistance phrase")
                                    .accessibilityHint("Appends shadow integration text to reflection")
                                    .accessibilityAddTraits(.isButton)
                                }
                                
                                // Anchored Tactical Input Field with Solid Theme Border
                                VesperTerminalInputField(
                                    placeholder: "Enter message",
                                    text: $reflectionText,
                                    accentColor: .vesperViolet,
                                    isAxisVertical: false,
                                    onCommit: {
                                        onSave(card.name, card.reflectionPrompt, reflectionText)
                                    }
                                )
                                
                                // Standardized 32px Action Button
                                Button(action: {
                                    onSave(card.name, card.reflectionPrompt, reflectionText)
                                }) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "arrow.right.circle.fill")
                                            .font(.system(size: 10))
                                        Text("[ COMMIT TO INDIVIDUATION MATRIX ]")
                                            .font(VesperFont.terminalHeader(size: 10))
                                            .fontWeight(.bold)
                                    }
                                    .foregroundColor(reflectionText.trimmingCharacters(in: .whitespaces).isEmpty ? Color.vesperViolet.opacity(0.4) : .voidBlack)
                                    .frame(height: 32)
                                    .frame(maxWidth: .infinity)
                                    .background(reflectionText.trimmingCharacters(in: .whitespaces).isEmpty ? Color.vesperViolet.opacity(0.15) : Color.vesperViolet)
                                    .border(Color.vesperViolet, width: 1)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                .disabled(reflectionText.trimmingCharacters(in: .whitespaces).isEmpty)
                                .accessibilityLabel("Commit to Individuation Matrix")
                                .accessibilityHint("Saves this daily reflection to the archive")
                                .accessibilityAddTraits(.isButton)
                            }
                            .padding(.horizontal, 14)
                            .padding(.bottom, 6)
                        }
                        .background(Color.voidBlack.opacity(0.65))
                    }
                }
                .frame(width: geo.size.width, height: geo.size.height)
                .overlay(
                    Rectangle()
                        .strokeBorder(Color.vesperViolet.opacity(0.4), lineWidth: 1)
                )
            }
        }
    }
    
    private func elementColor(_ elem: ElementType) -> Color {
        switch elem {
        case .fire: return .magiOrange
        case .water: return .evaCyan
        case .air: return .magiViolet
        case .earth: return .biosGreen
        case .spirit: return .ghostWhite
        }
    }
}

#Preview {
    DailyReflectionModalView(
        onSave: { _, _, _ in },
        onClose: {}
    )
    .preferredColorScheme(.dark)
    .background(Color.black)
}
