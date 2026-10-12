// Sunucudaki kuralların (backend/server) formda, göndermeden önce uygulanan karşılıkları

// bcrypt parolanın yalnızca ilk 72 baytını kullanır; sunucu daha uzununu reddeder.
// Bayt sayılır: ç, ğ, ı, ö, ş, ü gibi harfler 2 bayttır.
export const MAX_PASSWORD_BYTES = 72;
export const PASSWORD_TOO_LONG =
  "Parola çok uzun. En fazla 72 karakter olabilir; ç, ğ, ı, ö, ş, ü gibi harfler 2 karakter sayılır.";
export const isPasswordTooLong = (password) => new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES;
