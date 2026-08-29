// Sources/Views/Components/VesperTelemetryRowView.swift
import SwiftUI

public struct VesperTelemetryRowView: View {
    @EnvironmentObject var telemetry: TelemetryStore
    public var accentColor: Color = .evaCyan
    
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var offset: CGFloat = 0
    @State private var groupWidth: CGFloat = 0
    @State private var isDragging: Bool = false
    @State private var dragStartOffset: CGFloat = 0
    @State private var lastInteractionDate: Date = .distantPast
    
    // Auto-scroll speed: 28 points per second
    private let scrollSpeed: CGFloat = 28.0
    // Resume auto-scroll after 2.5 seconds of user inactivity
    private let resumeDelay: TimeInterval = 2.5
    
    private let timer = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()
    
    public init(accentColor: Color = .evaCyan) {
        self.accentColor = accentColor
    }
    
    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Background
                Color.voidBlack
                
                // Infinite repeating ticker stream
                HStack(spacing: 24) {
                    telemetryItemsGroup()
                        .background(
                            GeometryReader { itemGeo in
                                Color.clear
                                    .preference(
                                        key: TelemetryGroupWidthPreferenceKey.self,
                                        value: itemGeo.size.width + 24
                                    )
                            }
                        )
                    
                    telemetryItemsGroup()
                    telemetryItemsGroup()
                    telemetryItemsGroup()
                }
                .offset(x: offset)
                .onPreferenceChange(TelemetryGroupWidthPreferenceKey.self) { newWidth in
                    if newWidth > 0 && groupWidth == 0 {
                        groupWidth = newWidth
                    }
                }
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            if !isDragging {
                                isDragging = true
                                dragStartOffset = offset
                            }
                            lastInteractionDate = Date()
                            offset = dragStartOffset + value.translation.width
                            wrapOffset()
                        }
                        .onEnded { _ in
                            isDragging = false
                            lastInteractionDate = Date()
                            dragStartOffset = offset
                            wrapOffset()
                        }
                )
            }
            .clipped()
        }
        .frame(height: 24)
        .background(Color.voidBlack)
        .overlay(
            Rectangle()
                .fill(Color.white.opacity(0.18))
                .frame(height: 1),
            alignment: .bottom
        )
        .onReceive(timer) { _ in
            guard !reduceMotion, groupWidth > 0 else { return }
            
            // Only auto-scroll if user is not currently dragging AND resume delay has passed
            if !isDragging && Date().timeIntervalSince(lastInteractionDate) >= resumeDelay {
                offset -= scrollSpeed * (1.0 / 60.0)
                wrapOffset()
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Environmental Telemetry: Battery \(Int(telemetry.batteryLevel * 100)) percent, Planetary Kp index \(String(format: "%.1f", telemetry.spaceWeather.kpIndex))")
    }
    
    private func wrapOffset() {
        guard groupWidth > 0 else { return }
        while offset <= -groupWidth {
            offset += groupWidth
            dragStartOffset += groupWidth
        }
        while offset > 0 {
            offset -= groupWidth
            dragStartOffset -= groupWidth
        }
    }
    
    @ViewBuilder
    private func telemetryItemsGroup() -> some View {
        HStack(spacing: 24) {
            // Ticker Item 1: Power
            HStack(spacing: 5) {
                Image(systemName: telemetry.isCharging ? "battery.100.bolt" : "battery.100")
                    .font(.system(size: 10))
                    .foregroundColor(telemetry.isCharging ? .warningAmber : .biosGreen)
                Text("POWER: \(Int(telemetry.batteryLevel * 100))% [\(telemetry.isCharging ? "AC" : "DC")]")
                    .font(VesperFont.telemetryTag(size: 9))
                    .foregroundColor(telemetry.isCharging ? .warningAmber : .biosGreen)
                    .lineLimit(1)
                    .fixedSize()
            }
            
            // Ticker Item 2: Temperature / Meteo
            HStack(spacing: 5) {
                Image(systemName: "cloud.sun.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.warningAmber)
                if let temp = telemetry.weather?.temperature {
                    Text("TEMP: \(String(format: "%.1f", temp))°C")
                        .font(VesperFont.telemetryTag(size: 9))
                        .foregroundColor(.warningAmber)
                        .lineLimit(1)
                        .fixedSize()
                } else {
                    Text("METEO: ONLINE")
                        .font(VesperFont.telemetryTag(size: 9))
                        .foregroundColor(.warningAmber)
                        .lineLimit(1)
                        .fixedSize()
                }
            }
            
            // Ticker Item 3: GPS Coordinates
            HStack(spacing: 5) {
                Image(systemName: "location.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.evaCyan)
                if let coords = telemetry.locationCoords {
                    Text("COORD: \(String(format: "%.2f", coords.lat)), \(String(format: "%.2f", coords.lon))")
                        .font(VesperFont.telemetryTag(size: 9))
                        .foregroundColor(.evaCyan)
                        .lineLimit(1)
                        .fixedSize()
                } else {
                    Text("COORD: LATENT")
                        .font(VesperFont.telemetryTag(size: 9))
                        .foregroundColor(.evaCyan)
                        .lineLimit(1)
                        .fixedSize()
                }
            }
            
            // Ticker Item 4: NOAA Planetary K-Index
            HStack(spacing: 5) {
                Image(systemName: "globe")
                    .font(.system(size: 10))
                    .foregroundColor(.magiOrange)
                Text("Kp-INDEX: \(String(format: "%.2f", telemetry.spaceWeather.kpIndex))")
                    .font(VesperFont.telemetryTag(size: 9))
                    .foregroundColor(.magiOrange)
                    .lineLimit(1)
                    .fixedSize()
            }
            
            // Ticker Item 5: Live Feed Badge
            Text("[ LIVE FEED ]")
                .font(VesperFont.telemetryTag(size: 9))
                .foregroundColor(accentColor)
                .lineLimit(1)
                .fixedSize()
            
            // Ticker Item 6: CPU Cores
            HStack(spacing: 5) {
                Image(systemName: "cpu")
                    .font(.system(size: 10))
                    .foregroundColor(.magiViolet)
                Text("CORES: \(telemetry.cpuCores)")
                    .font(VesperFont.telemetryTag(size: 9))
                    .foregroundColor(.magiViolet)
                    .lineLimit(1)
                    .fixedSize()
            }
            
            // Ticker Item 7: System Time
            Text(telemetry.systemTimeText)
                .font(VesperFont.telemetryTag(size: 9))
                .foregroundColor(.ghostWhite.opacity(0.8))
                .lineLimit(1)
                .fixedSize()
        }
        .padding(.vertical, 4)
    }
}

private struct TelemetryGroupWidthPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}
