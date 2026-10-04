// © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
// Tar skjermbilder av appen med WebKit (samme motor som Safari), til brukerveiledningen.
// Bygg og kjør:  swiftc -O verktoy/skjermbilder.swift -o /tmp/skjermbilder && /tmp/skjermbilder verktoy/skjermbilder.json
import AppKit
import WebKit

struct Bilde: Decodable {
  let navn: String
  let side: String          // f.eks. "pappa.html#/ny"
  let bredde: Double?
  let hoyde: Double?        // nil = hele siden
  let js: String?           // kjøres etter lasting (kan bruke await)
  let klipp: String?        // CSS-velger: ta bare bilde av dette elementet
  let etterJs: String?      // kjøres etter bildet (f.eks. trykke «Send» for å fange SMS-teksten)
  let mork: Bool?           // true = mørk modus (som en telefon med mørkt tema)
}
struct Oppsett: Decodable {
  let rot: String
  let ut: String
  let forJs: String
  let bilder: [Bilde]
}

@MainActor
final class Fotograf: NSObject, WKNavigationDelegate {
  let web: WKWebView
  let vindu: NSWindow
  var lastet: CheckedContinuation<Void, Never>?
  var fangetLenker: [String] = []

  init(forJs: String) {
    let cfg = WKWebViewConfiguration()
    cfg.websiteDataStore = .nonPersistent()
    cfg.userContentController.addUserScript(WKUserScript(source: forJs, injectionTime: .atDocumentStart, forMainFrameOnly: true))
    web = WKWebView(frame: NSRect(x: 0, y: 0, width: 390, height: 844), configuration: cfg)
    web.appearance = NSAppearance(named: .aqua)
    vindu = NSWindow(contentRect: NSRect(x: -4000, y: -4000, width: 390, height: 844), styleMask: [.borderless],
                     backing: .buffered, defer: false)
    super.init()
    vindu.contentView = web
    vindu.orderBack(nil)
    web.navigationDelegate = self
  }

  func webView(_ w: WKWebView, didFinish n: WKNavigation!) { ferdigLastet() }
  func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) { print("  lastefeil: \(e.localizedDescription)"); ferdigLastet() }
  func webView(_ w: WKWebView, didFailProvisionalNavigation n: WKNavigation!, withError e: Error) { print("  lastefeil: \(e.localizedDescription)"); ferdigLastet() }
  func ferdigLastet() {
    lastet?.resume()
    lastet = nil
  }

  func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = a.request.url, ["sms", "tel"].contains(url.scheme ?? "") {
      fangetLenker.append(url.absoluteString)
      decisionHandler(.cancel)
      return
    }
    decisionHandler(.allow)
  }

  func last(_ url: URL, rot: URL) async {
    await withCheckedContinuation { (c: CheckedContinuation<Void, Never>) in
      lastet = c
      web.loadFileURL(url, allowingReadAccessTo: rot)
      DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
        if self?.lastet != nil { print("  tidsavbrudd ved lasting av \(url.lastPathComponent)"); self?.ferdigLastet() }
      }
    }
  }

  func storrelse(_ b: Double, _ h: Double) async {
    vindu.setContentSize(NSSize(width: b, height: h))
    web.frame = NSRect(x: 0, y: 0, width: b, height: h)
    try? await Task.sleep(nanoseconds: 350_000_000)
  }

  func ta(_ b: Bilde, rot: URL, ut: URL, nr: Int) async throws {
    let bredde = b.bredde ?? 390
    web.appearance = NSAppearance(named: (b.mork ?? false) ? .darkAqua : .aqua)
    await storrelse(bredde, b.hoyde ?? 844)
    let deler = b.side.split(separator: "#", maxSplits: 1).map(String.init)
    var komp = URLComponents(url: rot.appendingPathComponent(deler[0]), resolvingAgainstBaseURL: false)!
    komp.query = "b=\(nr)"
    if deler.count > 1 { komp.percentEncodedFragment = deler[1] }
    await last(komp.url!, rot: rot)
    try? await Task.sleep(nanoseconds: 300_000_000)
    if let js = b.js {
      _ = try await web.callAsyncJavaScript("return await Promise.race([(async () => {" + js + "})(), " +
        "new Promise((_, nei) => setTimeout(() => nei(new Error('tidsavbrudd i testen')), 30000))]);",
        arguments: [:], in: nil, contentWorld: .page)
    }
    try? await Task.sleep(nanoseconds: 500_000_000)
    let hoyde: Double
    if let h = b.hoyde { hoyde = h } else {
      hoyde = (try await web.evaluateJavaScript("document.documentElement.scrollHeight") as? Double) ?? 844
      await storrelse(bredde, hoyde)
    }
    var rekt = NSRect(x: 0, y: 0, width: bredde, height: hoyde)
    if let sel = b.klipp {
      let js = "const r=document.querySelector(\(String(reflecting: sel))).getBoundingClientRect();return [r.left,r.top+scrollY,r.width,r.height];"
      if let v = try await web.callAsyncJavaScript(js, arguments: [:], in: nil, contentWorld: .page) as? [Double] {
        let luft = 10.0
        rekt = NSRect(x: max(0, v[0] - luft), y: max(0, v[1] - luft), width: min(bredde, v[2] + 2 * luft), height: v[3] + 2 * luft)
      }
    }
    let cfg = WKSnapshotConfiguration()
    cfg.rect = rekt
    cfg.snapshotWidth = NSNumber(value: rekt.width * 3 / (NSScreen.main?.backingScaleFactor ?? 2))
    let bilde = try await web.takeSnapshot(configuration: cfg)
    guard let tiff = bilde.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else { throw NSError(domain: "bilde", code: 1) }
    try png.write(to: ut.appendingPathComponent(b.navn + ".png"))
    print("✔ \(b.navn).png  \(rep.pixelsWide)×\(rep.pixelsHigh)")
    if let js = b.etterJs {
      fangetLenker = []
      _ = try await web.callAsyncJavaScript(js, arguments: [:], in: nil, contentWorld: .page)
      try? await Task.sleep(nanoseconds: 700_000_000)
      for l in fangetLenker {
        try l.write(to: ut.appendingPathComponent(b.navn + "-lenke.txt"), atomically: true, encoding: .utf8)
        print("  fanget: \(l.prefix(60))…")
      }
    }
  }
}

@MainActor
func kjor() async {
  do {
    let sti = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "verktoy/skjermbilder.json"
    let oppsett = try JSONDecoder().decode(Oppsett.self, from: Data(contentsOf: URL(fileURLWithPath: sti)))
    let rot = URL(fileURLWithPath: oppsett.rot, isDirectory: true).standardizedFileURL
    let ut = URL(fileURLWithPath: oppsett.ut, isDirectory: true).standardizedFileURL
    try FileManager.default.createDirectory(at: ut, withIntermediateDirectories: true)
    let forJs = try String(contentsOf: URL(fileURLWithPath: oppsett.forJs).standardizedFileURL, encoding: .utf8)
    let f = Fotograf(forJs: forJs)
    for (i, b) in oppsett.bilder.enumerated() {
      do { try await f.ta(b, rot: rot, ut: ut, nr: i) } catch { print("✘ \(b.navn): \(error)") }
    }
  } catch {
    print("Feil: \(error)")
  }
  NSApp.terminate(nil)
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
Task { @MainActor in await kjor() }
app.run()
