// Sources/Views/Components/VesperHeaderView.swift
import SwiftUI

public struct TelemetryColumnItem: Identifiable {
    public let id = UUID()
    public let label: String
    public let value: String
    public let icon: String?
    public let color: Color?
    
    public init(label: String, value: String, icon: String? = nil, color: Color? = nil) {
        self.label = label
        self.value = value
        self.icon = icon
        self.color = color
    }
}

public struct VesperHeaderView: View {
    @EnvironmentObject var vesper: VesperStore
    
    public let title: String
    public let accentColor: Color
    public let telemetryItems: [TelemetryColumnItem]
    public var ambientWaveform: AnyView?
    public var rightActions: AnyView?
    
    public init(
        title: String,
        accentColor: Color = .evaCyan,
        telemetryItems: [TelemetryColumnItem] = [],
        ambientWaveform: AnyView? = nil,
        rightActions: AnyView? = nil
    ) {
        self.title = title
        self.accentColor = accentColor
        self.telemetryItems = telemetryItems
        self.ambientWaveform = ambientWaveform
        self.rightActions = rightActions
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // Ambient Waveform in Background (if present)
            ZStack(alignment: .top) {
                if let ambient = ambientWaveform {
                    ambient
                        .opacity(0.35)
                }
                
                VStack(spacing: 0) {
                    // 1. Top Title Ribbon (Solid Accent Color)
                    HStack {
                        HStack(spacing: 4) {
                            Text(">")
                                .font(VesperFont.telemetryTag(size: 11))
                                .fontWeight(.bold)
                                .accessibilityHidden(true)
                            ScrambleTextView(text: title.uppercased(), font: VesperFont.telemetryTag(size: 11), color: .voidBlack)
                        }
                        
                        Spacer()
                        
                        Text("[ BIOS v9.0.2 ]")
                            .font(VesperFont.telemetryTag(size: 9))
                            .foregroundColor(.voidBlack.opacity(0.8))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(accentColor)
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityLabel("\(title) Screen Header")
                    
                    // 2. Sub-bar: Audio Toggle + Telemetry Columns + Actions
                    HStack(spacing: 0) {
                        // Global Audio Toggle
                        Button(action: {
                            vesper.toggleAudioOutput()
                        }) {
                            Image(systemName: !vesper.audioOutputEnabled ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                .font(.system(size: 11))
                                .foregroundColor(!vesper.audioOutputEnabled ? .magiOrange : accentColor)
                                .frame(width: 32, height: 32)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Toggle audio output")
                        .accessibilityValue(vesper.audioOutputEnabled ? "Enabled" : "Muted")
                        .accessibilityHint("Turns speech synthesis on or off")
                        
                        Rectangle()
                            .fill(accentColor.opacity(0.4))
                            .frame(width: 1, height: 26)
                            .accessibilityHidden(true)
                        
                        // Telemetry Grid Columns
                        ForEach(Array(telemetryItems.enumerated()), id: \.element.id) { index, item in
                            VStack(alignment: .leading, spacing: 1) {
                                Text(item.label)
                                    .font(VesperFont.telemetryTag(size: 8.5))
                                    .fontWeight(.bold)
                                    .foregroundColor(.vesperMuted)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.8)
                                
                                HStack(spacing: 3) {
                                    if let icon = item.icon {
                                        Image(systemName: icon)
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(item.color ?? accentColor)
                                    }
                                    Text("[\(item.value)]")
                                        .font(VesperFont.terminalBody(size: 10))
                                        .fontWeight(.bold)
                                        .foregroundColor(item.color ?? accentColor)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.8)
                                }
                            }
                            .padding(.horizontal, 4)
                            .padding(.vertical, 3)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("\(item.label): \(item.value)")
                            
                            if index < telemetryItems.count - 1 {
                                Rectangle()
                                    .fill(accentColor.opacity(0.4))
                                    .frame(width: 1, height: 26)
                                    .accessibilityHidden(true)
                            }
                        }
                        
                        if let actions = rightActions {
                            Rectangle()
                                .fill(accentColor.opacity(0.4))
                                .frame(width: 1, height: 26)
                            actions
                                .padding(.horizontal, 5)
                                .layoutPriority(2)
                        }
                    }
                    .background(Color.voidBlack)
                }
            }
            
            // 3. Thick 2px Bottom Accent Line
            Rectangle()
                .fill(accentColor)
                .frame(height: 2)
        }
        .background(Color.voidBlack)
    }
}
