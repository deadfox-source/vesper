// Sources/Core/Audio/VesperSoundEffects.swift
import AVFoundation
import AudioToolbox

@MainActor
public final class VesperSoundEffects {
    public static let shared = VesperSoundEffects()
    
    private var engine: AVAudioEngine?
    private var isMuted: Bool = false
    
    private init() {
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        #if os(iOS)
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("⚠️ Failed to set AVAudioSession category: \(error)")
        }
        #endif
    }
    
    public func setMuted(_ muted: Bool) {
        self.isMuted = muted
    }
    
    // MARK: - Tactical System Audio
    
    /// High-pitched tactical terminal blip (System sound or synthesized oscillator)
    public func playTerminalBlip() {
        guard !isMuted else { return }
        AudioServicesPlaySystemSound(1104) // iOS key click / blip
    }
    
    public func playKeystroke() {
        playTerminalBlip()
    }
    
    /// Holo-card draw sound
    public func playCardDraw() {
        guard !isMuted else { return }
        AudioServicesPlaySystemSound(1105)
    }
    
    /// Glitch / Hologram sweep effect
    public func playGlitchSweep() {
        guard !isMuted else { return }
        AudioServicesPlaySystemSound(1057) // iOS charge/sweep tone
    }
    
    /// Warning / Geomagnetic alarm tone
    public func playWarningAlarm() {
        guard !isMuted else { return }
        AudioServicesPlaySystemSound(1053)
    }
    
    /// Oracle Synthesis Complete chime
    public func playSynthesisComplete() {
        guard !isMuted else { return }
        AudioServicesPlaySystemSound(1025)
    }
}
