// Sources/Models/Spread.swift
import Foundation

public struct SpreadNodeDef: Identifiable, Codable, Sendable {
    public let id: Int
    public let name: String
    public let x: Double // Normalized coordinate (0.0 to 1.0)
    public let y: Double // Normalized coordinate (0.0 to 1.0)
    public let title: String
    public let description: String
    
    public init(id: Int, name: String, x: Double, y: Double, title: String, description: String) {
        self.id = id
        self.name = name
        self.x = x
        self.y = y
        self.title = title
        self.description = description
    }
}

public struct SpreadConfig: Identifiable, Codable, Sendable {
    public let id: String
    public let name: String
    public let tagline: String
    public let nodeCount: Int
    public let description: String
    public let iconName: String
    public let nodes: [SpreadNodeDef]
    
    public init(id: String, name: String, tagline: String, nodeCount: Int, description: String, iconName: String, nodes: [SpreadNodeDef]) {
        self.id = id
        self.name = name
        self.tagline = tagline
        self.nodeCount = nodeCount
        self.description = description
        self.iconName = iconName
        self.nodes = nodes
    }
}

public struct SpreadLibrary {
    public static let macroSystem = SpreadConfig(
        id: "GRID_MACRO_SYSTEM",
        name: "FULL SYSTEM SCAN",
        tagline: "10-NODE KABBALISTIC TREE",
        nodeCount: 10,
        description: "A comprehensive 10-node mapping across intention, resources, conflict, emotion, logic, and material resolution. Best for multi-layered life inquiries.",
        iconName: "network",
        nodes: [
            SpreadNodeDef(id: 1, name: "Kether", x: 0.5, y: 0.10, title: "Intention / Aspiration", description: "The ultimate operational objective or the pure, initial spark of the inquiry."),
            SpreadNodeDef(id: 2, name: "Chokhmah", x: 0.25, y: 0.22, title: "Wisdom / Initiative", description: "The active potential and raw kinetic energy available to execute the mission."),
            SpreadNodeDef(id: 3, name: "Binah", x: 0.75, y: 0.22, title: "Understanding / Limitations", description: "The systemic boundaries, defense perimeters, or restrictions placed upon the user."),
            SpreadNodeDef(id: 4, name: "Chesed", x: 0.25, y: 0.40, title: "Mercy / Resources", description: "The constructive influences, available resources, and benevolent assets driving operational growth."),
            SpreadNodeDef(id: 5, name: "Gevurah", x: 0.75, y: 0.40, title: "Severity / Friction", description: "Destructive influences, harshness, or kinetic conflict expected during the operation."),
            SpreadNodeDef(id: 6, name: "Tiferet", x: 0.5, y: 0.50, title: "Beauty / Core Vector", description: "The true 'Self', the heart of the matter, where the objective and human aspiration intersect."),
            SpreadNodeDef(id: 7, name: "Netzach", x: 0.25, y: 0.65, title: "Victory / Emotional Drive", description: "The instinctual state, passion, and psychological resilience required for endurance."),
            SpreadNodeDef(id: 8, name: "Hod", x: 0.75, y: 0.65, title: "Splendor / Analytics", description: "The logical strategy, communication hurdles, and intellectual data routing necessary."),
            SpreadNodeDef(id: 9, name: "Yesod", x: 0.5, y: 0.78, title: "Foundation / Subsurface", description: "Hidden psychological variables, dreams, and the unknown astral aspect."),
            SpreadNodeDef(id: 10, name: "Malkuth", x: 0.5, y: 0.92, title: "Kingdom / Resolution", description: "The final manifestation, tangible form, and probable outcome of the operation.")
        ]
    )
    
    public static let infiltration = SpreadConfig(
        id: "GRID_INFILTRATION",
        name: "QUICK INQUIRY",
        tagline: "3-NODE RAPID VECTOR",
        nodeCount: 3,
        description: "A focused 3-node spread. Identify your current state, confront the primary obstacle, and define direct action on the objective.",
        iconName: "bolt.horizontal",
        nodes: [
            SpreadNodeDef(id: 1, name: "Current Vector", x: 0.30, y: 0.20, title: "Current Vector", description: "The specific mindset or energetic approach required to approach the situation."),
            SpreadNodeDef(id: 2, name: "Core Restraint", x: 0.70, y: 0.50, title: "System Restraint", description: "The primary adversarial force, whether an external obstacle or repressed Shadow element."),
            SpreadNodeDef(id: 3, name: "Action on Objective", x: 0.30, y: 0.80, title: "Action on Objective", description: "The definitive execution required to neutralize the psychological threat.")
        ]
    )
    
    public static let exfiltration = SpreadConfig(
        id: "GRID_EXFILTRATION",
        name: "CHALLENGE RESOLUTION",
        tagline: "5-NODE PATHFINDING",
        nodeCount: 5,
        description: "A 5-node pathfinding spread. Assess the situation, uncover hidden factors, clear the path forward, find external support, and define resolution.",
        iconName: "point.3.connected.trianglepath.dotted",
        nodes: [
            SpreadNodeDef(id: 1, name: "Threat Assessment", x: 0.30, y: 0.15, title: "Current Obstacle", description: "The immediate, tangible danger to psychological or systemic stability."),
            SpreadNodeDef(id: 2, name: "Hidden Variables", x: 0.70, y: 0.35, title: "Hidden Variables", description: "Hidden strengths, suppressed Shadow capabilities, or overlooked resources."),
            SpreadNodeDef(id: 3, name: "Route Clearance", x: 0.30, y: 0.55, title: "Route Clearance", description: "The precise, practical action required to secure a path forward."),
            SpreadNodeDef(id: 4, name: "External Support", x: 0.70, y: 0.75, title: "System Support", description: "External factors, systemic advantages, or aligned telemetry providing assistance."),
            SpreadNodeDef(id: 5, name: "Resolution", x: 0.30, y: 0.95, title: "Resolution Point", description: "The final, secure psychological state or physical resolution.")
        ]
    )
    
    public static let all: [SpreadConfig] = [infiltration, exfiltration, macroSystem]
    public static let map: [String: SpreadConfig] = [
        "GRID_MACRO_SYSTEM": macroSystem,
        "GRID_INFILTRATION": infiltration,
        "GRID_EXFILTRATION": exfiltration
    ]
}
