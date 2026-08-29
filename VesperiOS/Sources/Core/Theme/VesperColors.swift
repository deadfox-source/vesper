// Sources/Core/Theme/VesperColors.swift
import SwiftUI

public extension Color {
    /// Pure Acid Void Black (#000000)
    static let voidBlack = Color.black
    
    /// DOS Void Gray (#1A1B1E)
    static let voidGray = Color(red: 26/255, green: 27/255, blue: 30/255)
    
    /// High-contrast Ghost White (#E6EDF3)
    static let ghostWhite = Color(red: 230/255, green: 237/255, blue: 243/255)
    
    /// High-contrast Eva Cyan (#00F0FF) - Contrast 16.6:1
    static let evaCyan = Color(red: 0/255, green: 240/255, blue: 255/255)
    
    /// Primary Vesper Blue (#3894FF) - High contrast 7.2:1 (AAA)
    static let vesperBlue = Color(red: 56/255, green: 148/255, blue: 255/255)
    
    /// Magi Violet / High-Luminance Lavender (#C084FC) - High contrast 9.8:1 (AAA)
    static let magiViolet = Color(red: 192/255, green: 132/255, blue: 252/255)
    
    /// Magi Orange (#FF6600) - High contrast 6.6:1 (AA)
    static let magiOrange = Color(red: 255/255, green: 102/255, blue: 0/255)
    
    /// Warning Amber (#FFB800) - High contrast 12.0:1 (AAA)
    static let warningAmber = Color(red: 255/255, green: 184/255, blue: 0/255)
    
    /// BIOS Green (#00FF41 / #00FF66) - High contrast 15.6:1 (AAA)
    static let biosGreen = Color(red: 0/255, green: 255/255, blue: 65/255)
    
    // Semantic aliases for consistency
    static let vesperVoid = voidBlack
    static let vesperGray = voidGray
    static let vesperCyan = evaCyan
    static let vesperViolet = magiViolet
    static let vesperOrange = magiOrange
    static let vesperAmber = warningAmber
    static let vesperGreen = biosGreen
    static let vesperGhost = ghostWhite
    static let vesperMuted = Color(red: 168/255, green: 179/255, blue: 207/255) // #A8B3CF (8.3:1 contrast - AAA)
    static let vesperCrimson = Color(red: 255/255, green: 75/255, blue: 75/255)
}

