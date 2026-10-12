// services/userLock.js
// Aynı anahtar (ör. kullanıcı) için işleri sırayla çalıştırır; farklı anahtarlar birbirini beklemez.
// "Önce say, sonra kaydet" gibi adımların aynı anda gelen isteklerle bozulmaması için.
// Yalnızca tek sunucu (tek Node süreci) içinde geçerlidir.

const queues = new Map();

function withUserLock(key, task) {
  const id = String(key);
  const previous = queues.get(id) || Promise.resolve();
  const run = previous.then(task, task); // önceki iş hata verse de sıradaki çalışır
  const tail = run.catch(() => {});
  queues.set(id, tail);
  // Sırada başka iş kalmadıysa kaydı sil (bellek büyümesin)
  tail.then(() => {
    if (queues.get(id) === tail) queues.delete(id);
  });
  return run;
}

module.exports = { withUserLock, pendingLocks: () => queues.size };
