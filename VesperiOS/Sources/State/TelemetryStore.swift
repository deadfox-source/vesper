// Sources/State/TelemetryStore.swift
import SwiftUI
import Combine
#if canImport(UIKit)
import UIKit
#endif

@MainActor
public final class TelemetryStore: ObservableObject {
    @Published public private(set) var batteryLevel: Float = 1.0
    @Published public private(set) var isCharging: Bool = false
    @Published public private(set) var weather: WeatherData?
    @Published public private(set) var spaceWeather: SpaceWeatherData = SpaceWeatherData(kpIndex: 2.33, status: "STANDBY")
    @Published public private(set) var locationCoords: (lat: Double, lon: Double)?
    @Published public private(set) var cpuCores: Int = ProcessInfo.processInfo.processorCount
    @Published public private(set) var systemTimeText: String = ""
    
    private var cancellables = Set<AnyCancellable>()
    private var clockTimer: Timer?
    
    public init() {
        setupBatteryMonitoring()
        setupLocationTracking()
        startClockTicker()
        fetchInitialTelemetry()
    }
    
    deinit {
        clockTimer?.invalidate()
    }
    
    private func setupBatteryMonitoring() {
        #if os(iOS) && canImport(UIKit)
        UIDevice.current.isBatteryMonitoringEnabled = true
        updateBatteryState()
        
        NotificationCenter.default.publisher(for: UIDevice.batteryLevelDidChangeNotification)
            .sink { [weak self] _ in self?.updateBatteryState() }
            .store(in: &cancellables)
        
        NotificationCenter.default.publisher(for: UIDevice.batteryStateDidChangeNotification)
            .sink { [weak self] _ in self?.updateBatteryState() }
            .store(in: &cancellables)
        #else
        self.batteryLevel = 1.0
        self.isCharging = false
        #endif
    }
    
    private func updateBatteryState() {
        #if os(iOS) && canImport(UIKit)
        let level = UIDevice.current.batteryLevel
        self.batteryLevel = level >= 0 ? level : 0.85
        let state = UIDevice.current.batteryState
        self.isCharging = (state == .charging || state == .full)
        #endif
    }
    
    private func setupLocationTracking() {
        LocationManager.shared.$latitude
            .combineLatest(LocationManager.shared.$longitude)
            .compactMap { lat, lon -> (Double, Double)? in
                guard let lat = lat, let lon = lon else { return nil }
                return (lat, lon)
            }
            .sink { [weak self] lat, lon in
                self?.locationCoords = (lat, lon)
                self?.refreshWeather(lat: lat, lon: lon)
            }
            .store(in: &cancellables)
        
        LocationManager.shared.requestLocation()
    }
    
    public func fetchInitialTelemetry() {
        Task {
            let sw = await SpaceWeatherService.shared.fetchKpIndex()
            self.spaceWeather = sw
        }
    }
    
    public func refreshWeather(lat: Double, lon: Double) {
        Task {
            if let w = await WeatherService.shared.fetchWeather(latitude: lat, longitude: lon) {
                self.weather = w
            }
        }
    }
    
    private func startClockTicker() {
        clockTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                let formatter = DateFormatter()
                formatter.dateFormat = "HH:mm:ss"
                self?.systemTimeText = formatter.string(from: Date())
            }
        }
    }
}
