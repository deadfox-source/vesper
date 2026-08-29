// Sources/Core/Haptics/VesperHapticEngine.swift
import Foundation
#if canImport(UIKit)
import UIKit
#endif
#if canImport(CoreHaptics)
import CoreHaptics
#endif

@MainActor
public final class VesperHapticEngine {
    public static let shared = VesperHapticEngine()
    
    #if os(iOS) && canImport(CoreHaptics)
    private var engine: CHHapticEngine?
    #endif
    
    #if os(iOS) && canImport(UIKit)
    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let impactRigid = UIImpactFeedbackGenerator(style: .rigid)
    private let notification = UINotificationFeedbackGenerator()
    #endif
    
    private init() {
        prepareEngine()
        prepareGenerators()
    }
    
    private func prepareEngine() {
        #if os(iOS) && canImport(CoreHaptics)
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        do {
            let hapticEngine = try CHHapticEngine()
            
            hapticEngine.resetHandler = { [weak self] in
                Task { @MainActor [weak self] in
                    do {
                        try self?.engine?.start()
                    } catch {
                        print("⚠️ Failed to restart CHHapticEngine: \(error)")
                    }
                }
            }
            
            hapticEngine.stoppedHandler = { reason in
                print("ℹ️ CHHapticEngine stopped with reason: \(reason)")
            }
            
            try hapticEngine.start()
            self.engine = hapticEngine
        } catch {
            print("⚠️ CHHapticEngine initialization error: \(error)")
        }
        #endif
    }
    
    private func prepareGenerators() {
        #if os(iOS) && canImport(UIKit)
        impactLight.prepare()
        impactMedium.prepare()
        impactHeavy.prepare()
        impactRigid.prepare()
        notification.prepare()
        #endif
    }
    
    // MARK: - Tactical Feedback
    
    /// Crisp, rigid feedback for terminal buttons, tab switching, and node interactions
    public func triggerTacticalClick() {
        #if os(iOS) && canImport(UIKit)
        impactRigid.impactOccurred()
        #endif
    }
    
    /// Light feedback for text typing or scramble animation step
    public func triggerSubtleTick() {
        #if os(iOS) && canImport(UIKit)
        impactLight.impactOccurred(intensity: 0.6)
        #endif
    }
    
    /// Card draw and node population
    public func triggerCardDrawn() {
        #if os(iOS) && canImport(UIKit)
        impactMedium.impactOccurred(intensity: 0.9)
        #endif
    }
    
    /// Warning / Perceptual Drift / Contrary Element alert
    public func triggerWarning() {
        #if os(iOS) && canImport(UIKit)
        notification.notificationOccurred(.warning)
        #endif
    }
    
    /// Error / Kernel Panic / System Restraint alert
    public func triggerError() {
        #if os(iOS) && canImport(UIKit)
        notification.notificationOccurred(.error)
        #endif
    }
    
    /// Success / Synchronization Complete
    public func triggerSuccess() {
        #if os(iOS) && canImport(UIKit)
        notification.notificationOccurred(.success)
        #endif
    }
    
    // MARK: - Advanced Occult & Daemon Haptic Patterns (CoreHaptics)
    
    /// Daemon Heartbeat Pulse: A resonant double-thump (Systole / Diastole)
    public func playHeartbeatPulse() {
        #if os(iOS) && canImport(CoreHaptics)
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics, let engine = engine else {
            #if canImport(UIKit)
            impactHeavy.impactOccurred()
            #endif
            return
        }
        
        do {
            let firstThump = CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.9),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3)
                ],
                relativeTime: 0.0
            )
            
            let firstRumble = CHHapticEvent(
                eventType: .hapticContinuous,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2)
                ],
                relativeTime: 0.02,
                duration: 0.12
            )
            
            let secondThump = CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.7),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.25)
                ],
                relativeTime: 0.18
            )
            
            let secondRumble = CHHapticEvent(
                eventType: .hapticContinuous,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.15)
                ],
                relativeTime: 0.20,
                duration: 0.10
            )
            
            let pattern = try CHHapticPattern(events: [firstThump, firstRumble, secondThump, secondRumble], parameters: [])
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: CHHapticTimeImmediate)
        } catch {
            #if canImport(UIKit)
            impactHeavy.impactOccurred()
            #endif
        }
        #endif
    }
    
    /// Geomagnetic / Contrary Friction Buzz: High-frequency erratic oscillation
    public func playFrictionBuzz() {
        #if os(iOS) && canImport(CoreHaptics)
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics, let engine = engine else {
            #if canImport(UIKit)
            notification.notificationOccurred(.warning)
            #endif
            return
        }
        
        do {
            var events: [CHHapticEvent] = []
            for i in 0..<4 {
                let time = Double(i) * 0.06
                let event = CHHapticEvent(
                    eventType: .hapticTransient,
                    parameters: [
                        CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(0.8 - (Double(i) * 0.1))),
                        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9)
                    ],
                    relativeTime: time
                )
                events.append(event)
            }
            
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: CHHapticTimeImmediate)
        } catch {
            #if canImport(UIKit)
            impactMedium.impactOccurred()
            #endif
        }
        #endif
    }
}
