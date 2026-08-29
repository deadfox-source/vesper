// Sources/Views/Components/CRTScanlineOverlay.swift
import SwiftUI

public struct CRTScanlineOverlay: View {
    @State private var scanlineOffset: CGFloat = 0.0
    
    public init() {}
    
    public var body: some View {
        Canvas { context, size in
            let lineSpacing: CGFloat = 3.5
            let totalLines = Int(size.height / lineSpacing)
            
            for i in 0...totalLines {
                let y = CGFloat(i) * lineSpacing
                let path = Path { p in
                    p.move(to: CGPoint(x: 0, y: y))
                    p.addLine(to: CGPoint(x: size.width, y: y))
                }
                context.stroke(path, with: .color(Color.white.opacity(0.04)), lineWidth: 0.75)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .overlay(
            RadialGradient(
                gradient: Gradient(colors: [Color.clear, Color.black.opacity(0.45)]),
                center: .center,
                startRadius: 200,
                endRadius: 500
            )
            .allowsHitTesting(false)
        )
    }
}
