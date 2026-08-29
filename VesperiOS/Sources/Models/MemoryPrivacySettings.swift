// Sources/Models/MemoryPrivacySettings.swift
import Foundation

public struct MemoryPrivacySettings: Codable, Sendable, Equatable {
    public var isMemoryRetentionEnabled: Bool
    public var isLocationTelemetryEnabled: Bool
    public var isSpaceWeatherTelemetryEnabled: Bool
    public var isSensorCaptureEnabled: Bool
    public var autoSaveChatSessions: Bool
    public var autoSynthesizeInsights: Bool
    
    public init(
        isMemoryRetentionEnabled: Bool = true,
        isLocationTelemetryEnabled: Bool = true,
        isSpaceWeatherTelemetryEnabled: Bool = true,
        isSensorCaptureEnabled: Bool = true,
        autoSaveChatSessions: Bool = true,
        autoSynthesizeInsights: Bool = true
    ) {
        self.isMemoryRetentionEnabled = isMemoryRetentionEnabled
        self.isLocationTelemetryEnabled = isLocationTelemetryEnabled
        self.isSpaceWeatherTelemetryEnabled = isSpaceWeatherTelemetryEnabled
        self.isSensorCaptureEnabled = isSensorCaptureEnabled
        self.autoSaveChatSessions = autoSaveChatSessions
        self.autoSynthesizeInsights = autoSynthesizeInsights
    }
}
