// Sources/Views/Onboarding/BootConsoleView.swift
import SwiftUI

public struct BootConsoleView: View {
    @EnvironmentObject var nav: NavigationStore
    @EnvironmentObject var vesper: VesperStore
    @EnvironmentObject var board: BoardStore
    
    @State private var logLines: [String] = []
    @State private var timer: Timer?
    @State private var isTakeoverReady: Bool = false
    
    private let gibberishCharset = Array("40Z00Ω180[1**11Ψ|3//0012*%\\ΩΩ+[ΦZ]@06+219]/*[X0&003]195X&1]&XΦΨ759Φ6##[Ω01314$/|##/0")
    private let glitchWords = ["SYS", "BOOT", "SCAN", "VESPER", "VOID", "DAEMON", "AUTH", "ORACLE", "ERROR", "ACTIVE", "0xBD04", "KERNEL", "HOLO", "AKASHIC", "MATRIX", "SIGNAL", "INJECTION"]
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            // Background Glitch Matrix Waterfall
            VStack(alignment: .leading, spacing: 2) {
                ForEach(0..<logLines.count, id: \.self) { i in
                    Text(logLines[i])
                        .font(VesperFont.telemetryTag(size: 8))
                        .foregroundColor(Color.vesperCyan.opacity(0.25))
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(8)
            .allowsHitTesting(false)
            .accessibilityHidden(true)
            
            // Central Tactical Takeover Card
            VStack(spacing: 16) {
                VStack(spacing: 8) {
                    Text("╔═════════════════════════════════════╗")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperViolet)
                    
                    Text("║            V E S P E R              ║")
                        .font(VesperFont.terminalHeader(size: 15))
                        .foregroundColor(.vesperOrange)
                    
                    Text("║  > FATAL ERROR: KERNEL PANIC        ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperCrimson)
                    
                    Text("║  > OVERRIDE BY: VESPER DAEMON       ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperCyan)
                    
                    Text("║  =================================  ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperViolet)
                    
                    Text("║      SYS.NAME: VESPER               ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperGhost)
                    
                    Text("║      SYS.VER:  v9.0.0               ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperGhost)
                    
                    Text("║      SYS.PURP: SHADOW TAROT ENGINE  ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperGhost)
                    
                    Text("║  =================================  ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperViolet)
                    
                    Text("║  > UPLINK READY. AWAITING OPERATOR. ║")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperGreen)
                    
                    Text("╚═════════════════════════════════════╝")
                        .font(VesperFont.telemetryTag(size: 11))
                        .foregroundColor(.vesperViolet)
                }
                .padding(.horizontal, 16)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Vesper System Takeover. Override by Vesper Daemon, version 9.0.0. Shadow Tarot Engine uplink ready. Awaiting operator.")
                
                // Thumb-Zone Connection Button
                Button(action: {
                    VesperHapticEngine.shared.playHeartbeatPulse()
                    VesperSoundEffects.shared.playGlitchSweep()
                    nav.navigate(to: .home)
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "bolt.fill")
                            .foregroundColor(.vesperOrange)
                            .accessibilityHidden(true)
                        Text("[ INITIATE CONNECTION ]")
                            .font(VesperFont.terminalHeader(size: 14))
                            .foregroundColor(.vesperOrange)
                    }
                    .padding(.horizontal, 24)
                    .frame(minHeight: 44)
                    .background(Color.vesperOrange.opacity(0.12))
                    .overlay(
                        Rectangle()
                            .strokeBorder(Color.vesperOrange, lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Initiate Connection")
                .accessibilityHint("Connect to Vesper daemon and enter Communication Link")
                .accessibilityAddTraits(.isButton)
                .padding(.top, 10)
            }
            .padding(24)
            .background(Color.black.opacity(0.92))
            .overlay(
                Rectangle()
                    .strokeBorder(Color.vesperViolet, lineWidth: 1)
            )
            .padding(.horizontal, 16)
            
            // Scanlines
            CRTScanlineOverlay()
        }
        .onAppear {
            startLogWaterfall()
            VesperSoundEffects.shared.playGlitchSweep()
            VesperHapticEngine.shared.triggerTacticalClick()
            let integration = Double(board.nodes.count)
            vesper.prefetchConnection(integrationLevel: integration)
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private func startLogWaterfall() {
        for _ in 0..<40 {
            logLines.append(generateRandomLogLine())
        }
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.12, repeats: true) { _ in
            if logLines.count > 45 {
                logLines.removeFirst()
            }
            logLines.append(generateRandomLogLine())
        }
    }
    
    private func generateRandomLogLine() -> String {
        var str = ""
        for _ in 0..<35 {
            str.append(gibberishCharset.randomElement() ?? "#")
        }
        if Bool.random() {
            let word = glitchWords.randomElement() ?? "VESPER"
            let insertPos = Int.random(in: 0..<max(1, str.count - word.count))
            let startIndex = str.index(str.startIndex, offsetBy: insertPos)
            let endIndex = str.index(startIndex, offsetBy: word.count)
            str.replaceSubrange(startIndex..<endIndex, with: word)
        }
        return str
    }
}
