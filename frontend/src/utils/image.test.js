import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MAX_SOURCE_BYTES, prepareImage } from "./image";

// jsdom'da gerçek resim çözme ve canvas yok: createImageBitmap ve canvas taklit edilir
const fakeCanvas = (supportsWebp = true) => {
  const canvas = {
    width: 0,
    height: 0,
    drawn: null,
    getContext: () => ({
      fillRect: vi.fn(),
      drawImage: (_bitmap, x, y, w, h) => (canvas.drawn = { x, y, w, h }),
    }),
    toBlob: (callback, type) => {
      const actual = type === "image/webp" && !supportsWebp ? "image/png" : type;
      callback(new Blob([new Uint8Array(1000)], { type: actual }));
    },
  };
  return canvas;
};

const photo = (type = "image/jpeg", size = 3_000_000) => ({ type, size, name: "kedi.jpg" });

describe("prepareImage", () => {
  let canvas;
  const realCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() });
    vi.spyOn(document, "createElement").mockImplementation((tag) =>
      tag === "canvas" ? (canvas = fakeCanvas()) : realCreateElement(tag)
    );
  });

  afterEach(() => vi.restoreAllMocks());

  test("shrinks to at most 1600 px keeping the aspect ratio, as WebP", async () => {
    const result = await prepareImage(photo());
    expect(result).toMatchObject({ width: 1600, height: 1200, type: "image/webp", size: 1000 });
    expect(result.dataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(canvas.drawn).toEqual({ x: 0, y: 0, w: 1600, h: 1200 });
    // Telefonun yön bilgisine göre döndürülür
    expect(createImageBitmap).toHaveBeenCalledWith(expect.anything(), { imageOrientation: "from-image" });
  });

  test("does not enlarge small photos", async () => {
    createImageBitmap.mockResolvedValue({ width: 800, height: 600, close: vi.fn() });
    expect(await prepareImage(photo())).toMatchObject({ width: 800, height: 600 });
  });

  test("falls back to JPEG where the browser cannot make WebP", async () => {
    document.createElement.mockImplementation((tag) =>
      tag === "canvas" ? (canvas = fakeCanvas(false)) : realCreateElement(tag)
    );
    expect((await prepareImage(photo())).type).toBe("image/jpeg");
  });

  test("explains files that are not photos, too large or unreadable", async () => {
    await expect(prepareImage(photo("application/pdf"))).rejects.toThrow("Lütfen bir fotoğraf dosyası seçin");
    await expect(prepareImage(photo("image/jpeg", MAX_SOURCE_BYTES + 1))).rejects.toThrow("En fazla 20 MB");
    createImageBitmap.mockRejectedValue(new Error("decode failed"));
    await expect(prepareImage(photo())).rejects.toThrow("Bu fotoğraf açılamadı");
  });
});
