// Sources/Core/Network/NetworkMonitor.swift
import Foundation
import Network
import Combine

@MainActor
public final class NetworkMonitor: ObservableObject {
    public static let shared = NetworkMonitor()
    
    @Published public private(set) var isConnected: Bool = true
    @Published public private(set) var isCellular: Bool = false
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "VesperNetworkMonitor")
    
    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isConnected = (path.status == .satisfied)
                self?.isCellular = path.isExpensive
            }
        }
        monitor.start(queue: queue)
    }
}
