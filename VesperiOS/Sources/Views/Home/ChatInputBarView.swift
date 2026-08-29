// Sources/Views/Home/ChatInputBarView.swift
import SwiftUI

public struct ChatInputBarView: View {
    @EnvironmentObject var vesper: VesperStore
    @State private var inputText: String = ""
    
    public var body: some View {
        VStack(spacing: 8) {
            // Suggestion Options Chips (Under 4 words, evoking inquiry)
            if let lastMsg = vesper.messages.last(where: { $0.role == .vesper }),
               let options = lastMsg.options, !options.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(options, id: \.self) { option in
                            Button(action: {
                                vesper.sendUserMessage(option)
                            }) {
                                HStack(spacing: 4) {
                                    Text(">")
                                        .font(VesperFont.telemetryTag(size: 10))
                                        .foregroundColor(.vesperAmber)
                                        .accessibilityHidden(true)
                                    Text(option.uppercased())
                                        .font(VesperFont.telemetryTag(size: 10))
                                        .foregroundColor(.vesperGhost)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                                .background(Color.vesperAmber.opacity(0.08))
                                .overlay(
                                    Rectangle()
                                        .strokeBorder(Color.vesperAmber.opacity(0.4), lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Suggested topic: \(option)")
                            .accessibilityHint("Double tap to send this query to Vesper")
                            .accessibilityAddTraits(.isButton)
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            
            // Thumb-Zone Input Bar
            VesperTerminalInputField(
                placeholder: "Enter message",
                text: $inputText,
                accentColor: .vesperCyan,
                onCommit: submitMessage
            )
            .padding(.horizontal, 16)
        }
        .padding(.bottom, 8)
    }
    
    private func submitMessage() {
        if vesper.isListening {
            vesper.stopVoiceListeningAndSend()
        } else {
            let msg = inputText
            inputText = ""
            vesper.sendUserMessage(msg)
        }
    }
}
