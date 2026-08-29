// Sources/Models/UserMemoryItem.swift
import Foundation

public enum MemorySource: String, Codable, Sendable, CaseIterable {
    case chat = "CHAT_SESSION"
    case oracleReading = "ORACLE_READING"
    case dailyLog = "DAILY_LOG"
    case manual = "MANUAL_DIRECTIVE"
    
    public var displayLabel: String {
        switch self {
        case .chat: return "DIALOGUE"
        case .oracleReading: return "ORACLE"
        case .dailyLog: return "DAILY LOG"
        case .manual: return "DIRECTIVE"
        }
    }
}

public struct UserMemoryItem: Identifiable, Codable, Sendable, Equatable {
    public let id: String
    public var key: String
    public var detail: String
    public var source: MemorySource
    public var timestamp: String
    public var isEnabled: Bool
    
    public init(
        id: String = UUID().uuidString,
        key: String,
        detail: String,
        source: MemorySource = .manual,
        timestamp: String? = nil,
        isEnabled: Bool = true
    ) {
        self.id = id
        self.key = key
        self.detail = detail
        self.source = source
        if let ts = timestamp {
            self.timestamp = ts
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd HH:mm"
            self.timestamp = formatter.string(from: Date())
        }
        self.isEnabled = isEnabled
    }
}
