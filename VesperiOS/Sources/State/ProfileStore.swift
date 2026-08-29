// Sources/State/ProfileStore.swift
import SwiftUI
import Combine

@MainActor
public final class ProfileStore: ObservableObject {
    @Published public var savedReadings: [ReadingRecord] = []
    @Published public var journalEntries: [JournalEntry] = []
    @Published public var savedConversations: [SavedConversation] = []
    @Published public var userMemories: [UserMemoryItem] = []
    @Published public var privacySettings: MemoryPrivacySettings = MemoryPrivacySettings()
    @Published public var individuationMatrix: IndividuationMatrix = IndividuationMatrix()
    
    public var savedRecords: [ReadingRecord] {
        savedReadings
    }
    
    public var matrix: IndividuationMatrix {
        individuationMatrix
    }
    
    public var activeMemories: [UserMemoryItem] {
        guard privacySettings.isMemoryRetentionEnabled else { return [] }
        return userMemories.filter { $0.isEnabled }
    }
    
    private let readingsKey = "VESPER_SAVED_READINGS"
    private let journalKey = "VESPER_JOURNAL_ENTRIES"
    private let conversationsKey = "VESPER_SAVED_CONVERSATIONS"
    private let memoriesKey = "VESPER_USER_MEMORIES"
    private let privacyKey = "VESPER_PRIVACY_SETTINGS"
    
    public init() {
        loadData()
        recalculateMatrix()
    }
    
    // MARK: - Persistence
    
    private func loadData() {
        // 1. Saved Readings
        if let data = UserDefaults.standard.data(forKey: readingsKey),
           let decoded = try? JSONDecoder().decode([ReadingRecord].self, from: data) {
            self.savedReadings = decoded
        }
        
        // 2. Journal Entries
        if let data = UserDefaults.standard.data(forKey: journalKey),
           let decoded = try? JSONDecoder().decode([JournalEntry].self, from: data) {
            self.journalEntries = decoded
        } else {
            // Seed initial journal entries for demo
            self.journalEntries = [
                JournalEntry(
                    cardName: "THE FOOL",
                    reflectionPrompt: "What immediate leap of faith is your current mindset resisting?",
                    userReflection: "Transitioning to native iOS architecture. Overcoming initial inertia.",
                    category: "INITIALIZATION"
                ),
                JournalEntry(
                    cardName: "THE MAGICIAN",
                    reflectionPrompt: "What specific tool or asset are you failing to fully leverage?",
                    userReflection: "Integrating CoreHaptics and on-device neural speech for tactile presence.",
                    category: "RECONNAISSANCE"
                )
            ]
            saveJournal()
        }
        
        // 3. Saved Conversations
        if let data = UserDefaults.standard.data(forKey: conversationsKey),
           let decoded = try? JSONDecoder().decode([SavedConversation].self, from: data) {
            self.savedConversations = decoded
        }
        
        // 4. Privacy Settings
        if let data = UserDefaults.standard.data(forKey: privacyKey),
           let decoded = try? JSONDecoder().decode(MemoryPrivacySettings.self, from: data) {
            self.privacySettings = decoded
        }
        
        // 5. User Memories / Insights Vault
        if let data = UserDefaults.standard.data(forKey: memoriesKey),
           let decoded = try? JSONDecoder().decode([UserMemoryItem].self, from: data) {
            self.userMemories = decoded
        } else {
            // Seed initial archetype baseline memory
            self.userMemories = [
                UserMemoryItem(
                    key: "Core Vector Alignment",
                    detail: "Focusing on architectural mastery, high-contrast visual precision, and sensory haptic synthesis.",
                    source: .manual,
                    isEnabled: true
                ),
                UserMemoryItem(
                    key: "Observed Archetype Resonance",
                    detail: "Frequent resonance with The Magician and The Fool—transitioning from conception to material execution.",
                    source: .dailyLog,
                    isEnabled: true
                )
            ]
            saveMemories()
        }
    }
    
    private func saveReadings() {
        if let data = try? JSONEncoder().encode(savedReadings) {
            UserDefaults.standard.set(data, forKey: readingsKey)
        }
    }
    
    private func saveJournal() {
        if let data = try? JSONEncoder().encode(journalEntries) {
            UserDefaults.standard.set(data, forKey: journalKey)
        }
    }
    
    private func saveConversations() {
        if let data = try? JSONEncoder().encode(savedConversations) {
            UserDefaults.standard.set(data, forKey: conversationsKey)
        }
    }
    
    public func saveMemories() {
        if let data = try? JSONEncoder().encode(userMemories) {
            UserDefaults.standard.set(data, forKey: memoriesKey)
        }
    }
    
    public func savePrivacySettings() {
        if let data = try? JSONEncoder().encode(privacySettings) {
            UserDefaults.standard.set(data, forKey: privacyKey)
        }
    }
    
    // MARK: - Memory Governance Actions
    
    public func addMemory(key: String, detail: String, source: MemorySource = .manual) {
        guard privacySettings.isMemoryRetentionEnabled else { return }
        VesperHapticEngine.shared.triggerSuccess()
        let memory = UserMemoryItem(key: key, detail: detail, source: source, isEnabled: true)
        userMemories.insert(memory, at: 0)
        saveMemories()
    }
    
    public func updateMemory(id: String, key: String, detail: String) {
        if let idx = userMemories.firstIndex(where: { $0.id == id }) {
            userMemories[idx].key = key
            userMemories[idx].detail = detail
            saveMemories()
            VesperHapticEngine.shared.triggerTacticalClick()
        }
    }
    
    public func toggleMemory(id: String) {
        if let idx = userMemories.firstIndex(where: { $0.id == id }) {
            userMemories[idx].isEnabled.toggle()
            saveMemories()
            VesperHapticEngine.shared.triggerTacticalClick()
        }
    }
    
    public func deleteMemory(id: String) {
        VesperHapticEngine.shared.triggerTacticalClick()
        userMemories.removeAll { $0.id == id }
        saveMemories()
    }
    
    public func clearAllMemories() {
        VesperHapticEngine.shared.triggerTacticalClick()
        userMemories.removeAll()
        saveMemories()
    }
    
    public func updatePrivacySettings(_ settings: MemoryPrivacySettings) {
        self.privacySettings = settings
        savePrivacySettings()
        VesperHapticEngine.shared.triggerSuccess()
    }
    
    // MARK: - Reading Actions
    
    public func saveReadingRecord(_ record: ReadingRecord) {
        VesperHapticEngine.shared.triggerSuccess()
        savedReadings.insert(record, at: 0)
        saveReadings()
        recalculateMatrix()
        
        // Auto-synthesize key insight into memory if enabled
        if privacySettings.isMemoryRetentionEnabled && privacySettings.autoSynthesizeInsights {
            if let query = record.query, !query.isEmpty {
                let key = "\(record.spreadName): \(query)"
                let outcome = record.synthesisReport?.finalOutcome ?? "Completed \(record.nodes.count)-node spread diagnostic."
                addMemory(key: key, detail: outcome, source: .oracleReading)
            }
        }
    }
    
    public func saveRecord(_ record: ReadingRecord) {
        saveReadingRecord(record)
    }
    
    public func deleteReadingRecord(id: String) {
        VesperHapticEngine.shared.triggerTacticalClick()
        savedReadings.removeAll { $0.id == id }
        saveReadings()
        recalculateMatrix()
    }
    
    public func deleteRecord(id: String) {
        deleteReadingRecord(id: id)
    }
    
    public func clearAllRecords() {
        VesperHapticEngine.shared.triggerTacticalClick()
        savedReadings.removeAll()
        saveReadings()
        recalculateMatrix()
    }
    
    // MARK: - Journal Actions
    
    public func addJournalEntry(cardName: String, prompt: String, reflection: String) {
        VesperHapticEngine.shared.triggerSuccess()
        let entry = JournalEntry(
            cardName: cardName,
            reflectionPrompt: prompt,
            userReflection: reflection
        )
        journalEntries.insert(entry, at: 0)
        saveJournal()
        recalculateMatrix()
        
        // Auto-synthesize daily log into memory if enabled
        if privacySettings.isMemoryRetentionEnabled && privacySettings.autoSynthesizeInsights {
            let key = "Daily Reflection [\(cardName)]"
            addMemory(key: key, detail: reflection, source: .dailyLog)
        }
    }
    
    public func deleteJournalEntry(id: String) {
        VesperHapticEngine.shared.triggerTacticalClick()
        journalEntries.removeAll { $0.id == id }
        saveJournal()
        recalculateMatrix()
    }
    
    public func clearJournal() {
        VesperHapticEngine.shared.triggerTacticalClick()
        journalEntries.removeAll()
        saveJournal()
        recalculateMatrix()
    }
    
    // MARK: - Conversation Actions
    
    public func saveConversation(title: String, messages: [ChatMessage]) {
        guard messages.count > 1 else { return }
        VesperHapticEngine.shared.triggerSuccess()
        let conversationMessages = messages.map {
            SavedConversationMessage(role: $0.role, text: $0.text, timestamp: $0.timestamp)
        }
        let convo = SavedConversation(title: title, messages: conversationMessages)
        savedConversations.insert(convo, at: 0)
        saveConversations()
    }
    
    public func saveConversation(_ conversation: SavedConversation) {
        VesperHapticEngine.shared.triggerSuccess()
        savedConversations.insert(conversation, at: 0)
        saveConversations()
    }
    
    public func deleteConversation(id: String) {
        VesperHapticEngine.shared.triggerTacticalClick()
        savedConversations.removeAll { $0.id == id }
        saveConversations()
    }
    
    public func clearAllConversations() {
        VesperHapticEngine.shared.triggerTacticalClick()
        savedConversations.removeAll()
        saveConversations()
    }
    
    // MARK: - Master Purge & Data Reset
    
    public func purgeAllProfileData() {
        VesperHapticEngine.shared.triggerSuccess()
        savedReadings.removeAll()
        journalEntries.removeAll()
        savedConversations.removeAll()
        userMemories.removeAll()
        
        saveReadings()
        saveJournal()
        saveConversations()
        saveMemories()
        
        recalculateMatrix()
    }
    
    // MARK: - Matrix Calculation
    
    public func recalculateMatrix() {
        self.individuationMatrix = IndividuationMatrix.calculate(from: journalEntries, readings: savedReadings)
    }
}
