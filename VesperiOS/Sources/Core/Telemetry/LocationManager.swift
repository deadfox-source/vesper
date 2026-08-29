// Sources/Core/Telemetry/LocationManager.swift
import Foundation
import CoreLocation
import Combine

@MainActor
public final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    public static let shared = LocationManager()
    
    @Published public private(set) var latitude: Double?
    @Published public private(set) var longitude: Double?
    @Published public private(set) var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published public private(set) var statusText: String = "AWAITING COORDS"
    
    private let manager = CLLocationManager()
    
    private override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
        authorizationStatus = manager.authorizationStatus
    }
    
    public func requestLocation() {
        if authorizationStatus == .notDetermined {
            manager.requestWhenInUseAuthorization()
        } else {
            #if os(iOS)
            if authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways {
                manager.requestLocation()
            }
            #else
            if authorizationStatus == .authorizedAlways {
                manager.requestLocation()
            }
            #endif
        }
    }
    
    // MARK: - CLLocationManagerDelegate (Nonisolated for Swift 6 Actor Safety)
    
    nonisolated public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            self.authorizationStatus = status
            switch status {
            #if os(iOS)
            case .authorizedWhenInUse, .authorizedAlways:
                self.statusText = "LOCATING..."
                manager.requestLocation()
            #else
            case .authorizedAlways:
                self.statusText = "LOCATING..."
                manager.requestLocation()
            #endif
            case .denied, .restricted:
                self.statusText = "DENIED"
            case .notDetermined:
                self.statusText = "STANDBY"
            @unknown default:
                self.statusText = "UNKNOWN"
            }
        }
    }
    
    nonisolated public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        let lat = loc.coordinate.latitude
        let lon = loc.coordinate.longitude
        Task { @MainActor in
            self.latitude = lat
            self.longitude = lon
            self.statusText = "ONLINE"
        }
    }
    
    nonisolated public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("⚠️ Location Manager error: \(error)")
        Task { @MainActor in
            self.statusText = "LOC ERR"
        }
    }
}
