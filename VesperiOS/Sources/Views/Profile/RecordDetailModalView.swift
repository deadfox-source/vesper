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
            // Solid Void Black Backdrop
            Color.voidBlack
                .ignoresSafeArea()
                .onTapGesture {
                    VesperHapticEngine.shared.triggerTacticalClick()
                    onClose()
                }
            
            // Tactical Modal Container
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
                .background(Color.voidBlack)
                
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
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.vesperMuted)
                        }
                        
                        if let query = record.query {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("QUERY / CONTEXT:")
                                    .font(VesperFont.telemetryTag(size: 8.5))
                                    .foregroundColor(.vesperViolet)
                                Text("\"\(query)\"")
                                    .font(VesperFont.terminalBody(size: 11))
                                    .foregroundColor(.vesperGhost)
                            }
                        }
                        
                        // Card Nodes
                        VStack(alignment: .leading, spacing: 6) {
                            Text("NODE ARCHITECTURE:")
                                .font(VesperFont.telemetryTag(size: 8.5))
                                .foregroundColor(.vesperViolet)
                            
                            ForEach(record.nodes.sorted(by: { $0.key < $1.key }), id: \.key) { nodeId, cardName in
                                HStack(spacing: 8) {
                                    Text("[\(nodeId)]")
                                        .font(VesperFont.telemetryTag(size: 8))
                                        .foregroundColor(.vesperViolet)
                                    Text(cardName)
                                        .font(VesperFont.terminalHeader(size: 11))
                                        .foregroundColor(.vesperGhost)
                                    Spacer()
                                    if let note = record.cardNotes?[nodeId] {
                                        Text(note)
                                            .font(VesperFont.terminalBody(size: 9.5))
                                            .foregroundColor(.vesperMuted)
                                            .lineLimit(1)
                                    }
                                }
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.voidBlack)
                                .border(Color.vesperViolet.opacity(0.3), width: 0.8)
                            }
                        }
                        
                        // Synthesis Extract
                        if let synth = record.synthesisReport {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("ORACLE SYNTHESIS:")
                                    .font(VesperFont.telemetryTag(size: 8.5))
                                    .foregroundColor(.warningAmber)
                                Text(synth.triadAnalysis)
                                    .font(VesperFont.terminalBody(size: 10.5))
                                    .foregroundColor(.vesperGhost)
                            }
                        }
                    }
                    .padding(12)
                }
            }
            .frame(maxHeight: 500)
            .background(Color.voidBlack)
            .overlay(
                Rectangle().strokeBorder(Color.vesperViolet, lineWidth: 1.2)
            )
            .padding(.horizontal, 14)
        }
    }
}
