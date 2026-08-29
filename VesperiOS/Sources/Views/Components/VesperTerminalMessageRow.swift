// Sources/Views/Components/VesperTerminalMessageRow.swift
import SwiftUI

public struct VesperTerminalMessageRow: View {
    public let message: ChatMessage
    public var accentColor: Color
    public var onSelectOption: ((String) -> Void)?
    public var onDeploySpread: ((String) -> Void)?
    
    public init(
        message: ChatMessage,
        accentColor: Color = .vesperBlue,
        onSelectOption: ((String) -> Void)? = nil,
        onDeploySpread: ((String) -> Void)? = nil
    ) {
        self.message = message
        self.accentColor = accentColor
        self.onSelectOption = onSelectOption
        self.onDeploySpread = onDeploySpread
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Determine message type & layout
            if message.role == .system || isSystemFormatted(message.text) {
                systemMessageView()
            } else if message.isUser {
                userMessageView()
            } else {
                vesperMessageView()
            }
            
            // Suggested Spread Interactive Action (Strict validation against literal "null")
            if let spreadId = message.suggestedSpreadId, isValidString(spreadId) {
                suggestedSpreadView(spreadId: spreadId, rationale: message.suggestedSpreadRationale)
            }
            
            // Interactive Option Chips
            if let options = message.options, !options.isEmpty {
                optionsChipsView(options: options)
            }
        }
        .padding(.vertical, 2)
    }
    
    // MARK: - 1. System Notices Format
    
    private func systemMessageView() -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Text("> [ SYSTEM ]")
                    .font(VesperFont.telemetryTag(size: 9))
                    .fontWeight(.bold)
                    .foregroundColor(.evaCyan)
                
                Spacer()
                
                Text(message.timestamp)
                    .font(VesperFont.telemetryTag(size: 7.5))
                    .foregroundColor(.vesperMuted)
            }
            
            Text(message.text)
                .font(VesperFont.terminalBody(size: 11.5))
                .foregroundColor(.ghostWhite.opacity(0.85))
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("System message: \(message.text)")
    }
    
    // MARK: - 2. User Chat (Operator) Format with Stylized ASCII Framing
    
    private func userMessageView() -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text("┌── [ OPERATOR ]")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundColor(.evaCyan)
                
                Text("──────────────────")
                    .font(.system(size: 8.5, design: .monospaced))
                    .foregroundColor(.evaCyan.opacity(0.35))
                    .lineLimit(1)
                
                Spacer()
                
                Text(message.timestamp)
                    .font(VesperFont.telemetryTag(size: 7.5))
                    .foregroundColor(.vesperMuted)
            }
            
            HStack(alignment: .top, spacing: 6) {
                Text("│ >")
                    .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                    .foregroundColor(.evaCyan.opacity(0.85))
                
                Text(message.text)
                    .font(VesperFont.terminalBody(size: 11.5))
                    .foregroundColor(.ghostWhite)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.leading, 2)
            
            Text("└─────────────────────────────────────────")
                .font(.system(size: 8, design: .monospaced))
                .foregroundColor(.evaCyan.opacity(0.3))
                .lineLimit(1)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Operator: \(message.text)")
    }
    
    // MARK: - 3. Vesper Message Format (Card Inquiry or Tactical Speech)
    
    private func vesperMessageView() -> some View {
        let cleanText = sanitizeMessageText(message.text)
        
        if let parsed = parseCardPrompt(from: cleanText) {
            return AnyView(cardInquiryPromptView(parsed: parsed))
        }
        
        let isClarification = cleanText.lowercased().contains("archetype") || 
                              cleanText.lowercased().contains("vector") || 
                              cleanText.lowercased().contains("card") ||
                              cleanText.lowercased().contains("polarity")
        let headerTitle = isClarification ? "> VESPER CLARIFICATION:" : "> VESPER:"
        
        return AnyView(
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(headerTitle)
                        .font(VesperFont.telemetryTag(size: 9))
                        .fontWeight(.bold)
                        .foregroundColor(accentColor)
                    
                    Spacer()
                    
                    Text(message.timestamp)
                        .font(VesperFont.telemetryTag(size: 7.5))
                        .foregroundColor(.vesperMuted)
                }
                
                Text(cleanText)
                    .font(VesperFont.terminalBody(size: 11.5))
                    .foregroundColor(.ghostWhite)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Vesper said: \(cleanText)")
        )
    }
    
    // MARK: - 3b. Stylized Text-Only Card Inquiry Frame
    
    private func cardInquiryPromptView(parsed: ParsedCardPrompt) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            // Header Top Bar with Node Number & Title
            HStack(spacing: 4) {
                Text("┌── [ NODE #\(parsed.nodeNum) · \(parsed.nodeTitle) ]")
                    .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                    .foregroundColor(.magiOrange)
                
                Text("──────────────────")
                    .font(.system(size: 8.5, design: .monospaced))
                    .foregroundColor(.evaCyan.opacity(0.35))
                    .lineLimit(1)
                
                Spacer()
                
                Text(message.timestamp)
                    .font(VesperFont.telemetryTag(size: 7.5))
                    .foregroundColor(.vesperMuted)
            }
            
            // Archetype Highlight
            HStack(spacing: 4) {
                Text("│ ARCHETYPE:")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundColor(.evaCyan.opacity(0.85))
                
                Text("[ \(parsed.cardName) ]")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundColor(.ghostWhite)
            }
            .padding(.leading, 2)
            
            // Facet / Theme (if present)
            if let theme = parsed.theme, !theme.isEmpty {
                HStack(spacing: 4) {
                    Text("│ > FACET:")
                        .font(.system(size: 8.5, weight: .bold, design: .monospaced))
                        .foregroundColor(.magiViolet)
                    Text(theme)
                        .font(VesperFont.terminalBody(size: 10))
                        .foregroundColor(.ghostWhite.opacity(0.9))
                }
                .padding(.leading, 2)
            }
            
            // Inquiry Question Body
            VStack(alignment: .leading, spacing: 2) {
                Text("│ > INQUIRY VECTOR:")
                    .font(.system(size: 8.5, weight: .bold, design: .monospaced))
                    .foregroundColor(.warningAmber)
                
                Text(parsed.promptBody)
                    .font(VesperFont.terminalBody(size: 11.5))
                    .foregroundColor(.ghostWhite)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.leading, 8)
            }
            .padding(.leading, 2)
            .padding(.top, 1)
            
            // Terminal ASCII rule footer
            Text("└─────────────────────────────────────────")
                .font(.system(size: 8, design: .monospaced))
                .foregroundColor(.evaCyan.opacity(0.3))
                .lineLimit(1)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Node \(parsed.nodeNum) card prompt for \(parsed.cardName): \(parsed.promptBody)")
    }
    
    // MARK: - 4. Suggested Spread Inline Action
    
    private func suggestedSpreadView(spreadId: String, rationale: String?) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("> SPREAD RECOM: [ \(spreadId) ]")
                .font(VesperFont.telemetryTag(size: 9))
                .fontWeight(.bold)
                .foregroundColor(.magiOrange)
            
            if let r = rationale, isValidString(r) {
                Text(r)
                    .font(VesperFont.terminalBody(size: 11))
                    .foregroundColor(.ghostWhite.opacity(0.80))
                    .lineLimit(2)
            }
            
            Button(action: {
                VesperHapticEngine.shared.triggerTacticalClick()
                onDeploySpread?(spreadId)
            }) {
                HStack(spacing: 4) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 9))
                    Text("[ DEPLOY SPREAD ]")
                        .font(VesperFont.telemetryTag(size: 9.5))
                        .fontWeight(.bold)
                }
                .foregroundColor(.voidBlack)
                .padding(.horizontal, 12)
                .frame(height: 32)
                .background(Color.evaCyan)
                .border(Color.evaCyan, width: 1)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Deploy suggested spread \(spreadId)")
            .accessibilityHint("Switches to Grid tabletop and initializes this spread")
            .accessibilityAddTraits(.isButton)
        }
        .padding(.vertical, 2)
    }
    
    // MARK: - 5. Standardized Option Chips
    
    private func optionsChipsView(options: [String]) -> some View {
        let validOptions = options.filter { isValidString($0) }
        guard !validOptions.isEmpty else { return AnyView(EmptyView()) }
        
        return AnyView(
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(validOptions, id: \.self) { opt in
                        Button(action: {
                            VesperHapticEngine.shared.triggerTacticalClick()
                            onSelectOption?(opt)
                        }) {
                            HStack(spacing: 4) {
                                Text(">")
                                    .font(VesperFont.telemetryTag(size: 9))
                                    .foregroundColor(.magiOrange)
                                    .accessibilityHidden(true)
                                Text(opt)
                                    .font(VesperFont.telemetryTag(size: 9.5))
                                    .foregroundColor(.evaCyan)
                                    .lineLimit(1)
                            }
                            .padding(.horizontal, 10)
                            .frame(height: 32)
                            .background(Color.voidBlack)
                            .border(Color.evaCyan.opacity(0.6), width: 1)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Suggested topic: \(opt)")
                        .accessibilityHint("Sends this message prompt to Vesper")
                        .accessibilityAddTraits(.isButton)
                    }
                }
                .padding(.vertical, 2)
            }
        )
    }
    
    // MARK: - Helpers
    
    private func isSystemFormatted(_ text: String) -> Bool {
        text.hasPrefix("[ CONNECTION ESTABLISHED ]") ||
        text.hasPrefix("[ SYSTEM ]") ||
        text.hasPrefix("[ INITIALIZATION ]") ||
        text.hasPrefix("[ SYNTHESIS READY ]")
    }
    
    private func isValidString(_ str: String?) -> Bool {
        guard let s = str?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else { return false }
        let lower = s.lowercased()
        return lower != "null" && lower != "nil" && lower != "undefined" && lower != "none"
    }
    
    private func sanitizeMessageText(_ rawText: String) -> String {
        var clean = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.hasPrefix("```json") {
            clean = clean.replacingOccurrences(of: "```json", with: "")
        }
        if clean.hasPrefix("```") {
            clean = clean.replacingOccurrences(of: "```", with: "")
        }
        if clean.hasSuffix("```") {
            clean = String(clean.dropLast(3))
        }
        clean = clean.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if clean.hasPrefix("{") && clean.contains("\"text\"") {
            if let regex = try? NSRegularExpression(pattern: "\"text\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"", options: []) {
                let ns = clean as NSString
                if let match = regex.firstMatch(in: clean, options: [], range: NSRange(location: 0, length: ns.length)),
                   match.numberOfRanges > 1 {
                    let extracted = ns.substring(with: match.range(at: 1))
                        .replacingOccurrences(of: "\\n", with: "\n")
                        .replacingOccurrences(of: "\\\"", with: "\"")
                    if !extracted.isEmpty {
                        return extracted
                    }
                }
            }
        }
        return clean
    }
    
    private struct ParsedCardPrompt {
        let nodeNum: String
        let nodeTitle: String
        let cardName: String
        let theme: String?
        let promptBody: String
    }
    
    private func parseCardPrompt(from text: String) -> ParsedCardPrompt? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("Node #") || trimmed.hasPrefix("NODE #") || trimmed.hasPrefix("Node ") || trimmed.hasPrefix("NODE ") else { return nil }
        
        let lines = trimmed.components(separatedBy: "\n")
        guard let header = lines.first else { return nil }
        
        // Pattern matches: Node #1 (TITLE): [ CARD ] or Node #1: [ CARD ]
        let pattern = #"^(?:Node|NODE)\s*#?(\d+)\s*(?:\((.*?)\))?:\s*\[\s*(.*?)\s*\]"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else { return nil }
        let nsString = header as NSString
        guard let match = regex.firstMatch(in: header, options: [], range: NSRange(location: 0, length: nsString.length)) else {
            return nil
        }
        
        let nodeNum = nsString.substring(with: match.range(at: 1))
        let nodeTitle = match.range(at: 2).location != NSNotFound ? nsString.substring(with: match.range(at: 2)).trimmingCharacters(in: .whitespaces) : "ACTIVE VECTOR"
        let cardName = match.range(at: 3).location != NSNotFound ? nsString.substring(with: match.range(at: 3)).trimmingCharacters(in: .whitespaces) : "ARCHETYPE"
        
        let rawBody = lines.dropFirst().joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !rawBody.isEmpty else {
            return ParsedCardPrompt(nodeNum: nodeNum, nodeTitle: nodeTitle.uppercased(), cardName: cardName.uppercased(), theme: nil, promptBody: header)
        }
        
        var theme: String? = nil
        var promptBody = rawBody
        
        if let colonIdx = rawBody.firstIndex(of: ":") {
            let distance = rawBody.distance(from: rawBody.startIndex, to: colonIdx)
            if distance > 2 && distance < 35 {
                let candidateTheme = String(rawBody[..<colonIdx]).trimmingCharacters(in: .whitespaces)
                let candidatePrompt = String(rawBody[rawBody.index(after: colonIdx)...]).trimmingCharacters(in: .whitespaces)
                if !candidatePrompt.isEmpty && !candidateTheme.contains("\n") {
                    theme = candidateTheme
                    promptBody = candidatePrompt
                }
            }
        }
        
        return ParsedCardPrompt(
            nodeNum: nodeNum,
            nodeTitle: nodeTitle.uppercased(),
            cardName: cardName.uppercased(),
            theme: theme?.uppercased(),
            promptBody: promptBody
        )
    }
}
