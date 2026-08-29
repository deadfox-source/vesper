// Sources/Views/Components/GlitchEffect.swift
import SwiftUI

public struct GlitchEffect: ViewModifier {
    @State private var offset: CGFloat = 0
    @State private var opacity: Double = 1.0
    public var trigger: Bool
    
    public func body(content: Content) -> some View {
        content
            .offset(x: trigger ? offset : 0)
            .opacity(trigger ? opacity : 1.0)
            .onChange(of: trigger) { newValue in
                if newValue {
                    triggerGlitch()
                }
            }
    }
    
    private func triggerGlitch() {
        let duration = 0.15
        withAnimation(.easeOut(duration: duration / 3)) {
            offset = CGFloat.random(in: -10...10)
            opacity = Double.random(in: 0.3...0.8)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + (duration / 3)) {
            withAnimation(.easeOut(duration: duration / 3)) {
                offset = CGFloat.random(in: -5...5)
                opacity = Double.random(in: 0.6...0.9)
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + (duration * 2 / 3)) {
            withAnimation(.easeIn(duration: duration / 3)) {
                offset = 0
                opacity = 1.0
            }
        }
    }
}

public extension View {
    func vesperGlitch(trigger: Bool) -> some View {
        self.modifier(GlitchEffect(trigger: trigger))
    }
}
