// Sources/Core/Speech/VesperSpeechRecognizer.swift
import Foundation
import Speech
import AVFoundation
import Combine

@MainActor
public final class VesperSpeechRecognizer: ObservableObject {
    public static let shared = VesperSpeechRecognizer()
    
    @Published public private(set) var isRecording: Bool = false
    @Published public private(set) var transcript: String = ""
    @Published public private(set) var authStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined
    
    private var audioEngine = AVAudioEngine()
    private var speechRecognizer: SFSpeechRecognizer? = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    
    private init() {}
    
    public func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            Task { @MainActor in
                self?.authStatus = status
            }
        }
    }
    
    public func toggleRecording(onResult: @escaping (String) -> Void) {
        if isRecording {
            stopRecording()
        } else {
            do {
                try startRecording(onResult: onResult)
            } catch {
                print("⚠️ Failed to start speech recognition: \(error)")
                stopRecording()
            }
        }
    }
    
    public func startRecording(onResult: @escaping (String) -> Void) throws {
        // Cancel any existing task
        stopRecording()
        
        transcript = ""
        
        #if os(iOS)
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        #endif
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            throw NSError(domain: "VesperSpeech", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unable to create recognition request"])
        }
        recognitionRequest.shouldReportPartialResults = true
        
        // Native on-device recognition if available
        if speechRecognizer?.supportsOnDeviceRecognition == true {
            recognitionRequest.requiresOnDeviceRecognition = false // Fallback gracefully if model not downloaded
        }
        
        let inputNode = audioEngine.inputNode
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let result = result {
                let text = result.bestTranscription.formattedString
                Task { @MainActor in
                    self.transcript = text
                    onResult(text)
                }
            }
            
            if error != nil || (result?.isFinal == true) {
                Task { @MainActor in
                    self.stopRecording()
                }
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        isRecording = true
    }
    
    public func stopRecording() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        isRecording = false
    }
}
