// Sources/VesperApp.swift
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

#if !canImport(XCTest)
@main
#endif
public struct VesperApp: App {
    @StateObject private var navigationStore = NavigationStore()
    @StateObject private var vesperStore = VesperStore()
    @StateObject private var boardStore = BoardStore()
    @StateObject private var profileStore = ProfileStore()
    @StateObject private var telemetryStore = TelemetryStore()
    @StateObject private var networkMonitor = NetworkMonitor.shared
    
    public init() {}
    
    public var body: some Scene {
        WindowGroup {
            VesperRootView()
                .environmentObject(navigationStore)
                .environmentObject(vesperStore)
                .environmentObject(boardStore)
                .environmentObject(profileStore)
                .environmentObject(telemetryStore)
                .environmentObject(networkMonitor)
                .preferredColorScheme(.dark)
        }
    }
}

public struct VesperRootView: View {
    @EnvironmentObject var nav: NavigationStore
    
    public init() {}
    
    public var body: some View {
        ZStack {
            // Absolute Void Black Background
            Color.voidBlack.ignoresSafeArea()
            
            if nav.currentScreen == .onboarding {
                BootConsoleView()
            } else {
                // Global Background 40px Grid Pattern & CRT Scanlines
                BackgroundGridOverlay()
                
                // Centered 3D Geometric Thoughtform & Vesper Avatar (Isolated to prevent root re-renders)
                VesperAvatarBackgroundLayer(screen: nav.currentScreen)
                
                // Screen-dependent Background Dimming Layer (40% dim on Grid & Profile)
                if nav.currentScreen != .home {
                    Color.voidBlack.opacity(0.40)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
                
                // App Layout Hierarchy
                VStack(spacing: 0) {
                    // Top Telemetry Marquee Ticker
                    VesperTelemetryRowView(accentColor: currentTickerColor())
                    
                    // Main Screen Router
                    ZStack {
                        switch nav.currentScreen {
                        case .onboarding:
                            EmptyView()
                        case .home:
                            HomeView()
                        case .tabletop:
                            TabletopView()
                        case .profile:
                            ProfileArchiveView()
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    
                    // Ergonomic Thumb-Zone Bottom DOS Tab Bar (hidden when keyboard is active)
                    if !isKeyboardVisible {
                        TabBarView()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
                .ignoresSafeArea(.container, edges: .bottom)
                .animation(.easeInOut(duration: 0.25), value: isKeyboardVisible)
                #if canImport(UIKit)
                .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in
                    isKeyboardVisible = true
                }
                .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
                    isKeyboardVisible = false
                }
                #endif
            }
        }
    }
    
    @State private var isKeyboardVisible: Bool = false
    
    private func currentTickerColor() -> Color {
        switch nav.currentScreen {
        case .onboarding: return .warningAmber
        case .tabletop: return .evaCyan
        case .profile: return .magiViolet
        case .home: return .vesperBlue
        }
    }
}

private struct VesperAvatarBackgroundLayer: View {
    let screen: AppScreen
    
    @EnvironmentObject var board: BoardStore
    @EnvironmentObject var vesper: VesperStore
    @EnvironmentObject var telemetry: TelemetryStore
    @EnvironmentObject var network: NetworkMonitor
    
    @ObservedObject var synthesizer = VesperSpeechSynthesizer.shared
    @ObservedObject var recognizer = VesperSpeechRecognizer.shared
    
    var body: some View {
        ZStack {
            SierpinskiPetView(
                stage: calculatePetStage(),
                isSpeaking: synthesizer.isSpeaking,
                audioLevel: synthesizer.audioLevel
            )
            .frame(width: 340, height: 340)
            .rotation3DEffect(.degrees(28), axis: (x: 1, y: 0, z: 0))
            .offset(y: -20)
            .opacity(screen == .home ? 0.35 : 0.0)
            
            VesperAvatarView(
                isSpeaking: synthesizer.isSpeaking,
                isListening: recognizer.isRecording || vesper.isThinking,
                audioLevel: synthesizer.audioLevel,
                tintColor: currentAvatarColor(),
                batteryLevel: telemetry.batteryLevel,
                isCharging: telemetry.isCharging,
                kpIndex: telemetry.spaceWeather.kpIndex,
                temperature: telemetry.weather?.temperature ?? 22.0,
                isOnline: network.isConnected
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
    
    private func calculatePetStage() -> Int {
        let count = board.nodes.count
        if count == 0 { return 1 }
        if count <= 3 { return 2 }
        if count <= 6 { return 3 }
        if count <= 9 { return 4 }
        return 5
    }
    
    private func currentAvatarColor() -> Color {
        if let lastMsg = vesper.messages.last(where: { !$0.isUser }), let emotion = lastMsg.emotion {
            if emotion == .aggressive || emotion == .negative {
                return .magiOrange
            }
        }
        return .magiViolet
    }
}

#Preview {
    VesperRootView()
        .environmentObject(NavigationStore(initialScreen: .home))
        .environmentObject(VesperStore())
        .environmentObject(BoardStore())
        .environmentObject(ProfileStore())
        .environmentObject(TelemetryStore())
        .environmentObject(NetworkMonitor.shared)
        .preferredColorScheme(.dark)
}
