import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";

// Yayın ayarları (vercel.json) ile uygulamanın uyumunu korur
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const vercel = JSON.parse(read("../../vercel.json"));
const header = (key) =>
  vercel.headers.find((h) => h.source === "/(.*)").headers.find((entry) => entry.key === key)?.value;

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

  test("API requests go to the backend and every other path to the app", () => {
    const [api, app] = vercel.rewrites;
    expect(api.source).toBe("/api/:path*");
    expect(api.destination).toMatch(/^https:\/\/.+\/api\/:path\*$/);
    expect(app.destination).toBe("/index.html");
    expect(vercel.outputDirectory).toBe("build");
  });
});
