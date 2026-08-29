// Sources/Views/Components/BackgroundGridOverlay.swift
import SwiftUI

public struct BackgroundGridOverlay: View {
    public init() {}
    
    public var body: some View {
        ZStack {
            // 1. Data-Wave 40px Grid Pattern
            Canvas { context, size in
                let step: CGFloat = 40
                var path = Path()
                
                // Vertical grid lines
                for x in stride(from: 0, through: size.width, by: step) {
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: size.height))
                }
                
                // Horizontal grid lines
                for y in stride(from: 0, through: size.height, by: step) {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: size.width, y: y))
                }
                
                context.stroke(path, with: .color(Color.evaCyan.opacity(0.04)), lineWidth: 1)
            }
            
            // 2. CRT Scanlines (4px gradient lines)
            Canvas { context, size in
                let step: CGFloat = 4
                var path = Path()
                for y in stride(from: 0, through: size.height, by: step) {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: size.width, y: y))
                }
                context.stroke(path, with: .color(Color.black.opacity(0.12)), lineWidth: 1.5)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .ignoresSafeArea()
    }
}
