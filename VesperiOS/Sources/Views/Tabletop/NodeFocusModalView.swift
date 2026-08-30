// Sources/Views/Tabletop/NodeFocusModalView.swift
import SwiftUI

public struct NodeFocusModalView: View {
    public let node: SpreadNodeDef
    public let cardName: String?
    public var currentNote: String = ""
    public let onSaveNote: (String) -> Void
    public let onRedraw: () -> Void
    public let onClose: () -> Void
    
    @EnvironmentObject var board: BoardStore
    @ObservedObject var recognizer = VesperSpeechRecognizer.shared
    
    @State private var cardMessages: [ChatMessage] = []
    @State private var inputText: String = ""
    @State private var isClarifying: Bool = false
    @State private var isSubmitting: Bool = false
    
    public init(
        node: SpreadNodeDef,
        cardName: String?,
        currentNote: String = "",
        onSaveNote: @escaping (String) -> Void,
        onRedraw: @escaping () -> Void,
        onClose: @escaping () -> Void
    ) {
        self.node = node
        self.cardName = cardName
        self.currentNote = currentNote
        self.onSaveNote = onSaveNote
        self.onRedraw = onRedraw
        self.onClose = onClose
    }
    
    private var card: TarotCardDescriptor? {
        guard let name = cardName else { return nil }
        return TarotDeck.getCard(named: name)
    }
    
    public var body: some View {
        GeometryReader { geo in
            let terminalHeight = geo.size.height * 0.40
            let messageScrollHeight = max(terminalHeight - 96, 70)
            
            ZStack {
                // Fullscreen Semi-Transparent Frosted Glass Background
                ZStack {
                    Color.voidBlack.opacity(0.60)
                    Rectangle().fill(.ultraThinMaterial.opacity(0.85))
                }
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // ── Top Navigation Header ────────────────────────────
                    HStack {
                        HStack(spacing: 6) {
                            Rectangle()
                                .fill(Color.evaCyan)
                                .frame(width: 4, height: 14)
                            Text("CODEX [ SYSTEM.ARCANA ]")
                                .font(VesperFont.terminalHeader(size: 12))
                                .fontWeight(.bold)
                                .foregroundColor(.evaCyan)
                                .lineLimit(1)
                            Text("· [ NODE #\(node.id) ]")
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
                        .accessibilityLabel("Dismiss codex")
                        .accessibilityHint("Closes this card reflection view")
                        .accessibilityAddTraits(.isButton)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.voidBlack.opacity(0.6))
                    
                    Rectangle()
                        .fill(Color.evaCyan.opacity(0.35))
                        .frame(height: 1)
                        .accessibilityHidden(true)
                    
                    // ── Card Codex Upper Content (Scrollable Top Area) ──────
                    ScrollView {
                        VStack(spacing: 4) {
                            // Section 1: Tactical Node Header
                            HStack {
                                Text("NODE #\(node.id):")
                                    .font(VesperFont.telemetryTag(size: 9))
                                    .foregroundColor(.evaCyan)
                                Text(node.title.uppercased())
                                    .font(VesperFont.terminalHeader(size: 11))
                                    .foregroundColor(.magiOrange)
                                Spacer()
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            
                            if let c = card {
                                // Section 2: Ascii Card Art
                                VesperAsciiCardView(
                                    cardName: c.name,
                                    element: c.element,
                                    accentColor: elementColor(c.element),
                                    cardHeight: min(geo.size.height * 0.22, 150),
                                    fontSize: 7.2
                                )
                                .padding(.vertical, 1)
                                
                                // Section 3: Card Information Text
                                HStack(alignment: .center, spacing: 8) {
                                    Text(c.name.uppercased())
                                        .font(VesperFont.bannerLarge(size: 13.5))
                                        .fontWeight(.bold)
                                        .foregroundColor(.evaCyan)
                                    
                                    Spacer()
                                    
                                    HStack(spacing: 6) {
                                        Text("[\(c.element.rawValue.uppercased())]")
                                            .font(VesperFont.terminalHeader(size: 8.5))
                                            .foregroundColor(elementColor(c.element))
                                            .padding(.horizontal, 4)
                                            .frame(height: 20)
                                            .border(elementColor(c.element), width: 0.8)
                                        
                                        Text("[ \(c.element.platonicSolid.uppercased()) ]")
                                            .font(VesperFont.telemetryTag(size: 8))
                                            .foregroundColor(.biosGreen)
                                    }
                                }
                                
                                // Section 4: Tactical Interpretation (Inline)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text("> TACTICAL INTERPRETATION:")
                                        .font(VesperFont.telemetryTag(size: 7.5))
                                        .foregroundColor(.ghostWhite.opacity(0.6))
                                    Text(c.meaning)
                                        .font(VesperFont.terminalBody(size: 10))
                                        .foregroundColor(.ghostWhite)
                                        .lineLimit(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                Text("No card currently assigned to this node.")
                                    .font(VesperFont.terminalBody(size: 11))
                                    .foregroundColor(.ghostWhite.opacity(0.5))
                                    .padding(12)
                            }
                        }
                        .padding(.horizontal, 10)
                        .padding(.top, 4)
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    
                    // ── Lower Pinned Card Terminal Frame (Anchored at Bottom 40%) ──
                    if let _ = card {
                        TerminalFrameView(
                            title: "VESPER TERMINAL",
                            headerSubtitle: "[ NODE #\(node.id) INQUIRY ]",
                            accentColor: .evaCyan
                        ) {
                            VStack(spacing: 0) {
                                ScrollViewReader { proxy in
                                    ScrollView {
                                        LazyVStack(alignment: .leading, spacing: 6) {
                                            ForEach(cardMessages) { msg in
                                                VesperTerminalMessageRow(
                                                    message: msg,
                                                    accentColor: .evaCyan,
                                                    onSelectOption: { opt in
                                                        inputText = opt
                                                        handleInputCommit()
                                                    },
                                                    onDeploySpread: nil
                                                )
                                                .id(msg.id)
                                            }
                                            
                                            if isClarifying {
                                                HStack(spacing: 4) {
                                                    Text("> VESPER:")
                                                        .font(VesperFont.telemetryTag(size: 9))
                                                        .foregroundColor(.evaCyan)
                                                    Text("CLARIFYING ARCHETYPE VECTOR...")
                                                        .font(VesperFont.terminalBody(size: 10))
                                                        .foregroundColor(.magiOrange)
                                                    ProgressView()
                                                        .scaleEffect(0.6)
                                                        .tint(.evaCyan)
                                                }
                                                .id("clarifying_indicator")
                                                .accessibilityElement(children: .combine)
                                                .accessibilityLabel("Vesper is clarifying card prompt")
                                            }
                                        }
                                        .padding(8)
                                    }
                                    .scrollDismissesKeyboard(.interactively)
                                    .frame(height: messageScrollHeight)
                                    .onChange(of: cardMessages.count) { _, _ in
                                        if let lastId = cardMessages.last?.id {
                                            withAnimation(.easeOut(duration: 0.2)) {
                                                proxy.scrollTo(lastId, anchor: .bottom)
                                            }
                                        }
                                    }
                                    .onChange(of: isClarifying) { _, clarifying in
                                        if clarifying {
                                            withAnimation {
                                                proxy.scrollTo("clarifying_indicator", anchor: .bottom)
                                            }
                                        }
                                    }
                                }
                                
                                // Input Row with orange cursor line
                                VesperTerminalInputField(
                                    placeholder: "Enter message",
                                    text: $inputText,
                                    accentColor: .evaCyan,
                                    isAxisVertical: false,
                                    onCommit: handleInputCommit
                                )
                                
                                // Action Bar with standardized 32px button
                                HStack(spacing: 0) {
                                    Button(action: {
                                        submitReflectionAndAdvance()
                                    }) {
                                        HStack(spacing: 6) {
                                            Image(systemName: "arrow.right.circle.fill")
                                                .font(.system(size: 10))
                                            Text("[ SUBMIT REFLECTION & ADVANCE ]")
                                                .font(VesperFont.telemetryTag(size: 9.5))
                                                .fontWeight(.bold)
                                        }
                                        .foregroundColor(canSubmit ? .voidBlack : Color.evaCyan.opacity(0.4))
                                        .frame(height: 32)
                                        .frame(maxWidth: .infinity)
                                        .background(canSubmit ? Color.evaCyan : Color.evaCyan.opacity(0.15))
                                        .border(Color.evaCyan, width: 1)
                                        .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(!canSubmit || isSubmitting)
                                    .accessibilityLabel("Submit reflection and advance")
                                    .accessibilityHint("Saves observation and draws the next node card")
                                    .accessibilityAddTraits(.isButton)
                                }
                                .padding(.horizontal, 8)
                                .padding(.vertical, 6)
                                .background(Color.voidBlack)
                            }
                        }
                        .padding(.horizontal, 6)
                        .padding(.bottom, 6)
                    }
                }
                .frame(width: geo.size.width, height: geo.size.height)
                .overlay(
                    Rectangle()
                        .strokeBorder(Color.evaCyan.opacity(0.4), lineWidth: 1)
                )
            }
        }
        .onAppear {
            if cardName == nil && node.id == board.activeStep {
                board.drawNextGuidedCard()
            }
            initializeCardMessages()
        }
    }
    
    private var canSubmit: Bool {
        let hasInput = !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let hasUserMessage = cardMessages.contains(where: { $0.isUser })
        let hasCurrentNote = !currentNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return hasInput || hasUserMessage || hasCurrentNote
    }
    
    private func initializeCardMessages() {
        guard cardMessages.isEmpty, let c = card else { return }
        let promptText = "Node #\(node.id) (\(node.title.uppercased())): [ \(c.name.uppercased()) ]\n\(c.reflectionPrompt)"
        cardMessages.append(ChatMessage(role: .vesper, text: promptText))
        
        if !currentNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            cardMessages.append(ChatMessage(role: .user, text: currentNote))
        }
    }
    
    private func handleInputCommit() {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isClarifying, let c = card else { return }
        
        VesperHapticEngine.shared.triggerTacticalClick()
        cardMessages.append(ChatMessage(role: .user, text: trimmed))
        let userQuestion = trimmed
        inputText = ""
        
        isClarifying = true
        Task {
            let reply = await GeminiClient.shared.clarifyCardPrompt(
                cardName: c.name,
                nodeTitle: node.title,
                cardPrompt: c.reflectionPrompt,
                userQuestion: userQuestion,
                conversationHistory: cardMessages,
                query: board.query,
                apiKey: VesperConfig.geminiAPIKey
            )
            
            cardMessages.append(ChatMessage(role: .vesper, text: reply))
            VesperSpeechSynthesizer.shared.speak(reply)
            isClarifying = false
        }
    }
    
    private func submitReflectionAndAdvance() {
        let trimmedInput = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        var finalAnswer = trimmedInput
        
        if !trimmedInput.isEmpty {
            cardMessages.append(ChatMessage(role: .user, text: trimmedInput))
            inputText = ""
        } else if let lastUser = cardMessages.last(where: { $0.isUser }) {
            finalAnswer = lastUser.text
        } else if !currentNote.isEmpty {
            finalAnswer = currentNote
        } else {
            finalAnswer = "Insight registered."
        }
        
        isSubmitting = true
        VesperHapticEngine.shared.triggerSuccess()
        onSaveNote(finalAnswer)
        
        // Immediately dismiss modal so spread view is revealed without hanging
        onClose()
        
        Task {
            await board.submitCardConversation(
                nodeId: node.id,
                conversation: cardMessages,
                finalAnswer: finalAnswer
            )
            isSubmitting = false
        }
    }
    
    private func elementColor(_ elem: ElementType) -> Color {
        switch elem {
        case .fire: return .magiOrange
        case .water: return .evaCyan
        case .air: return .magiViolet
        case .earth: return .biosGreen
        case .spirit: return .ghostWhite
        }
    }
}

#Preview("Dedicated Reflection Page") {
    NodeFocusModalView(
        node: SpreadNodeDef(id: 1, name: "VECTOR_1", x: 0.5, y: 0.2, title: "Current Vector", description: "Mindset required to approach current situation."),
        cardName: "THE FOOL",
        currentNote: "Resonates with current polarity and shadow integration.",
        onSaveNote: { _ in },
        onRedraw: {},
        onClose: {}
    )
    .environmentObject(BoardStore())
    .preferredColorScheme(.dark)
}


