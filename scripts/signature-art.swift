// Builds the two picture assets the email signature is made of.
//
// Gmail throws away <style> blocks, ignores blend modes, filters and gradients,
// and cannot be relied on for background images. Anything with texture in it
// therefore has to arrive as a picture that already has the texture in it —
// which is what this does, using the same treatment as the binder cover so the
// signature and the site are visibly the same object.
//
// Two assets rather than one flat image: the contact details stay live HTML so
// they remain selectable, clickable, and legible when a client blocks images.
//
//   swiftc -O scripts/signature-art.swift -o /tmp/sigart
//   /tmp/sigart <portrait.jpg> <outdir>

import AppKit
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: sigart <portrait> <outdir>\n".data(using: .utf8)!)
    exit(2)
}

let inputURL = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])

let RED = CGColor(red: 227 / 255, green: 37 / 255, blue: 27 / 255, alpha: 1)
let STOCK = CGColor(red: 242 / 255, green: 237 / 255, blue: 227 / 255, alpha: 1)

func context(_ w: Int, _ h: Int) -> CGContext? {
    CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
}

/// Deterministic, so rebuilding the assets does not reshuffle the grain.
var seed: UInt64 = 20260830
func rand() -> Double {
    seed = seed &* 6364136223846793005 &+ 1442695040888963407
    return Double((seed >> 33) % 100000) / 100000.0
}

/// Print grain. Flat colour reads as a screen; noise reads as ink on paper.
func grain(_ ctx: CGContext, _ w: Int, _ h: Int, _ amount: Double, _ scale: Int = 2) {
    ctx.saveGState()
    ctx.setBlendMode(.overlay)
    for y in stride(from: 0, to: h, by: scale) {
        for x in stride(from: 0, to: w, by: scale) {
            let v = rand()
            ctx.setFillColor(
                CGColor(red: v, green: v, blue: v, alpha: amount))
            ctx.fill(CGRect(x: x, y: y, width: scale, height: scale))
        }
    }
    ctx.restoreGState()
}

func write(_ image: CGImage, to url: URL, jpeg: Bool) {
    let rep = NSBitmapImageRep(cgImage: image)
    let props: [NSBitmapImageRep.PropertyKey: Any] =
        jpeg ? [.compressionFactor: 0.88] : [:]
    guard let data = rep.representation(using: jpeg ? .jpeg : .png, properties: props) else {
        FileHandle.standardError.write("encode failed\n".data(using: .utf8)!)
        exit(1)
    }
    try? data.write(to: url)
}

// ------------------------------------------------------------- the portrait --

// Retina: the card shows it at 120×150, so it is drawn at twice that.
let PW = 240, PH = 300

guard
    let src = NSImage(contentsOf: inputURL),
    let srcCG = src.cgImage(forProposedRect: nil, context: nil, hints: nil),
    let pctx = context(PW, PH)
else {
    FileHandle.standardError.write("cannot read portrait\n".data(using: .utf8)!)
    exit(1)
}

// Fill to the frame, centred — the same cover-crop the site does everywhere.
let scale = max(Double(PW) / Double(srcCG.width), Double(PH) / Double(srcCG.height))
let dw = Double(srcCG.width) * scale
let dh = Double(srcCG.height) * scale
let drawRect = CGRect(x: (Double(PW) - dw) / 2, y: (Double(PH) - dh) / 2, width: dw, height: dh)

// Red ground, then the photograph multiplied into it and screened back on top:
// the two-plate treatment from the cover. Multiply alone kills the highlights
// and the face disappears; the overlay pass brings them back.
pctx.setFillColor(RED)
pctx.fill(CGRect(x: 0, y: 0, width: PW, height: PH))

pctx.saveGState()
pctx.setBlendMode(.multiply)
pctx.setAlpha(0.92)
pctx.draw(srcCG, in: drawRect)
pctx.restoreGState()

pctx.saveGState()
pctx.setBlendMode(.overlay)
pctx.setAlpha(0.5)
pctx.draw(srcCG, in: drawRect)
pctx.restoreGState()

grain(pctx, PW, PH, 0.13)

if let out = pctx.makeImage() {
    write(out, to: outDir.appendingPathComponent("sig-portrait.jpg"), jpeg: true)
    print("sig-portrait.jpg  \(PW)x\(PH)")
}

// -------------------------------------------------------------- the wordmark --

// Set as a picture rather than as live text so it looks the same in every
// client. Impact is the nearest thing to Anton that ships on macOS, and baking
// it means the recipient never needs the font at all.
let SIZE: CGFloat = 76
let font = NSFont(name: "Impact", size: SIZE)
    ?? NSFont(name: "Haettenschweiler", size: SIZE)
    ?? NSFont.systemFont(ofSize: SIZE, weight: .black)

func measure(_ s: String) -> CGSize {
    (s as NSString).size(withAttributes: [.font: font])
}

let leftText = "NESH"
let rightText = "VIDEO"
let leftSize = measure(leftText)
let rightSize = measure(rightText)

let pad = 12
let WW = Int(ceil(leftSize.width + rightSize.width)) + pad * 2
let WH = Int(ceil(leftSize.height)) + pad * 2

guard let wctx = context(WW, WH) else { exit(1) }

let nsctx = NSGraphicsContext(cgContext: wctx, flipped: false)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = nsctx

// The two halves, in the cover's colours.
let baseY = CGFloat(pad)
(leftText as NSString).draw(
    at: CGPoint(x: CGFloat(pad), y: baseY),
    withAttributes: [.font: font, .foregroundColor: NSColor(cgColor: STOCK)!])
(rightText as NSString).draw(
    at: CGPoint(x: CGFloat(pad) + leftSize.width, y: baseY),
    withAttributes: [.font: font, .foregroundColor: NSColor(cgColor: RED)!])

NSGraphicsContext.restoreGraphicsState()

// Texture laid *inside* the letters. sourceAtop keeps it on the type and off
// the transparent ground, which is what stops the wordmark growing a box.
wctx.saveGState()
wctx.setBlendMode(.sourceAtop)
// Sparse and faint on purpose. Dense speckle at this size stops reading as
// texture and starts reading as damage — the letters went blotchy and "NESH"
// turned pink rather than white.
for _ in 0..<(WW * WH / 110) {
    let warm = rand() > 0.5
    wctx.setFillColor(
        CGColor(
            red: warm ? 227 / 255 : 150 / 255,
            green: warm ? 37 / 255 : 22 / 255,
            blue: warm ? 27 / 255 : 18 / 255,
            alpha: 0.04 + rand() * 0.14))
    wctx.fill(
        CGRect(
            x: rand() * Double(WW), y: rand() * Double(WH),
            width: 1 + rand() * 2.0, height: 1 + rand() * 1.6))
}

// A burn along the foot of the letters, so the type sits in ink.
if let grad = CGGradient(
    colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
    colors: [
        CGColor(red: 150 / 255, green: 22 / 255, blue: 16 / 255, alpha: 0.20),
        CGColor(red: 227 / 255, green: 37 / 255, blue: 27 / 255, alpha: 0.02),
    ] as CFArray,
    locations: [0, 0.42])
{
    wctx.drawLinearGradient(
        grad, start: CGPoint(x: 0, y: CGFloat(pad)),
        end: CGPoint(x: 0, y: CGFloat(WH - pad)), options: [])
}
wctx.restoreGState()

if let out = wctx.makeImage() {
    write(out, to: outDir.appendingPathComponent("sig-wordmark.png"), jpeg: false)
    print("sig-wordmark.png  \(WW)x\(WH)")
}
