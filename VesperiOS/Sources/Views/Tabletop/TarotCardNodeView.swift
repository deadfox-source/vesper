// Sources/Views/Tabletop/TarotCardNodeView.swift
import SwiftUI

public struct TarotCardNodeView: View {
    public let node: SpreadNodeDef
    public let cardName: String?
    public let isActiveStep: Bool
    public let isGuided: Bool
    public let isAwaitingTap: Bool
    public let latitude: Double?
    public let longitude: Double?
    public let kpIndex: Double?
    public let onTap: () -> Void
    
    @State private var glitchTrigger = false
    @State private var scanlineOffset: CGFloat = -55
    @State private var isCollapsing: Bool = false
    @State private var flipDegrees: Double = 0
    @State private var scrambleChars: String = "0101XYZΩ"
    
    private let timer = Timer.publish(every: 0.18, on: .main, in: .common).autoconnect()
    
    public init(
        node: SpreadNodeDef,
        cardName: String?,
        isActiveStep: Bool,
        isGuided: Bool,
        isAwaitingTap: Bool = false,
        latitude: Double? = nil,
        longitude: Double? = nil,
        kpIndex: Double? = nil,
        onTap: @escaping () -> Void
    ) {
        self.node = node
        self.cardName = cardName
        self.isActiveStep = isActiveStep
        self.isGuided = isGuided
        self.isAwaitingTap = isAwaitingTap
        self.latitude = latitude
        self.longitude = longitude
        self.kpIndex = kpIndex
        self.onTap = onTap
    }
    
    private var isPopulated: Bool {
        cardName != nil
    }
    
    private var cardDescriptor: TarotCardDescriptor? {
        guard let name = cardName else { return nil }
        return TarotDeck.getCard(named: name)
    }
    
    private var isLocked: Bool {
        isGuided && node.id > (cardName != nil ? node.id : (isActiveStep ? node.id : 999)) && !isPopulated && !isActiveStep
    }
    
    public var body: some View {
        Button(action: {
            guard !isLocked else { return }
            VesperHapticEngine.shared.triggerCardDrawn()
            
            if isActiveStep && !isPopulated {
                withAnimation(.easeOut(duration: 0.25)) {
                    isCollapsing = true
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                    isCollapsing = false
                    onTap()
                }
            } else {
                onTap()
            }
        }) {
            ZStack {
                // Coordinate Header Tag above card
                VStack {
                    HStack(spacing: 4) {
                        Text("[\(String(format: "%02d", node.id))] \(node.title.uppercased())")
                            .font(VesperFont.telemetryTag(size: 7))
                            .foregroundColor(isActiveStep ? .evaCyan : .ghostWhite.opacity(0.5))
                        
                        if let lat = latitude, let lon = longitude {
                            Text("COORD: \(String(format: "%.2f", lat)),\(String(format: "%.2f", lon))")
                                .font(VesperFont.telemetryTag(size: 6))
                                .foregroundColor(.evaCyan.opacity(0.6))
                        }
                    }
                    .frame(maxWidth: 110, alignment: .leading)
                    .offset(y: -54)
                    
                    Spacer()
                }
                
                // Corner HUD Brackets
                ZStack {
                    // Top-Left
                    Path { p in
                        p.move(to: CGPoint(x: -49, y: -57))
                        p.addLine(to: CGPoint(x: -55, y: -57))
                        p.addLine(to: CGPoint(x: -55, y: -51))
                    }
                    .stroke(bracketColor, lineWidth: 1.5)
                    
                    // Top-Right
                    Path { p in
                        p.move(to: CGPoint(x: 49, y: -57))
                        p.addLine(to: CGPoint(x: 55, y: -57))
                        p.addLine(to: CGPoint(x: 55, y: -51))
                    }
                    .stroke(bracketColor, lineWidth: 1.5)
                    
                    // Bottom-Left
                    Path { p in
                        p.move(to: CGPoint(x: -49, y: 67))
                        p.addLine(to: CGPoint(x: -55, y: 67))
                        p.addLine(to: CGPoint(x: -55, y: 61))
                    }
                    .stroke(bracketColor, lineWidth: 1.5)
                    
                    // Bottom-Right
                    Path { p in
                        p.move(to: CGPoint(x: 49, y: 67))
                        p.addLine(to: CGPoint(x: 55, y: 67))
                        p.addLine(to: CGPoint(x: 55, y: 61))
                    }
                    .stroke(bracketColor, lineWidth: 1.5)
                }
                
                // Main Card Surface
                ZStack {
                    // Background Fill
                    Rectangle()
                        .fill(
                            isPopulated
                                ? Color.voidBlack
                                : (isActiveStep
                                    ? (isAwaitingTap ? Color.magiOrange.opacity(0.12) : Color.evaCyan.opacity(0.08))
                                    : Color.voidBlack)
                        )
                    
                    // Card Border
                    Rectangle()
                        .strokeBorder(
                            isPopulated
                                ? Color.evaCyan
                                : (isActiveStep
                                    ? (isAwaitingTap ? Color.magiOrange : Color.evaCyan)
                                    : Color.evaCyan.opacity(0.25)),
                            lineWidth: (isActiveStep || isPopulated) ? 1.5 : 1
                        )
                    
                    if let card = cardDescriptor {
                        // ── Populated Card View ───────────────────────
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("NODE_\(String(format: "%03d", node.id))")
                                    .font(VesperFont.telemetryTag(size: 7))
                                    .foregroundColor(.ghostWhite.opacity(0.6))
                                Spacer()
                                Text("[\(card.element.rawValue)]")
                                    .font(VesperFont.telemetryTag(size: 7))
                                    .foregroundColor(elementColor(card.element))
                            }
                            .padding(.bottom, 2)
                            
                            Spacer()
                            
                            Text(card.name.uppercased())
                                .font(VesperFont.bannerLarge(size: 10))
                                .fontWeight(.bold)
                                .foregroundColor(.evaCyan)
                                .shadow(color: .evaCyan.opacity(0.6), radius: 6)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)
                                .lineLimit(2)
                            
                            Spacer()
                            
                            // Platonic Badge
                            HStack {
                                Spacer()
                                Text("[ \(card.element.platonicSolid.uppercased()) LOADED ]")
                                    .font(VesperFont.telemetryTag(size: 6))
                                    .foregroundColor(.biosGreen)
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 2)
                                    .border(Color.biosGreen, width: 0.8)
                                Spacer()
                            }
                        }
                        .padding(8)
                    } else {
                        // ── Superposition / Undrawn Node View ─────────
                        VStack(spacing: 6) {
                            Text("\(node.id)")
                                .font(VesperFont.bannerLarge(size: 24))
                                .fontWeight(.bold)
                                .foregroundColor(isActiveStep ? .evaCyan : .ghostWhite.opacity(0.2))
                            
                            if isActiveStep {
                                if isAwaitingTap {
                                    VStack(spacing: 2) {
                                        Text("[ COLLAPSE ]")
                                            .font(VesperFont.telemetryTag(size: 8))
                                            .fontWeight(.bold)
                                            .foregroundColor(.magiOrange)
                                        Text("TAP TO DRAW")
                                            .font(VesperFont.telemetryTag(size: 6))
                                            .foregroundColor(.magiOrange.opacity(0.8))
                                    }
                                } else {
                                    VStack(spacing: 2) {
                                        Text("[ SUPERPOSITION ]")
                                            .font(VesperFont.telemetryTag(size: 6))
                                            .foregroundColor(.warningAmber)
                                        Text(scrambleChars)
                                            .font(VesperFont.terminalBody(size: 8))
                                            .foregroundColor(.evaCyan)
                                    }
                                }
                            } else {
                                Text(node.title.uppercased())
                                    .font(VesperFont.telemetryTag(size: 7))
                                    .foregroundColor(.ghostWhite.opacity(0.3))
                                    .multilineTextAlignment(.center)
                                    .lineLimit(2)
                            }
                        }
                        .padding(6)
                    }
                    
                    // Laser Scanline over active node
                    if isActiveStep && !isPopulated {
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [.clear, Color.evaCyan.opacity(0.8), .clear],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(height: 2)
                            .shadow(color: .evaCyan, radius: 4)
                            .offset(y: scanlineOffset)
                            .onAppear {
                                withAnimation(
                                    .linear(duration: 1.8).repeatForever(autoreverses: true)
                                ) {
                                    scanlineOffset = 55
                                }
                            }
                    }
                }
                .frame(width: 96, height: 130)
                .rotation3DEffect(.degrees(flipDegrees), axis: (x: 0, y: 1, z: 0))
                .scaleEffect(isCollapsing ? 0.88 : (isActiveStep && isAwaitingTap ? 1.04 : 1.0))
                .shadow(
                    color: isActiveStep
                        ? (isAwaitingTap ? Color.magiOrange.opacity(0.4) : Color.evaCyan.opacity(0.3))
                        : (isPopulated ? Color.evaCyan.opacity(0.2) : Color.clear),
                    radius: 8
                )
            }
            .opacity(isLocked ? 0.35 : 1.0)
        }
        .buttonStyle(.plain)
        .disabled(isLocked)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Node \(node.id): \(node.title)")
        .accessibilityValue(isPopulated ? "Drawn card: \(cardName!)" : (isActiveStep ? (isAwaitingTap ? "Ready to draw" : "In superposition") : (isLocked ? "Locked" : "Pending")))
        .accessibilityHint(isPopulated ? "Double tap to inspect card reflection" : (isActiveStep ? "Double tap to collapse wave function and draw card" : "Node is locked"))
        .accessibilityAddTraits(isPopulated ? [.isButton, .isSelected] : [.isButton])
        .onReceive(timer) { _ in
            if isActiveStep && !isPopulated {
                let glyphs = ["0", "1", "X", "Y", "Z", "Ω", "Ψ", "Φ", "Σ", "<", ">", "/", "#", "*"]
                scrambleChars = (0..<6).map { _ in glyphs.randomElement()! }.joined()
            }
        }
        .onChange(of: cardName) { _, newCard in
            if newCard != nil {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                    flipDegrees += 360
                }
            }
        }
    }
    
    private var bracketColor: Color {
        if isPopulated {
            return .evaCyan
        } else if isActiveStep {
            return isAwaitingTap ? .magiOrange : .evaCyan
        } else {
            return .evaCyan.opacity(0.2)
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

