// Sources/Views/Tabletop/SynthesisTerminalView.swift
import SwiftUI

public struct SynthesisTerminalView: View {
    public let report: SynthesisReport
    public let onSave: () -> Void
    public let onClose: () -> Void
    
    @ObservedObject var recognizer = VesperSpeechRecognizer.shared
    
    @State private var messages: [ChatMessage] = []
    @State private var inputText: String = ""
    @State private var isReplying: Bool = false
    @State private var isSaved: Bool = false
    
    public init(
        report: SynthesisReport,
        onSave: @escaping () -> Void,
        onClose: @escaping () -> Void
    ) {
        self.report = report
        self.onSave = onSave
        self.onClose = onClose
    }
    
    public var body: some View {
        GeometryReader { geo in
            let terminalHeight = geo.size.height * 0.40
            let messageScrollHeight = max(terminalHeight - 96, 70)
            
            ZStack {
                // 1. Fullscreen Frosted Void Black Glass Background
                ZStack {
                    Color.voidBlack.opacity(0.60)
                    Rectangle().fill(.ultraThinMaterial.opacity(0.85))
                }
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // ── 2. Top Navigation Header ────────────────────────
                    HStack {
                        HStack(spacing: 6) {
                            Rectangle()
                                .fill(Color.warningAmber)
                                .frame(width: 4, height: 14)
                            Text("ORACLE SYNTHESIS REPORT")
                                .font(VesperFont.terminalHeader(size: 12))
                                .fontWeight(.bold)
                                .foregroundColor(.warningAmber)
                                .lineLimit(1)
                            Text("· [ \(report.spreadName.uppercased()) ]")
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.ghostWhite.opacity(0.6))
                                .lineLimit(1)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            VesperHapticEngine.shared.triggerTacticalClick()
                            onClose()
                        }) {
                            HStack(spacing: 4) {
                                Text("[ DISMISS ]")
                                    .font(VesperFont.telemetryTag(size: 9))
                                    .foregroundColor(.ghostWhite.opacity(0.8))
                                Image(systemName: "xmark")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.ghostWhite)
                            }
                            .padding(.horizontal, 10)
                            .frame(height: 32)
                            .background(Color.voidBlack)
                            .border(Color.white.opacity(0.3), width: 1)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Dismiss synthesis report")
                        .accessibilityHint("Closes this synthesis view")
                        .accessibilityAddTraits(.isButton)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.voidBlack.opacity(0.6))
                    
                    // ── 3. Top Synthesis Data Display (Upper 60%) ───────
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            // Elemental Dignity Scores
                            VStack(alignment: .leading, spacing: 6) {
                                HStack(spacing: 4) {
                                    Text("┌── [ ELEMENTAL DIGNITY SCORES ]")
                                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                                        .foregroundColor(.evaCyan)
                                    Text("──────────")
                                        .font(.system(size: 8.5, design: .monospaced))
                                        .foregroundColor(.evaCyan.opacity(0.35))
                                }
                                
                                HStack(spacing: 8) {
                                    elementBadge("FIRE", score: report.elements.fire, color: .magiOrange)
                                    elementBadge("WATER", score: report.elements.water, color: .magiViolet)
                                    elementBadge("AIR", score: report.elements.air, color: .evaCyan)
                                    elementBadge("EARTH", score: report.elements.earth, color: .biosGreen)
                                }
                            }
                            
                            // Triad Calculus
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 4) {
                                    Text("┌── [ TRIAD CALCULUS ]")
                                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                                        .foregroundColor(.evaCyan)
                                    Text("──────────────────")
                                        .font(.system(size: 8.5, design: .monospaced))
                                        .foregroundColor(.evaCyan.opacity(0.35))
                                }
                                
                                HStack(alignment: .top, spacing: 6) {
                                    Text("│ >")
                                        .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                                        .foregroundColor(.evaCyan.opacity(0.85))
                                    Text(report.triadAnalysis)
                                        .font(VesperFont.terminalBody(size: 11))
                                        .foregroundColor(.ghostWhite.opacity(0.9))
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                
                                Text("└─────────────────────────────────────────")
                                    .font(.system(size: 8, design: .monospaced))
                                    .foregroundColor(.evaCyan.opacity(0.25))
                            }
                            
                            // Tactical Directives
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 4) {
                                    Text("┌── [ TACTICAL DIRECTIVES ]")
                                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                                        .foregroundColor(.warningAmber)
                                    Text("──────────────")
                                        .font(.system(size: 8.5, design: .monospaced))
                                        .foregroundColor(.warningAmber.opacity(0.35))
                                }
                                
                                ForEach(report.tacticalDirectives, id: \.self) { dir in
                                    HStack(alignment: .top, spacing: 6) {
                                        Text("│ >")
                                            .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                                            .foregroundColor(.warningAmber.opacity(0.85))
                                        Text(dir)
                                            .font(VesperFont.terminalBody(size: 11))
                                            .foregroundColor(.ghostWhite)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                                
                                Text("└─────────────────────────────────────────")
                                    .font(.system(size: 8, design: .monospaced))
                                    .foregroundColor(.warningAmber.opacity(0.25))
                            }
                            
                            // Save to Archive Action Button
                            Button(action: {
                                guard !isSaved else { return }
                                isSaved = true
                                VesperHapticEngine.shared.triggerSuccess()
                                onSave()
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: isSaved ? "checkmark.circle.fill" : "square.and.arrow.down.fill")
                                        .font(.system(size: 11))
                                    Text(isSaved ? "[ SAVED TO INDIVIDUATION ARCHIVE ]" : "[ SAVE TO INDIVIDUATION ARCHIVE ]")
                                        .font(VesperFont.telemetryTag(size: 10))
                                        .fontWeight(.bold)
                                }
                                .foregroundColor(isSaved ? .biosGreen : .evaCyan)
                                .frame(maxWidth: .infinity, minHeight: 38)
                                .background(isSaved ? Color.biosGreen.opacity(0.12) : Color.voidBlack)
                                .border(isSaved ? Color.biosGreen : Color.evaCyan, width: 1)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Save to Individuation Archive")
                            .accessibilityHint("Saves this oracle synthesis record to your profile")
                            .accessibilityAddTraits(.isButton)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    
                    // ── 4. Bottom Guided Terminal Window (Anchored Flush at 40%) ─
                    TerminalFrameView(
                        title: "VESPER SYNTHESIS TERMINAL",
                        headerSubtitle: "[ ORACLE HARMONY ]",
                        accentColor: .warningAmber
                    ) {
                        VStack(spacing: 0) {
                            ScrollViewReader { proxy in
                                ScrollView {
                                    LazyVStack(alignment: .leading, spacing: 6) {
                                        ForEach(messages) { msg in
                                            VesperTerminalMessageRow(
                                                message: msg,
                                                accentColor: .warningAmber,
                                                onSelectOption: { opt in
                                                    handleSelectOption(opt)
                                                },
                                                onDeploySpread: nil
                                            )
                                            .id(msg.id)
                                        }
                                        
                                        if isReplying {
                                            HStack(spacing: 6) {
                                                Text("> VESPER:")
                                                    .font(VesperFont.telemetryTag(size: 9))
                                                    .foregroundColor(.warningAmber)
                                                Text("INTEGRATING SYNTHESIS QUERY...")
                                                    .font(VesperFont.terminalBody(size: 10))
                                                    .foregroundColor(.magiOrange)
                                                ProgressView()
                                                    .scaleEffect(0.6)
                                                    .tint(.warningAmber)
                                            }
                                            .id("processing_indicator")
                                            .accessibilityElement(children: .combine)
                                            .accessibilityLabel("Vesper is processing synthesis query")
                                        }
                                    }
                                    .padding(8)
                                }
                                .scrollDismissesKeyboard(.interactively)
                                .frame(height: messageScrollHeight)
                                .onChange(of: messages.count) { _, _ in
                                    if let lastId = messages.last?.id {
                                        withAnimation {
                                            proxy.scrollTo(lastId, anchor: .bottom)
                                        }
                                    }
                                }
                                .onChange(of: isReplying) { _, processing in
                                    if processing {
                                        withAnimation {
                                            proxy.scrollTo("processing_indicator", anchor: .bottom)
                                        }
                                    }
                                }
                            }
                            
                            // Input Bar with top line anchored flush at the bottom of the terminal window
                            VesperTerminalInputField(
                                placeholder: "Enter message",
                                text: $inputText,
                                accentColor: .warningAmber,
                                onCommit: handleSend
                            )
                        }
                    }
                    .padding(.horizontal, 6)
                    .padding(.bottom, 6)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .onAppear {
            initializeSynthesisDialogue()
        }
    }
    
    // MARK: - Dialogue Initialization
    
    private func initializeSynthesisDialogue() {
        guard messages.isEmpty else { return }
        let highLevelTakeaway = report.spokenConcise ?? "Oracle synthesis completed. The structural vectors of your spread have been fully calculated and integrated."
        
        let initialMsg = ChatMessage(
            role: .vesper,
            text: highLevelTakeaway,
            options: ["Examine core vector", "Integrate directives", "Deepen analysis"]
        )
        messages.append(initialMsg)
    }
    
    // MARK: - Message Handling
    
    private func handleSend() {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        inputText = ""
        
        messages.append(ChatMessage(role: .user, text: trimmed))
        isReplying = true
        VesperHapticEngine.shared.triggerTacticalClick()
        
        Task {
            let history = messages.map { (role: $0.isUser ? "user" : "model", text: $0.text) }
            do {
                let aiResponse = try await GeminiClient.shared.sendChatMessage(
                    history: history,
                    userMessage: trimmed,
                    telemetrySummary: report.gridSummary,
                    apiKey: VesperConfig.geminiAPIKey
                )
                messages.append(ChatMessage(
                    role: .vesper,
                    text: aiResponse.text,
                    options: aiResponse.options
                ))
                VesperSpeechSynthesizer.shared.speak(aiResponse.text)
            } catch {
                let fallback = "The synthesis vectors remain in balance. Which directive would you like to explore further?"
                messages.append(ChatMessage(role: .vesper, text: fallback))
                VesperSpeechSynthesizer.shared.speak(fallback)
            }
            isReplying = false
        }
    }
    
    private func handleSelectOption(_ option: String) {
        inputText = option
        handleSend()
    }
    
    private func elementBadge(_ name: String, score: Double, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(name)
                .font(VesperFont.telemetryTag(size: 8))
                .foregroundColor(color)
            Text(String(format: "%.1f", score))
                .font(VesperFont.terminalHeader(size: 13))
                .fontWeight(.bold)
                .foregroundColor(.ghostWhite)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(Color.voidBlack)
        .border(color.opacity(0.6), width: 1)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(name) element score: \(String(format: "%.1f", score))")
    }
}
