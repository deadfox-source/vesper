// Sources/Views/Components/ScrambleTextView.swift
import SwiftUI

public struct ScrambleTextView: View {
    public let text: String
    public var duration: Double = 0.8
    public var font: Font = VesperFont.terminalBody()
    public var color: Color = .vesperCyan
    
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var displayedText: String = ""
    @State private var timer: Timer?
    
    private let glyphs = Array("0101XYZΩΨΦΣ0123456789<>[]/\\|#*+@&$%")
    
    public init(text: String, duration: Double = 0.8, font: Font = VesperFont.terminalBody(), color: Color = .vesperCyan) {
        self.text = text
        self.duration = duration
        self.font = font
        self.color = color
    }
    
    public var body: some View {
        Text((reduceMotion || displayedText.isEmpty) ? text : displayedText)
            .font(font)
            .foregroundColor(color)
            .accessibilityLabel(text)
            .onAppear {
                if !reduceMotion {
                    startScramble()
                }
            }
            .onChange(of: text) { _, _ in
                if !reduceMotion {
                    startScramble()
                }
            }
            .onDisappear {
                timer?.invalidate()
            }
    }
    
    private func startScramble() {
        timer?.invalidate()
        let targetChars = Array(text)
        let totalSteps = max(6, Int(duration * 20))
        var currentStep = 0
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.04, repeats: true) { t in
            currentStep += 1
            let progress = Double(currentStep) / Double(totalSteps)
            let revealedCount = Int(progress * Double(targetChars.count))
            
            var result = ""
            for i in 0..<targetChars.count {
                if i < revealedCount {
                    result.append(targetChars[i])
                } else {
                    result.append(glyphs.randomElement() ?? "?")
                }
            }
            
            self.displayedText = result
            
            if currentStep >= totalSteps {
                t.invalidate()
                self.displayedText = self.text
            }
        }
    }
}
