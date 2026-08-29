// Renders the binder's printed pages from the real work.
//
// The placeholder generator draws its pages procedurally, which was right when
// there was nothing to put on them. Now there is, and compositing photographs
// into a laid-out page needs an image pipeline — so this does it with
// CoreGraphics, which ships with the machine and renders type properly.
//
// Reads a JSON spec on stdin, writes JPEGs. One process renders every page, so
// fonts and colour spaces are set up once.
//
//   swiftc -O scripts/pages.swift -o /tmp/pages
//   echo '<spec>' | /tmp/pages
//
// Spec: { "outDir": "...", "pages": [ { "id", "kind", "ground", "index",
//         "title", "tail", "kicker", "blurb", "images": [paths] } ] }

import AppKit
import CoreText
import Foundation

// The printed page, and the bare photograph. Both sizes are what
// lib/spreads.ts already expects — the frame is landscape because the masthead
// cuts its type out of it and the contact strip runs it as a filmstrip cell.
let PAGE = CGSize(width: 900, height: 1274)
let FRAME = CGSize(width: 1000, height: 700)

let STOCK = NSColor(srgbRed: 0.949, green: 0.929, blue: 0.890, alpha: 1) // #F2EDE3
let INK = NSColor(srgbRed: 0.067, green: 0.067, blue: 0.067, alpha: 1)  // #111
let RED = NSColor(srgbRed: 0.890, green: 0.145, blue: 0.106, alpha: 1)  // #E3251B
let GOLD = NSColor(srgbRed: 0.914, green: 0.655, blue: 0.200, alpha: 1) // #E9A733

/// The gutter tenth is kept clear of art: it is where the ring holes bite.
let GUTTER: CGFloat = 0.1

struct PageSpec: Decodable {
    let id: String
    let kind: String
    var ground: String?
    var index: String?
    var title: String?
    var tail: String?
    var kicker: String?
    var blurb: String?
    var images: [String]
}

struct Spec: Decodable {
    let outDir: String
    let pages: [PageSpec]
}

// ------------------------------------------------------------------ helpers --

func loadImage(_ path: String) -> CGImage? {
    guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
    else { return nil }
    return img
}

extension CGContext {
    func fill(_ rect: CGRect, _ color: NSColor) {
        setFillColor(color.cgColor)
        fill(rect)
    }

    /// Draws an image to fill `rect`, cropping the overflow — the CSS
    /// `object-fit: cover` behaviour, which is what a photo editor does.
    func drawCover(_ image: CGImage, in rect: CGRect) {
        let iw = CGFloat(image.width), ih = CGFloat(image.height)
        guard iw > 0, ih > 0, rect.width > 0, rect.height > 0 else { return }

        let scale = max(rect.width / iw, rect.height / ih)
        let w = iw * scale, h = ih * scale
        let drawn = CGRect(
            x: rect.midX - w / 2, y: rect.midY - h / 2, width: w, height: h)

        saveGState()
        clip(to: rect)
        draw(image, in: drawn)
        restoreGState()
    }

    func text(
        _ string: String, at point: CGPoint, size: CGFloat, color: NSColor,
        weight: NSFont.Weight = .regular, tracking: CGFloat = 0, mono: Bool = false,
        align: NSTextAlignment = .left, width: CGFloat? = nil
    ) {
        let font =
            mono
            ? NSFont.monospacedSystemFont(ofSize: size, weight: weight)
            : NSFont.systemFont(ofSize: size, weight: weight)

        let para = NSMutableParagraphStyle()
        para.alignment = align
        para.lineSpacing = size * 0.28

        let attrs: [NSAttributedString.Key: Any] = [
            .font: font, .foregroundColor: color, .kern: tracking, .paragraphStyle: para,
        ]

        let gc = NSGraphicsContext(cgContext: self, flipped: false)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = gc
        let s = NSAttributedString(string: string, attributes: attrs)
        if let width {
            s.draw(with: CGRect(x: point.x, y: point.y - size * 6, width: width, height: size * 6),
                   options: [.usesLineFragmentOrigin])
        } else {
            s.draw(at: point)
        }
        NSGraphicsContext.restoreGraphicsState()
    }

    /// The red / gold / green band that runs under every header on the site.
    func flagRule(_ rect: CGRect) {
        let colors: [NSColor] = [RED, GOLD, NSColor(srgbRed: 0.055, green: 0.478, blue: 0.235, alpha: 1)]
        let w = rect.width / CGFloat(colors.count)
        for (i, c) in colors.enumerated() {
            fill(CGRect(x: rect.minX + CGFloat(i) * w, y: rect.minY, width: w, height: rect.height), c)
        }
    }

    /// A thin black rebate with a hairline outside it — the film edge the site
    /// puts around every frame.
    func rebate(_ rect: CGRect) {
        setStrokeColor(NSColor.black.cgColor)
        setLineWidth(6)
        stroke(rect.insetBy(dx: -3, dy: -3))
    }
}

// -------------------------------------------------------------------- pages --

func render(_ page: PageSpec, size: CGSize, bleed: Bool) -> CGImage? {
    guard
        let ctx = CGContext(
            data: nil, width: Int(size.width), height: Int(size.height),
            bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpace(name: CGColorSpace.sRGB)!,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return nil }

    let ground: NSColor =
        page.ground == "red" ? RED : page.ground == "ink" ? INK : STOCK
    let onDark = page.ground == "red" || page.ground == "ink"
    let type = onDark ? STOCK : INK

    ctx.fill(CGRect(origin: .zero, size: size), ground)

    // On a printed page the gutter is dead space; on a bare frame it is not.
    let gutter = bleed ? 0 : size.width * GUTTER
    let margin = size.width * 0.075
    let box = CGRect(
        x: gutter + margin, y: margin,
        width: size.width - gutter - margin * 2, height: size.height - margin * 2)

    let images = page.images.compactMap(loadImage)

    switch page.kind {
    case "title":
        // The cover: type only, and a lot of air.
        ctx.flagRule(CGRect(x: box.minX, y: box.maxY - 90, width: box.width, height: 12))
        ctx.text(
            page.kicker ?? "", at: CGPoint(x: box.minX, y: box.maxY - 150), size: 20,
            color: STOCK.withAlphaComponent(0.85), weight: .bold, tracking: 3.4, mono: true)
        ctx.text(
            page.title ?? "", at: CGPoint(x: box.minX, y: box.midY + 40), size: 132,
            color: STOCK, weight: .black, tracking: -3)
        ctx.text(
            page.tail ?? "", at: CGPoint(x: box.minX, y: box.midY - 100), size: 132,
            color: STOCK.withAlphaComponent(0.35), weight: .black, tracking: -3)
        ctx.text(
            page.blurb ?? "", at: CGPoint(x: box.minX, y: box.minY + 130), size: 21,
            color: STOCK.withAlphaComponent(0.8), width: box.width * 0.8)

    case "poster":
        // One frame, screened back into flat colour, and the section number
        // sitting on top of it. The loudest page in the book.
        if let img = images.first {
            let plate = CGRect(
                x: box.minX, y: box.minY + box.height * 0.2,
                width: box.width, height: box.height * 0.62)
            ctx.saveGState()
            ctx.setAlpha(0.62)
            ctx.drawCover(img, in: plate)
            ctx.restoreGState()
            ctx.rebate(plate)
        }
        ctx.text(
            page.index ?? "", at: CGPoint(x: box.minX, y: box.maxY - 120), size: 96,
            color: STOCK, weight: .black, tracking: -2)
        ctx.text(
            (page.title ?? "") + (page.tail ?? ""),
            at: CGPoint(x: box.minX, y: box.minY + 40), size: 62, color: STOCK,
            weight: .black, tracking: -1.4)

    case "hero":
        // One wide still under a credit block.
        if let img = images.first {
            let plate = CGRect(
                x: box.minX, y: box.minY + box.height * 0.26,
                width: box.width, height: box.height * 0.66)
            ctx.drawCover(img, in: plate)
            ctx.rebate(plate)
        }
        ctx.flagRule(CGRect(x: box.minX, y: box.minY + box.height * 0.2, width: box.width, height: 8))
        ctx.text(
            page.kicker ?? "", at: CGPoint(x: box.minX, y: box.minY + box.height * 0.14),
            size: 17, color: type.withAlphaComponent(0.7), weight: .bold, tracking: 2.8, mono: true)
        ctx.text(
            (page.title ?? "") + (page.tail ?? ""),
            at: CGPoint(x: box.minX, y: box.minY + 30), size: 54, color: type,
            weight: .black, tracking: -1.2)

    case "plate":
        // A single medium-format frame, rebate and all, hung high with the
        // caption under it.
        if let img = images.first {
            let side = min(box.width, box.height * 0.68)
            let plate = CGRect(
                x: box.midX - side / 2, y: box.maxY - side - 40, width: side, height: side)
            ctx.drawCover(img, in: plate)
            ctx.rebate(plate)
        }
        ctx.text(
            page.kicker ?? "", at: CGPoint(x: box.minX, y: box.minY + 120), size: 17,
            color: type.withAlphaComponent(0.7), weight: .bold, tracking: 2.8, mono: true)
        ctx.text(
            (page.title ?? "") + (page.tail ?? ""),
            at: CGPoint(x: box.minX, y: box.minY + 40), size: 50, color: type,
            weight: .black, tracking: -1.1)

    case "contact":
        // A proof sheet off the light box: everything the section holds, small.
        let cols = 3, rows = 4
        let gap: CGFloat = 14
        let cw = (box.width - gap * CGFloat(cols - 1)) / CGFloat(cols)
        let chh = (box.height * 0.78 - gap * CGFloat(rows - 1)) / CGFloat(rows)

        for r in 0..<rows {
            for c in 0..<cols {
                let n = r * cols + c
                let cell = CGRect(
                    x: box.minX + CGFloat(c) * (cw + gap),
                    y: box.maxY - chh - CGFloat(r) * (chh + gap),
                    width: cw, height: chh)
                if n < images.count {
                    ctx.drawCover(images[n], in: cell)
                    ctx.setStrokeColor(NSColor.black.withAlphaComponent(0.9).cgColor)
                    ctx.setLineWidth(3)
                    ctx.stroke(cell)
                } else {
                    // An empty bay still reads as part of the sheet.
                    ctx.fill(cell, onDark ? STOCK.withAlphaComponent(0.06) : INK.withAlphaComponent(0.05))
                }
                // A frame number set straight onto the photograph disappears
                // the moment the corner is bright, so it gets its own chip.
                ctx.fill(
                    CGRect(x: cell.minX + 4, y: cell.minY + 4, width: 26, height: 15),
                    NSColor.black.withAlphaComponent(0.62))
                ctx.text(
                    String(format: "%02d", n + 1),
                    at: CGPoint(x: cell.minX + 8, y: cell.minY + 5), size: 11,
                    color: STOCK.withAlphaComponent(0.95), weight: .bold, tracking: 1, mono: true)
            }
        }
        ctx.text(
            (page.title ?? "") + (page.tail ?? ""),
            at: CGPoint(x: box.minX, y: box.minY + 30), size: 40, color: type,
            weight: .black, tracking: -0.9)

    default:  // "grid"
        // The six-up from the reference spread: a standfirst, then the work.
        let cols = 2, rows = 3
        let gap: CGFloat = 18
        let cw = (box.width - gap) / CGFloat(cols)
        let chh = (box.height * 0.8 - gap * CGFloat(rows - 1)) / CGFloat(rows)

        for r in 0..<rows {
            for c in 0..<cols {
                let n = r * cols + c
                let cell = CGRect(
                    x: box.minX + CGFloat(c) * (cw + gap),
                    y: box.maxY - chh - CGFloat(r) * (chh + gap) - box.height * 0.02,
                    width: cw, height: chh)
                if n < images.count {
                    ctx.drawCover(images[n], in: cell)
                    ctx.rebate(cell.insetBy(dx: 1, dy: 1))
                } else {
                    ctx.fill(cell, onDark ? STOCK.withAlphaComponent(0.06) : INK.withAlphaComponent(0.05))
                }
            }
        }
        ctx.flagRule(CGRect(x: box.minX, y: box.minY + 96, width: box.width, height: 7))
        ctx.text(
            page.kicker ?? "", at: CGPoint(x: box.minX, y: box.minY + 62), size: 16,
            color: type.withAlphaComponent(0.7), weight: .bold, tracking: 2.6, mono: true)
        ctx.text(
            (page.title ?? "") + (page.tail ?? ""),
            at: CGPoint(x: box.minX, y: box.minY + 8), size: 44, color: type,
            weight: .black, tracking: -1)
    }

    return ctx.makeImage()
}

/// The bare photograph a page stands for, full bleed and free of type.
func renderFrame(_ page: PageSpec) -> CGImage? {
    guard
        let ctx = CGContext(
            data: nil, width: Int(FRAME.width), height: Int(FRAME.height),
            bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpace(name: CGColorSpace.sRGB)!,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return nil }

    let rect = CGRect(origin: .zero, size: FRAME)
    let ground: NSColor = page.ground == "red" ? RED : page.ground == "ink" ? INK : STOCK
    ctx.fill(rect, ground)

    if let img = page.images.compactMap(loadImage).first {
        ctx.drawCover(img, in: rect)
    }

    return ctx.makeImage()
}

func writeJPEG(_ image: CGImage, to path: String) {
    let rep = NSBitmapImageRep(cgImage: image)
    guard
        let data = rep.representation(
            using: .jpeg, properties: [.compressionFactor: 0.86])
    else { return }
    try? data.write(to: URL(fileURLWithPath: path))
}

// --------------------------------------------------------------------- run --

let input = FileHandle.standardInput.readDataToEndOfFile()
let spec = try JSONDecoder().decode(Spec.self, from: input)

let pagesDir = spec.outDir + "/pages"
let framesDir = spec.outDir + "/frames"
for d in [pagesDir, framesDir] {
    try? FileManager.default.createDirectory(
        atPath: d, withIntermediateDirectories: true)
}

for page in spec.pages {
    if let printed = render(page, size: PAGE, bleed: false) {
        writeJPEG(printed, to: "\(pagesDir)/\(page.id).jpg")
    }
    // The bare photograph. Not a second run of the page layout: the masthead
    // cuts its type straight out of this file and the contact strip runs it as
    // a filmstrip cell, so both want the picture itself, full bleed and with
    // no type of its own to collide with theirs.
    if let bare = renderFrame(page) {
        writeJPEG(bare, to: "\(framesDir)/\(page.id).jpg")
    }
    print("  \(page.id)")
}
