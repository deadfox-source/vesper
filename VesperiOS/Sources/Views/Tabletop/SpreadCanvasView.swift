// Sources/Views/Tabletop/SpreadCanvasView.swift
import SwiftUI

public struct SpreadCanvasView: View {
    public let spread: SpreadConfig
    public let nodesRecord: [Int: String]
    public let activeStep: Int
    public let isGuided: Bool
    public let isAwaitingTap: Bool
    public let latitude: Double?
    public let longitude: Double?
    public let kpIndex: Double?
    public let onNodeTapped: (SpreadNodeDef) -> Void
    
    public init(
        spread: SpreadConfig,
        nodesRecord: [Int: String],
        activeStep: Int,
        isGuided: Bool,
        isAwaitingTap: Bool = false,
        latitude: Double? = nil,
        longitude: Double? = nil,
        kpIndex: Double? = nil,
        onNodeTapped: @escaping (SpreadNodeDef) -> Void
    ) {
        self.spread = spread
        self.nodesRecord = nodesRecord
        self.activeStep = activeStep
        self.isGuided = isGuided
        self.isAwaitingTap = isAwaitingTap
        self.latitude = latitude
        self.longitude = longitude
        self.kpIndex = kpIndex
        self.onNodeTapped = onNodeTapped
    }
    
    // Centered scaled nodes calculation fitting within the visible tabletop viewport
    private var centeredNodes: [SpreadNodeDef] {
        guard !spread.nodes.isEmpty else { return [] }
        var minX: Double = 1.0, maxX: Double = 0.0
        var minY: Double = 1.0, maxY: Double = 0.0
        
        for n in spread.nodes {
            if n.x < minX { minX = n.x }
            if n.x > maxX { maxX = n.x }
            if n.y < minY { minY = n.y }
            if n.y > maxY { maxY = n.y }
        }
        
        let centerX = (minX + maxX) / 2.0
        let centerY = (minY + maxY) / 2.0
        let offsetX = 0.5 - centerX
        let offsetY = 0.5 - centerY
        let scaleFactorX = 0.70
        let scaleFactorY = 0.60
        
        return spread.nodes.map { node in
            let centeredX = node.x + offsetX
            let centeredY = node.y + offsetY
            let finalX = 0.5 + (centeredX - 0.5) * scaleFactorX
            let finalY = 0.5 + (centeredY - 0.5) * scaleFactorY
            return SpreadNodeDef(
                id: node.id,
                name: node.name,
                x: finalX,
                y: finalY,
                title: node.title,
                description: node.description
            )
        }
    }
    
    public var body: some View {
        GeometryReader { geo in
            let canvasWidth = geo.size.width
            let canvasHeight = geo.size.height
            let nodesList = centeredNodes
            
            ZStack {
                // ── 1. Dynamic Vector Ley-Lines with Elemental Synergies ─
                ForEach(0..<max(0, nodesList.count - 1), id: \.self) { i in
                    let n1 = nodesList[i]
                    let n2 = nodesList[i + 1]
                    let card1 = nodesRecord[n1.id].flatMap { TarotDeck.getCard(named: $0) }
                    let card2 = nodesRecord[n2.id].flatMap { TarotDeck.getCard(named: $0) }
                    let isLatestLine = isGuided && n2.id == activeStep
                    
                    let p1 = CGPoint(x: n1.x * canvasWidth, y: n1.y * canvasHeight)
                    let p2 = CGPoint(x: n2.x * canvasWidth, y: n2.y * canvasHeight)
                    let midP = CGPoint(x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2)
                    let synergy = calculateSynergy(c1: card1, c2: card2)
                    
                    // Background Glow Line
                    Path { p in
                        p.move(to: p1)
                        p.addLine(to: p2)
                    }
                    .stroke(
                        synergy.color.opacity(isLatestLine ? 0.3 : (card2 != nil ? 0.8 : 0.35)),
                        style: StrokeStyle(lineWidth: isLatestLine ? 1.5 : 2.5, lineCap: .round, dash: isLatestLine ? [4, 4] : [])
                    )
                    .shadow(color: synergy.color.opacity(0.4), radius: 4)
                    
                    // Elemental Synergy Badge at Line Midpoint
                    if let text = synergy.text {
                        Text(text)
                            .font(VesperFont.telemetryTag(size: 7))
                            .foregroundColor(synergy.color)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Color.voidBlack)
                            .border(synergy.color.opacity(0.6), width: 0.8)
                            .position(midP)
                    }
                }
                .accessibilityHidden(true)
                
                // ── 2. Holographic Node Cards ────────────────────────
                ForEach(nodesList) { node in
                    let posX = node.x * canvasWidth
                    let posY = node.y * canvasHeight
                    
                    TarotCardNodeView(
                        node: node,
                        cardName: nodesRecord[node.id],
                        isActiveStep: node.id == activeStep,
                        isGuided: isGuided,
                        isAwaitingTap: isAwaitingTap,
                        latitude: latitude,
                        longitude: longitude,
                        kpIndex: kpIndex,
                        onTap: {
                            onNodeTapped(node)
                        }
                    )
                    .scaleEffect(node.id == activeStep ? 1.08 : 0.94)
                    .zIndex(node.id == activeStep ? 20 : Double(node.id))
                    .position(x: posX, y: posY)
                    .id("node_\(node.id)")
                }
            }
            .frame(width: canvasWidth, height: canvasHeight)
        }
    }
    
    private func calculateSynergy(c1: TarotCardDescriptor?, c2: TarotCardDescriptor?) -> (color: Color, text: String?) {
        guard let card1 = c1, let card2 = c2 else {
            return (Color.evaCyan, nil)
        }
        
        let e1 = card1.element
        let e2 = card2.element
        
        if e1 == e2 {
            return (elementColor(e1), "[\(e1.rawValue.uppercased()) REINFORCED]")
        }
        
        if (e1 == .fire && e2 == .air) || (e1 == .air && e2 == .fire) {
            return (Color.magiOrange, "[FIRE+AIR SYNTHESIS]")
        }
        if (e1 == .water && e2 == .earth) || (e1 == .earth && e2 == .water) {
            return (Color.vesperBlue, "[WATER+EARTH NOURISHMENT]")
        }
        if (e1 == .fire && e2 == .water) || (e1 == .water && e2 == .fire) {
            return (Color.warningAmber, "[FIRE+WATER TENSION]")
        }
        if (e1 == .air && e2 == .earth) || (e1 == .earth && e2 == .air) {
            return (Color.ghostWhite.opacity(0.8), "[AIR+EARTH FRICTION]")
        }
        
        return (Color.evaCyan, nil)
    }
    
    private func elementColor(_ element: ElementType) -> Color {
        switch element {
        case .fire: return .magiOrange
        case .water: return .vesperBlue
        case .air: return .evaCyan
        case .earth, .spirit: return .biosGreen
        }
    }
}
