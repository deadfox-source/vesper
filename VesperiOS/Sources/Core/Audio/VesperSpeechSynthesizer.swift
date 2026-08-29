// Sources/Core/Audio/VesperSpeechSynthesizer.swift
import Foundation
import AVFoundation
import Combine

@MainActor
public final class VesperSpeechSynthesizer: NSObject, ObservableObject, AVAudioPlayerDelegate, AVSpeechSynthesizerDelegate {
    public static let shared = VesperSpeechSynthesizer()
    
    @Published public private(set) var isSpeaking: Bool = false
    public private(set) var audioLevel: Float = 0.0
    
    private var audioPlayer: AVAudioPlayer?
    private var playbackContinuation: CheckedContinuation<Void, Never>?
    private let localSynthesizer = AVSpeechSynthesizer()
    private var levelTimer: Timer?
    private var speechQueue: [String] = []
    private var isProcessingQueue: Bool = false
    private let audioCache = NSCache<NSString, NSData>()
    
    private override init() {
        super.init()
        audioCache.countLimit = 60
        localSynthesizer.delegate = self
    }
    
    // MARK: - Public Speech Entry Point
    
    public func speak(_ text: String) {
        let rawClean = cleanTextContent(text)
        guard !rawClean.isEmpty else { return }
        
        stopSpeaking()
        
        // Break into sentences for rapid streaming delivery
        let sentences = splitIntoSentences(rawClean)
        guard !sentences.isEmpty else { return }
        
        // Kick off concurrent pre-fetching for all sentences
        let key = VesperConfig.geminiAPIKey
        if !key.isEmpty {
            for sentence in sentences {
                Task {
                    _ = await self.fetchGoogleTTSAudio(text: sentence, apiKey: key)
                }
            }
        }
        
        speechQueue = sentences
        processQueue()
    }
    
    public func stopSpeaking() {
        speechQueue.removeAll()
        isProcessingQueue = false
        
        if let player = audioPlayer, player.isPlaying {
            player.stop()
        }
        audioPlayer = nil
        
        if localSynthesizer.isSpeaking {
            localSynthesizer.stopSpeaking(at: .immediate)
        }
        
        playbackContinuation?.resume()
        playbackContinuation = nil
        
        isSpeaking = false
        stopLevelMeter()
    }
    
    // MARK: - Queue & Audio Pipeline
    
    private func processQueue() {
        guard !speechQueue.isEmpty, !isProcessingQueue else { return }
        isProcessingQueue = true
        let sentence = speechQueue.removeFirst()
        
        Task {
            await playSentence(sentence)
            self.isProcessingQueue = false
            if !self.speechQueue.isEmpty {
                self.processQueue()
            } else {
                self.isSpeaking = false
                self.stopLevelMeter()
            }
        }
    }
    
    private func playSentence(_ text: String) async {
        let key = VesperConfig.geminiAPIKey
        
        if !key.isEmpty {
            // Attempt Google Cloud Text-to-Speech (Journey British Voice)
            if let audioData = await fetchGoogleTTSAudio(text: text, apiKey: key) {
                await playAudioData(audioData)
                return
            }
        }
        
        // Fallback to local AVSpeechSynthesizer
        playLocalSpeech(text: text)
    }
    
    // MARK: - Google Cloud Text-To-Speech (en-GB-Journey-D)
    
    private func fetchGoogleTTSAudio(text: String, apiKey: String) async -> Data? {
        let cacheKey = text as NSString
        if let cached = audioCache.object(forKey: cacheKey) {
            return cached as Data
        }
        
        guard let url = URL(string: "https://texttospeech.googleapis.com/v1/text:synthesize?key=\(apiKey)") else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Exact 1:1 payload matching web vesperSpeech.ts
        let payload: [String: Any] = [
            "input": ["text": text],
            "voice": [
                "languageCode": "en-GB",
                "name": "en-GB-Journey-D"
            ],
            "audioConfig": [
                "audioEncoding": "MP3"
            ]
        ]
        
        guard let httpBody = try? JSONSerialization.data(withJSONObject: payload) else { return nil }
        request.httpBody = httpBody
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return nil
            }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let audioContentBase64 = json["audioContent"] as? String,
               let audioData = Data(base64Encoded: audioContentBase64) {
                audioCache.setObject(audioData as NSData, forKey: cacheKey)
                return audioData
            }
        } catch {
            print("⚠️ Google TTS Fetch error: \(error)")
        }
        
        return nil
    }
    
    private func playAudioData(_ data: Data) async {
        #if os(iOS)
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("⚠️ Audio session error: \(error)")
        }
        #endif
        
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            do {
                let player = try AVAudioPlayer(data: data)
                self.playbackContinuation = continuation
                player.delegate = self
                player.isMeteringEnabled = true
                player.prepareToPlay()
                self.audioPlayer = player
                self.isSpeaking = true
                self.startLevelMeter()
                
                let didPlay = player.play()
                if !didPlay {
                    print("⚠️ AVAudioPlayer failed to play, falling back to local speech")
                    self.playbackContinuation = nil
                    continuation.resume()
                }
            } catch {
                print("⚠️ AVAudioPlayer playback error: \(error)")
                continuation.resume()
            }
        }
    }
    
    // MARK: - Local iOS Fallback
    
    private func playLocalSpeech(text: String) {
        guard !text.isEmpty else { return }
        let utterance = AVSpeechUtterance(string: text)
        let ukVoices = AVSpeechSynthesisVoice.speechVoices().filter { $0.language == "en-GB" }
        utterance.voice = ukVoices.first(where: { $0.quality == .enhanced || $0.quality == .premium })
            ?? ukVoices.first
            ?? AVSpeechSynthesisVoice(language: "en-GB")
            ?? AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.50
        utterance.volume = 1.0
        
        #if os(iOS)
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("⚠️ Audio session error: \(error)")
        }
        #endif
        
        isSpeaking = true
        startLevelMeter()
        localSynthesizer.speak(utterance)
    }
    
    // MARK: - Text Normalization & Clean
    
    private func cleanTextContent(_ text: String) -> String {
        var clean = text
        if clean.contains("CHAT WITH VESPER\n\n") {
            clean = clean.components(separatedBy: "CHAT WITH VESPER\n\n").last ?? clean
        }
        // Remove code blocks
        if let jsonRange = clean.range(of: "```") {
            clean = String(clean[..<jsonRange.lowerBound])
        }
        // Strip markdown brackets, parenthesis tags, headers, bold markers
        clean = clean.replacingOccurrences(of: "\\[.*?\\]", with: "", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "\\(.*?\\)", with: "", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "CHAT WITH VESPER", with: "")
        clean = clean.replacingOccurrences(of: "[#*_~`{}/\\\\|<>]+", with: "", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "^>\\s*", with: "", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "!{2,}", with: "!", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "(^|\\s)-+|-+(\\s|$)", with: " ", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "\\n+", with: " ", options: .regularExpression)
        clean = clean.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        
        // Convert ALL-CAPS words to TitleCase so Journey-D does not spell out letters
        let words = clean.components(separatedBy: " ")
        clean = words.map { word -> String in
            if word.count > 1 && word == word.uppercased() && word.rangeOfCharacter(from: .letters) != nil {
                return word.capitalized
            }
            return word
        }.joined(separator: " ")
        
        return clean.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func splitIntoSentences(_ text: String) -> [String] {
        var sentences: [String] = []
        text.enumerateSubstrings(in: text.startIndex..<text.endIndex, options: .bySentences) { substring, _, _, _ in
            if let s = substring?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
                sentences.append(s)
            }
        }
        return sentences.isEmpty ? [text] : sentences
    }
    
    // MARK: - Metering for Resonance Waveform & 3D Avatar
    
    private func startLevelMeter() {
        levelTimer?.invalidate()
        levelTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            Task { @MainActor in
                if let player = self.audioPlayer, player.isPlaying {
                    player.updateMeters()
                    let avgPower = player.averagePower(forChannel: 0)
                    // Convert -60dB...0dB to normalized 0.0...1.0
                    let normalized = max(0.0, min(1.0, (avgPower + 50.0) / 50.0))
                    self.audioLevel = normalized
                } else if self.localSynthesizer.isSpeaking {
                    self.audioLevel = Float.random(in: 0.35...0.85)
                } else {
                    self.audioLevel = 0.0
                }
            }
        }
    }
    
    private func stopLevelMeter() {
        levelTimer?.invalidate()
        levelTimer = nil
        audioLevel = 0.0
    }
    
    // MARK: - Delegates
    
    nonisolated public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.playbackContinuation?.resume()
            self.playbackContinuation = nil
        }
    }
    
    nonisolated public func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        Task { @MainActor in
            self.playbackContinuation?.resume()
            self.playbackContinuation = nil
        }
    }
    
    nonisolated public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            self.stopLevelMeter()
        }
    }
    
    nonisolated public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            self.stopLevelMeter()
        }
    }
}

