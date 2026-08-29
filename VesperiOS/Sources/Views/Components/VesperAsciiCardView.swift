// Sources/Views/Components/VesperAsciiCardView.swift
import SwiftUI

public struct VesperAsciiCardView: View {
    public let cardName: String
    public let element: ElementType
    public var accentColor: Color = .evaCyan
    public var cardHeight: CGFloat = 205
    public var fontSize: CGFloat = 8.6
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var displayedText: String = ""
    @State private var revealProgress: Double = 0.0
    @State private var isRevealed: Bool = false
    
    private static let glitchGlyphs: [Character] = [
        "#", "*", "%", "@", "$", "&", "+", "-", "/", "\\", "<", ">", ":", ";", "X", "0", "1", "~", "^", "=", "!"
    ]
    
    public init(
        cardName: String,
        element: ElementType,
        accentColor: Color = .evaCyan,
        cardHeight: CGFloat = 205,
        fontSize: CGFloat = 8.6
    ) {
        self.cardName = cardName
        self.element = element
        self.accentColor = accentColor
        self.cardHeight = cardHeight
        self.fontSize = fontSize
    }
    
    private var targetArt: String {
        VesperAsciiArt.getArtOnly(forCard: cardName, element: element)
    }
    
    public var body: some View {
        ZStack {
            // Absolute Void Black Centerpiece Rectangle
            Color.voidBlack
            
            // Tactical corner markers
            VStack {
                HStack {
                    Text("+")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .foregroundColor(accentColor.opacity(0.8))
                    Spacer()
                    Text("+")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .foregroundColor(accentColor.opacity(0.8))
                }
                Spacer()
                HStack {
                    Text("+")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .foregroundColor(accentColor.opacity(0.8))
                    Spacer()
                    Text("+")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .foregroundColor(accentColor.opacity(0.8))
                }
            }
            .padding(4)
            .accessibilityHidden(true)
            
            // Decrypting Status Tag overlay when scrambling
            if !isRevealed && !reduceMotion {
                VStack {
                    HStack {
                        Spacer()
                        Text("[ DECRYPTING ]")
                            .font(.system(size: 7, weight: .bold, design: .monospaced))
                            .foregroundColor(accentColor)
                            .padding(.trailing, 8)
                            .padding(.top, 4)
                    }
                    Spacer()
                }
                .accessibilityHidden(true)
            }
            
            Text(displayedText.isEmpty ? targetArt : displayedText)
                .font(.system(size: fontSize, weight: .bold, design: .monospaced))
                .foregroundColor(accentColor)
                .lineSpacing(1.3)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 4)
                .padding(.vertical, 6)
        }
        .frame(maxWidth: .infinity)
        .frame(height: cardHeight)
        .overlay(
            Rectangle()
                .strokeBorder(accentColor, lineWidth: 1.2)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(cardName), \(element.rawValue.capitalized) Element Tarot Card")
        .onAppear {
            startScrambleRevealAnimation()
        }
        .onChange(of: cardName) {
            startScrambleRevealAnimation()
        }
    }
    
    private func startScrambleRevealAnimation() {
        let art = targetArt
        if reduceMotion {
            displayedText = art
            isRevealed = true
            return
        }
        
        isRevealed = false
        revealProgress = 0.0
        
        // Generate initial random scrambled state
        displayedText = scramble(text: art, progress: 0.0)
        
        let totalSteps = 20
        var currentStep = 0
        let stepInterval = 0.035 // ~0.7 seconds total animation
        
        Timer.scheduledTimer(withTimeInterval: stepInterval, repeats: true) { timer in
            currentStep += 1
            let progress = Double(currentStep) / Double(totalSteps)
            
            DispatchQueue.main.async {
                if progress >= 1.0 {
                    timer.invalidate()
                    displayedText = art
                    isRevealed = true
                    VesperHapticEngine.shared.triggerTacticalClick()
                } else {
                    displayedText = scramble(text: art, progress: progress)
                }
            }
        }
    }
    
    private func scramble(text: String, progress: Double) -> String {
        var result = ""
        let chars = Array(text)
        let total = Double(max(chars.count, 1))
        
        for (i, char) in chars.enumerated() {
            if char == "\n" || char == " " {
                result.append(char)
                continue
            }
            
            // Spatial threshold based on position and noise
            let normalizedPos = Double(i) / total
            let threshold = normalizedPos * 0.7 + (Double((i * 37) % 100) / 100.0) * 0.3
            
            if progress >= threshold {
                result.append(char)
            } else {
                result.append(Self.glitchGlyphs.randomElement() ?? "*")
            }
        }
        return result
    }
}
