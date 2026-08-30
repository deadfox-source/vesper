// Sources/Views/Tabletop/TabletopView.swift
import SwiftUI

public struct TabletopView: View {
    @EnvironmentObject var board: BoardStore
    @EnvironmentObject var telemetry: TelemetryStore
    @EnvironmentObject var profile: ProfileStore
    @EnvironmentObject var nav: NavigationStore
    @ObservedObject var recognizer = VesperSpeechRecognizer.shared
    
    @State private var isDeploying: Bool = false
    @State private var selectedTemplateId: String = "GRID_INFILTRATION"
    @State private var intentQuery: String = ""
    @State private var observationInput: String = ""
    @State private var showConfirmReset: Bool = false
    @FocusState private var isObservationFocused: Bool
    
    public init() {}
    
    public var body: some View {
        ZStack {
            if board.nodes.isEmpty && !isDeploying {
                // Phase 1: Mission Select / Spread Selection Guide
                spreadSelectorGuideView()
            } else {
                // Phase 2: Active Tactical Grid Tabletop
                activeTacticalGridView()
            }
            
            // Fullscreen Synthesis Terminal Modal
            if board.isSynthesisActive, let report = board.synthesisReport {
                SynthesisTerminalView(
                    report: report,
                    onSave: {
                        VesperHapticEngine.shared.triggerSuccess()
                        let record = ReadingRecord(
                            spreadId: board.activeSpreadId,
                            spreadName: board.activeSpread.name,
                            query: board.query.isEmpty ? nil : board.query,
                            nodes: board.nodes,
                            cardNotes: board.cardNotes,
                            synthesisReport: report
                        )
                        profile.saveRecord(record)
                    },
                    onClose: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        board.isSynthesisActive = false
                    }
                )
                .transition(.asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity), removal: .opacity))
                .zIndex(300)
            }
            
            // Full-Page Dedicated Card Reflection Screen
            if let focusedId = board.focusedNodeId, let node = board.activeSpread.nodes.first(where: { $0.id == focusedId }) {
                NodeFocusModalView(
                    node: node,
                    cardName: board.nodes[focusedId],
                    currentNote: board.cardNotes[focusedId] ?? "",
                    onSaveNote: { note in
                        board.setNote(forNodeId: focusedId, note: note)
                    },
                    onRedraw: {
                        board.drawNextCard()
                    },
                    onClose: {
                        board.focusedNodeId = nil
                    }
                )
                .transition(.asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity), removal: .opacity))
                .zIndex(300)
            }
        }
        .alert("TERMINATE MISSION SPREAD?", isPresented: $showConfirmReset) {
            Button("Cancel", role: .cancel) {}
            Button("Reset", role: .destructive) {
                board.resetBoard()
                isDeploying = false
            }
        } message: {
            Text("This will purge all active node coordinates and reset the probability matrix.")
        }
    }
    
    // MARK: - Phase 1: Spread Selection Guide
    
    private func spreadSelectorGuideView() -> some View {
        VStack(spacing: 0) {
            VesperHeaderView(
                title: "MISSION SELECT",
                accentColor: .evaCyan,
                telemetryItems: [
                    TelemetryColumnItem(label: "STAT", value: "STANDBY", icon: "square.grid.2x2", color: .evaCyan)
                ]
            )
            
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    // Section: Spread Templates
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("> INITIALIZATION TEMPLATES")
                                .font(VesperFont.telemetryTag(size: 10))
                                .fontWeight(.bold)
                                .foregroundColor(.voidBlack)
                            Spacer()
                            Text("[ 3 PROTOCOLS ]")
                                .font(VesperFont.telemetryTag(size: 9))
                                .foregroundColor(.voidBlack.opacity(0.8))
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.evaCyan)
                        
                        // Template 1: Quick Inquiry (3 Nodes)
                        templateCardView(
                            id: "GRID_INFILTRATION",
                            tagline: "QUICK INQUIRY · 3-NODE",
                            iconName: "scope",
                            description: "Identify current state, confront primary obstacle, and define action."
                        )
                        
                        // Template 2: Challenge Resolution (5 Nodes)
                        templateCardView(
                            id: "GRID_EXFILTRATION",
                            tagline: "CHALLENGE RESOLUTION · 5-NODE",
                            iconName: "waveform.path.ecg",
                            description: "Pathfinding through difficult scenarios, hidden factors, and resolution."
                        )
                        
                        // Template 3: Full System Scan (10 Nodes)
                        templateCardView(
                            id: "GRID_MACRO_SYSTEM",
                            tagline: "FULL SYSTEM SCAN · 10-NODE",
                            iconName: "network",
                            description: "Comprehensive 10-node mapping across the complete Tree of Life Sephirot."
                        )
                    }
                }
                .padding(12)
            }
            
            // ── Sticky Bottom Intent Query & Deploy Action ─────────
            VStack(spacing: 8) {
                Rectangle()
                    .fill(Color.evaCyan.opacity(0.35))
                    .frame(height: 1)
                
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("> INTENT QUERY")
                            .font(VesperFont.telemetryTag(size: 9))
                            .fontWeight(.bold)
                            .foregroundColor(.voidBlack)
                        Spacer()
                        Text("[ REQUIRED ]")
                            .font(VesperFont.telemetryTag(size: 8))
                            .foregroundColor(.voidBlack.opacity(0.8))
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(Color.evaCyan)
                    
                    VesperTerminalInputField(
                        placeholder: "Enter topic of inquiry...",
                        text: $intentQuery,
                        accentColor: .evaCyan,
                        onCommit: {
                            if !intentQuery.trimmingCharacters(in: .whitespaces).isEmpty {
                                VesperHapticEngine.shared.triggerTacticalClick()
                                board.selectSpread(id: selectedTemplateId, query: intentQuery)
                                isDeploying = true
                            }
                        }
                    )
                    
                    // Sticky Bottom Deploy Button
                    Button(action: {
                        VesperHapticEngine.shared.triggerTacticalClick()
                        board.selectSpread(id: selectedTemplateId, query: intentQuery)
                        isDeploying = true
                    }) {
                        Text("[ INITIATE SCAN ]")
                            .font(VesperFont.telemetryTag(size: 12))
                            .fontWeight(.bold)
                            .foregroundColor(intentQuery.trimmingCharacters(in: .whitespaces).isEmpty ? Color.evaCyan.opacity(0.3) : .voidBlack)
                            .frame(height: 44)
                            .frame(maxWidth: .infinity)
                            .background(intentQuery.trimmingCharacters(in: .whitespaces).isEmpty ? Color.white.opacity(0.06) : Color.evaCyan)
                            .border(Color.evaCyan, width: 1.2)
                    }
                    .buttonStyle(.plain)
                    .disabled(intentQuery.trimmingCharacters(in: .whitespaces).isEmpty)
                    .accessibilityLabel("Initiate spread scan")
                    .accessibilityHint("Deploys selected spread template with your inquiry")
                    .accessibilityAddTraits(.isButton)
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 8)
                .background(Color.voidBlack)
            }
            .background(Color.voidBlack)
        }
    }
    
    private func templateCardView(id: String, tagline: String, iconName: String, description: String) -> some View {
        let isSelected = selectedTemplateId == id
        
        return Button(action: {
            VesperHapticEngine.shared.triggerTacticalClick()
            selectedTemplateId = id
        }) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: iconName)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(isSelected ? .voidBlack : .evaCyan)
                        .accessibilityHidden(true)
                    Text(tagline)
                        .font(VesperFont.telemetryTag(size: 11))
                        .fontWeight(.bold)
                        .foregroundColor(isSelected ? .voidBlack : .evaCyan)
                    Spacer()
                    if isSelected {
                        Text("[ SELECTED ]")
                            .font(VesperFont.telemetryTag(size: 8))
                            .foregroundColor(.voidBlack)
                    }
                }
                
                Text(description)
                    .font(VesperFont.terminalBody(size: 11))
                    .foregroundColor(isSelected ? .voidBlack.opacity(0.9) : .ghostWhite.opacity(0.7))
            }
            .padding(10)
            .background(isSelected ? Color.evaCyan : Color.voidBlack.opacity(0.8))
            .border(isSelected ? Color.evaCyan : Color.evaCyan.opacity(0.3), width: 1)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(tagline): \(description)")
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityHint("Double tap to select this spread protocol")
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : [.isButton])
    }
    
    // MARK: - Phase 2: Active Tactical Grid Tabletop
    
    private func activeTacticalGridView() -> some View {
        GeometryReader { geo in
            let terminalHeight = geo.size.height * 0.40
            let messageScrollHeight = max(terminalHeight - 74, 100)
            
            VStack(spacing: 0) {
                // Active Grid Header
                VesperHeaderView(
                    title: board.activeSpread.name.uppercased(),
                    accentColor: .evaCyan,
                    telemetryItems: [
                        TelemetryColumnItem(label: "STAT", value: "ACTIVE", icon: "activity", color: .evaCyan),
                        TelemetryColumnItem(label: "SYNC", value: "\(board.nodes.count)/\(board.activeSpread.nodes.count)", icon: "checkmark.circle", color: board.isComplete ? .biosGreen : .evaCyan)
                    ],
                    rightActions: AnyView(
                        Button(action: {
                            VesperHapticEngine.shared.triggerTacticalClick()
                            showConfirmReset = true
                        }) {
                            Text("[ NEW ]")
                                .font(VesperFont.telemetryTag(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.voidBlack)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.magiOrange)
                                .frame(minWidth: 44, minHeight: 32)
                                .contentShape(Rectangle())
                        }
                        .accessibilityLabel("New spread")
                        .accessibilityHint("Resets active board and allows selecting a new spread template")
                        .accessibilityAddTraits(.isButton)
                    )
                )
                
                // 3D Isometric Tarot Visual Canvas Area
                ZStack {
                    SpreadCanvasView(
                        spread: board.activeSpread,
                        nodesRecord: board.nodes,
                        activeStep: board.activeStep,
                        isGuided: board.isGuidedMode,
                        isAwaitingTap: board.isAwaitingTap,
                        latitude: telemetry.locationCoords?.lat,
                        longitude: telemetry.locationCoords?.lon,
                        kpIndex: telemetry.spaceWeather.kpIndex,
                        onNodeTapped: { node in
                            handleNodeTap(node: node)
                        }
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .rotation3DEffect(.degrees(12), axis: (x: 1, y: 0, z: 0))
                    .padding(.horizontal, 6)
                    .padding(.top, 14)
                    .padding(.bottom, 6)
                }
                
                // Lower Guided Dialogue Terminal (Standardized 40% vertical height)
                TerminalFrameView(
                    title: "VESPER GUIDANCE TERMINAL",
                    headerSubtitle: board.isComplete ? "[ SYNTHESIS READY ]" : "[ STEP \(board.activeStep)/\(board.activeSpread.nodes.count) ]",
                    accentColor: .evaCyan
                ) {
                    VStack(spacing: 0) {
                        ScrollViewReader { proxy in
                            ScrollView {
                                LazyVStack(alignment: .leading, spacing: 6) {
                                    ForEach(board.readingMessages) { msg in
                                        VesperTerminalMessageRow(
                                            message: msg,
                                            accentColor: .evaCyan,
                                            onSelectOption: { opt in
                                                Task {
                                                    await board.submitNodeReflection(userText: opt)
                                                }
                                            },
                                            onDeploySpread: nil
                                        )
                                        .id(msg.id)
                                    }
                                    
                                    if board.isProcessingReflection {
                                        HStack(spacing: 6) {
                                            Text("> VESPER:")
                                                .font(VesperFont.telemetryTag(size: 9))
                                                .foregroundColor(.evaCyan)
                                            Text("ANALYZING FIELD OBSERVATION...")
                                                .font(VesperFont.terminalBody(size: 10))
                                                .foregroundColor(.magiOrange)
                                            ProgressView()
                                                .scaleEffect(0.6)
                                                .tint(.evaCyan)
                                        }
                                        .id("processing_indicator")
                                        .accessibilityElement(children: .combine)
                                        .accessibilityLabel("Vesper is analyzing field observation")
                                    }
                                }
                                .padding(8)
                            }
                            .scrollDismissesKeyboard(.interactively)
                            .frame(height: messageScrollHeight)
                            .onChange(of: board.readingMessages.count) { _, _ in
                                if let lastId = board.readingMessages.last?.id {
                                    withAnimation {
                                        proxy.scrollTo(lastId, anchor: .bottom)
                                    }
                                }
                            }
                            .onChange(of: board.isProcessingReflection) { _, processing in
                                if processing {
                                    withAnimation {
                                        proxy.scrollTo("processing_indicator", anchor: .bottom)
                                    }
                                }
                            }
                        }
                        
                        // Integrated In-Terminal Synthesis Action Prompt
                        if board.isComplete {
                            HStack(spacing: 8) {
                                Button(action: {
                                    VesperHapticEngine.shared.playHeartbeatPulse()
                                    board.executeSynthesis(
                                        weather: telemetry.weather,
                                        spaceWeather: telemetry.spaceWeather,
                                        batteryLevel: telemetry.batteryLevel
                                    )
                                }) {
                                    HStack(spacing: 6) {
                                        Text(">")
                                            .font(VesperFont.telemetryTag(size: 9.5))
                                            .foregroundColor(.magiOrange)
                                        Image(systemName: "sparkles")
                                            .font(.system(size: 9))
                                            .foregroundColor(.warningAmber)
                                        Text("[ ENGAGE FULL SYNTHESIS ]")
                                            .font(VesperFont.telemetryTag(size: 10))
                                            .fontWeight(.bold)
                                            .foregroundColor(.warningAmber)
                                    }
                                    .padding(.horizontal, 12)
                                    .frame(height: 32)
                                    .background(Color.voidBlack)
                                    .border(Color.warningAmber, width: 1)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Engage Full Oracle Synthesis")
                                .accessibilityHint("Calculates elemental balance and compiles tactical directives")
                                
                                Spacer()
                            }
                            .padding(.horizontal, 8)
                            .padding(.bottom, 6)
                        }
                        
                        // Input Bar with top line anchored flush at the bottom of the terminal window
                        VesperTerminalInputField(
                            placeholder: "Enter message",
                            text: $observationInput,
                            accentColor: .evaCyan,
                            onCommit: sendObservation
                        )
                    }
                }
                .padding(.horizontal, 6)
                .padding(.bottom, 6)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .onAppear {
            board.startGuidedSession()
        }
    }
    
    private func handleNodeTap(node: SpreadNodeDef) {
        if node.id == board.activeStep && board.nodes[node.id] == nil {
            board.drawNextGuidedCard()
            board.focusedNodeId = node.id
        } else if board.nodes[node.id] != nil {
            board.focusedNodeId = node.id
        }
    }
    
    private func sendObservation() {
        let trimmed = observationInput.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        observationInput = ""
        Task {
            await board.submitNodeReflection(userText: trimmed)
        }
    }
    
    private func toggleVoiceDictation() {
        VesperHapticEngine.shared.triggerTacticalClick()
        if recognizer.isRecording {
            recognizer.stopRecording()
            if !recognizer.transcript.isEmpty {
                observationInput = recognizer.transcript
            }
        } else {
            recognizer.toggleRecording { text in
                self.observationInput = text
            }
        }
    }
}


#Preview {
    TabletopView()
        .environmentObject(BoardStore())
        .environmentObject(TelemetryStore())
        .environmentObject(ProfileStore())
        .environmentObject(NavigationStore())
        .preferredColorScheme(.dark)
        .background(Color.voidBlack)
}
