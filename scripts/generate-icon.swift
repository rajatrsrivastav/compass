// Original vector compass artwork. Run on macOS: swift scripts/generate-icon.swift
import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let resources = root.appendingPathComponent("resources")
let scratch = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
let iconset = scratch.appendingPathComponent("icon.iconset")
try FileManager.default.createDirectory(at: resources, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: iconset, withIntermediateDirectories: true)
defer { try? FileManager.default.removeItem(at: scratch) }

func render(_ size: Int) -> Data {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    let context = NSGraphicsContext.current!.cgContext
    context.scaleBy(x: CGFloat(size) / 1024, y: CGFloat(size) / 1024)
    NSColor(calibratedRed: 0.063, green: 0.071, blue: 0.078, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(x: 48, y: 48, width: 928, height: 928), xRadius: 210, yRadius: 210).fill()
    let accent = NSColor(calibratedRed: 0.659, green: 0.875, blue: 0.710, alpha: 1)
    accent.setStroke()
    let ring = NSBezierPath(ovalIn: NSRect(x: 208, y: 208, width: 608, height: 608))
    ring.lineWidth = 34
    ring.stroke()
    let needle = NSBezierPath()
    needle.move(to: NSPoint(x: 700, y: 700))
    needle.line(to: NSPoint(x: 555, y: 469))
    needle.line(to: NSPoint(x: 324, y: 324))
    needle.line(to: NSPoint(x: 469, y: 555))
    needle.close()
    accent.setFill()
    needle.fill()
    NSColor(calibratedRed: 0.063, green: 0.071, blue: 0.078, alpha: 1).setFill()
    NSBezierPath(ovalIn: NSRect(x: 486, y: 486, width: 52, height: 52)).fill()
    NSGraphicsContext.restoreGraphicsState()
    return bitmap.representation(using: .png, properties: [:])!
}
for size in [16, 32, 128, 256, 512] {
    try render(size).write(to: iconset.appendingPathComponent("icon_\(size)x\(size).png"))
    try render(size * 2).write(to: iconset.appendingPathComponent("icon_\(size)x\(size)@2x.png"))
}
try render(1024).write(to: resources.appendingPathComponent("icon.png"))
let converter = Process()
converter.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
converter.arguments = ["-c", "icns", iconset.path, "-o", resources.appendingPathComponent("icon.icns").path]
try converter.run()
converter.waitUntilExit()
if converter.terminationStatus != 0 { exit(converter.terminationStatus) }
print("Generated resources/icon.png and resources/icon.icns from vector paths.")
