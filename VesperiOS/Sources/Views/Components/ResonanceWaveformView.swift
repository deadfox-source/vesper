// Sources/Views/Components/ResonanceWaveformView.swift
import SwiftUI

public struct ResonanceWaveformView: View {
    let height: CGFloat
    let emotion: VesperEmotion?
    
    @State private var phase: CGFloat = 0
    
    public init(height: CGFloat = 60, emotion: VesperEmotion? = .neutral) {
        self.height = height
        self.emotion = emotion
    }
    
    public var body: some View {
        TimelineView(.animation) { timeline in
            Canvas { context, size in
                let time = timeline.date.timeIntervalSinceReferenceDate
                let width = size.width
                let midY = size.height / 2
                
                var path = Path()
                let waveColor = colorForEmotion()
                
                let amplitude: CGFloat = (emotion == .aggressive || emotion == .negative) ? 14 : 7
                let frequency: CGFloat = 0.03
                let speed: CGFloat = (emotion == .aggressive) ? 5.0 : 2.0
                
                for x in stride(from: 0, through: width, by: 3) {
                    let y = midY + sin(CGFloat(x) * frequency + CGFloat(time) * speed) * amplitude
                    if x == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
                
                context.stroke(path, with: .color(waveColor.opacity(0.35)), lineWidth: 1.5)
            }
        }
        .frame(height: height)
        .allowsHitTesting(false)
    }
    
    private func colorForEmotion() -> Color {
        switch emotion {
        case .positive: return .evaCyan
        case .negative, .aggressive: return .magiOrange
        case .embarrassment: return .vesperBlue
        case .neutral, .none: return .evaCyan
        }
    }
}
