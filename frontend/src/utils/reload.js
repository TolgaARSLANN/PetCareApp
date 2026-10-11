// Sayfayı yeniler. Ayrı bir modülde: testlerde gerçek yenileme yerine sahtesi kullanılır.
export const reloadPage = () => window.location.reload();

// Yeni bir sürüm yayınlanınca eski sayfa dosyaları sunucudan kalkar; o sırada sitede olan bir
// kullanıcı henüz açmadığı bir sayfaya geçerse dosya bulunamaz. Tarayıcılar bunu farklı yazar.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Failed to fetch module|ChunkLoadError/i;
export const isChunkLoadError = (error) => CHUNK_ERROR.test(`${error?.name} ${error?.message}`);

// Yeni sürümü almak için sayfa bir kez kendiliğinden yenilenir. Kısa süre içinde ikinci kez olursa
// (ör. dosya gerçekten eksik) döngüye girmemek için yenilenmez, hata sayfası gösterilir.
const RELOAD_KEY = "chunkReloadAt";
const RELOAD_WINDOW_MS = 10_000;

export const shouldAutoReload = (now = Date.now()) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (last && now - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
    return true;
  } catch {
    return false; // depolama kapalıysa döngü riskine girme
  }
};

// Aynı hata için karar bir kez verilir: React hata durumunda bileşeni iki kez kurabilir; ikinci kurulum
// ilk kurulumun kaydını "az önce yenilendi" sanıp yenilemeyi iptal etmesin
const decided = new WeakMap();
export const shouldAutoReloadFor = (error) => {
  if (error && typeof error === "object" && decided.has(error)) return decided.get(error);
  const result = isChunkLoadError(error) && shouldAutoReload();
  if (error && typeof error === "object") decided.set(error, result);
  return result;
};
