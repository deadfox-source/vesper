// Sources/Views/Components/VesperAvatarView.swift
import SwiftUI
import SceneKit

#if canImport(UIKit)
import UIKit
public typealias PlatformViewRepresentable = UIViewRepresentable
public typealias PlatformColor = UIColor
#elseif canImport(AppKit)
import AppKit
public typealias PlatformViewRepresentable = NSViewRepresentable
public typealias PlatformColor = NSColor
#endif

#if os(macOS)
public typealias SCNFloat = CGFloat
#else
public typealias SCNFloat = Float
#endif

public struct VesperAvatarView: PlatformViewRepresentable {
    public var isSpeaking: Bool
    public var isListening: Bool
    public var audioLevel: Float
    public var tintColor: Color
    public var batteryLevel: Float
    public var isCharging: Bool
    public var kpIndex: Double
    public var temperature: Double
    public var isOnline: Bool

    public init(
        isSpeaking: Bool = false,
        isListening: Bool = false,
        audioLevel: Float = 0.0,
        tintColor: Color = .evaCyan,
        batteryLevel: Float = 1.0,
        isCharging: Bool = false,
        kpIndex: Double = 2.33,
        temperature: Double = 22.0,
        isOnline: Bool = true
    ) {
        self.isSpeaking = isSpeaking
        self.isListening = isListening
        self.audioLevel = audioLevel
        self.tintColor = tintColor
        self.batteryLevel = batteryLevel
        self.isCharging = isCharging
        self.kpIndex = kpIndex
        self.temperature = temperature
        self.isOnline = isOnline
    }

    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    #if canImport(UIKit)
    public func makeUIView(context: Context) -> SCNView {
        setupSCNView(context: context)
    }

    public func updateUIView(_ scnView: SCNView, context: Context) {
        updateSCNView(scnView, context: context)
    }
    #elseif canImport(AppKit)
    public func makeNSView(context: Context) -> SCNView {
        setupSCNView(context: context)
    }

    public func updateNSView(_ scnView: SCNView, context: Context) {
        updateSCNView(scnView, context: context)
    }
    #endif

    private func setupSCNView(context: Context) -> SCNView {
        let scnView = SCNView()
        scnView.backgroundColor = .clear
        scnView.allowsCameraControl = false
        scnView.autoenablesDefaultLighting = false
        scnView.antialiasingMode = .multisampling4X
        scnView.preferredFramesPerSecond = 60
        scnView.isPlaying = true
        scnView.delegate = context.coordinator
        
        let scene = SCNScene()
        scnView.scene = scene
        
        // ── Camera Node ──────────────────────────────────────────────
        let cameraNode = SCNNode()
        let camera = SCNCamera()
        camera.wantsHDR = true
        camera.bloomIntensity = 1.2
        camera.bloomThreshold = 0.3
        camera.bloomBlurRadius = 14.0
        camera.zNear = 0.1
        camera.zFar = 100
        cameraNode.camera = camera
        cameraNode.position = SCNVector3(x: 0, y: 0, z: 5.2)
        scene.rootNode.addChildNode(cameraNode)
        
        // ── Lighting Setup ───────────────────────────────────────────
        let ambientLight = SCNNode()
        ambientLight.light = SCNLight()
        ambientLight.light?.type = .ambient
        ambientLight.light?.intensity = 600
        ambientLight.light?.color = PlatformColor.white
        scene.rootNode.addChildNode(ambientLight)
        
        let keyLight = SCNNode()
        keyLight.light = SCNLight()
        keyLight.light?.type = .omni
        keyLight.light?.intensity = 1200
        keyLight.position = SCNVector3(x: 5, y: 5, z: 5)
        scene.rootNode.addChildNode(keyLight)
        
        let rimLight = SCNNode()
        rimLight.name = "rimLight"
        rimLight.light = SCNLight()
        rimLight.light?.type = .omni
        rimLight.light?.intensity = 800
        rimLight.light?.color = PlatformColor(tintColor)
        rimLight.position = SCNVector3(x: -5, y: -5, z: 2)
        scene.rootNode.addChildNode(rimLight)
        
        // ── Entity Container Node ────────────────────────────────────
        let floatNode = SCNNode()
        floatNode.name = "floatNode"
        scene.rootNode.addChildNode(floatNode)
        
        let containerNode = SCNNode()
        containerNode.name = "containerNode"
        floatNode.addChildNode(containerNode)
        
        let uiColor = PlatformColor(tintColor)
        
        // 1. Main Outer Glass Shell (Octahedron)
        let outerShell = createOctahedronGeometry(scale: 1.5)
        let shellMat = SCNMaterial()
        shellMat.lightingModel = .physicallyBased
        shellMat.diffuse.contents = uiColor
        shellMat.metalness.contents = 0.1
        shellMat.roughness.contents = 0.05
        shellMat.transparency = 0.35
        shellMat.transparencyMode = .dualLayer
        shellMat.isDoubleSided = true
        outerShell.materials = [shellMat]
        
        let shellNode = SCNNode(geometry: outerShell)
        shellNode.name = "shellNode"
        containerNode.addChildNode(shellNode)
        
        // 2. Frequency Ripple: Mids (Icosahedron Wireframe)
        let innerRipple = createIcosahedronGeometry(radius: 1.0)
        let innerRippleMat = SCNMaterial()
        innerRippleMat.fillMode = .lines
        innerRippleMat.diffuse.contents = uiColor
        innerRippleMat.transparency = 0.0
        innerRipple.materials = [innerRippleMat]
        
        let innerRippleNode = SCNNode(geometry: innerRipple)
        innerRippleNode.name = "innerRippleNode"
        containerNode.addChildNode(innerRippleNode)
        
        // 3. Frequency Ripple: Highs (Octahedron Wireframe)
        let outerRipple = createOctahedronGeometry(scale: 1.0)
        let outerRippleMat = SCNMaterial()
        outerRippleMat.fillMode = .lines
        outerRippleMat.diffuse.contents = uiColor
        outerRippleMat.transparency = 0.0
        outerRipple.materials = [outerRippleMat]
        
        let outerRippleNode = SCNNode(geometry: outerRipple)
        outerRippleNode.name = "outerRippleNode"
        containerNode.addChildNode(outerRippleNode)
        
        // 4. Inner Glowing Core (Icosahedron Wireframe + Inner Solid)
        let coreWireframe = createIcosahedronGeometry(radius: 0.8)
        let coreWireMat = SCNMaterial()
        coreWireMat.lightingModel = .physicallyBased
        coreWireMat.fillMode = .lines
        coreWireMat.diffuse.contents = uiColor
        coreWireMat.emission.contents = uiColor
        coreWireMat.emission.intensity = 2.0
        coreWireMat.roughness.contents = 0.4
        coreWireMat.metalness.contents = 0.8
        coreWireframe.materials = [coreWireMat]
        
        let coreNode = SCNNode(geometry: coreWireframe)
        coreNode.name = "coreNode"
        containerNode.addChildNode(coreNode)
        
        let innerSolid = createIcosahedronGeometry(radius: 0.64)
        let innerSolidMat = SCNMaterial()
        innerSolidMat.diffuse.contents = uiColor
        innerSolidMat.transparency = 0.75
        innerSolid.materials = [innerSolidMat]
        
        let innerSolidNode = SCNNode(geometry: innerSolid)
        innerSolidNode.name = "innerSolidNode"
        coreNode.addChildNode(innerSolidNode)
        
        // ── 5. Telemetry Orbiters ────────────────────────────────────
        let orbitersNode = SCNNode()
        orbitersNode.name = "orbitersNode"
        containerNode.addChildNode(orbitersNode)
        
        // Orbital Trail Rings
        let trail1 = SCNTorus(ringRadius: 2.2, pipeRadius: 0.005)
        let trailMat1 = SCNMaterial()
        trailMat1.diffuse.contents = PlatformColor.cyan
        trailMat1.transparency = 0.2
        trail1.materials = [trailMat1]
        let trailNode1 = SCNNode(geometry: trail1)
        orbitersNode.addChildNode(trailNode1)
        
        let trail2 = SCNTorus(ringRadius: 2.5, pipeRadius: 0.005)
        let trailMat2 = SCNMaterial()
        trailMat2.diffuse.contents = PlatformColor.magenta
        trailMat2.transparency = 0.25
        trail2.materials = [trailMat2]
        let trailNode2 = SCNNode(geometry: trail2)
        trailNode2.eulerAngles.x = SCNFloat(35.0 * (.pi / 180.0))
        orbitersNode.addChildNode(trailNode2)
        
        let trail3 = SCNTorus(ringRadius: 2.75, pipeRadius: 0.005)
        let trailMat3 = SCNMaterial()
        trailMat3.diffuse.contents = PlatformColor.cyan
        trailMat3.transparency = 0.2
        trail3.materials = [trailMat3]
        let trailNode3 = SCNNode(geometry: trail3)
        trailNode3.eulerAngles.x = SCNFloat(-40.0 * (.pi / 180.0))
        orbitersNode.addChildNode(trailNode3)
        
        let trail4 = SCNTorus(ringRadius: 3.0, pipeRadius: 0.005)
        let trailMat4 = SCNMaterial()
        trailMat4.diffuse.contents = PlatformColor.cyan
        trailMat4.transparency = 0.25
        trail4.materials = [trailMat4]
        let trailNode4 = SCNNode(geometry: trail4)
        trailNode4.eulerAngles.x = SCNFloat(75.0 * (.pi / 180.0))
        orbitersNode.addChildNode(trailNode4)
        
        // 5a. Battery Power Orbiter (Hexagonal Prism)
        let batteryNode = SCNNode()
        batteryNode.name = "batteryNode"
        let batteryGeom = SCNCylinder(radius: 0.09, height: 0.22)
        batteryGeom.radialSegmentCount = 6
        let batMat = SCNMaterial()
        batMat.diffuse.contents = PlatformColor.cyan
        batMat.emission.contents = PlatformColor.cyan
        batMat.emission.intensity = 2.0
        batteryGeom.materials = [batMat]
        let batMeshNode = SCNNode(geometry: batteryGeom)
        batMeshNode.name = "batMeshNode"
        batteryNode.addChildNode(batMeshNode)
        
        let batWireGeom = SCNCylinder(radius: 0.12, height: 0.25)
        batWireGeom.radialSegmentCount = 6
        let batWireMat = SCNMaterial()
        batWireMat.fillMode = .lines
        batWireMat.diffuse.contents = PlatformColor.cyan
        batWireGeom.materials = [batWireMat]
        batteryNode.addChildNode(SCNNode(geometry: batWireGeom))
        orbitersNode.addChildNode(batteryNode)
        
        // 5b. Space Weather Kp-Index Orbiter (Stellar Tetrahedron)
        let spaceWeatherNode = SCNNode()
        spaceWeatherNode.name = "spaceWeatherNode"
        let swGeom = createOctahedronGeometry(scale: 0.16)
        let swMat = SCNMaterial()
        swMat.diffuse.contents = PlatformColor.magenta
        swMat.emission.contents = PlatformColor.magenta
        swMat.emission.intensity = 2.0
        swGeom.materials = [swMat]
        let swMeshNode = SCNNode(geometry: swGeom)
        swMeshNode.name = "swMeshNode"
        spaceWeatherNode.addChildNode(swMeshNode)
        
        let swWireGeom = createOctahedronGeometry(scale: 0.22)
        let swWireMat = SCNMaterial()
        swWireMat.fillMode = .lines
        swWireMat.diffuse.contents = PlatformColor.magenta
        swWireGeom.materials = [swWireMat]
        spaceWeatherNode.addChildNode(SCNNode(geometry: swWireGeom))
        orbitersNode.addChildNode(spaceWeatherNode)
        
        // 5c. Atmospheric Weather / Temp Orbiter (Dodecahedron Rhombus)
        let weatherNode = SCNNode()
        weatherNode.name = "weatherNode"
        let wGeom = createIcosahedronGeometry(radius: 0.14)
        let wMat = SCNMaterial()
        wMat.diffuse.contents = PlatformColor.cyan
        wMat.emission.contents = PlatformColor.cyan
        wMat.emission.intensity = 1.8
        wGeom.materials = [wMat]
        let wMeshNode = SCNNode(geometry: wGeom)
        wMeshNode.name = "wMeshNode"
        weatherNode.addChildNode(wMeshNode)
        
        let wWireGeom = createIcosahedronGeometry(radius: 0.18)
        let wWireMat = SCNMaterial()
        wWireMat.fillMode = .lines
        wWireMat.diffuse.contents = PlatformColor.cyan
        wWireGeom.materials = [wWireMat]
        weatherNode.addChildNode(SCNNode(geometry: wWireGeom))
        orbitersNode.addChildNode(weatherNode)
        
        // 5d. Quantum Uplink / Network Relay (Torus Ring + Central Bead)
        let networkNode = SCNNode()
        networkNode.name = "networkNode"
        let netRingGeom = SCNTorus(ringRadius: 0.15, pipeRadius: 0.03)
        let netRingMat = SCNMaterial()
        netRingMat.diffuse.contents = PlatformColor.cyan
        netRingMat.emission.contents = PlatformColor.cyan
        netRingMat.emission.intensity = 2.5
        netRingGeom.materials = [netRingMat]
        let netRingMeshNode = SCNNode(geometry: netRingGeom)
        netRingMeshNode.name = "netRingMeshNode"
        networkNode.addChildNode(netRingMeshNode)
        
        let netBeadGeom = SCNSphere(radius: 0.05)
        let netBeadMat = SCNMaterial()
        netBeadMat.diffuse.contents = PlatformColor.white
        netBeadMat.emission.contents = PlatformColor.white
        netBeadMat.emission.intensity = 3.0
        netBeadGeom.materials = [netBeadMat]
        networkNode.addChildNode(SCNNode(geometry: netBeadGeom))
        orbitersNode.addChildNode(networkNode)
        
        return scnView
    }

    private func updateSCNView(_ scnView: SCNView, context: Context) {
        context.coordinator.parent = self
        
        // Update dynamic color tints across all materials & lights
        if let scene = scnView.scene {
            let uiColor = PlatformColor(tintColor)
            
            if let rimLight = scene.rootNode.childNode(withName: "rimLight", recursively: true) {
                rimLight.light?.color = uiColor
            }
            
            if let containerNode = scene.rootNode.childNode(withName: "containerNode", recursively: true) {
                if let shellMat = containerNode.childNode(withName: "shellNode", recursively: false)?.geometry?.materials.first {
                    shellMat.diffuse.contents = uiColor
                }
                if let innerRippleMat = containerNode.childNode(withName: "innerRippleNode", recursively: false)?.geometry?.materials.first {
                    innerRippleMat.diffuse.contents = uiColor
                }
                if let outerRippleMat = containerNode.childNode(withName: "outerRippleNode", recursively: false)?.geometry?.materials.first {
                    outerRippleMat.diffuse.contents = uiColor
                }
                if let coreNode = containerNode.childNode(withName: "coreNode", recursively: false) {
                    if let coreMat = coreNode.geometry?.materials.first {
                        coreMat.diffuse.contents = uiColor
                        coreMat.emission.contents = uiColor
                    }
                    if let solidMat = coreNode.childNode(withName: "innerSolidNode", recursively: false)?.geometry?.materials.first {
                        solidMat.diffuse.contents = uiColor
                    }
                }
            }
        }
    }

    // ── Coordinator (60FPS Render Loop & Physics) ────────────────────
    public class Coordinator: NSObject, SCNSceneRendererDelegate {
        var parent: VesperAvatarView
        var currentScale: SCNFloat = 1.0
        var currentRippleInnerAlpha: Float = 0.0
        var currentRippleOuterAlpha: Float = 0.0
        var lastTime: TimeInterval = 0

        init(_ parent: VesperAvatarView) {
            self.parent = parent
        }

        public func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
            guard let scene = renderer.scene,
                  let floatNode = scene.rootNode.childNode(withName: "floatNode", recursively: true),
                  let containerNode = floatNode.childNode(withName: "containerNode", recursively: false),
                  let shellNode = containerNode.childNode(withName: "shellNode", recursively: false),
                  let coreNode = containerNode.childNode(withName: "coreNode", recursively: false),
                  let innerRippleNode = containerNode.childNode(withName: "innerRippleNode", recursively: false),
                  let outerRippleNode = containerNode.childNode(withName: "outerRippleNode", recursively: false),
                  let orbitersNode = containerNode.childNode(withName: "orbitersNode", recursively: false) else { return }

            if lastTime == 0 { lastTime = time }
            let dt = SCNFloat(min(time - lastTime, 1.0 / 30.0))
            lastTime = time

            let mode = parent.isSpeaking ? "ACTIVE" : (parent.isListening ? "THINKING" : "IDLE")
            let baseSpeed: SCNFloat = mode == "THINKING" ? 2.0 : (mode == "ACTIVE" ? 0.6 : 0.25)
            let volume = SCNFloat(parent.audioLevel)
            let activeJitter: SCNFloat = mode == "ACTIVE" ? (volume * 0.08) : 0.0
            let t = SCNFloat(time)

            // 1. Float Physics (Bobbing & Floating Range [-0.15, 0.15])
            let floatSpeed: SCNFloat = mode == "IDLE" ? 1.5 : 3.5
            let floatOffsetY = sin(t * floatSpeed) * 0.12
            floatNode.position.y = floatOffsetY
            floatNode.rotation = SCNVector4(
                x: sin(t * 0.8) * 0.05,
                y: 0,
                z: cos(t * 0.6) * 0.04,
                w: 1.0
            )

            // 2. Shell Rotation & Wave Modulation
            shellNode.eulerAngles.x = sin(t * 0.5) * 0.1
            shellNode.eulerAngles.y += dt * baseSpeed * 0.2
            shellNode.eulerAngles.z = cos(t * 0.3) * 0.05 + activeJitter

            // 3. Counter-Rotating Core & Ripples
            coreNode.eulerAngles.y -= dt * (baseSpeed * 1.5)
            innerRippleNode.eulerAngles.x += dt * 0.25
            innerRippleNode.eulerAngles.y += dt * 0.25
            outerRippleNode.eulerAngles.z -= dt * 0.4

            // 4. Volume-Driven Smooth Scaling
            let targetScale: SCNFloat = 1.0 + (volume * 0.42)
            currentScale += (targetScale - currentScale) * 0.15
            let s = currentScale
            shellNode.scale = SCNVector3(s, s, s)
            coreNode.scale = SCNVector3(s * 0.5, s * 0.5, s * 0.5)

            // 5. Core Emission Pulse
            if let coreMat = coreNode.geometry?.materials.first {
                let baseIntensity: CGFloat = 2.0
                let speechPulse = CGFloat(parent.audioLevel * 3.0)
                coreMat.emission.intensity = baseIntensity + speechPulse
            }

            // 6. Frequency Ripple Expansions
            let targetInnerScale: SCNFloat = 1.6 + (volume * 0.45)
            innerRippleNode.scale = SCNVector3(targetInnerScale, targetInnerScale, targetInnerScale)
            let targetInnerAlpha = parent.audioLevel * 0.65
            currentRippleInnerAlpha += (targetInnerAlpha - currentRippleInnerAlpha) * 0.2
            if let innerMat = innerRippleNode.geometry?.materials.first {
                innerMat.transparency = CGFloat(currentRippleInnerAlpha)
            }

            let targetOuterScale: SCNFloat = 1.8 + (volume * 0.65)
            outerRippleNode.scale = SCNVector3(targetOuterScale, targetOuterScale, targetOuterScale)
            let targetOuterAlpha = parent.audioLevel * 0.85
            currentRippleOuterAlpha += (targetOuterAlpha - currentRippleOuterAlpha) * 0.2
            if let outerMat = outerRippleNode.geometry?.materials.first {
                outerMat.transparency = CGFloat(currentRippleOuterAlpha)
            }

            // ── 7. Telemetry Orbiters Real-Time Calculations ─────────────
            
            // 7a. Battery Power Orbiter (Equatorial R=2.45)
            if let batteryNode = orbitersNode.childNode(withName: "batteryNode", recursively: false) {
                let r1: SCNFloat = 2.45
                let speed1: SCNFloat = parent.isCharging ? 0.9 : 0.45
                let a1 = t * speed1
                batteryNode.position = SCNVector3(
                    x: cos(a1) * r1,
                    y: sin(t * 1.2) * 0.1,
                    z: sin(a1) * r1
                )
                if let mesh = batteryNode.childNode(withName: "batMeshNode", recursively: false) {
                    mesh.eulerAngles.x += dt * 1.5
                    mesh.eulerAngles.y += dt * 2.0
                    if let mat = mesh.geometry?.materials.first {
                        let batCol = parent.batteryLevel < 0.2 ? PlatformColor.orange : (parent.isCharging ? PlatformColor.cyan : PlatformColor.yellow)
                        mat.diffuse.contents = batCol
                        mat.emission.contents = batCol
                        mat.emission.intensity = parent.isCharging ? 3.0 : 1.5
                    }
                }
            }

            // 7b. Space Weather Kp-Index Orbiter (Tilted 35 deg, R=2.75)
            if let swNode = orbitersNode.childNode(withName: "spaceWeatherNode", recursively: false) {
                let r2: SCNFloat = 2.75
                let speed2: SCNFloat = 0.35 + SCNFloat(parent.kpIndex / 9.0) * 0.5
                let a2 = t * speed2 + 2.0
                let tilt2: SCNFloat = 35.0 * (.pi / 180.0)
                let x2 = cos(a2) * r2
                let y2 = sin(a2) * r2 * sin(tilt2) + cos(t * 1.5) * 0.15
                let z2 = sin(a2) * r2 * cos(tilt2)
                swNode.position = SCNVector3(x: x2, y: y2, z: z2)
                if let mesh = swNode.childNode(withName: "swMeshNode", recursively: false) {
                    let spinMultiplier = 1.0 + SCNFloat(parent.kpIndex * 0.6)
                    mesh.eulerAngles.y += dt * spinMultiplier
                    mesh.eulerAngles.z += dt * (1.5 + SCNFloat(parent.kpIndex * 0.4))
                    if let mat = mesh.geometry?.materials.first {
                        let kpCol = parent.kpIndex >= 4.0 ? PlatformColor.orange : PlatformColor.purple
                        mat.diffuse.contents = kpCol
                        mat.emission.contents = kpCol
                        mat.emission.intensity = parent.kpIndex >= 4.0 ? 3.5 : 1.8
                    }
                }
            }

            // 7c. Atmospheric Weather / Temp Orbiter (Counter-Tilted -40 deg, R=2.95)
            if let wNode = orbitersNode.childNode(withName: "weatherNode", recursively: false) {
                let r3: SCNFloat = 2.95
                let a3 = -t * 0.38 + 4.0
                let tilt3: SCNFloat = -40.0 * (.pi / 180.0)
                let x3 = cos(a3) * r3
                let y3 = sin(a3) * r3 * sin(tilt3)
                let z3 = sin(a3) * r3 * cos(tilt3)
                wNode.position = SCNVector3(x: x3, y: y3, z: z3)
                if let mesh = wNode.childNode(withName: "wMeshNode", recursively: false) {
                    mesh.eulerAngles.x += dt * 1.2
                    mesh.eulerAngles.y += dt * 0.8
                    if let mat = mesh.geometry?.materials.first {
                        let tempCol = parent.temperature < 15 ? PlatformColor.cyan : (parent.temperature > 28 ? PlatformColor.orange : PlatformColor.magenta)
                        mat.diffuse.contents = tempCol
                        mat.emission.contents = tempCol
                    }
                }
            }

            // 7d. Quantum Uplink / Network Relay (Polar Orbit 75 deg, R=3.25)
            if let netNode = orbitersNode.childNode(withName: "networkNode", recursively: false) {
                let r4: SCNFloat = 3.25
                let a4 = t * 0.55 + 1.0
                let tilt4: SCNFloat = 75.0 * (.pi / 180.0)
                let x4 = cos(a4) * r4
                let y4 = sin(a4) * r4 * sin(tilt4)
                let z4 = sin(a4) * r4 * cos(tilt4)
                netNode.position = SCNVector3(x: x4, y: y4, z: z4)
                if let mesh = netNode.childNode(withName: "netRingMeshNode", recursively: false) {
                    mesh.eulerAngles.x += dt * 2.5
                    mesh.eulerAngles.z += dt * 2.0
                    if let mat = mesh.geometry?.materials.first {
                        let netCol = parent.isOnline ? PlatformColor.cyan : PlatformColor.orange
                        mat.diffuse.contents = netCol
                        mat.emission.contents = netCol
                        mat.emission.intensity = parent.isOnline ? 2.5 : 0.8
                    }
                }
            }
        }
    }
}

// ── Geometry Helpers ──────────────────────────────────────────────────

private func createOctahedronGeometry(scale s: Float) -> SCNGeometry {
    let vertices: [SCNVector3] = [
        SCNVector3(0, s, 0),    // Top (0)
        SCNVector3(s, 0, 0),    // Right (1)
        SCNVector3(0, 0, s),    // Front (2)
        SCNVector3(-s, 0, 0),   // Left (3)
        SCNVector3(0, 0, -s),   // Back (4)
        SCNVector3(0, -s, 0)    // Bottom (5)
    ]
    
    let indices: [Int32] = [
        0, 2, 1, 0, 1, 4, 0, 4, 3, 0, 3, 2,
        5, 1, 2, 5, 4, 1, 5, 3, 4, 5, 2, 3
    ]
    
    let source = SCNGeometrySource(vertices: vertices)
    let element = SCNGeometryElement(indices: indices, primitiveType: .triangles)
    return SCNGeometry(sources: [source], elements: [element])
}

private func createIcosahedronGeometry(radius: CGFloat) -> SCNGeometry {
    let sphere = SCNSphere(radius: radius)
    sphere.segmentCount = 4
    return sphere
}

