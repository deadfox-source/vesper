// Sources/State/BoardStore.swift
import SwiftUI
import Combine

@MainActor
public final class BoardStore: ObservableObject {
    @Published public var activeSpreadId: String = "GRID_INFILTRATION"
    @Published public var nodes: [Int: String] = [:]
    @Published public var cardNotes: [Int: String] = [:]
    @Published public var activeStep: Int = 1
    @Published public var isGuidedMode: Bool = true
    @Published public var query: String = ""
    @Published public var isSynthesisActive: Bool = false
    @Published public var isFullReportReady: Bool = false
    @Published public var synthesisReport: SynthesisReport?
    @Published public var focusedNodeId: Int?
    @Published public var isSynthesizingAI: Bool = false
    
    // Conversational Guided Reading Flow
    @Published public var readingMessages: [ChatMessage] = []
    @Published public var isAwaitingTap: Bool = false
    @Published public var introSpoken: Bool = false
    @Published public var isAwaitingSynthesisConfirm: Bool = false
    @Published public var preSynthesisChat: [ChatMessage] = []
    @Published public var isProcessingReflection: Bool = false
    
    public var activeSpread: SpreadConfig {
        SpreadLibrary.map[activeSpreadId] ?? SpreadLibrary.infiltration
    }
    
    public var isComplete: Bool {
        nodes.count == activeSpread.nodes.count
    }
    
    public init() {}
    
    // MARK: - Spread Operations & Guided Flow
    
    public func selectSpread(id: String, query: String = "") {
        VesperHapticEngine.shared.triggerTacticalClick()
        self.activeSpreadId = id
        self.query = query
        self.nodes = [:]
        self.cardNotes = [:]
        self.activeStep = 1
        self.synthesisReport = nil
        self.isFullReportReady = false
        self.isSynthesisActive = false
        self.introSpoken = false
        self.isAwaitingTap = false
        self.isAwaitingSynthesisConfirm = false
        self.preSynthesisChat = []
        self.readingMessages = [
            ChatMessage(
                role: .vesper,
                text: "[ READING PROTOCOL INITIALIZED ] Awaiting quantum coordinate initialization..."
            )
        ]
    }
    
    public func startGuidedSession() {
        guard !introSpoken else { return }
        introSpoken = true
        let introLine = isGuidedMode
            ? "Tap the illuminated node to collapse the probability matrix and draw your first card."
            : "Tap the illuminated node to focus your intent and select your first card."
        
        readingMessages.append(ChatMessage(role: .vesper, text: introLine))
        VesperSpeechSynthesizer.shared.speak(introLine)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.isAwaitingTap = true
        }
    }
    
    public func drawNextGuidedCard() {
        guard nodes[activeStep] == nil else { return }
        
        let assignedSet = Set(nodes.values)
        let availableCards = TarotDeck.cards.filter { !assignedSet.contains($0.name.uppercased()) }
        guard let picked = availableCards.randomElement() else { return }
        
        VesperHapticEngine.shared.triggerCardDrawn()
        VesperSoundEffects.shared.playCardDraw()
        
        let cardName = picked.name.uppercased()
        nodes[activeStep] = cardName
        isAwaitingTap = false
        
        let nodeTitle = activeSpread.nodes.first(where: { $0.id == activeStep })?.title ?? "Node \(activeStep)"
        let spokenLine = "You've drawn \(picked.name) for \(nodeTitle). \(picked.reflectionPrompt)"
        let displayLine = "Node #\(activeStep) (\(nodeTitle)): [ \(cardName) ]\n\(picked.reflectionPrompt)"
        
        readingMessages.append(ChatMessage(role: .vesper, text: displayLine))
        VesperSpeechSynthesizer.shared.speak(spokenLine)
    }
    
    public func submitNodeReflection(userText: String) async {
        let trimmed = userText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let msg = ChatMessage(role: .user, text: trimmed)
        await submitCardConversation(nodeId: activeStep, conversation: [msg], finalAnswer: trimmed)
    }
    
    public func submitCardConversation(nodeId: Int, conversation: [ChatMessage], finalAnswer: String) async {
        let trimmed = finalAnswer.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !isProcessingReflection else { return }
        guard let cardName = nodes[nodeId] else { return }
        
        isProcessingReflection = true
        VesperHapticEngine.shared.triggerTacticalClick()
        VesperSoundEffects.shared.playTerminalBlip()
        
        cardNotes[nodeId] = trimmed.isEmpty ? "Reflection registered." : trimmed
        
        // Find existing node prompt in readingMessages if present, and replace with full conversation
        let nodePrefix = "Node #\(nodeId)"
        if let existingIdx = readingMessages.firstIndex(where: { $0.text.hasPrefix(nodePrefix) }) {
            readingMessages.remove(at: existingIdx)
            for (idx, msg) in conversation.enumerated() {
                readingMessages.insert(msg, at: existingIdx + idx)
            }
        } else {
            readingMessages.append(contentsOf: conversation)
        }
        
        let nodeTitle = activeSpread.nodes.first(where: { $0.id == nodeId })?.title ?? "Node \(nodeId)"
        let lastVesperPrompt = conversation.last(where: { !$0.isUser })?.text ?? ""
        let isLastNode = nodeId >= activeSpread.nodes.count
        let textToAnalyze = trimmed.isEmpty ? (conversation.last(where: { $0.isUser })?.text ?? "Insight integrated.") : trimmed
        
        let analysis = await GeminiClient.shared.analyzeCardReflection(
            userText: textToAnalyze,
            cardName: cardName,
            nodeIndex: nodeId,
            nodeTitle: nodeTitle,
            lastVesperPrompt: lastVesperPrompt,
            isLastNode: isLastNode,
            query: query,
            apiKey: VesperConfig.geminiAPIKey
        )
        
        var responseText = analysis.text
        
        if !isLastNode {
            let nextStepIndex = nodeId + 1
            let nextTitle = activeSpread.nodes.first(where: { $0.id == nextStepIndex })?.title ?? "Node \(nextStepIndex)"
            let nextPrompt = "Tap the illuminated node to draw your card for \(nextTitle)."
            responseText += "\n\n" + nextPrompt
        } else {
            let synthesisPrompt = "All nodes in the spread are complete. Are you ready to compile the full synthesis report?"
            responseText += "\n\n" + synthesisPrompt
        }
        
        readingMessages.append(ChatMessage(role: .vesper, text: responseText))
        VesperSpeechSynthesizer.shared.speak(responseText)
        
        advanceGuidedStep()
        isProcessingReflection = false
    }
    
    public func advanceGuidedStep() {
        if activeStep < activeSpread.nodes.count {
            activeStep += 1
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
                self?.isAwaitingTap = true
            }
        } else {
            // Spread complete
            isFullReportReady = true
            isAwaitingSynthesisConfirm = true
            preSynthesisChat = readingMessages
            VesperHapticEngine.shared.playHeartbeatPulse()
        }
    }
    
    public func drawNextCard() {
        drawNextGuidedCard()
    }
    
    public func setCard(forNodeId id: Int, cardName: String) {
        VesperHapticEngine.shared.triggerCardDrawn()
        VesperSoundEffects.shared.playCardDraw()
        nodes[id] = cardName.uppercased()
        focusedNodeId = id
        if id == activeStep {
            advanceGuidedStep()
        }
    }
    
    public func removeCard(forNodeId id: Int) {
        VesperHapticEngine.shared.triggerTacticalClick()
        nodes.removeValue(forKey: id)
        activeStep = id
        synthesisReport = nil
        isFullReportReady = false
        isAwaitingSynthesisConfirm = false
    }
    
    public func setNote(forNodeId id: Int, note: String) {
        cardNotes[id] = note
    }
    
    public func resetBoard() {
        VesperHapticEngine.shared.triggerTacticalClick()
        nodes.removeAll()
        cardNotes.removeAll()
        activeStep = 1
        synthesisReport = nil
        isFullReportReady = false
        isSynthesisActive = false
        introSpoken = false
        isAwaitingTap = false
        isAwaitingSynthesisConfirm = false
        readingMessages.removeAll()
        preSynthesisChat.removeAll()
    }
    
    // MARK: - Synthesis Execution
    
    public func executeSynthesis(weather: WeatherData?, spaceWeather: SpaceWeatherData?, batteryLevel: Float?) {
        guard isComplete else { return }
        
        isSynthesisActive = true
        VesperHapticEngine.shared.playHeartbeatPulse()
        VesperSoundEffects.shared.playGlitchSweep()
        
        // 1. Generate local deterministic synthesis
        let localReport = SynthesisEngine.generateLocalSynthesis(
            nodes: nodes,
            spreadId: activeSpreadId,
            query: query,
            weather: weather,
            spaceWeather: spaceWeather,
            batteryLevel: batteryLevel
        )
        self.synthesisReport = localReport
        self.isFullReportReady = true
        
        // 2. Request AI Oracle interpretation in background
        isSynthesizingAI = true
        Task {
            var nodeMap: [String: String] = [:]
            for (k, v) in self.nodes {
                nodeMap["Node_\(k)"] = v
            }
            
            let aiOutput = await GeminiClient.shared.generateOracleSynthesis(
                spreadName: self.activeSpread.name,
                query: self.query,
                nodes: nodeMap,
                dignitySummary: localReport.gridSummary,
                apiKey: VesperConfig.geminiAPIKey
            )
            
            self.isSynthesizingAI = false
            self.synthesisReport = SynthesisReport(
                timestamp: localReport.timestamp,
                spreadName: localReport.spreadName,
                elements: localReport.elements,
                dominantElement: localReport.dominantElement,
                gridSummary: localReport.gridSummary,
                tacticalDirectives: localReport.tacticalDirectives,
                triadAnalysis: localReport.triadAnalysis,
                isStormFrictionApplied: localReport.isStormFrictionApplied,
                spokenConcise: aiOutput.spokenConcise,
                inquiryTheme: aiOutput.inquiryTheme,
                finalOutcome: aiOutput.finalOutcome
            )
            
            VesperSoundEffects.shared.playSynthesisComplete()
            VesperHapticEngine.shared.triggerSuccess()
            
            if !aiOutput.spokenConcise.isEmpty {
                VesperSpeechSynthesizer.shared.speak(aiOutput.spokenConcise)
            }
        }
    }
}

