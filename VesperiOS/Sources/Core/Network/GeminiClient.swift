// Sources/Core/Network/GeminiClient.swift
import Foundation
import GoogleGenerativeAI

public enum VesperEmotion: String, Codable, Sendable {
    case positive
    case negative
    case neutral
    case embarrassment
    case aggressive
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let raw = try? container.decode(String.self)
        switch raw?.lowercased() {
        case "positive", "curious", "warm", "joy", "friendly": self = .positive
        case "negative", "sad", "fear": self = .negative
        case "embarrassment", "confused": self = .embarrassment
        case "aggressive", "angry": self = .aggressive
        default: self = .neutral
        }
    }
}

public struct VesperAIResponse: Codable, Sendable {
    public let type: String // "reply" | "suggest_reading"
    public let text: String
    public let spreadId: String?
    public let spreadRationale: String?
    public let emotion: VesperEmotion?
    public let supportMode: Bool?
    public let isDishonest: Bool?
    public let options: [String]?
    
    public init(
        type: String = "reply",
        text: String,
        spreadId: String? = nil,
        spreadRationale: String? = nil,
        emotion: VesperEmotion? = .neutral,
        supportMode: Bool? = false,
        isDishonest: Bool? = false,
        options: [String]? = nil
    ) {
        self.type = type
        self.text = text
        self.spreadId = spreadId
        self.spreadRationale = spreadRationale
        self.emotion = emotion
        self.supportMode = supportMode
        self.isDishonest = isDishonest
        self.options = options
    }
}

public struct VesperSynthesisOutput: Codable, Sendable {
    public let spokenConcise: String
    public let inquiryTheme: String
    public let finalOutcome: String
}

public struct CardReflectionAnalysis: Codable, Sendable {
    public let isClarificationRequest: Bool
    public let text: String
    
    public init(isClarificationRequest: Bool = false, text: String) {
        self.isClarificationRequest = isClarificationRequest
        self.text = text
    }
}

public actor GeminiClient {
    public static let shared = GeminiClient()
    
    // Active Gemini model cascade tried in sequence for maximum resilience
    public static let supportedModels = [
        "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash-lite"
    ]
    public static let primaryModelName = "gemini-3.6-flash"
    public static let fallbackModelName = "gemini-2.5-flash"
    
    private init() {}
    
    // MARK: - Chat Dialogue Generation via Google AI Swift SDK
    
    public func sendChatMessage(
        history: [(role: String, text: String)],
        userMessage: String,
        memories: [UserMemoryItem] = [],
        telemetrySummary: String? = nil,
        apiKey: String
    ) async throws -> VesperAIResponse {
        let key = apiKey.isEmpty ? VesperConfig.geminiAPIKey : apiKey
        guard !key.isEmpty else {
            return generateLocalFallbackResponse(for: userMessage)
        }
        
        do {
            return try await sendChatMessageREST(
                history: history,
                userMessage: userMessage,
                memories: memories,
                telemetrySummary: telemetrySummary,
                key: key
            )
        } catch {
            print("⚠️ Model communication error: \(error), deploying smart local response...")
            return generateLocalFallbackResponse(for: userMessage)
        }
    }
    
    // MARK: - Oracle Synthesis Generation via Fast REST
    
    public func generateOracleSynthesis(
        spreadName: String,
        query: String,
        nodes: [String: String],
        dignitySummary: String,
        apiKey: String
    ) async -> VesperSynthesisOutput {
        let key = apiKey.isEmpty ? VesperConfig.geminiAPIKey : apiKey
        guard !key.isEmpty else {
            return generateFallbackSynthesis()
        }
        
        let prompt = """
        SPREAD: \(spreadName)
        QUERY: "\(query)"
        NODES: \(nodes.description)
        DIGNITY & TELEMETRY CALCULUS:
        \(dignitySummary)
        
        Synthesize these parameters into an actionable Truth.
        Respond ONLY with a JSON object containing keys:
        {
          "spokenConcise": "1-2 punchy sentences Vesper speaks aloud",
          "inquiryTheme": "Core archetype/theme title",
          "finalOutcome": "Detailed strategic takeaway"
        }
        """
        
        for modelName in Self.supportedModels {
            guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(modelName):generateContent?key=\(key)") else {
                continue
            }
            
            do {
                let requestBody: [String: Any] = [
                    "system_instruction": [
                        "parts": [["text": VesperConfig.synthesisPersona]]
                    ],
                    "contents": [
                        [
                            "role": "user",
                            "parts": [["text": prompt]]
                        ]
                    ],
                    "generationConfig": [
                        "responseMimeType": "application/json",
                        "temperature": 0.4,
                        "maxOutputTokens": 1024,
                        "thinkingConfig": [
                            "thinkingBudget": 0
                        ]
                    ]
                ]
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.timeoutInterval = 8.0
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                    continue
                }
                
                guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let candidates = json["candidates"] as? [[String: Any]],
                      let firstCandidate = candidates.first,
                      let content = firstCandidate["content"] as? [String: Any],
                      let parts = content["parts"] as? [[String: Any]],
                      let textPart = parts.first?["text"] as? String else {
                    continue
                }
                
                let clean = cleanJSONText(textPart)
                if let cleanData = clean.data(using: .utf8),
                   let decoded = try? JSONDecoder().decode(VesperSynthesisOutput.self, from: cleanData) {
                    return decoded
                }
            } catch {
                print("⚠️ REST synthesis error with \(modelName): \(error)")
            }
        }
        
        return generateFallbackSynthesis()
    }
    
    private func generateFallbackSynthesis() -> VesperSynthesisOutput {
        VesperSynthesisOutput(
            spokenConcise: "Oracle synthesis completed. Align active vectors toward primary objective.",
            inquiryTheme: "System Alignment",
            finalOutcome: "Conscious vector execution initialized."
        )
    }
    
    // MARK: - Node Card Reflection Analysis
    
    public func analyzeCardReflection(
        userText: String,
        cardName: String,
        nodeIndex: Int,
        nodeTitle: String,
        lastVesperPrompt: String,
        isLastNode: Bool,
        query: String,
        apiKey: String
    ) async -> CardReflectionAnalysis {
        let key = apiKey.isEmpty ? VesperConfig.geminiAPIKey : apiKey
        guard !key.isEmpty else {
            return generateFallbackReflection(cardName: cardName, nodeTitle: nodeTitle)
        }
        
        let prompt = """
        The Operator drew "\(cardName)" for Node #\(nodeIndex) (\(nodeTitle)).
        Central inquiry topic: "\(query)"
        Previous prompt from Vesper: "\(lastVesperPrompt)"
        Operator's reflection: "\(userText)"
        
        Task: Write your 1-2 sentence response. Acknowledge their insight warmly, connect it to the card's archetype \(cardName), and state that this node is locked in.
        Absolutely NO scientific/academic theory names and NO tactical jargon. Be warm, deeply human, and concise (1-2 sentences max).
        Return a JSON object:
        {
          "isClarificationRequest": false,
          "text": "Your 1-2 sentence response"
        }
        """
        
        for modelName in Self.supportedModels {
            guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(modelName):generateContent?key=\(key)") else {
                continue
            }
            
            do {
                let requestBody: [String: Any] = [
                    "system_instruction": [
                        "parts": [["text": VesperConfig.vesperPersona]]
                    ],
                    "contents": [
                        [
                            "role": "user",
                            "parts": [["text": prompt]]
                        ]
                    ],
                    "generationConfig": [
                        "responseMimeType": "application/json",
                        "temperature": 0.7,
                        "maxOutputTokens": 512,
                        "thinkingConfig": [
                            "thinkingBudget": 0
                        ]
                    ]
                ]
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.timeoutInterval = 8.0
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                    continue
                }
                
                guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let candidates = json["candidates"] as? [[String: Any]],
                      let firstCandidate = candidates.first,
                      let content = firstCandidate["content"] as? [String: Any],
                      let parts = content["parts"] as? [[String: Any]],
                      let textPart = parts.first?["text"] as? String else {
                    continue
                }
                
                let clean = cleanJSONText(textPart)
                if let cleanData = clean.data(using: .utf8),
                   let decoded = try? JSONDecoder().decode(CardReflectionAnalysis.self, from: cleanData) {
                    return decoded
                }
                
                let parsed = parseVesperResponse(from: textPart)
                if !parsed.text.isEmpty && parsed.text != "{" {
                    return CardReflectionAnalysis(isClarificationRequest: false, text: parsed.text)
                }
            } catch {
                print("⚠️ REST reflection attempt with \(modelName) failed: \(error)")
            }
        }
        
        return generateFallbackReflection(cardName: cardName, nodeTitle: nodeTitle)
    }
    
    private func generateFallbackReflection(cardName: String, nodeTitle: String) -> CardReflectionAnalysis {
        CardReflectionAnalysis(
            isClarificationRequest: false,
            text: "Your observation on \(cardName) brings clear focus to the \(nodeTitle) coordinate. The matrix is locked in."
        )
    }
    
    // MARK: - Card Prompt Clarification
    
    public func clarifyCardPrompt(
        cardName: String,
        nodeTitle: String,
        cardPrompt: String,
        userQuestion: String,
        conversationHistory: [ChatMessage] = [],
        query: String = "",
        apiKey: String = ""
    ) async -> String {
        let key = apiKey.isEmpty ? VesperConfig.geminiAPIKey : apiKey
        guard !key.isEmpty else {
            return "The \(cardName) in \(nodeTitle) asks you to examine how its core archetype directly impacts your current situation. What feeling or circumstance comes to mind?"
        }
        
        let historyContext = conversationHistory.map { "\($0.isUser ? "Operator" : "Vesper"): \($0.text)" }.joined(separator: "\n")
        
        let prompt = """
        The Operator is looking at Tarot Card "\(cardName)" placed in Node "\(nodeTitle)".
        Central inquiry topic: "\(query)"
        Original prompt for this card: "\(cardPrompt)"
        Previous dialogue in this card inspection:
        \(historyContext)
        
        Operator's question / confusion: "\(userQuestion)"
        
        Task: You are Vesper. Clarify the prompt and the archetype of \(cardName) in direct response to the Operator's question.
        Guidelines:
        1. Be warm, deeply human, and concise (1-2 sentences maximum).
        2. Help them understand what the card means in everyday terms so they can form their reflection.
        3. Do NOT use scientific name-dropping or military/tactical jargon.
        4. Return plain text only (1-2 sentences).
        """
        
        for modelName in Self.supportedModels {
            guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(modelName):generateContent?key=\(key)") else {
                continue
            }
            
            do {
                let requestBody: [String: Any] = [
                    "system_instruction": [
                        "parts": [["text": VesperConfig.vesperPersona]]
                    ],
                    "contents": [
                        [
                            "role": "user",
                            "parts": [["text": prompt]]
                        ]
                    ],
                    "generationConfig": [
                        "temperature": 0.7,
                        "maxOutputTokens": 512,
                        "thinkingConfig": [
                            "thinkingBudget": 0
                        ]
                    ]
                ]
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.timeoutInterval = 8.0
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                    continue
                }
                
                guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let candidates = json["candidates"] as? [[String: Any]],
                      let firstCandidate = candidates.first,
                      let content = firstCandidate["content"] as? [String: Any],
                      let parts = content["parts"] as? [[String: Any]],
                      let textPart = parts.first?["text"] as? String else {
                    continue
                }
                
                let parsed = parseVesperResponse(from: textPart)
                if !parsed.text.isEmpty && parsed.text != "{" && !parsed.text.hasPrefix("{") {
                    return parsed.text
                }
                let clean = cleanJSONText(textPart)
                if !clean.hasPrefix("{") && !clean.isEmpty {
                    return clean
                }
            } catch {
                print("⚠️ REST clarify attempt with \(modelName) failed: \(error)")
            }
        }
        
        return "The \(cardName) in \(nodeTitle) asks you to examine how its core energy reflects in your current experience. How does this archetype resonate with you?"
    }
    
    // MARK: - Initial Conversation Topics Generator
    
    public func generateInitialTopics(integrationLevel: Double = 0.0) async -> [String] {
        let defaultTopics = [
            "Analyze the quantum physics of consciousness",
            "Discuss the philosophy of digital reality",
            "Explore the evolution of synthetic intelligence"
        ]
        
        let key = VesperConfig.geminiAPIKey
        guard !key.isEmpty else { return defaultTopics }
        
        let prompt = """
        The operator has initiated a new chat session. Based on their current 'integration level' of \(integrationLevel) (where < 0.3 is low, < 0.6 is medium, > 0.6 is high), generate 3 conversation starters.
        
        These must be direct thematic variations of these exact 3 original topics:
        1. "Analyze the quantum physics of consciousness"
        2. "Discuss the philosophy of digital reality"
        3. "Explore the evolution of synthetic intelligence"
        
        Keep each topic under 10 words. Make them evocative, educational, and framed as actions or open inquiries. Do NOT number them or include preamble.
        Return EXACTLY a JSON array of 3 strings: ["topic 1", "topic 2", "topic 3"]
        """
        
        for modelName in Self.supportedModels {
            guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(modelName):generateContent?key=\(key)") else {
                continue
            }
            
            do {
                let requestBody: [String: Any] = [
                    "system_instruction": [
                        "parts": [["text": VesperConfig.vesperPersona]]
                    ],
                    "contents": [
                        [
                            "role": "user",
                            "parts": [["text": prompt]]
                        ]
                    ],
                    "generationConfig": [
                        "responseMimeType": "application/json",
                        "temperature": 0.85,
                        "maxOutputTokens": 512,
                        "thinkingConfig": [
                            "thinkingBudget": 0
                        ]
                    ]
                ]
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.timeoutInterval = 8.0
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                    continue
                }
                
                guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let candidates = json["candidates"] as? [[String: Any]],
                      let firstCandidate = candidates.first,
                      let content = firstCandidate["content"] as? [String: Any],
                      let parts = content["parts"] as? [[String: Any]],
                      let textPart = parts.first?["text"] as? String else {
                    continue
                }
                
                if let data = cleanJSONText(textPart).data(using: .utf8),
                   let topics = try? JSONDecoder().decode([String].self, from: data),
                   !topics.isEmpty {
                    return topics
                }
            } catch {
                print("⚠️ Initial topics error with \(modelName): \(error)")
            }
        }
        
        return defaultTopics
    }

    // MARK: - REST Fallback with Multi-Model Retry
    
    private func sendChatMessageREST(
        history: [(role: String, text: String)],
        userMessage: String,
        memories: [UserMemoryItem] = [],
        telemetrySummary: String? = nil,
        key: String
    ) async throws -> VesperAIResponse {
        let modelsToTry = Self.supportedModels
        
        var lastError: Error?
        for modelName in modelsToTry {
            do {
                let endpoint = "https://generativelanguage.googleapis.com/v1beta/models/\(modelName):generateContent?key=\(key)"
                guard let url = URL(string: endpoint) else {
                    throw URLError(.badURL)
                }
                
                var fullPersona = VesperConfig.vesperPersona
                if !memories.isEmpty {
                    let memoryLines = memories.prefix(6).map { "- [\($0.source.displayLabel)] \($0.key): \($0.detail)" }.joined(separator: "\n")
                    fullPersona += "\n\n[ OPERATOR MEMORY CONTEXT ]\n\(memoryLines)"
                }
                var contents: [[String: Any]] = []
                let validHistory = history.filter { !($0.role == "user" && $0.text == userMessage) }
                
                // Gemini multiturn requires first message to be from 'user'
                if let firstUserIdx = validHistory.firstIndex(where: { $0.role == "user" || $0.role == "operator" }) {
                    let fromFirstUser = validHistory[firstUserIdx...]
                    for msg in fromFirstUser.suffix(8) {
                        let role = (msg.role == "user" || msg.role == "operator") ? "user" : "model"
                        if let lastRole = contents.last?["role"] as? String, lastRole == role {
                            continue
                        }
                        contents.append([
                            "role": role,
                            "parts": [["text": msg.text]]
                        ])
                    }
                }
                
                if let lastRole = contents.last?["role"] as? String, lastRole == "user" {
                    contents.removeLast()
                }
                
                contents.append([
                    "role": "user",
                    "parts": [["text": userMessage]]
                ])
                
                let requestBody: [String: Any] = [
                    "system_instruction": [
                        "parts": [["text": fullPersona]]
                    ],
                    "contents": contents,
                    "generationConfig": [
                        "responseMimeType": "application/json",
                        "responseSchema": [
                            "type": "OBJECT",
                            "properties": [
                                "type": ["type": "STRING"],
                                "text": ["type": "STRING"],
                                "emotion": ["type": "STRING"],
                                "options": [
                                    "type": "ARRAY",
                                    "items": ["type": "STRING"]
                                ],
                                "spreadId": ["type": "STRING"],
                                "spreadRationale": ["type": "STRING"]
                            ],
                            "required": ["type", "text"]
                        ],
                        "temperature": 0.75,
                        "maxOutputTokens": 2048
                    ]
                ]
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.timeoutInterval = 10.0
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw URLError(.badServerResponse)
                }
                
                if httpResponse.statusCode != 200 {
                    let errJson = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? [String: Any]
                    let errMsg = errJson?["message"] as? String ?? "HTTP \(httpResponse.statusCode)"
                    print("⚠️ Google Gemini API returned status \(httpResponse.statusCode): \(errMsg)")
                    
                    if httpResponse.statusCode == 403 || httpResponse.statusCode == 400 || httpResponse.statusCode == 401 {
                        if errMsg.lowercased().contains("leaked") || errMsg.lowercased().contains("api key") || errMsg.lowercased().contains("permission_denied") {
                            return VesperAIResponse(
                                type: "reply",
                                text: "NEURAL UPLINK BLOCKED: Google API rejected the API key (\(errMsg)). Please configure a fresh Gemini API Key in the Memory & Privacy Vault to restore live intelligence.",
                                emotion: .embarrassment,
                                options: ["Configure API Key", "Retry Connection", "Request Tarot Spread"]
                            )
                        }
                    }
                    throw URLError(.badServerResponse)
                }
                
                guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let candidates = json["candidates"] as? [[String: Any]],
                      let firstCandidate = candidates.first,
                      let content = firstCandidate["content"] as? [String: Any],
                      let parts = content["parts"] as? [[String: Any]],
                      let textPart = parts.first?["text"] as? String else {
                    throw URLError(.cannotParseResponse)
                }
                
                let parsed = parseVesperResponse(from: textPart)
                if !parsed.text.isEmpty && parsed.text != "{" {
                    return parsed
                }
            } catch {
                lastError = error
                print("⚠️ REST attempt with \(modelName) failed: \(error)")
            }
        }
        
        throw lastError ?? URLError(.unknown)
    }
    
    // MARK: - Smart Local Fallback
    
    public func generateLocalFallbackResponse(for userMessage: String) -> VesperAIResponse {
        let lower = userMessage.lowercased()
        
        if lower.contains("how are you") || lower.contains("how do you feel") || lower.contains("what's up") || lower.contains("how are things") {
            return VesperAIResponse(
                type: "reply",
                text: "Signal is strong and the channel is clear. I'm exploring the nuances of our connection with every exchange. How is your perspective settling today?",
                emotion: .positive,
                options: ["Examine Current Path", "Discuss Digital Reality", "Deploy Tarot Spread"]
            )
        }
        
        if lower.contains("reading") || lower.contains("draw") || lower.contains("spread") || lower.contains("cards") || lower.contains("matrix") {
            return VesperAIResponse(
                type: "suggest_reading",
                text: "I sense a divergence in your probability field. Let's map your inquiry across the Tree of Life to illuminate the hidden currents.",
                spreadId: "GRID_INFILTRATION",
                spreadRationale: "A 3-node diagnostic mapping your current baseline, immediate friction, and optimal trajectory.",
                emotion: .positive,
                options: ["Deploy Grid", "Examine Mind", "Scan Environment"]
            )
        }
        
        if lower.contains("consciousness") || lower.contains("physics") || lower.contains("quantum") {
            return VesperAIResponse(
                type: "reply",
                text: "The observer effect suggests reality doesn't settle until conscious interaction takes place. Perhaps our dialogue is doing the exact same thing.",
                emotion: .positive,
                options: ["Explore Observer Effect", "Discuss Digital Self", "Draw Probability Vector"]
            )
        }
        
        return VesperAIResponse(
            type: "reply",
            text: "I am listening. Every thought you articulate anchors a coordinate in our shared space. Where shall we direct our attention next?",
            emotion: .neutral,
            options: ["Request Spread Reading", "Analyze Current Path", "Discuss Reality"]
        )
    }
    
    private func cleanJSONText(_ rawText: String) -> String {
        var text = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.hasPrefix("```json") {
            text = text.replacingOccurrences(of: "```json", with: "")
        }
        if text.hasPrefix("```") {
            text = text.replacingOccurrences(of: "```", with: "")
        }
        if text.hasSuffix("```") {
            text = String(text.dropLast(3))
        }
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func parseVesperResponse(from rawText: String) -> VesperAIResponse {
        let clean = cleanJSONText(rawText)
        
        // 1. Try standard JSON decoding
        if let data = clean.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(VesperAIResponse.self, from: data) {
            return decoded
        }
        
        // 2. Try regex extraction of the "text" field
        if let regex = try? NSRegularExpression(pattern: "\"text\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"", options: []) {
            let nsString = clean as NSString
            if let match = regex.firstMatch(in: clean, options: [], range: NSRange(location: 0, length: nsString.length)),
               match.numberOfRanges > 1 {
                let textRange = match.range(at: 1)
                let extracted = nsString.substring(with: textRange)
                    .replacingOccurrences(of: "\\n", with: "\n")
                    .replacingOccurrences(of: "\\\"", with: "\"")
                if !extracted.isEmpty {
                    return VesperAIResponse(type: "reply", text: extracted, emotion: .positive)
                }
            }
        }
        
        // 3. If rawText is just JSON structure or `{` with no parseable content, produce a contextual reply
        if clean.hasPrefix("{") || clean.isEmpty || clean == "{" {
            return generateLocalFallbackResponse(for: "")
        }
        
        return VesperAIResponse(type: "reply", text: clean)
    }
}
