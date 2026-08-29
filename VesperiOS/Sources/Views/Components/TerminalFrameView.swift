// Sources/Views/Components/TerminalFrameView.swift
import SwiftUI

public struct TerminalFrameView<Content: View>: View {
    public let title: String
    public var headerSubtitle: String?
    public var accentColor: Color = .vesperBlue
    public let content: Content
    
    public init(
        title: String,
        headerSubtitle: String? = nil,
        accentColor: Color = .vesperBlue,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.headerSubtitle = headerSubtitle
        self.accentColor = accentColor
        self.content = content()
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // Header Bar
            HStack {
                HStack(spacing: 4) {
                    Text(">")
                        .font(VesperFont.telemetryTag(size: 10))
                        .fontWeight(.bold)
                        .foregroundColor(.voidBlack)
                        .accessibilityHidden(true)
                    Text(title.uppercased())
                        .font(VesperFont.telemetryTag(size: 10))
                        .fontWeight(.bold)
                        .foregroundColor(.voidBlack)
                }
                
                Spacer()
                
                if let subtitle = headerSubtitle {
                    Text(subtitle)
                        .font(VesperFont.telemetryTag(size: 9))
                        .foregroundColor(.voidBlack.opacity(0.85))
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(accentColor)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
            .accessibilityLabel(headerSubtitle != nil ? "\(title), \(headerSubtitle!)" : title)
            
            // Content Body (Strict Solid Black Background, Sharp 1px Border, No Glow)
            content
                .background(Color.voidBlack)
        }
        .border(accentColor, width: 1)
    }
}
