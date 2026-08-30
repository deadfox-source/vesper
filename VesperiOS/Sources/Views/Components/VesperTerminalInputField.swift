// Sources/Views/Components/VesperTerminalInputField.swift
import SwiftUI

public struct VesperTerminalInputField: View {
    public var placeholder: String
    @Binding public var text: String
    public var accentColor: Color
    public var isAxisVertical: Bool
    public var isPrimary: Bool
    public var showTrailingAction: Bool
    public var onCommit: () -> Void
    
    @ObservedObject var recognizer = VesperSpeechRecognizer.shared
    @FocusState private var isFocused: Bool
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    public init(
        placeholder: String = "Enter message",
        text: Binding<String>,
        accentColor: Color = .vesperBlue,
        isAxisVertical: Bool = false,
        isPrimary: Bool = true,
        showTrailingAction: Bool = true,
        onCommit: @escaping () -> Void = {}
    ) {
        self.placeholder = placeholder
        self._text = text
        self.accentColor = accentColor
        self.isAxisVertical = isAxisVertical
        self.isPrimary = isPrimary
        self.showTrailingAction = showTrailingAction
        self.onCommit = onCommit
    }
    
    private var isFirstOrFocused: Bool {
        isFocused || isPrimary
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // ── Top Divider Line ─────────────────────────────────────────
            Rectangle()
                .fill(accentColor.opacity(0.4))
                .frame(height: 1)
                .accessibilityHidden(true)
            
            // ── Input Interactive Row ──────────────────────────────────
            HStack(spacing: 8) {
                // Tactical Terminal Prompt Chevron
                HStack(spacing: 2) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(accentColor)
                }
                .accessibilityHidden(true)
                
                // Text Input Area with Word-Editor Blinking Cursor
                ZStack(alignment: .leading) {
                    if text.isEmpty {
                        HStack(spacing: 4) {
                            if isFirstOrFocused {
                                BlinkingOrangeCursorLine()
                            }
                            
                            Text(placeholder)
                                .font(VesperFont.terminalBody(size: 13))
                                .foregroundColor(Color.ghostWhite.opacity(0.40))
                        }
                        .allowsHitTesting(false)
                    }
                    
                    if isAxisVertical {
                        TextField("", text: $text, axis: .vertical)
                            .font(VesperFont.terminalBody(size: 13))
                            .foregroundColor(.ghostWhite)
                            .tint(Color.magiOrange)
                            .focused($isFocused)
                            .lineLimit(1...4)
                            .frame(maxWidth: .infinity, minHeight: 36, alignment: .leading)
                            .accessibilityLabel(placeholder)
                            .accessibilityHint("Enter text")
                    } else {
                        TextField("", text: $text)
                            .font(VesperFont.terminalBody(size: 13))
                            .foregroundColor(.ghostWhite)
                            .tint(Color.magiOrange)
                            .focused($isFocused)
                            .frame(maxWidth: .infinity, minHeight: 36, alignment: .leading)
                            .accessibilityLabel(placeholder)
                            .accessibilityHint("Enter text")
                            .onSubmit {
                                submit()
                            }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                if showTrailingAction {
                    HStack(spacing: 6) {
                        if isFocused {
                            Button(action: minimizeKeyboard) {
                                Image(systemName: "keyboard.chevron.compact.down")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.ghostWhite.opacity(0.8))
                                    .frame(width: 32, height: 32)
                                    .background(Color.voidBlack)
                                    .border(Color.ghostWhite.opacity(0.3), width: 1)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Minimize keyboard")
                            .accessibilityHint("Dismisses the on-screen keyboard")
                            .accessibilityAddTraits(.isButton)
                        }
                        
                        if !text.trimmingCharacters(in: .whitespaces).isEmpty {
                            Button(action: submit) {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundColor(accentColor == .vesperBlue ? .magiOrange : accentColor)
                                    .frame(minWidth: 36, minHeight: 36)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Submit input")
                            .accessibilityHint("Submits text input")
                            .accessibilityAddTraits(.isButton)
                        } else {
                            Button(action: toggleSpeechDictation) {
                                Image(systemName: recognizer.isRecording ? "mic.fill" : "mic")
                                    .font(.system(size: 18))
                                    .foregroundColor(recognizer.isRecording ? .magiOrange : accentColor)
                                    .padding(6)
                                    .background(recognizer.isRecording ? Color.magiOrange.opacity(0.2) : Color.clear)
                                    .clipShape(Circle())
                                    .frame(minWidth: 36, minHeight: 36)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(recognizer.isRecording ? "Stop voice dictation" : "Start voice dictation")
                            .accessibilityHint("Transcribes voice to text")
                            .accessibilityAddTraits(.isButton)
                        }
                    }
                }
            }
            .padding(.horizontal, 10)
            .frame(height: isAxisVertical ? nil : 44)
            .frame(minHeight: 44)
            .background(Color.voidBlack)
        }
    }
    
    private func minimizeKeyboard() {
        VesperHapticEngine.shared.triggerTacticalClick()
        isFocused = false
        #if canImport(UIKit)
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        #endif
    }
    
    private func submit() {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        VesperHapticEngine.shared.triggerTacticalClick()
        onCommit()
    }
    
    private func toggleSpeechDictation() {
        VesperHapticEngine.shared.triggerTacticalClick()
        if recognizer.isRecording {
            recognizer.stopRecording()
            if !recognizer.transcript.isEmpty {
                text = (text.isEmpty ? "" : text + " ") + recognizer.transcript
            }
        } else {
            recognizer.toggleRecording { transcribedText in
                self.text = transcribedText
            }
        }
    }
}

private struct BlinkingOrangeCursorLine: View {
    @State private var isVisible: Bool = true
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    var body: some View {
        Rectangle()
            .fill(Color.magiOrange)
            .frame(width: 2, height: 14)
            .opacity(isVisible ? 1.0 : 0.0)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 0.53).repeatForever(autoreverses: true)) {
                    isVisible = false
                }
            }
            .accessibilityHidden(true)
    }
}
