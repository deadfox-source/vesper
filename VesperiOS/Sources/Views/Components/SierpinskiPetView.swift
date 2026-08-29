import SwiftUI

public struct SierpinskiPetView: View {
    public var stage: Int
    public var isSpeaking: Bool
    @State private var time: Double = 0.0
    
    public var audioLevel: Float = 0.0
    
    public init(stage: Int = 1, isSpeaking: Bool = false, audioLevel: Float = 0.0) {
        self.stage = stage
        self.isSpeaking = isSpeaking
        self.audioLevel = audioLevel
    }
    
    public var body: some View {
        TimelineView(.animation) { context in
            Canvas { ctx, size in
                let t = context.date.timeIntervalSinceReferenceDate
                
                let pulse = isSpeaking ? 1.15 : (1.0 + sin(t * 1.5) * 0.03)
                let cx = size.width / 2.0
                let cy = size.height / 2.0
                let baseRadius = min(size.width, size.height) * 0.35
                
                func getPoints(radius: Double, sides: Int, rotation: Double) -> [CGPoint] {
                    var points: [CGPoint] = []
                    for i in 0..<sides {
                        let angle = (Double(i) * 2.0 * .pi / Double(sides)) + rotation
                        let x = cx + radius * cos(angle)
                        let y = cy + radius * sin(angle)
                        points.append(CGPoint(x: x, y: y))
                    }
                    return points
                }
                
                func drawPolygon(radius: Double, sides: Int, rotation: Double, color: Color, lineWidth: Double, dashed: Bool = false, opacity: Double = 1.0) {
                    let pts = getPoints(radius: radius, sides: sides, rotation: rotation)
                    guard !pts.isEmpty else { return }
                    var path = Path()
                    path.move(to: pts[0])
                    for i in 1..<pts.count {
                        path.addLine(to: pts[i])
                    }
                    path.closeSubpath()
                    
                    var style = StrokeStyle(lineWidth: lineWidth, lineJoin: .round)
                    if dashed {
                        style.dash = [4, 4]
                    }
                    
                    ctx.opacity = opacity
                    ctx.stroke(path, with: .color(color), style: style)
                    ctx.opacity = 1.0 // reset
                }
                
                func drawRays(radius: Double, count: Int, rotation: Double, color: Color) {
                    for i in 0..<count {
                        let angle = (Double(i) * 2.0 * .pi / Double(count)) + rotation
                        let startX = cx + (radius * 0.6) * cos(angle)
                        let startY = cy + (radius * 0.6) * sin(angle)
                        let endX = cx + radius * cos(angle)
                        let endY = cy + radius * sin(angle)
                        
                        var path = Path()
                        path.move(to: CGPoint(x: startX, y: startY))
                        path.addLine(to: CGPoint(x: endX, y: endY))
                        
                        ctx.opacity = 0.4
                        ctx.stroke(path, with: .color(color), lineWidth: 1.0)
                        ctx.opacity = 1.0
                    }
                }
                
                // Stage 1: Core Octahedron / Diamond Wireframe
                drawPolygon(radius: baseRadius * 0.4 * pulse, sides: 6, rotation: t * 0.4, color: Color.evaCyan, lineWidth: 1.5, opacity: 0.8)
                drawPolygon(radius: baseRadius * 0.25 * pulse, sides: 3, rotation: -t * 0.8, color: Color.vesperViolet, lineWidth: 1.2, opacity: 0.9)
                
                // Stage 2+: Outer Concentric Orbital Hexagon
                if stage >= 2 {
                    drawPolygon(radius: baseRadius * 0.7 * pulse, sides: 6, rotation: -t * 0.2, color: Color.evaCyan, lineWidth: 1.0, dashed: true, opacity: 0.5)
                }
                
                // Stage 3+: Radiating Data Vectors
                if stage >= 3 {
                    drawRays(radius: baseRadius * 0.85, count: 12, rotation: t * 0.1, color: Color.magiOrange)
                }
                
                // Stage 4+: Complex Sacred Geometry Overlay
                if stage >= 4 {
                    drawPolygon(radius: baseRadius * 0.95 * pulse, sides: 12, rotation: t * 0.15, color: Color.vesperViolet, lineWidth: 1.0, opacity: 0.4)
                }
                
                // Stage 5: Fully Integrated Holographic Matrix
                if stage >= 5 {
                    drawPolygon(radius: baseRadius * 1.1 * pulse, sides: 8, rotation: -t * 0.3, color: Color.evaCyan, lineWidth: 1.5, opacity: 0.6)
                }
            }
        }
    }
}
