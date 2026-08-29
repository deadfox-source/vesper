// Sources/Core/Telemetry/WeatherService.swift
import Foundation

public struct WeatherData: Codable, Sendable {
    public let temperature: Double
    public let weatherCode: Int
    public let status: String
    
    public init(temperature: Double, weatherCode: Int, status: String = "ONLINE") {
        self.temperature = temperature
        self.weatherCode = weatherCode
        self.status = status
    }
}

private struct OpenMeteoResponse: Codable {
    struct CurrentWeather: Codable {
        let temperature: Double
        let weathercode: Int
    }
    let current_weather: CurrentWeather?
}

public actor WeatherService {
    public static let shared = WeatherService()
    
    private init() {}
    
    public func fetchWeather(latitude: Double, longitude: Double) async -> WeatherData? {
        guard let url = URL(string: "https://api.open-meteo.com/v1/forecast?latitude=\(latitude)&longitude=\(longitude)&current_weather=true") else {
            return nil
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return nil
            }
            
            let decoded = try JSONDecoder().decode(OpenMeteoResponse.self, from: data)
            if let current = decoded.current_weather {
                return WeatherData(temperature: current.temperature, weatherCode: current.weathercode, status: "ONLINE")
            }
        } catch {
            print("⚠️ WeatherService fetch error: \(error)")
        }
        return nil
    }
}
