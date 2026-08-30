// Sources/Views/Profile/MemoryGovernanceModalView.swift
import SwiftUI

public struct MemoryGovernanceModalView: View {
    @ObservedObject var profile: ProfileStore
    public var onClose: () -> Void
    
    @State private var newMemoryKey: String = ""
    @State private var newMemoryDetail: String = ""
    @State private var isAddingMemory: Bool = false
    @State private var showConfirmPurgeAll: Bool = false
    @State private var showConfirmClearMemories: Bool = false
    @State private var editingMemory: UserMemoryItem? = nil
    
    public init(profile: ProfileStore, onClose: @escaping () -> Void) {
        self.profile = profile
        self.onClose = onClose
    }
    
    public var body: some View {
        ZStack {
            // Solid void black backdrop
            Color.voidBlack
                .ignoresSafeArea()
                .onTapGesture {
                    onClose()
                }
            
            VStack(spacing: 0) {
                // ── Header ─────────────────────────────────────────────
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text("VESPER")
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.ghostWhite.opacity(0.6))
                            Text("MEMORY & PRIVACY VAULT")
                                .font(VesperFont.telemetryTag(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.magiViolet)
                        }
                        Text("[ OPERATOR DATA GOVERNANCE ]")
                            .font(VesperFont.telemetryTag(size: 8))
                            .foregroundColor(.evaCyan)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        onClose()
                    }) {
                        HStack(spacing: 4) {
                            Text("[ CLOSE ]")
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.ghostWhite.opacity(0.8))
                            Image(systemName: "xmark")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.magiViolet)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.06))
                        .border(Color.magiViolet.opacity(0.5), width: 1)
                        .frame(minWidth: 44, minHeight: 44)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close memory governance panel")
                    .accessibilityHint("Dismisses privacy and memory vault modal")
                    .accessibilityAddTraits(.isButton)
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 10)
                .background(Color.voidBlack)
                .border(Color.magiViolet.opacity(0.3), width: 0.8)
                
                // ── Content Scroll Area ─────────────────────────────────
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        // Section 1: Operator Sovereignty Statement
                        VStack(alignment: .leading, spacing: 4) {
                            Text("> SOVEREIGNTY PROTOCOL:")
                                .font(VesperFont.telemetryTag(size: 8.5))
                                .fontWeight(.bold)
                                .foregroundColor(.magiViolet)
                            Text("You hold absolute authority over all telemetry and neural context Vesper retains. Disabled vectors are purged from runtime synthesis prompts instantly.")
                                .font(VesperFont.terminalBody(size: 11))
                                .foregroundColor(.ghostWhite.opacity(0.85))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(10)
                        .background(Color.magiViolet.opacity(0.08))
                        .border(Color.magiViolet.opacity(0.4), width: 1)
                        
                        // Section 2: Privacy & Telemetry Switches
                        VStack(alignment: .leading, spacing: 10) {
                            Text("> TELEMETRY & CAPTURE TOGGLES")
                                .font(VesperFont.telemetryTag(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.evaCyan)
                            
                            governanceToggle(
                                title: "EPISODIC MEMORY RETENTION",
                                subtitle: "Allows Vesper to retain and recall operator directives across sessions.",
                                isOn: Binding(
                                    get: { profile.privacySettings.isMemoryRetentionEnabled },
                                    set: { val in
                                        var copy = profile.privacySettings
                                        copy.isMemoryRetentionEnabled = val
                                        profile.updatePrivacySettings(copy)
                                    }
                                ),
                                accentColor: .magiViolet
                            )
                            
                            governanceToggle(
                                title: "GPS & LOCATION TELEMETRY",
                                subtitle: "Feeds local coordinate geomagnetic weighting into the Tree of Life engine.",
                                isOn: Binding(
                                    get: { profile.privacySettings.isLocationTelemetryEnabled },
                                    set: { val in
                                        var copy = profile.privacySettings
                                        copy.isLocationTelemetryEnabled = val
                                        profile.updatePrivacySettings(copy)
                                    }
                                ),
                                accentColor: .evaCyan
                            )
                            
                            governanceToggle(
                                title: "SPACE WEATHER & SOLAR WIND",
                                subtitle: "Incorporates live NOAA Kp geomagnetic index into oracle dignity calculations.",
                                isOn: Binding(
                                    get: { profile.privacySettings.isSpaceWeatherTelemetryEnabled },
                                    set: { val in
                                        var copy = profile.privacySettings
                                        copy.isSpaceWeatherTelemetryEnabled = val
                                        profile.updatePrivacySettings(copy)
                                    }
                                ),
                                accentColor: .warningAmber
                            )
                            
                            governanceToggle(
                                title: "AUTO-ARCHIVE CHAT SESSIONS",
                                subtitle: "Automatically preserves completed chat dialogue into your profile archive.",
                                isOn: Binding(
                                    get: { profile.privacySettings.autoSaveChatSessions },
                                    set: { val in
                                        var copy = profile.privacySettings
                                        copy.autoSaveChatSessions = val
                                        profile.updatePrivacySettings(copy)
                                    }
                                ),
                                accentColor: .magiOrange
                            )
                            
                            governanceToggle(
                                title: "AUTO-SYNTHESIZE INSIGHTS",
                                subtitle: "Extracts key insights from daily archetype logs and oracle spread completions.",
                                isOn: Binding(
                                    get: { profile.privacySettings.autoSynthesizeInsights },
                                    set: { val in
                                        var copy = profile.privacySettings
                                        copy.autoSynthesizeInsights = val
                                        profile.updatePrivacySettings(copy)
                                    }
                                ),
                                accentColor: .biosGreen
                            )
                        }
                        
                        // Section 3: Active Memory Vault
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("> ACTIVE MEMORY VAULT (\(profile.userMemories.count))")
                                    .font(VesperFont.telemetryTag(size: 9))
                                    .fontWeight(.bold)
                                    .foregroundColor(.magiViolet)
                                Spacer()
                                
                                Button(action: {
                                    VesperHapticEngine.shared.triggerTacticalClick()
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        isAddingMemory.toggle()
                                    }
                                }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: isAddingMemory ? "chevron.up" : "plus")
                                            .font(.system(size: 9))
                                        Text(isAddingMemory ? "[ CANCEL ]" : "[ + ADD DIRECTIVE ]")
                                            .font(VesperFont.telemetryTag(size: 8.5))
                                    }
                                    .foregroundColor(.magiViolet)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.magiViolet.opacity(0.12))
                                    .border(Color.magiViolet.opacity(0.5), width: 0.8)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Add manual memory directive")
                                .accessibilityHint("Opens input fields to insert a permanent directive for Vesper")
                                .accessibilityAddTraits(.isButton)
                            }
                            
                            // Inline New Memory Form
                            if isAddingMemory {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("> DIRECTIVE KEY / TITLE:")
                                        .font(VesperFont.telemetryTag(size: 8))
                                        .foregroundColor(.ghostWhite.opacity(0.7))
                                    
                                    VesperTerminalInputField(
                                        placeholder: "e.g. Focus Vector, Core Philosophy",
                                        text: $newMemoryKey,
                                        accentColor: .magiViolet,
                                        isPrimary: true,
                                        showTrailingAction: false
                                    )
                                    .border(Color.magiViolet.opacity(0.5), width: 1)
                                    
                                    Text("> DIRECTIVE DETAIL:")
                                        .font(VesperFont.telemetryTag(size: 8))
                                        .foregroundColor(.ghostWhite.opacity(0.7))
                                    
                                    VesperTerminalInputField(
                                        placeholder: "e.g. Always emphasize architectural precision and swift feedback.",
                                        text: $newMemoryDetail,
                                        accentColor: .magiViolet,
                                        isPrimary: false,
                                        showTrailingAction: false
                                    )
                                    .border(Color.magiViolet.opacity(0.5), width: 1)
                                    
                                    Button(action: {
                                        let k = newMemoryKey.trimmingCharacters(in: .whitespaces)
                                        let d = newMemoryDetail.trimmingCharacters(in: .whitespaces)
                                        guard !k.isEmpty && !d.isEmpty else { return }
                                        profile.addMemory(key: k, detail: d, source: .manual)
                                        newMemoryKey = ""
                                        newMemoryDetail = ""
                                        withAnimation {
                                            isAddingMemory = false
                                        }
                                    }) {
                                        Text("[ COMMIT DIRECTIVE TO MEMORY ]")
                                            .font(VesperFont.telemetryTag(size: 10))
                                            .fontWeight(.bold)
                                            .foregroundColor(.voidBlack)
                                            .frame(height: 44)
                                            .frame(maxWidth: .infinity)
                                            .background(Color.magiViolet)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel("Commit directive to memory")
                                    .accessibilityHint("Saves this directive to Vesper's persistent memory")
                                    .accessibilityAddTraits(.isButton)
                                    .padding(.top, 4)
                                }
                                .padding(10)
                                .background(Color.white.opacity(0.03))
                                .border(Color.magiViolet.opacity(0.3), width: 1)
                            }
                            
                            if profile.userMemories.isEmpty {
                                Text("[ NO PERSISTENT MEMORIES RECORDED ]")
                                    .font(VesperFont.telemetryTag(size: 10))
                                    .foregroundColor(.vesperMuted)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                            } else {
                                ForEach(profile.userMemories) { mem in
                                    memoryItemCard(mem)
                                }
                            }
                        }
                        
                        // Section 4: Data Purge & Governance
                        VStack(alignment: .leading, spacing: 10) {
                            Text("> DANGER ZONE & DATA PURGE")
                                .font(VesperFont.telemetryTag(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.magiOrange)
                            
                            HStack(spacing: 8) {
                                Button(action: {
                                    showConfirmClearMemories = true
                                }) {
                                    Text("[ CLEAR MEMORIES ]")
                                        .font(VesperFont.telemetryTag(size: 9))
                                        .fontWeight(.bold)
                                        .foregroundColor(.magiOrange)
                                        .frame(height: 44)
                                        .frame(maxWidth: .infinity)
                                        .background(Color.magiOrange.opacity(0.12))
                                        .border(Color.magiOrange.opacity(0.6), width: 1)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Clear all memory directives")
                                .accessibilityHint("Permanently deletes all captured memories")
                                .accessibilityAddTraits(.isButton)
                                
                                Button(action: {
                                    showConfirmPurgeAll = true
                                }) {
                                    Text("[ HARD RESET ALL ]")
                                        .font(VesperFont.telemetryTag(size: 9))
                                        .fontWeight(.bold)
                                        .foregroundColor(.magiOrange)
                                        .frame(height: 44)
                                        .frame(maxWidth: .infinity)
                                        .background(Color.magiOrange.opacity(0.18))
                                        .border(Color.magiOrange, width: 1.2)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Hard reset all profile data")
                                .accessibilityHint("Wipes all readings, journals, conversations, and memories")
                                .accessibilityAddTraits(.isButton)
                            }
                        }
                        .padding(.top, 6)
                    }
                    .padding(14)
                }
            }
            .frame(maxWidth: 580)
            .background(Color.voidBlack)
            .border(Color.magiViolet.opacity(0.4), width: 1)
            .padding(.horizontal, 10)
            .padding(.vertical, 16)
        }
        .confirmationDialog(
            "Clear all persistent memory items?",
            isPresented: $showConfirmClearMemories,
            titleVisibility: .visible
        ) {
            Button("Clear All Memories", role: .destructive) {
                profile.clearAllMemories()
            }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog(
            "Hard reset all profile records, journals, conversations, and memories?",
            isPresented: $showConfirmPurgeAll,
            titleVisibility: .visible
        ) {
            Button("Hard Reset Entire Profile", role: .destructive) {
                profile.purgeAllProfileData()
            }
            Button("Cancel", role: .cancel) {}
        }
    }
    
    // MARK: - Component Views
    
    private func governanceToggle(
        title: String,
        subtitle: String,
        isOn: Binding<Bool>,
        accentColor: Color
    ) -> some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(VesperFont.telemetryTag(size: 9.5))
                    .fontWeight(.bold)
                    .foregroundColor(accentColor)
                Text(subtitle)
                    .font(VesperFont.terminalBody(size: 10.5))
                    .foregroundColor(.ghostWhite.opacity(0.75))
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
            
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(accentColor)
                .accessibilityLabel(title)
                .accessibilityHint("Toggles \(title)")
        }
        .padding(10)
        .background(Color.white.opacity(0.025))
        .border(accentColor.opacity(0.25), width: 0.8)
    }
    
    private func memoryItemCard(_ memory: UserMemoryItem) -> some View {
        let isEnabled = memory.isEnabled
        let statusText = isEnabled ? "[ ACTIVE ]" : "[ MUTED ]"
        let statusColor: Color = isEnabled ? .biosGreen : .vesperMuted
        let statusBg: Color = isEnabled ? Color.biosGreen.opacity(0.12) : Color.white.opacity(0.04)
        let statusBorder: Color = isEnabled ? Color.biosGreen.opacity(0.4) : Color.white.opacity(0.15)
        let cardBg: Color = isEnabled ? Color.white.opacity(0.03) : Color.white.opacity(0.01)
        let cardBorder: Color = isEnabled ? Color.magiViolet.opacity(0.35) : Color.white.opacity(0.1)
        
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("[\(memory.source.displayLabel)]")
                    .font(VesperFont.telemetryTag(size: 8))
                    .foregroundColor(.evaCyan)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(Color.evaCyan.opacity(0.12))
                    .border(Color.evaCyan.opacity(0.4), width: 0.6)
                
                Text(memory.key)
                    .font(VesperFont.telemetryTag(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(isEnabled ? .ghostWhite : .vesperMuted)
                
                Spacer()
                
                // Active status toggle
                Button(action: {
                    profile.toggleMemory(id: memory.id)
                }) {
                    Text(statusText)
                        .font(VesperFont.telemetryTag(size: 8))
                        .foregroundColor(statusColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(statusBg)
                        .border(statusBorder, width: 0.6)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Toggle memory active state for \(memory.key)")
                .accessibilityHint(isEnabled ? "Mutes this memory from synthesis" : "Activates this memory for synthesis")
                .accessibilityAddTraits(.isButton)
                
                // Delete Button
                Button(action: {
                    profile.deleteMemory(id: memory.id)
                }) {
                    Image(systemName: "trash")
                        .font(.system(size: 12))
                        .foregroundColor(.magiOrange)
                        .frame(minWidth: 44, minHeight: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Delete memory \(memory.key)")
                .accessibilityHint("Permanently deletes this memory directive")
                .accessibilityAddTraits(.isButton)
            }
            
            Text(memory.detail)
                .font(VesperFont.terminalBody(size: 11))
                .foregroundColor(isEnabled ? .ghostWhite.opacity(0.9) : .vesperMuted)
            
            Text(memory.timestamp)
                .font(VesperFont.telemetryTag(size: 7.5))
                .foregroundColor(.vesperMuted)
        }
        .padding(10)
        .background(cardBg)
        .border(cardBorder, width: 0.8)
    }
}
