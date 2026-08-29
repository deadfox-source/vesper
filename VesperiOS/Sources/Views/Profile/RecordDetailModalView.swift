// Sources/Views/Profile/RecordDetailModalView.swift
import SwiftUI

public struct RecordDetailModalView: View {
    public let record: ReadingRecord
    public let onClose: () -> Void
    
    public init(record: ReadingRecord, onClose: @escaping () -> Void) {
        self.record = record
        self.onClose = onClose
    }
    
    public var body: some View {
        ZStack {
            // Semi-translucent Backdrop
            Color.black.opacity(0.65)
                .ignoresSafeArea()
                .onTapGesture {
                    VesperHapticEngine.shared.triggerTacticalClick()
                    onClose()
                }
            
            // Tactical Glass Modal Container
            VStack(spacing: 0) {
                // Header
                HStack {
                    HStack(spacing: 6) {
                        Rectangle()
                            .fill(Color.vesperViolet)
                            .frame(width: 4, height: 14)
                        Text("ARCHIVE RECORD [#\(record.id.prefix(6))]")
                            .font(VesperFont.terminalHeader(size: 12))
                            .foregroundColor(.vesperViolet)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        onClose()
                    }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.vesperGhost)
                            .padding(8)
                            .background(Color.white.opacity(0.12))
                            .frame(minWidth: 44, minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close archive record")
                    .accessibilityHint("Dismisses this reading record view")
                    .accessibilityAddTraits(.isButton)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.voidBlack.opacity(0.6))
                
                Rectangle()
                    .fill(Color.vesperViolet.opacity(0.4))
                    .frame(height: 1)
                    .accessibilityHidden(true)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(record.spreadName)
                                .font(VesperFont.terminalHeader(size: 13))
                                .foregroundColor(.vesperGhost)
                            Spacer()
                            Text(record.timestamp)
                                .font(VesperFont.telemetryTag(size: 8))
                                .foregroundColor(.vesperMuted)
                        }
                        
                        if let q = record.query {
                            Text("INQUIRY: \"\(q)\"")
                                .font(VesperFont.terminalBody(size: 11))
                                .foregroundColor(.vesperAmber)
                        }
                        
                        Divider().background(Color.vesperMuted.opacity(0.3))
                        
                        Text("ASSIGNED VECTORS:")
                            .font(VesperFont.telemetryTag(size: 8))
                            .foregroundColor(.vesperCyan)
                        
                        ForEach(record.nodes.keys.sorted(), id: \.self) { k in
                            if let cardName = record.nodes[k] {
                                HStack {
                                    Text("Node #\(k):")
                                        .font(VesperFont.telemetryTag(size: 9))
                                        .foregroundColor(.vesperMuted)
                                    Text(cardName)
                                        .font(VesperFont.terminalBody(size: 11))
                                        .foregroundColor(.vesperGhost)
                                }
                            }
                        }
                        
                        if let report = record.synthesisReport {
                            Divider().background(Color.vesperMuted.opacity(0.3))
                            
                            if let spoken = report.spokenConcise {
                                Text("SYNTHESIS:")
                                    .font(VesperFont.telemetryTag(size: 8))
                                    .foregroundColor(.vesperAmber)
                                Text("\"\(spoken)\"")
                                    .font(VesperFont.terminalBody(size: 11))
                                    .foregroundColor(.vesperGhost)
                            }
                        }
                    }
                    .padding(12)
                }
            }
            .frame(maxHeight: 500)
            .background(
                ZStack {
                    Color.voidBlack.opacity(0.80)
                    Rectangle().fill(.ultraThinMaterial.opacity(0.65))
                }
            )
            .overlay(
                Rectangle().strokeBorder(Color.vesperViolet, lineWidth: 1.2)
            )
            .shadow(color: Color.vesperViolet.opacity(0.25), radius: 16)
            .padding(.horizontal, 14)
        }
    }
}
