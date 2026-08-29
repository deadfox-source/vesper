// Sources/Views/Components/TabBarView.swift
import SwiftUI

public struct TabBarView: View {
    @EnvironmentObject var nav: NavigationStore
    
    public init() {}
    
    public var body: some View {
        VStack(spacing: 0) {
            // Dynamic Top Border Line matching active screen
            Rectangle()
                .fill(currentBorderColor())
                .frame(height: 1.2)
                .accessibilityHidden(true)
            
            // 3 DOS Selection Blocks
            HStack(spacing: 0) {
                // Tab 1: VESPER (Home)
                tabButton(
                    title: "VESPER",
                    iconName: "moon.fill",
                    screen: AppScreen.home,
                    activeBg: Color.vesperBlue
                )
                
                // Tab 2: GRID (Tabletop)
                tabButton(
                    title: "GRID",
                    iconName: "square.grid.2x2.fill",
                    screen: AppScreen.tabletop,
                    activeBg: Color.evaCyan
                )
                
                // Tab 3: INDIVIDUATION (Profile)
                tabButton(
                    title: "INDIVIDUATION",
                    iconName: "clock.arrow.circlepath",
                    screen: AppScreen.profile,
                    activeBg: Color.magiViolet
                )
            }
        }
        .background(
            HStack(spacing: 0) {
                Rectangle()
                    .fill(nav.currentScreen == .home ? Color.vesperBlue : Color.voidBlack)
                Rectangle()
                    .fill(nav.currentScreen == .tabletop ? Color.evaCyan : Color.voidBlack)
                Rectangle()
                    .fill(nav.currentScreen == .profile ? Color.magiViolet : Color.voidBlack)
            }
        )
    }
    
    private func tabButton(
        title: String,
        iconName: String,
        screen: AppScreen,
        activeBg: Color
    ) -> some View {
        let isActive = nav.currentScreen == screen
        
        return Button(action: {
            VesperHapticEngine.shared.triggerTacticalClick()
            nav.navigate(to: screen)
        }) {
            VStack(spacing: 3) {
                Image(systemName: iconName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(isActive ? Color.voidBlack : Color.evaCyan.opacity(0.85))
                
                Text(title)
                    .font(VesperFont.telemetryTag(size: 9))
                    .fontWeight(.bold)
                    .foregroundColor(isActive ? Color.voidBlack : Color.evaCyan.opacity(0.85))
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 7)
            .padding(.bottom, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title) Tab")
        .accessibilityValue(isActive ? "Selected" : "Not selected")
        .accessibilityHint("Double tap to switch to \(title) screen")
        .accessibilityAddTraits(isActive ? [.isButton, .isSelected] : [.isButton])
    }
    
    private func currentBorderColor() -> Color {
        switch nav.currentScreen {
        case .home: return Color.vesperBlue
        case .tabletop: return Color.evaCyan
        case .profile: return Color.magiViolet
        case .onboarding: return Color.warningAmber
        }
    }
}
