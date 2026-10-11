// Giriş yapmış kullanıcının ID'sini JWT içinden okur.
// Not: Bu yalnızca arayüzde buton göstermek içindir; asıl yetki kontrolü backend'de yapılır.
export const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).userId || null;
  } catch {
    return null;
  }
};
