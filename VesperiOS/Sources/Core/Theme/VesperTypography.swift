// Sources/Core/Theme/VesperTypography.swift
import SwiftUI

public struct VesperFont {
    public static func terminalHeader(size: CGFloat = 16) -> Font {
        .system(size: size, weight: .bold, design: .monospaced)
    }
    
    public static func terminalBody(size: CGFloat = 13) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
    
    public static func telemetryTag(size: CGFloat = 10) -> Font {
        .system(size: size, weight: .semibold, design: .monospaced)
    }
    
    public static func cardTitle(size: CGFloat = 14) -> Font {
        .system(size: size, weight: .heavy, design: .monospaced)
    }
    
    public static func bannerLarge(size: CGFloat = 22) -> Font {
        .system(size: size, weight: .black, design: .monospaced)
    }
    
    // Dynamic Type Accessible Styles (Scales with user accessibility text preferences)
    public static var headlineAccessible: Font {
        .system(.headline, design: .monospaced, weight: .bold)
    }
    
    public static var bodyAccessible: Font {
        .system(.body, design: .monospaced, weight: .medium)
    }
    
    public static var captionAccessible: Font {
        .system(.caption, design: .monospaced, weight: .semibold)
    }
    
    public static var subheadlineAccessible: Font {
        .system(.subheadline, design: .monospaced, weight: .regular)
    }
}

public struct VesperTerminalStyle: ViewModifier {
    public var borderColor: Color = .vesperCyan
    public var backgroundColor: Color = .vesperVoid
    public var cornerRadius: CGFloat = 0 // Strict angular acid aesthetic
    public var borderWidth: CGFloat = 1
    
    public func body(content: Content) -> some View {
        content
            .background(backgroundColor)
            .overlay(
                Rectangle()
                    .strokeBorder(borderColor, lineWidth: borderWidth)
            )
    }
}

public extension View {
    func vesperTerminalFrame(borderColor: Color = .vesperCyan, backgroundColor: Color = .vesperVoid, borderWidth: CGFloat = 1) -> some View {
        self.modifier(VesperTerminalStyle(borderColor: borderColor, backgroundColor: backgroundColor, borderWidth: borderWidth))
    }
}
