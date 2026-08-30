// Sources/Views/Profile/JournalDetailModalView.swift
import SwiftUI

public struct JournalDetailModalView: View {
    public let entry: JournalEntry
    public let onClose: () -> Void
    
    public init(entry: JournalEntry, onClose: @escaping () -> Void) {
        self.entry = entry
        self.onClose = onClose
    }
    
    private var card: TarotCardDescriptor? {
        TarotDeck.getCard(named: entry.cardName)
    }
    
    public var body: some View {
        ZStack {
            // Solid Void Black Backdrop
            Color.voidBlack
                .ignoresSafeArea()
                .onTapGesture {
                    VesperHapticEngine.shared.triggerTacticalClick()
                    onClose()
                }
            
            // Tactical Modal Container
            VStack(spacing: 0) {
                // Header
                HStack {
                    HStack(spacing: 6) {
                        Rectangle()
                            .fill(Color.magiViolet)
                            .frame(width: 4, height: 14)
                        Text("DAILY ARCHETYPE LOG")
                            .font(VesperFont.terminalHeader(size: 12))
                            .foregroundColor(.magiViolet)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        onClose()
                    }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.ghostWhite)
                            .padding(8)
                            .background(Color.white.opacity(0.12))
                            .frame(minWidth: 44, minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close daily archetype log")
                    .accessibilityHint("Dismisses this journal entry view")
                    .accessibilityAddTraits(.isButton)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.voidBlack)
                
                Rectangle()
                    .fill(Color.magiViolet.opacity(0.35))
                    .frame(height: 1)
                    .accessibilityHidden(true)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        // Card Graphic + Metadata Header
                        if let c = card {
                            HStack(alignment: .top, spacing: 12) {
                                VesperAsciiCardView(
                                    cardName: c.name,
                                    element: c.element,
                                    accentColor: .magiViolet,
                                    fontSize: 6.8
                                )
                                .frame(width: 95)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(entry.cardName.uppercased())
                                        .font(VesperFont.bannerLarge(size: 15))
                                        .fontWeight(.bold)
                                        .foregroundColor(.ghostWhite)
                                    Text("\(entry.category) · \(entry.timestamp)")
                                        .font(VesperFont.telemetryTag(size: 8))
                                        .foregroundColor(.vesperMuted)
                                    
                                    HStack(spacing: 4) {
                                        Text("[\(c.element.rawValue.uppercased())]")
                                            .font(VesperFont.terminalHeader(size: 10))
                                            .foregroundColor(.magiOrange)
                                        Text("[\(c.element.platonicSolid.uppercased())]")
                                            .font(VesperFont.telemetryTag(size: 8))
                                            .foregroundColor(.biosGreen)
                                    }
                                }
                            }
                            .padding(10)
                            .background(Color.voidBlack)
                            .border(Color.magiViolet.opacity(0.3), width: 0.8)
                            
                            // Card Inquiry Prompt
                            VStack(alignment: .leading, spacing: 4) {
                                Text("> VESPER INQUIRY PROMPT:")
                                    .font(VesperFont.telemetryTag(size: 9))
                                    .fontWeight(.bold)
                                    .foregroundColor(.warningAmber)
                                Text(entry.reflectionPrompt.isEmpty ? c.reflectionPrompt : entry.reflectionPrompt)
                                    .font(VesperFont.terminalBody(size: 11))
                                    .foregroundColor(.warningAmber)
                                    .lineSpacing(2)
                            }
                            .padding(8)
                            .background(Color.voidBlack)
                            .border(Color.warningAmber.opacity(0.4), width: 0.8)
                        } else {
                            Text(entry.cardName)
                                .font(VesperFont.bannerLarge(size: 16))
                                .foregroundColor(.ghostWhite)
                        }
                        
                        // User Reflection Body
                        VStack(alignment: .leading, spacing: 4) {
                            Text("> OPERATOR REFLECTION:")
                                .font(VesperFont.telemetryTag(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.magiViolet)
                            Text(entry.userReflection)
                                .font(VesperFont.terminalBody(size: 12))
                                .foregroundColor(.ghostWhite)
                                .lineSpacing(2)
                                .padding(10)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.voidBlack)
                                .border(Color.magiViolet.opacity(0.4), width: 0.8)
                        }
                    }
                    .padding(12)
                }
            }
            .frame(maxHeight: 520)
            .background(Color.voidBlack)
            .overlay(Rectangle().strokeBorder(Color.magiViolet, lineWidth: 1.2))
            .padding(.horizontal, 14)
        }
    }
}
