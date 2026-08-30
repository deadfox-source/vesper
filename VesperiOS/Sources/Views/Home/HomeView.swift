// Sources/Views/Home/HomeView.swift
import SwiftUI

public struct HomeView: View {
    @EnvironmentObject var vesper: VesperStore
    @EnvironmentObject var nav: NavigationStore
    @EnvironmentObject var board: BoardStore
    @EnvironmentObject var profile: ProfileStore
    @EnvironmentObject var telemetry: TelemetryStore
    @EnvironmentObject var network: NetworkMonitor
    
    @State private var inputText: String = ""
    @FocusState private var isInputFocused: Bool
    
    public init() {}
    
    public var body: some View {
        GeometryReader { geo in
            let terminalHeight = geo.size.height * 0.40
            let messageScrollHeight = max(terminalHeight - 74, 120)
            
            VStack(spacing: 0) {
                // 1. Communication Link Header
                VesperHeaderView(
                    title: "COMMUNICATION LINK",
                    accentColor: .vesperBlue,
                    telemetryItems: [
                        TelemetryColumnItem(
                            label: "AFFECT",
                            value: currentAffectText(),
                            icon: "waveform.path.ecg",
                            color: currentAffectColor()
                        ),
                        TelemetryColumnItem(
                            label: "MEM",
                            value: "\(profile.activeMemories.count)",
                            icon: "brain",
                            color: profile.privacySettings.isMemoryRetentionEnabled ? .magiViolet : .vesperMuted
                        ),
                        TelemetryColumnItem(
                            label: "UPLINK",
                            value: network.isConnected ? "ONLINE" : "OFFLINE",
                            icon: "wifi",
                            color: network.isConnected ? .evaCyan : .magiOrange
                        )
                    ],
                    ambientWaveform: AnyView(ResonanceWaveformView(height: 50, emotion: vesper.messages.last?.emotion)),
                    rightActions: AnyView(
                        HStack(spacing: 6) {
                            if vesper.canSaveSession {
                                Button(action: {
                                    vesper.saveCurrentSession(to: profile)
                                }) {
                                    HStack(spacing: 3) {
                                        Image(systemName: "square.and.arrow.down")
                                            .font(.system(size: 9))
                                        Text("[ SAVE ]")
                                            .font(VesperFont.telemetryTag(size: 8.5))
                                            .fontWeight(.bold)
                                    }
                                    .foregroundColor(.voidBlack)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 4)
                                    .background(Color.evaCyan)
                                    .frame(minWidth: 44, minHeight: 32)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Save current chat session")
                                .accessibilityHint("Archives this conversation to your individuation profile")
                                .accessibilityAddTraits(.isButton)
                            }
                            
                            Button(action: {
                                vesper.startNewSession(savePreviousTo: profile)
                            }) {
                                HStack(spacing: 3) {
                                    Image(systemName: "plus")
                                        .font(.system(size: 9))
                                    Text("[ NEW ]")
                                        .font(VesperFont.telemetryTag(size: 8.5))
                                        .fontWeight(.bold)
                                }
                                .foregroundColor(.voidBlack)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 4)
                                .background(Color.magiOrange)
                                .frame(minWidth: 44, minHeight: 32)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Start new chat session")
                            .accessibilityHint("Resets chat session and archives current dialogue if auto-save is enabled")
                            .accessibilityAddTraits(.isButton)
                        }
                    )
                )
                
                // 2. Center Viewport Area (Exposing global 3D avatar & pet)
                Spacer()
                
                // 3. Lower Pinned Chat Terminal Frame (strictly under half the screen)
                TerminalFrameView(
                    title: "VESPER TERMINAL",
                    headerSubtitle: "[ \(vesper.messages.count) MSG ]",
                    accentColor: .vesperBlue
                ) {
                    VStack(spacing: 0) {
                        // Chat Message Stream
                        ScrollViewReader { proxy in
                            ScrollView {
                                LazyVStack(alignment: .leading, spacing: 8) {
                                    ForEach(vesper.messages) { msg in
                                        chatMessageRow(msg)
                                            .id(msg.id)
                                    }
                                    
                                    if vesper.isThinking {
                                        HStack(spacing: 4) {
                                            Text("> VESPER:")
                                                .font(VesperFont.telemetryTag(size: 10))
                                                .foregroundColor(.vesperBlue)
                                            Text("PROCESSING SIGNAL...")
                                                .font(VesperFont.terminalBody(size: 11))
                                                .foregroundColor(.evaCyan)
                                            ProgressView()
                                                .scaleEffect(0.6)
                                                .tint(.evaCyan)
                                        }
                                        .padding(.vertical, 3)
                                        .id("thinking_indicator")
                                        .accessibilityElement(children: .combine)
                                        .accessibilityLabel("Vesper is processing signal")
                                    }
                                }
                                .padding(8)
                            }
                            .scrollDismissesKeyboard(.interactively)
                            .frame(height: messageScrollHeight)
                            .onChange(of: vesper.messages.count) { _, _ in
                                if let lastId = vesper.messages.last?.id {
                                    withAnimation(.easeOut(duration: 0.2)) {
                                        proxy.scrollTo(lastId, anchor: .bottom)
                                    }
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
                                        withAnimation(.easeOut(duration: 0.2)) {
                                            proxy.scrollTo(lastId, anchor: .bottom)
                                        }
                                    }
                                }
                            }
                            .onChange(of: vesper.isThinking) { _, thinking in
                                if thinking {
                                    withAnimation(.easeOut(duration: 0.2)) {
                                        proxy.scrollTo("thinking_indicator", anchor: .bottom)
                                    }
                                }
                            }
                            .onAppear {
                                if let lastId = vesper.messages.last?.id {
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                        proxy.scrollTo(lastId, anchor: .bottom)
                                    }
                                }
                            }
                        }
                        
                        // Input Command Row with top line anchored flush at the bottom of the terminal window
                        VesperTerminalInputField(
                            placeholder: "Enter message",
                            text: $inputText,
                            accentColor: .vesperBlue,
                            onCommit: sendMessage
                        )
                    }
                }
                .padding(.horizontal, 6)
                .padding(.bottom, 4)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .background(Color.clear)
        .onAppear {
            if vesper.messages.count == 1 && !vesper.hasSpokenGreeting {
                vesper.hasSpokenGreeting = true
                if vesper.audioOutputEnabled, let first = vesper.messages.first {
                    let rawText = first.text
                    let greetingText: String
                    if rawText.contains("CHAT WITH VESPER\n\n") {
                        greetingText = rawText.components(separatedBy: "CHAT WITH VESPER\n\n").last ?? rawText
                    } else {
                        greetingText = rawText
                    }
                    VesperSpeechSynthesizer.shared.speak(greetingText)
                }
            }
        }
    }
    
    // MARK: - Message Row
    
    private func chatMessageRow(_ msg: ChatMessage) -> some View {
        VesperTerminalMessageRow(
            message: msg,
            accentColor: .vesperBlue,
            onSelectOption: { opt in
                let telemetrySummary: String? = profile.privacySettings.isSpaceWeatherTelemetryEnabled ? "SpaceWeather: Kp \(telemetry.spaceWeather.kpIndex)" : nil
                vesper.sendUserMessage(opt, memories: profile.activeMemories, telemetrySummary: telemetrySummary)
            },
            onDeploySpread: { spreadId in
                board.selectSpread(id: spreadId, query: msg.text)
                nav.navigate(to: .tabletop)
            }
        )
    }
    
    // MARK: - Actions
    
    private func sendMessage() {
        let trimmed = inputText.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        
        VesperHapticEngine.shared.triggerTacticalClick()
        VesperSoundEffects.shared.playKeystroke()
        inputText = ""
        
        let telemetrySummary: String?
        if profile.privacySettings.isSpaceWeatherTelemetryEnabled {
            if let w = telemetry.weather {
                telemetrySummary = "SpaceWeather: Kp \(telemetry.spaceWeather.kpIndex), Weather: \(Int(w.temperature))°C"
            } else {
                telemetrySummary = "SpaceWeather: Kp \(telemetry.spaceWeather.kpIndex)"
            }
        } else {
            telemetrySummary = nil
        }
        
        vesper.sendUserMessage(
            trimmed,
            memories: profile.activeMemories,
            telemetrySummary: telemetrySummary
        )
    }
    
    private func currentAffectText() -> String {
        guard let lastMsg = vesper.messages.last(where: { !$0.isUser }), let emotion = lastMsg.emotion else {
            return "NEUTRAL"
        }
        return emotion.rawValue.uppercased()
    }
    
    private func currentAffectColor() -> Color {
        guard let lastMsg = vesper.messages.last(where: { !$0.isUser }), let emotion = lastMsg.emotion else {
            return .evaCyan
        }
        switch emotion {
        case .positive: return .evaCyan
        case .negative, .aggressive: return .magiOrange
        case .embarrassment: return .vesperBlue
        case .neutral: return .evaCyan
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(VesperStore())
        .environmentObject(NavigationStore())
        .environmentObject(BoardStore())
        .environmentObject(ProfileStore())
        .environmentObject(TelemetryStore())
        .environmentObject(NetworkMonitor.shared)
        .preferredColorScheme(.dark)
        .background(Color.voidBlack)
}
