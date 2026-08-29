// Sources/Views/Profile/SavedConversationsView.swift
import SwiftUI

public struct SavedConversationsModalView: View {
    public let conversation: SavedConversation
    public let onClose: () -> Void
    
    public init(conversation: SavedConversation, onClose: @escaping () -> Void) {
        self.conversation = conversation
        self.onClose = onClose
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Rectangle()
                        .fill(Color.evaCyan)
                        .frame(width: 4, height: 14)
                    Text("SAVED CONVERSATION TRANSCRIPT")
                        .font(VesperFont.terminalHeader(size: 12))
                        .foregroundColor(.evaCyan)
                }
                
                Spacer()
                
                Button(action: {
                    VesperHapticEngine.shared.triggerTacticalClick()
                    onClose()
                }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.ghostWhite)
                        .padding(10)
                        .background(Color.white.opacity(0.1))
                        .frame(minWidth: 44, minHeight: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Close conversation transcript")
                .accessibilityHint("Dismisses this transcript view")
                .accessibilityAddTraits(.isButton)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.black)
            
            Rectangle()
                .fill(Color.evaCyan.opacity(0.35))
                .frame(height: 1)
                .accessibilityHidden(true)
            
            // Conversation info
            HStack {
                Text(conversation.title)
                    .font(VesperFont.terminalHeader(size: 13))
                    .foregroundColor(.magiOrange)
                Spacer()
                Text(conversation.timestamp)
                    .font(VesperFont.telemetryTag(size: 9))
                    .foregroundColor(.vesperMuted)
            }
            .padding(12)
            .background(Color.white.opacity(0.02))
            .accessibilityElement(children: .combine)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(conversation.messages) { msg in
                        VesperTerminalMessageRow(
                            message: msg.asChatMessage,
                            accentColor: .evaCyan,
                            onSelectOption: nil,
                            onDeploySpread: nil
                        )
                    }
                }
                .padding(12)
            }
        }
        .frame(maxHeight: 520)
        .background(Color.black)
        .overlay(Rectangle().strokeBorder(Color.evaCyan, lineWidth: 1))
        .padding(.horizontal, 12)
    }
}
