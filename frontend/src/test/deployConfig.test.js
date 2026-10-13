import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";

// Yayın ayarları (vercel.json) ile uygulamanın uyumunu korur
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const vercel = JSON.parse(read("../../vercel.json"));
const route = (src) => vercel.routes.find((r) => r.src === src && !r.handle);
const header = (key) => route("/(.*)").headers[key];

describe("vercel.json", () => {
  test("the CSP allows exactly the inline theme script in index.html", () => {
    // index.html'deki tema betiği değişip özet güncellenmezse yayında betik engellenir
    const script = read("../../index.html").match(/<script>([\s\S]*?)<\/script>/)[1];
    const hash = `sha256-${createHash("sha256").update(script, "utf8").digest("base64")}`;
    expect(header("Content-Security-Policy")).toContain(`'${hash}'`);
  });

  test("the CSP does not allow inline code or third-party sources", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/https?:\/\//); // dışarıdan betik, stil ya da font yok
  });

  test("API requests go to the backend with the proxy secret, every other path to the app", () => {
    const api = route("/api/(.*)");
    expect(api.dest).toMatch(/^https:\/\/.+\/api\/\$1$/);
    // Gizli anahtar repoda değil, Vercel ortam değişkeninde durur
    expect(api.transforms).toEqual([
      expect.objectContaining({
        type: "request.headers",
        op: "set",
        target: { key: "x-proxy-secret" },
        args: "$PROXY_SECRET",
        env: ["PROXY_SECRET"],
      }),
    ]);
    // Güvenlik başlıkları her yanıta eklenir ve yönlendirmeyi durdurmaz
    expect(vercel.routes[0]).toMatchObject({ src: "/(.*)", continue: true });
    // Önce gerçek dosyalar (build/assets), sonra uygulama
    const filesystem = vercel.routes.findIndex((r) => r.handle === "filesystem");
    expect(filesystem).toBeGreaterThan(vercel.routes.indexOf(api));
    expect(vercel.routes.at(-1)).toEqual({ src: "/(.*)", dest: "/index.html" });
    expect(vercel.outputDirectory).toBe("build");
  });
});
