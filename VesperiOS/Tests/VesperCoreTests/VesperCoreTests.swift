// Tests/VesperCoreTests/VesperCoreTests.swift
import XCTest
import SwiftUI
@testable import VesperCore

@MainActor
final class VesperCoreTests: XCTestCase {
    
    func testTarotDeckCompleteness() {
        // Assert complete 78 cards exist
        XCTAssertEqual(TarotDeck.cards.count, 78, "Tarot deck must contain exactly 78 cards.")
        
        // Assert Major Arcana cards exist
        let fool = TarotDeck.getCard(named: "THE FOOL")
        XCTAssertNotNil(fool)
        XCTAssertEqual(fool?.element, .air)
        
        let tower = TarotDeck.getCard(named: "THE TOWER")
        XCTAssertNotNil(tower)
        XCTAssertEqual(tower?.element, .fire)
    }
    
    func testSpreadLibraryConfigs() {
        XCTAssertNotNil(SpreadLibrary.map["GRID_MACRO_SYSTEM"])
        XCTAssertEqual(SpreadLibrary.macroSystem.nodes.count, 10)
        
        XCTAssertNotNil(SpreadLibrary.map["GRID_INFILTRATION"])
        XCTAssertEqual(SpreadLibrary.infiltration.nodes.count, 3)
        
        XCTAssertNotNil(SpreadLibrary.map["GRID_EXFILTRATION"])
        XCTAssertEqual(SpreadLibrary.exfiltration.nodes.count, 5)
    }
    
    func testIndividuationMatrixCalculation() {
        let entries = [
            JournalEntry(cardName: "THE FOOL", reflectionPrompt: "", userReflection: ""),     // AIR -> Anima
            JournalEntry(cardName: "THE TOWER", reflectionPrompt: "", userReflection: ""),    // FIRE -> Persona
            JournalEntry(cardName: "DEATH", reflectionPrompt: "", userReflection: ""),        // WATER -> Shadow
            JournalEntry(cardName: "THE EMPRESS", reflectionPrompt: "", userReflection: "")   // EARTH -> Self
        ]
        
        let matrix = IndividuationMatrix.calculate(from: entries)
        XCTAssertEqual(matrix.persona, 25)
        XCTAssertEqual(matrix.shadow, 25)
        XCTAssertEqual(matrix.anima, 25)
        XCTAssertEqual(matrix.selfActualization, 25)
    }
    
    func testSynthesisEngineLocal() {
        let nodes: [Int: String] = [
            1: "THE FOOL",     // AIR
            2: "THE MAGICIAN", // AIR
            3: "ACE OF WANDS"  // FIRE
        ]
        
        let report = SynthesisEngine.generateLocalSynthesis(
            nodes: nodes,
            spreadId: "GRID_INFILTRATION",
            query: "Test Query",
            weather: nil,
            spaceWeather: nil,
            batteryLevel: 0.90
        )
        
        XCTAssertEqual(report.dominantElement, .air)
        XCTAssertFalse(report.isStormFrictionApplied)
        XCTAssertFalse(report.tacticalDirectives.isEmpty)
    }
    
    func testBoardStoreGuidedOperations() {
        let board = BoardStore()
        board.selectSpread(id: "GRID_INFILTRATION", query: "Parity Test")
        
        XCTAssertEqual(board.activeStep, 1)
        XCTAssertFalse(board.isComplete)
        XCTAssertEqual(board.readingMessages.count, 1)
        
        board.drawNextGuidedCard()
        XCTAssertNotNil(board.nodes[1])
        XCTAssertEqual(board.readingMessages.count, 2)
    }
    
    func testProfileStoreSavedConversations() {
        let profile = ProfileStore()
        let convo = SavedConversation(
            title: "Archival Test",
            messages: [
                SavedConversationMessage(role: .user, text: "Initial query", timestamp: "12:00:00"),
                SavedConversationMessage(role: .vesper, text: "Directive received", timestamp: "12:00:01")
            ]
        )
        
        profile.saveConversation(convo)
        XCTAssertTrue(profile.savedConversations.contains(where: { $0.id == convo.id }))
        
        profile.deleteConversation(id: convo.id)
        XCTAssertFalse(profile.savedConversations.contains(where: { $0.id == convo.id }))
    }
    
    func testGreetingOnlySpeaksOncePerSession() {
        let store = VesperStore()
        
        // Initial state before greeting is spoken
        XCTAssertFalse(store.hasSpokenGreeting)
        XCTAssertEqual(store.messages.count, 1)
        XCTAssertTrue(store.messages.first?.text.contains("CHAT WITH VESPER") ?? false)
        
        // Simulate speaking greeting on session start
        store.hasSpokenGreeting = true
        
        // Simulate switching tabs (NavigationStore change)
        let nav = NavigationStore()
        nav.navigate(to: .tabletop)
        XCTAssertEqual(nav.currentScreen, .tabletop)
        
        // Returning to home tab
        nav.navigate(to: .home)
        XCTAssertEqual(nav.currentScreen, .home)
        
        // State remains true so greeting will not re-trigger
        XCTAssertTrue(store.hasSpokenGreeting)
    }
    
    func testAudioOutputToggle() {
        let store = VesperStore()
        XCTAssertTrue(store.audioOutputEnabled)
        
        store.toggleAudioOutput()
        XCTAssertFalse(store.audioOutputEnabled)
        
        store.toggleAudioOutput()
        XCTAssertTrue(store.audioOutputEnabled)
    }
    
    func testPrefetchConnectionFormatting() async {
        let store = VesperStore()
        XCTAssertEqual(store.messages.count, 1)
        
        let initialMsg = store.messages.first?.text ?? ""
        XCTAssertTrue(initialMsg.hasPrefix("[ CONNECTION ESTABLISHED ] CHAT WITH VESPER"))
        
        // Test clearMessages resets properly
        store.hasSpokenGreeting = true
        store.clearMessages()
        XCTAssertFalse(store.hasSpokenGreeting)
        XCTAssertEqual(store.messages.count, 1)
    }
    
    func testTerminalInputFieldThemeAccents() {
        var textValue = "Sample input"
        let inputField = VesperTerminalInputField(
            placeholder: "Enter prompt",
            text: Binding(get: { textValue }, set: { textValue = $0 }),
            accentColor: .evaCyan,
            onCommit: {}
        )
        
        XCTAssertEqual(inputField.placeholder, "Enter prompt")
        XCTAssertEqual(inputField.accentColor, .evaCyan)
    }
    
    func testSquareAsciiArtGeneration() {
        let foolArt = VesperAsciiArt.getArtOnly(forCard: "THE FOOL", element: .air)
        XCTAssertFalse(foolArt.isEmpty)
        XCTAssertFalse(foolArt.contains("+---+"))
        
        let cupsArt = VesperAsciiArt.getArtOnly(forCard: "TEN OF CUPS", element: .water)
        XCTAssertFalse(cupsArt.isEmpty)
        
        let fallbackArt = VesperAsciiArt.getArtOnly(forCard: "UNKNOWN_CUSTOM", element: .fire)
        XCTAssertFalse(fallbackArt.isEmpty)
    }
    
    func testUserMemoryManagementAndToggling() {
        let profile = ProfileStore()
        let initialCount = profile.userMemories.count
        
        profile.addMemory(key: "Test Directive", detail: "Always test thoroughly", source: .manual)
        XCTAssertEqual(profile.userMemories.count, initialCount + 1)
        
        guard let memory = profile.userMemories.first(where: { $0.key == "Test Directive" }) else {
            XCTFail("Created memory should exist in profile.")
            return
        }
        
        XCTAssertTrue(memory.isEnabled)
        profile.toggleMemory(id: memory.id)
        XCTAssertFalse(profile.userMemories.first(where: { $0.id == memory.id })?.isEnabled ?? true)
        
        profile.updateMemory(id: memory.id, key: "Updated Directive", detail: "New detail")
        XCTAssertEqual(profile.userMemories.first(where: { $0.id == memory.id })?.key, "Updated Directive")
        
        profile.deleteMemory(id: memory.id)
        XCTAssertFalse(profile.userMemories.contains(where: { $0.id == memory.id }))
    }
    
    func testMemoryPrivacySettingsGovernance() {
        let profile = ProfileStore()
        profile.addMemory(key: "Privacy Test", detail: "Active test detail")
        
        // When memory retention is disabled, activeMemories returns empty
        profile.updatePrivacySettings(MemoryPrivacySettings(isMemoryRetentionEnabled: false))
        XCTAssertEqual(profile.activeMemories.count, 0)
        
        // When memory retention is re-enabled, enabled memories are active
        profile.updatePrivacySettings(MemoryPrivacySettings(isMemoryRetentionEnabled: true))
        XCTAssertTrue(profile.activeMemories.count > 0)
    }
    
    func testIndividuationMatrixMultiSourceCalculation() {
        let entries = [
            JournalEntry(cardName: "THE FOOL", reflectionPrompt: "", userReflection: "") // AIR (Anima)
        ]
        let readings = [
            ReadingRecord(
                spreadId: "GRID_INFILTRATION",
                spreadName: "INFILTRATION",
                query: "Test",
                nodes: [1: "THE TOWER", 2: "DEATH", 3: "THE EMPRESS"], // FIRE, WATER, EARTH
                synthesisReport: nil
            )
        ]
        
        let matrix = IndividuationMatrix.calculate(from: entries, readings: readings)
        XCTAssertEqual(matrix.persona, 25)
        XCTAssertEqual(matrix.shadow, 25)
        XCTAssertEqual(matrix.anima, 25)
        XCTAssertEqual(matrix.selfActualization, 25)
    }
    
    func testProfilePurgeAllData() {
        let profile = ProfileStore()
        profile.addJournalEntry(cardName: "THE FOOL", prompt: "Test", reflection: "Test")
        profile.addMemory(key: "Purge Test", detail: "To be wiped")
        
        profile.purgeAllProfileData()
        XCTAssertTrue(profile.savedReadings.isEmpty)
        XCTAssertTrue(profile.journalEntries.isEmpty)
        XCTAssertTrue(profile.savedConversations.isEmpty)
        XCTAssertTrue(profile.userMemories.isEmpty)
    }
    
    func testChatMessageRoleAndFormattingDistinctions() {
        let systemMsg = ChatMessage(role: .system, text: "[ CONNECTION ESTABLISHED ] CHAT WITH VESPER")
        let userMsg = ChatMessage(role: .user, text: "What is the shadow?")
        let vesperMsg = ChatMessage(
            role: .vesper,
            text: "Mapping your current path.",
            options: ["Explore unconscious", "Analyze tension"],
            suggestedSpreadId: "GRID_INFILTRATION",
            suggestedSpreadRationale: "3-node diagnostic"
        )
        
        XCTAssertEqual(systemMsg.role, .system)
        XCTAssertTrue(userMsg.isUser)
        XCTAssertFalse(vesperMsg.isUser)
        XCTAssertEqual(vesperMsg.options?.count, 2)
        XCTAssertEqual(vesperMsg.suggestedSpreadId, "GRID_INFILTRATION")
    }
    
    func testLiveGeminiClientConnection() async throws {
        let response = try await GeminiClient.shared.sendChatMessage(
            history: [("model", "Hey there! Feels like a good signal today.")],
            userMessage: "How are you?",
            memories: [],
            telemetrySummary: nil,
            apiKey: VesperConfig.geminiAPIKey
        )
        print("🟢 LIVE GEMINI RESPONSE TEXT: [\(response.text)]")
        print("🟢 LIVE GEMINI RESPONSE EMOTION: [\(String(describing: response.emotion))]")
        print("🟢 LIVE GEMINI RESPONSE OPTIONS: [\(String(describing: response.options))]")
        XCTAssertFalse(response.text.isEmpty)
        XCTAssertNotEqual(response.text, "{")
    }
    
    @MainActor
    func testVesperStoreFullUserInteractionLoop() async throws {
        let store = VesperStore()
        XCTAssertEqual(store.messages.count, 1)
        
        // Disable audio for fast testing
        store.audioOutputEnabled = false
        
        store.sendUserMessage("Hello Vesper, how are you?")
        XCTAssertEqual(store.messages.count, 2)
        XCTAssertEqual(store.messages[1].role, .user)
        XCTAssertEqual(store.messages[1].text, "Hello Vesper, how are you?")
        
        // Wait up to 10 seconds for background Task to append Vesper response
        var waitCount = 0
        while store.messages.count < 3 && waitCount < 100 {
            try await Task.sleep(nanoseconds: 100_000_000)
            waitCount += 1
        }
        
        XCTAssertEqual(store.messages.count, 3)
        if store.messages.count >= 3 {
            let vesperReply = store.messages[2]
            XCTAssertEqual(vesperReply.role, .vesper)
            XCTAssertFalse(vesperReply.text.isEmpty)
            XCTAssertFalse(vesperReply.text.hasPrefix("{"))
            print("🟢 STORE TEST COMPLETED: Vesper responded with: [\(vesperReply.text)]")
        }
    }
    
    @MainActor
    func testSubmitCardConversationFullForwarding() async throws {
        let board = BoardStore()
        board.selectSpread(id: "GRID_INFILTRATION", query: "Career path")
        board.setCard(forNodeId: 1, cardName: "THE FOOL")
        
        let cardConversation: [ChatMessage] = [
            ChatMessage(role: .vesper, text: "Node #1 (Current Vector): [ THE FOOL ]\nWhat bold, unconventional path calls to you?"),
            ChatMessage(role: .user, text: "What does unconventional mean here?"),
            ChatMessage(role: .vesper, text: "It means breaking from typical conventions."),
            ChatMessage(role: .user, text: "I want to launch my autonomous startup.")
        ]
        
        await board.submitCardConversation(
            nodeId: 1,
            conversation: cardConversation,
            finalAnswer: "I want to launch my autonomous startup."
        )
        
        XCTAssertEqual(board.cardNotes[1], "I want to launch my autonomous startup.")
        
        // Verify all 4 messages from cardConversation are present in readingMessages in order
        let readingTexts = board.readingMessages.map { $0.text }
        XCTAssertTrue(readingTexts.contains(where: { $0.contains("What does unconventional mean here?") }))
        XCTAssertTrue(readingTexts.contains(where: { $0.contains("It means breaking from typical conventions.") }))
        XCTAssertTrue(readingTexts.contains(where: { $0.contains("I want to launch my autonomous startup.") }))
        
        // And verify Vesper's transition is appended
        XCTAssertTrue(board.readingMessages.count >= 5)
    }
    
    func testClarifyCardPrompt() async throws {
        let reply = await GeminiClient.shared.clarifyCardPrompt(
            cardName: "THE FOOL",
            nodeTitle: "Current Vector",
            cardPrompt: "What bold, unconventional path calls to you?",
            userQuestion: "Can you explain this simply?",
            conversationHistory: []
        )
        XCTAssertFalse(reply.isEmpty)
        XCTAssertFalse(reply.hasPrefix("{"))
    }
    
    @MainActor
    func testTelemetryMotionAndTapTriggers() {
        let telemetry = TelemetryStore()
        XCTAssertEqual(telemetry.tapPulseTrigger, 0)
        XCTAssertEqual(telemetry.shakeGlitchTrigger, 0)
        
        telemetry.triggerVesperTap()
        XCTAssertEqual(telemetry.tapPulseTrigger, 1)
        
        telemetry.triggerVesperTap()
        XCTAssertEqual(telemetry.tapPulseTrigger, 2)
    }
    
    @MainActor
    func testVesperTapPresencePing() {
        let vesper = VesperStore()
        let initialCount = vesper.messages.count
        
        vesper.pingOperatorPresence()
        XCTAssertEqual(vesper.messages.count, initialCount + 1)
        
        let lastMsg = vesper.messages.last
        XCTAssertNotNil(lastMsg)
        XCTAssertEqual(lastMsg?.role, .vesper)
        XCTAssertTrue(lastMsg?.text.contains("TACTILE LINK") == true)
        XCTAssertNotNil(lastMsg?.options)
        XCTAssertFalse(lastMsg?.options?.isEmpty ?? true)
    }
}

