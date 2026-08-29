// Sources/Core/Telemetry/SpaceWeatherService.swift
import Foundation

public struct SpaceWeatherData: Codable, Sendable {
    public let kpIndex: Double
    public let status: String
    public let isStorm: Bool
    
    public init(kpIndex: Double, status: String = "ONLINE") {
        self.kpIndex = kpIndex
        self.status = status
        self.isStorm = kpIndex >= 5.0
    }
}

public actor SpaceWeatherService {
    public static let shared = SpaceWeatherService()
    
    private init() {}
    
    public func fetchKpIndex() async -> SpaceWeatherData {
        guard let url = URL(string: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json") else {
            return SpaceWeatherData(kpIndex: 2.33, status: "SIMULATED")
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return SpaceWeatherData(kpIndex: 2.33, status: "SIMULATED")
            }
            
            // NOAA returns a 2D JSON array: [ ["time_tag", "Kp", ...], ["2026-08-24 00:00:00", "2.67", ...] ]
            if let jsonArray = try JSONSerialization.jsonObject(with: data) as? [[String]], jsonArray.count > 1 {
                if let lastRow = jsonArray.last, lastRow.count > 1, let kpVal = Double(lastRow[1]) {
                    return SpaceWeatherData(kpIndex: kpVal, status: "ONLINE")
                }
            }
        } catch {
            print("⚠️ SpaceWeatherService fetch error: \(error)")
        }
        
        return SpaceWeatherData(kpIndex: 2.67, status: "STANDBY")
    }
}
