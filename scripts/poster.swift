// Pulls a poster frame out of a video file.
//
// A first frame is usually the worst frame — black, or halfway through a fade.
// So this samples several points across the running time and keeps the one with
// the most going on: brightest on average, and with the widest spread of tones.
// Written against AVFoundation so it needs nothing installed; macOS ships it.
//
//   swiftc -O scripts/poster.swift -o /tmp/poster
//   /tmp/poster input.mov output.png

import AVFoundation
import AppKit
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: poster <video> <output.png>\n".data(using: .utf8)!)
    exit(2)
}

let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])

let asset = AVURLAsset(url: input)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = CGSize(width: 2400, height: 2400)
// Grabbing exactly on a requested time forces a decode from the previous
// keyframe; a couple of seconds either way is free and just as good a frame.
generator.requestedTimeToleranceBefore = CMTime(seconds: 1.5, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 1.5, preferredTimescale: 600)

let seconds = CMTimeGetSeconds(asset.duration)
guard seconds.isFinite, seconds > 0 else {
    FileHandle.standardError.write("unreadable duration\n".data(using: .utf8)!)
    exit(1)
}

/// Mean luminance and spread, sampled off a small thumbnail of the frame.
func score(_ image: CGImage) -> Double {
    let w = 64, h = 64
    var pixels = [UInt8](repeating: 0, count: w * h * 4)
    guard
        let space = CGColorSpace(name: CGColorSpace.sRGB),
        let ctx = CGContext(
            data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
            space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return 0 }

    ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))

    var luma = [Double]()
    luma.reserveCapacity(w * h)
    for i in stride(from: 0, to: pixels.count, by: 4) {
        let r = Double(pixels[i]), g = Double(pixels[i + 1]), b = Double(pixels[i + 2])
        luma.append((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0)
    }

    let mean = luma.reduce(0, +) / Double(luma.count)
    let variance = luma.reduce(0) { $0 + ($1 - mean) * ($1 - mean) } / Double(luma.count)

    // A frame that is merely bright and flat is no better than a black one, so
    // contrast carries most of the weight. Near-black frames are ruled out.
    if mean < 0.06 { return 0 }
    return sqrt(variance) * 2.0 + mean
}

// Skip the head and tail: titles, fades and end cards live there.
let fractions = [0.12, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82]
var best: CGImage?
var bestScore = -1.0

for f in fractions {
    let time = CMTime(seconds: seconds * f, preferredTimescale: 600)
    guard let frame = try? generator.copyCGImage(at: time, actualTime: nil) else { continue }
    let s = score(frame)
    if s > bestScore {
        bestScore = s
        best = frame
    }
}

// Nothing scored — fall back to whatever the very start gives us.
if best == nil {
    best = try? generator.copyCGImage(at: .zero, actualTime: nil)
}

guard let frame = best else {
    FileHandle.standardError.write("no frame\n".data(using: .utf8)!)
    exit(1)
}

let rep = NSBitmapImageRep(cgImage: frame)
guard let data = rep.representation(using: .png, properties: [:]) else {
    FileHandle.standardError.write("encode failed\n".data(using: .utf8)!)
    exit(1)
}

try data.write(to: output)
