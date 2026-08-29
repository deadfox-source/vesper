// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "VesperiOS",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "VesperCore",
            targets: ["VesperCore"]
        ),
    ],
    dependencies: [
        // Google Generative AI (Gemini) SDK for Swift
        .package(
            url: "https://github.com/google-gemini/generative-ai-swift",
            from: "0.5.6"
        )
    ],
    targets: [
        .target(
            name: "VesperCore",
            dependencies: [
                .product(name: "GoogleGenerativeAI", package: "generative-ai-swift")
            ],
            path: "Sources",
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "VesperCoreTests",
            dependencies: ["VesperCore"],
            path: "Tests"
        )
    ]
)
