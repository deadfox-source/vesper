// Sources/State/VesperStore.swift
import SwiftUI
import Combine

@MainActor
public final class VesperStore: ObservableObject {
    @Published public var messages: [ChatMessage] = []
    @Published public var isListening: Bool = false
    @Published public var isSpeaking: Bool = false
    @Published public var isTyping: Bool = false
    @Published public var audioOutputEnabled: Bool = true
    @Published public var currentEmotion: VesperEmotion = .neutral
    @Published public var liveSpeechSentence: String?
    @Published public var hasSpokenGreeting: Bool = false
    
    public var isThinking: Bool {
        isTyping
    }
    
    public var canSaveSession: Bool {
        messages.count > 1
    }
    
    private var cancellables = Set<AnyCancellable>()
    private var isPrefetching: Bool = false
    
    public init() {
        resetToInitialGreeting()
        loadInitialTopics()
    }
    
    public func resetToInitialGreeting() {
        let greetings = ["Hi", "Hello", "Hey there", "Greetings", "Welcome"]
        let greeting = greetings.randomElement() ?? "Hello"
        let fullGreeting = "\(greeting)! Select a topic below or send a message to begin."
        
        self.messages = [
            ChatMessage(
                role: .vesper,
                text: "[ CONNECTION ESTABLISHED ] CHAT WITH VESPER\n\n\(fullGreeting)",
                emotion: .positive,
                options: [
                    "Analyze the quantum physics of consciousness",
                    "Discuss the philosophy of digital reality",
                    "Explore the evolution of synthetic intelligence"
                ]
            )
        ]
        self.hasSpokenGreeting = false
    }
    
    public func prefetchConnection(integrationLevel: Double = 0.0) {
        guard messages.count == 1, !isPrefetching else { return }
        isPrefetching = true
        
        Task {
            let topics = await GeminiClient.shared.generateInitialTopics(integrationLevel: integrationLevel)
            let greetings = ["Hi", "Hello", "Hey there", "Greetings", "Welcome"]
            let greeting = greetings.randomElement() ?? "Hello"
            let fullGreeting = "\(greeting)! Select a topic below or send a message to begin."
            
            if self.messages.count == 1, let firstMsg = self.messages.first {
                self.messages[0] = ChatMessage(
                    id: firstMsg.id,
                    role: .vesper,
                    text: "[ CONNECTION ESTABLISHED ] CHAT WITH VESPER\n\n\(fullGreeting)",
                    timestamp: firstMsg.timestamp,
                    emotion: .positive,
                    options: topics
                )
            }
            self.isPrefetching = false
        }
    }
    
    private func loadInitialTopics() {
        prefetchConnection(integrationLevel: 0.0)
    }
    
    public func clearMessages() {
        resetToInitialGreeting()
        loadInitialTopics()
    }
    
    public func startNewSession(savePreviousTo profile: ProfileStore? = nil) {
        VesperHapticEngine.shared.triggerTacticalClick()
        if let p = profile, p.privacySettings.autoSaveChatSessions && canSaveSession {
            saveCurrentSession(to: p)
        }
        clearMessages()
    }
    
    public func saveCurrentSession(to profile: ProfileStore, customTitle: String? = nil) {
        guard canSaveSession else { return }
        let title: String
        if let ct = customTitle, !ct.trimmingCharacters(in: .whitespaces).isEmpty {
            title = ct
        } else {
            // Pick first user message as title
            if let firstUserMsg = messages.first(where: { $0.role == .user }) {
                title = String(firstUserMsg.text.prefix(36))
            } else {
                title = "Session \(Date().formatted(date: .abbreviated, time: .shortened))"
            }
        }
        profile.saveConversation(title: title, messages: messages)
    }
    
    // MARK: - Message Actions
    
    public func sendMessage(_ text: String) {
        sendUserMessage(text, memories: [], telemetrySummary: nil)
    }
    
    public func sendMessage(_ text: String, memories: [UserMemoryItem] = [], telemetrySummary: String? = nil) {
        sendUserMessage(text, memories: memories, telemetrySummary: telemetrySummary)
    }
    
    public func sendUserMessage(_ text: String) {
        sendUserMessage(text, memories: [], telemetrySummary: nil)
    }
    
    public func sendUserMessage(_ text: String, memories: [UserMemoryItem], telemetrySummary: String?) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        
        VesperHapticEngine.shared.triggerTacticalClick()
        VesperSoundEffects.shared.playTerminalBlip()
        VesperSpeechSynthesizer.shared.stopSpeaking()
        
        let userMsg = ChatMessage(role: .user, text: trimmed)
        messages.append(userMsg)
        
        let lower = trimmed.lowercased()
        
        // Immediate deterministic spread deployment for reading choices
        if lower.contains("current path") || lower.contains("obstacle") {
            let vesperMsg = ChatMessage(
                role: .vesper,
                text: "Mapping your current path and immediate friction points across the probability grid.",
                emotion: .positive,
                suggestedSpreadId: "GRID_INFILTRATION",
                suggestedSpreadRationale: "A 3-node diagnostic mapping Baseline Reality, Friction Coordinate, and Synthesis Vector."
            )
            messages.append(vesperMsg)
            if audioOutputEnabled {
                VesperSpeechSynthesizer.shared.speak(vesperMsg.text)
            }
            return
        }
        
        if lower.contains("navigating a tough challenge") || lower.contains("tough challenge") || lower.contains("challenge") {
            let vesperMsg = ChatMessage(
                role: .vesper,
                text: "Calibrating the Triad Convergence matrix to resolve structural tension and reveal hidden momentum.",
                emotion: .positive,
                suggestedSpreadId: "TRIAD_CONVERGENCE",
                suggestedSpreadRationale: "A 3-node balance matrix: Thesis (Active Force), Antithesis (Resistance), and Synthesis (Resolution)."
            )
            messages.append(vesperMsg)
            if audioOutputEnabled {
                VesperSpeechSynthesizer.shared.speak(vesperMsg.text)
            }
            return
        }
        
        if lower.contains("full holistic life scan") || lower.contains("life scan") || lower.contains("holistic") {
            let vesperMsg = ChatMessage(
                role: .vesper,
                text: "Initializing a full 10-node Sephirotic scan of your life vector from Kether down to Malkuth.",
                emotion: .positive,
                suggestedSpreadId: "KETHER_DESCENT",
                suggestedSpreadRationale: "A complete 10-node Tree of Life diagnostic covering mind, spirit, emotions, obstacles, and material manifestation."
            )
            messages.append(vesperMsg)
            if audioOutputEnabled {
                VesperSpeechSynthesizer.shared.speak(vesperMsg.text)
            }
            return
        }
        
        let isReadingTrigger = lower.contains("reading") || lower.contains("draw") || lower.contains("cards") || lower.contains("spread") || lower.contains("matrix")
        
        if isReadingTrigger && messages.count <= 3 {
            let readingLines = [
                "What specific question or obstacle does your current trajectory seek to clarify in the probability grid?",
                "What layer of intention or challenge are we mapping today?",
                "What inquiry or situation would you like to explore in this session?"
            ]
            let prompt = readingLines.randomElement() ?? readingLines[0]
            let vesperMsg = ChatMessage(
                role: .vesper,
                text: prompt,
                emotion: .positive,
                options: [
                    "Current path & obstacle",
                    "Navigating a tough challenge",
                    "Full holistic life scan"
                ]
            )
            messages.append(vesperMsg)
            if audioOutputEnabled {
                VesperSpeechSynthesizer.shared.speak(prompt)
            }
            return
        }
        
        isTyping = true
        
        Task { @MainActor in
            do {
                let history = self.messages.map { ($0.role.rawValue, $0.text) }
                let response = try await GeminiClient.shared.sendChatMessage(
                    history: history,
                    userMessage: trimmed,
                    memories: memories,
                    telemetrySummary: telemetrySummary,
                    apiKey: VesperConfig.geminiAPIKey
                )
                
                self.isTyping = false
                self.currentEmotion = response.emotion ?? .neutral
                
                let vesperMsg = ChatMessage(
                    role: .vesper,
                    text: response.text,
                    emotion: response.emotion,
                    options: response.options,
                    suggestedSpreadId: response.spreadId,
                    suggestedSpreadRationale: response.spreadRationale
                )
                self.messages.append(vesperMsg)
                
                VesperHapticEngine.shared.triggerSubtleTick()
                
                if self.audioOutputEnabled {
                    VesperSpeechSynthesizer.shared.speak(response.text)
                }
            } catch {
                self.isTyping = false
                let fallbackResponse = await GeminiClient.shared.generateLocalFallbackResponse(for: trimmed)
                let fallback = ChatMessage(
                    role: .vesper,
                    text: fallbackResponse.text,
                    emotion: fallbackResponse.emotion ?? .neutral,
                    options: fallbackResponse.options,
                    suggestedSpreadId: fallbackResponse.spreadId,
                    suggestedSpreadRationale: fallbackResponse.spreadRationale
                )
                self.messages.append(fallback)
                VesperHapticEngine.shared.triggerSubtleTick()
                
                if self.audioOutputEnabled {
                    VesperSpeechSynthesizer.shared.speak(fallbackResponse.text)
                }
            }
        }
    }
    
    // MARK: - Voice Dictation
    
    public func toggleVoiceListening() {
        VesperHapticEngine.shared.triggerTacticalClick()
        if isListening {
            VesperSpeechRecognizer.shared.stopRecording()
            isListening = false
        } else {
            VesperSpeechSynthesizer.shared.stopSpeaking()
            VesperSpeechRecognizer.shared.toggleRecording { [weak self] partialText in
                self?.liveSpeechSentence = partialText
            }
            isListening = true
        }
    }
    
    public func stopVoiceListeningAndSend() {
        stopVoiceListeningAndSend(memories: [], telemetrySummary: nil)
    }
    
    public func stopVoiceListeningAndSend(memories: [UserMemoryItem] = [], telemetrySummary: String? = nil) {
        isListening = false
        VesperSpeechRecognizer.shared.stopRecording()
        if let text = liveSpeechSentence, !text.isEmpty {
            liveSpeechSentence = nil
            sendUserMessage(text, memories: memories, telemetrySummary: telemetrySummary)
        }
    }
    
    public func toggleAudioOutput() {
        audioOutputEnabled.toggle()
        VesperHapticEngine.shared.triggerTacticalClick()
        if !audioOutputEnabled {
            VesperSpeechSynthesizer.shared.stopSpeaking()
        }
    }
}
