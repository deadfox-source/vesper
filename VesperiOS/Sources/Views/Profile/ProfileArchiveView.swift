// Sources/Views/Profile/ProfileArchiveView.swift
import SwiftUI

public struct ProfileArchiveView: View {
    @EnvironmentObject var profile: ProfileStore
    
    @State private var activeTab: Int = 0 // 0: Readings, 1: Journal, 2: Conversations
    @State private var isDailyReflectionOpen: Bool = false
    @State private var isMemoryVaultOpen: Bool = false
    @State private var selectedRecord: ReadingRecord?
    @State private var selectedJournalEntry: JournalEntry?
    @State private var selectedConversation: SavedConversation?
    @State private var selectedMatrixPart: String?
    
    public init() {}
    
    public var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // Header
                VesperHeaderView(
                    title: "INDIVIDUATION PROFILE",
                    accentColor: .magiViolet,
                    telemetryItems: [
                        TelemetryColumnItem(label: "IND", value: "\(profile.savedRecords.count)", icon: "database", color: .evaCyan),
                        TelemetryColumnItem(label: "JRNL", value: "\(profile.journalEntries.count)", icon: "book", color: .evaCyan),
                        TelemetryColumnItem(label: "MEM", value: "\(profile.activeMemories.count)", icon: "brain", color: profile.privacySettings.isMemoryRetentionEnabled ? .magiViolet : .vesperMuted)
                    ],
                    rightActions: AnyView(
                        Button(action: {
                            VesperHapticEngine.shared.triggerTacticalClick()
                            withAnimation(.easeInOut(duration: 0.25)) {
                                isMemoryVaultOpen = true
                            }
                        }) {
                            HStack(spacing: 3) {
                                Image(systemName: "gearshape.fill")
                                    .font(.system(size: 8.5))
                                    .accessibilityHidden(true)
                                Text("[ SETTINGS ]")
                                    .font(VesperFont.telemetryTag(size: 8.5))
                                    .fontWeight(.bold)
                                    .fixedSize(horizontal: true, vertical: false)
                            }
                            .foregroundColor(.voidBlack)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 5)
                            .background(Color.magiOrange)
                            .frame(minHeight: 28)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Settings and Memory Vault")
                        .accessibilityHint("Opens operator settings, data governance, and telemetry toggles")
                        .accessibilityAddTraits(.isButton)
                    )
                )
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        // 1. Individuation Matrix Box
                        individuationMatrixSection()
                        
                        // 2. Segmented Filter Tabs (3 Tabs)
                        HStack(spacing: 0) {
                            tabButton(title: "INQUIRIES (\(profile.savedRecords.count))", index: 0)
                            tabButton(title: "JOURNAL (\(profile.journalEntries.count))", index: 1)
                            tabButton(title: "CONVOS (\(profile.savedConversations.count))", index: 2)
                        }
                        .border(Color.magiViolet.opacity(0.4), width: 1)
                        
                        // 3. Tab Content
                        if activeTab == 0 {
                            oracleSessionsList()
                        } else if activeTab == 1 {
                            journalEntriesList()
                        } else {
                            savedConversationsList()
                        }
                    }
                    .padding(12)
                }
                
                // 4. Daily Archetype Log Action Button (Anchored at bottom)
                Button(action: {
                    VesperHapticEngine.shared.triggerTacticalClick()
                    withAnimation(.easeInOut(duration: 0.25)) {
                        isDailyReflectionOpen = true
                    }
                }) {
                    HStack {
                        Image(systemName: "plus")
                            .accessibilityHidden(true)
                        Text("[ + DAILY ARCHETYPE LOG ]")
                            .fontWeight(.bold)
                    }
                    .font(VesperFont.telemetryTag(size: 11))
                    .foregroundColor(.voidBlack)
                    .frame(height: 44)
                    .frame(maxWidth: .infinity)
                    .background(Color.magiViolet)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Add Daily Archetype Log")
                .accessibilityHint("Opens daily reflection protocol to draw and log archetype")
                .accessibilityAddTraits(.isButton)
                .padding(.horizontal, 12)
                .padding(.bottom, 6)
            }
            
            // Fullscreen Semi-Transparent Daily Archetype Modal Overlay
            if isDailyReflectionOpen {
                DailyReflectionModalView(
                    onSave: { cardName, prompt, reflection in
                        profile.addJournalEntry(cardName: cardName, prompt: prompt, reflection: reflection)
                        withAnimation(.easeInOut(duration: 0.25)) {
                            isDailyReflectionOpen = false
                        }
                    },
                    onClose: {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            isDailyReflectionOpen = false
                        }
                    }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(150)
            }
            
            // Fullscreen Semi-Transparent Record Detail Modal Overlay
            if let record = selectedRecord {
                RecordDetailModalView(
                    record: record,
                    onClose: {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            selectedRecord = nil
                        }
                    }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(150)
            }
            
            // Fullscreen Semi-Transparent Journal Detail Modal Overlay
            if let entry = selectedJournalEntry {
                JournalDetailModalView(
                    entry: entry,
                    onClose: {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            selectedJournalEntry = nil
                        }
                    }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(150)
            }
            
            // Fullscreen Semi-Transparent Saved Conversation Modal Overlay
            if let convo = selectedConversation {
                SavedConversationsModalView(
                    conversation: convo,
                    onClose: {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            selectedConversation = nil
                        }
                    }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(150)
            }
            
            // Fullscreen Semi-Transparent Memory & Privacy Governance Modal Overlay
            if isMemoryVaultOpen {
                MemoryGovernanceModalView(
                    profile: profile,
                    onClose: {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            isMemoryVaultOpen = false
                        }
                    }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(160)
            }
        }
    }
    
    // MARK: - Individuation Matrix Section
    
    private func individuationMatrixSection() -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("> INDIVIDUATION MATRIX")
                    .font(VesperFont.telemetryTag(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.voidBlack)
                    .accessibilityHidden(true)
                Spacer()
                Text("[ ACTIVE ]")
                    .font(VesperFont.telemetryTag(size: 9))
                    .foregroundColor(.voidBlack.opacity(0.8))
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.magiViolet)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
            .accessibilityLabel("Individuation Matrix Dashboard")
            
            VStack(spacing: 12) {
                // 4 Metric Columns
                HStack(spacing: 4) {
                    matrixColumn(title: "[ PERSONA ]", value: profile.matrix.persona, color: .ghostWhite.opacity(0.8), partKey: "persona")
                    matrixColumn(title: "[ SHADOW ]", value: profile.matrix.shadow, color: .magiViolet, partKey: "shadow")
                    matrixColumn(title: "[ ANIMA ]", value: profile.matrix.anima, color: .magiOrange, partKey: "anima")
                    matrixColumn(title: "[ SELF ]", value: profile.matrix.selfActualization, color: .evaCyan, partKey: "self")
                }
                
                // Proportional Segmented Progress Bar
                GeometryReader { proxy in
                    let total = CGFloat(max(1, profile.matrix.persona + profile.matrix.shadow + profile.matrix.anima + profile.matrix.selfActualization))
                    let width = proxy.size.width
                    
                    HStack(spacing: 1) {
                        Rectangle()
                            .fill(Color.ghostWhite.opacity(0.8))
                            .frame(width: (CGFloat(profile.matrix.persona) / total) * width)
                        Rectangle()
                            .fill(Color.magiViolet)
                            .frame(width: (CGFloat(profile.matrix.shadow) / total) * width)
                        Rectangle()
                            .fill(Color.magiOrange)
                            .frame(width: (CGFloat(profile.matrix.anima) / total) * width)
                        Rectangle()
                            .fill(Color.evaCyan)
                            .frame(width: (CGFloat(profile.matrix.selfActualization) / total) * width)
                    }
                }
                .frame(height: 6)
                .background(Color.white.opacity(0.1))
                .border(Color.magiViolet.opacity(0.4), width: 0.5)
                .accessibilityHidden(true)
                
                // Expanded Definition if tapped
                if let part = selectedMatrixPart {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("[ MATRIX VARIABLE: \(part.uppercased()) ]")
                            .font(VesperFont.telemetryTag(size: 9))
                            .fontWeight(.bold)
                            .foregroundColor(partColor(part))
                        Text(partDescription(part))
                            .font(VesperFont.terminalBody(size: 10))
                            .foregroundColor(.ghostWhite)
                            .lineSpacing(2)
                    }
                    .padding(8)
                    .background(Color.voidBlack)
                    .border(partColor(part), width: 1)
                    .accessibilityElement(children: .combine)
                }
            }
            .padding(10)
            .background(Color.magiViolet.opacity(0.04))
            .border(Color.magiViolet.opacity(0.5), width: 1)
        }
    }
    
    private func matrixColumn(title: String, value: Int, color: Color, partKey: String) -> some View {
        let isSelected = selectedMatrixPart == partKey
        let cleanTitle = title.replacingOccurrences(of: "[", with: "").replacingOccurrences(of: "]", with: "").trimmingCharacters(in: .whitespaces)
        
        return Button(action: {
            VesperHapticEngine.shared.triggerTacticalClick()
            selectedMatrixPart = isSelected ? nil : partKey
        }) {
            VStack(spacing: 4) {
                Text("\(value)%")
                    .font(VesperFont.terminalHeader(size: 15))
                    .foregroundColor(color)
                Text(title)
                    .font(VesperFont.telemetryTag(size: 7))
                    .foregroundColor(.ghostWhite.opacity(0.7))
            }
            .frame(maxWidth: .infinity, minHeight: 44)
            .padding(.vertical, 6)
            .background(isSelected ? color.opacity(0.1) : Color.clear)
            .border(isSelected ? color : Color.clear, width: 1)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(cleanTitle): \(value) percent")
        .accessibilityValue(isSelected ? "Expanded" : "Collapsed")
        .accessibilityHint("Double tap to toggle detailed psychological description")
        .accessibilityAddTraits(.isButton)
    }
    
    private func tabButton(title: String, index: Int) -> some View {
        let isSelected = activeTab == index
        
        return Button(action: {
            VesperHapticEngine.shared.triggerTacticalClick()
            activeTab = index
        }) {
            Text(title)
                .font(VesperFont.telemetryTag(size: 8))
                .fontWeight(.bold)
                .foregroundColor(isSelected ? .voidBlack : .magiViolet)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(isSelected ? Color.magiViolet : Color.voidBlack)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityHint("Double tap to switch to \(title)")
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : [.isButton])
    }
    
    // MARK: - Oracle Sessions List
    
    private func oracleSessionsList() -> some View {
        VStack(spacing: 8) {
            if profile.savedRecords.isEmpty {
                Text("[ NO ARCHIVED ORACLE SESSIONS ]")
                    .font(VesperFont.telemetryTag(size: 10))
                    .foregroundColor(.vesperMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                ForEach(profile.savedRecords) { record in
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        selectedRecord = record
                    }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(record.spreadName)
                                    .font(VesperFont.telemetryTag(size: 11))
                                    .fontWeight(.bold)
                                    .foregroundColor(.evaCyan)
                                if let query = record.query {
                                    Text("\"\(query)\"")
                                        .font(VesperFont.terminalBody(size: 11))
                                        .foregroundColor(.magiOrange)
                                        .lineLimit(1)
                                }
                                Text("\(record.timestamp) · \(record.nodes.count) Nodes")
                                    .font(VesperFont.telemetryTag(size: 8))
                                    .foregroundColor(.vesperMuted)
                            }
                            
                            Spacer()
                            
                            Button(action: {
                                profile.deleteRecord(id: record.id)
                            }) {
                                Image(systemName: "trash")
                                    .font(.system(size: 12))
                                    .foregroundColor(.magiOrange)
                                    .padding(10)
                                    .frame(minWidth: 44, minHeight: 44)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Delete \(record.spreadName) record")
                            .accessibilityHint("Permanently deletes this reading from the archive")
                            .accessibilityAddTraits(.isButton)
                        }
                        .padding(10)
                        .background(Color.white.opacity(0.03))
                        .border(Color.evaCyan.opacity(0.3), width: 1)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Inquiry: \(record.spreadName), \(record.query != nil ? "Query: " + record.query! + ", " : "")\(record.timestamp), \(record.nodes.count) nodes")
                    .accessibilityHint("Double tap to view reading record")
                    .accessibilityAddTraits(.isButton)
                }
            }
        }
    }
    
    // MARK: - Journal Entries List
    
    private func journalEntriesList() -> some View {
        VStack(spacing: 8) {
            if profile.journalEntries.isEmpty {
                Text("[ NO DAILY ARCHETYPE LOGS RECORDED ]")
                    .font(VesperFont.telemetryTag(size: 10))
                    .foregroundColor(.vesperMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                ForEach(profile.journalEntries) { entry in
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        selectedJournalEntry = entry
                    }) {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(entry.cardName)
                                    .font(VesperFont.telemetryTag(size: 11))
                                    .fontWeight(.bold)
                                    .foregroundColor(.magiViolet)
                                Spacer()
                                Text(entry.timestamp)
                                    .font(VesperFont.telemetryTag(size: 8))
                                    .foregroundColor(.vesperMuted)
                                
                                Button(action: {
                                    profile.deleteJournalEntry(id: entry.id)
                                }) {
                                    Image(systemName: "trash")
                                        .font(.system(size: 12))
                                        .foregroundColor(.magiOrange)
                                        .padding(10)
                                        .frame(minWidth: 44, minHeight: 44)
                                        .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Delete journal entry for \(entry.cardName)")
                                .accessibilityHint("Permanently deletes this entry")
                                .accessibilityAddTraits(.isButton)
                            }
                            Text(entry.userReflection)
                                .font(VesperFont.terminalBody(size: 11))
                                .foregroundColor(.ghostWhite)
                                .lineLimit(2)
                        }
                        .padding(10)
                        .background(Color.white.opacity(0.03))
                        .border(Color.magiViolet.opacity(0.3), width: 1)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Journal entry: \(entry.cardName), \(entry.timestamp). Reflection: \(entry.userReflection)")
                    .accessibilityHint("Double tap to inspect full reflection")
                    .accessibilityAddTraits(.isButton)
                }
            }
        }
    }
    
    // MARK: - Saved Conversations List
    
    private func savedConversationsList() -> some View {
        VStack(spacing: 8) {
            if profile.savedConversations.isEmpty {
                Text("[ NO SAVED CONVERSATIONS IN ARCHIVE ]")
                    .font(VesperFont.telemetryTag(size: 10))
                    .foregroundColor(.vesperMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                ForEach(profile.savedConversations) { convo in
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        selectedConversation = convo
                    }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(convo.title)
                                    .font(VesperFont.telemetryTag(size: 11))
                                    .fontWeight(.bold)
                                    .foregroundColor(.evaCyan)
                                Text("\(convo.timestamp) · \(convo.messages.count) Messages")
                                    .font(VesperFont.telemetryTag(size: 8))
                                    .foregroundColor(.vesperMuted)
                            }
                            
                            Spacer()
                            
                            Button(action: {
                                profile.deleteConversation(id: convo.id)
                            }) {
                                Image(systemName: "trash")
                                    .font(.system(size: 12))
                                    .foregroundColor(.magiOrange)
                                    .padding(10)
                                    .frame(minWidth: 44, minHeight: 44)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Delete conversation \(convo.title)")
                            .accessibilityHint("Permanently deletes this conversation transcript")
                            .accessibilityAddTraits(.isButton)
                        }
                        .padding(10)
                        .background(Color.white.opacity(0.03))
                        .border(Color.evaCyan.opacity(0.3), width: 1)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Conversation: \(convo.title), \(convo.timestamp), \(convo.messages.count) messages")
                    .accessibilityHint("Double tap to read full transcript")
                    .accessibilityAddTraits(.isButton)
                }
            }
        }
    }
    
    private func partColor(_ part: String) -> Color {
        switch part {
        case "persona": return .ghostWhite
        case "shadow": return .magiViolet
        case "anima": return .magiOrange
        case "self": return .evaCyan
        default: return .magiViolet
        }
    }
    
    private func partDescription(_ part: String) -> String {
        switch part {
        case "persona": return "PERSONA: Represents the digital mask and structural shield presented to system interfaces."
        case "shadow": return "SHADOW: Tracks unrevealed or unconscious coordinates; raw occult backend potential."
        case "anima": return "ANIMA: The subjective aesthetic and emotional channel; analog connection to intuitive alignment."
        case "self": return "SELF: The synthesized state of actualization, harmonizing Persona, Shadow, and Anima."
        default: return ""
        }
    }
}

