// Sources/Views/Components/SyncBarView.swift
import SwiftUI

public struct SyncBarView: View {
    public var accentColor: Color = .vesperBlue
    
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var syncProgress: CGFloat = 0.65
    @State private var isPulsing: Bool = false
    
    public init(accentColor: Color = .vesperBlue) {
        self.accentColor = accentColor
    }
    
    public var body: some View {
        VStack(spacing: 3) {
            HStack {
                Text("LATENT BRIDGE")
                    .font(VesperFont.telemetryTag(size: 7))
                    .foregroundColor(accentColor.opacity(0.8))
                Spacer()
                Text("SYNC: \(Int(syncProgress * 100))%")
                    .font(VesperFont.telemetryTag(size: 7))
                    .foregroundColor(accentColor.opacity(0.8))
            }
            
            // Segmented Sync Progress Bar
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.white.opacity(0.08))
                    
                    Rectangle()
                        .fill(accentColor)
                        .frame(width: proxy.size.width * syncProgress)
                        .opacity((isPulsing && !reduceMotion) ? 0.7 : 1.0)
                }
            }
            .frame(height: 3)
            .border(accentColor.opacity(0.3), width: 0.5)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Latent Bridge Sync: \(Int(syncProgress * 100)) percent")
        .onAppear {
            if !reduceMotion {
                withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                    isPulsing.toggle()
                }
            }
        }
    }
}
