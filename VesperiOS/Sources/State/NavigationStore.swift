// Sources/State/NavigationStore.swift
import SwiftUI
import Combine

public enum AppScreen: String, CaseIterable, Sendable {
    case onboarding = "ONBOARDING"
    case home = "HOME"
    case tabletop = "TABLETOP"
    case profile = "PROFILE"
}

public typealias ScreenType = AppScreen

@MainActor
public final class NavigationStore: ObservableObject {
    @Published public var currentScreen: AppScreen = .onboarding
    
    public init(initialScreen: AppScreen = .onboarding) {
        self.currentScreen = initialScreen
    }
    
    public func navigate(to screen: AppScreen) {
        VesperHapticEngine.shared.triggerTacticalClick()
        withAnimation(.easeInOut(duration: 0.25)) {
            self.currentScreen = screen
        }
    }
}
