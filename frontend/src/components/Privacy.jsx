import React from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { CONTACT_EMAIL, CONTROLLER_NAME, LEGAL_UPDATED } from "../utils/legal";

// Gizlilik Politikası ve KVKK Aydınlatma Metni (6698 sayılı Kanun, m. 10).
// Uygulamanın gerçekte işlediği verileri anlatır: yeni bir veri ya da hizmet sağlayıcı eklenirse burası da güncellenir.
const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const Privacy = () => {
  useDocumentTitle("Gizlilik ve Aydınlatma Metni");
  return (
    <div className="page">
      <div className="container container-narrow">
        <header className="legal-header">
          <p className="eyebrow">Gizlilik</p>
          <h1 className="page-title">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
          <p className="text-muted">Son güncelleme: {LEGAL_UPDATED}</p>
        </header>

        <article className="card legal">
          <p>
            Bu metin, Pawfect Care'i kullanırken kişisel verilerinizin nasıl işlendiğini, 6698 sayılı Kişisel Verilerin
            Korunması Kanunu'nun ("KVKK") 10. maddesi uyarınca açıklar. Verilerinizi satmayız, reklam için kullanmayız ve
            sitede reklam ya da ziyaretçi izleme (analitik) aracı bulunmaz.
          </p>

          <h2>1. Veri sorumlusu</h2>
          <p>
            Pawfect Care kişisel bir portföy projesidir; lütfen hassas bilgiler girmeyin. Veri sorumlusu <strong>{CONTROLLER_NAME}</strong>'dır. Bu metinle ilgili
            her türlü soru ve talep için: <Mail />
          </p>

          <h2>2. Hangi verileri işliyoruz?</h2>
          <ul>
            <li>
              <strong>Hesap bilgileri:</strong> e-posta adresiniz, görünen adınız ve parolanız. Parolanızın kendisi
              saklanmaz; yalnızca geri çevrilemeyen bir özeti (bcrypt) saklanır. Kayıt sırasında Kullanım Koşulları'nı
              kabul ettiğiniz tarih de kaydedilir.
            </li>
            <li>
              <strong>Evcil dost kayıtları:</strong> eklediğiniz evcil dostların adı, türü, doğum tarihi, fotoğrafı ve
              aşı, sağlık, kilo, ilaç, randevu (tarih, saat, neden, yer) kayıtları.
            </li>
            <li>
              <strong>Acil durum kişileri:</strong> eklerseniz, bu kişilerin adı, yakınlığı, telefonu ve adresi. Bu
              bilgiler başka kişilere aittir; eklemeden önce onları bilgilendirmeniz gerekir. Yalnızca siz görürsünüz.
            </li>
            <li>
              <strong>Blog yazıları:</strong> yayınladığınız yazıların başlığı, içeriği, kapak fotoğrafı ve tarihi,
              yazar olarak da görünen adınız. Blog yazıları <strong>herkese açıktır</strong>; üye olmayanlar da okuyabilir.
            </li>
            <li>
              <strong>Fotoğraflar:</strong> yüklediğiniz fotoğraflar, yüklenmeden önce tarayıcınızda küçültülür ve
              içlerindeki konum (GPS) gibi ek bilgiler silinir.
            </li>
            <li>
              <strong>Teknik veriler:</strong> siteye bağlandığınız IP adresi. Kötüye kullanımı önlemek için (ör. art
              arda hatalı giriş denemeleri) sunucunun belleğinde en fazla 15 dakika tutulur ve bir yere yazılmaz. Siteyi
              barındıran hizmet sağlayıcılar da bağlantı kayıtlarını (IP adresi, tarih, istenen sayfa) kendi güvenlik ve
              işletim amaçlarıyla sınırlı bir süre saklayabilir.
            </li>
          </ul>
          <p>
            Bu verilerin tamamı, siz siteyi kullanırken formlar aracılığıyla elektronik ortamda toplanır. Evcil
            dostlarınızın kayıtları ve acil durum kişileri yalnızca size gösterilir.
          </p>

          <h2>3. Hangi amaçlarla ve hangi hukuki sebeplere dayanarak?</h2>
          <ul>
            <li>
              Hesabınızı açmak, oturumunuzu yönetmek ve evcil dost kayıtlarınızı saklayıp size göstermek: bir sözleşmenin
              kurulması ve ifası için gerekli olması (KVKK m. 5/2-c).
            </li>
            <li>
              Blog yazılarınızı görünen adınızla yayınlamak: sözleşmenin ifası (m. 5/2-c) ve yazıyı herkese açık olarak
              yayınlamayı sizin seçmeniz (m. 5/2-d).
            </li>
            <li>
              Siteyi ve hesapları kötüye kullanıma karşı korumak (deneme sınırları, oturum güvenliği): meşru menfaat
              (m. 5/2-f).
            </li>
            <li>
              Yasal bir talep olduğunda yetkili kurumlara bilgi vermek: hukuki yükümlülük (m. 5/2-ç).
            </li>
          </ul>
          <p>Verileriniz bu amaçlar dışında kullanılmaz ve üçüncü kişilere pazarlama için verilmez.</p>

          <h2>4. Verileriniz kimlere aktarılır?</h2>
          <p>
            Site, aşağıdaki hizmet sağlayıcıların altyapısında çalışır. Verileriniz bu sağlayıcıların sunucularında
            saklanır ve işlenir; sağlayıcılar verilerinize yalnızca hizmeti sunmak için erişir.
          </p>
          <ul>
            <li>
              <strong>Vercel Inc.</strong> (ABD): sitenin sayfalarını sunar. Siteye yaptığınız her istek, size en yakın
              Vercel sunucusundan (dünyanın farklı ülkelerinde olabilir) geçer.
            </li>
            <li>
              <strong>Render Services, Inc.</strong> (ABD): uygulama sunucusu. Sunucu Frankfurt, Almanya'dadır.
            </li>
            <li>
              <strong>MongoDB, Inc.</strong> (ABD), MongoDB Atlas: veritabanı. Verileriniz Frankfurt, Almanya'daki
              sunucularda saklanır.
            </li>
          </ul>
          <p>
            Bu sunucular Türkiye dışında olduğu için verileriniz yurt dışına aktarılmış olur (KVKK m. 9). Bunun dışında
            verileriniz yalnızca yasal bir zorunluluk olduğunda yetkili kamu kurumlarıyla paylaşılır.
          </p>

          <h2>5. Ne kadar süre saklanır?</h2>
          <ul>
            <li>Hesabınız ve ona bağlı tüm veriler hesabınız açık olduğu sürece saklanır.</li>
            <li>
              Hesabınızı sildiğinizde evcil dostlarınız ve tüm kayıtları, blog yazılarınız ve fotoğraflarınız kalıcı
              olarak hemen silinir. Silinen veriler geri getirilemez.
            </li>
            <li>Bir yazıyı ya da fotoğrafı sildiğinizde o içerik de hemen silinir.</li>
            <li>IP adresleri sunucu belleğinde en fazla 15 dakika tutulur.</li>
          </ul>

          <h2>6. Çerezler ve tarayıcınızda saklananlar</h2>
          <ul>
            <li>
              <strong>Oturum çerezi (token):</strong> giriş yaptığınızda oturumunuzu açık tutar. Zorunludur; sayfadaki
              kodlar tarafından okunamaz ve yalnızca bu siteye gönderilir. 1 gün kullanılmazsa, her durumda da girişten
              en fazla 30 gün sonra geçersiz olur; çıkış yapınca silinir.
            </li>
            <li>
              <strong>Tema tercihi:</strong> açık ya da koyu temayı kendiniz seçerseniz bu seçim tarayıcınızda
              saklanır, sunucuya gönderilmez.
            </li>
          </ul>
          <p>Reklam, analitik ya da üçüncü taraf çerezi kullanılmaz.</p>

          <h2>7. Haklarınız (KVKK m. 11)</h2>
          <p>Kişisel verilerinizle ilgili olarak şu haklara sahipsiniz:</p>
          <ul>
            <li>verilerinizin işlenip işlenmediğini öğrenmek ve işlendiyse buna ilişkin bilgi istemek,</li>
            <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek,</li>
            <li>yurt içinde ya da yurt dışında aktarıldığı üçüncü kişileri bilmek,</li>
            <li>eksik ya da yanlış işlenmişse düzeltilmesini, silinmesini ya da yok edilmesini istemek,</li>
            <li>düzeltme ve silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini istemek,</li>
            <li>
              yalnızca otomatik sistemlerle analiz edilmesi sonucunda aleyhinize bir sonuç doğmasına itiraz etmek,
            </li>
            <li>kanuna aykırı işleme nedeniyle zarara uğrarsanız zararın giderilmesini talep etmek.</li>
          </ul>
          <p>
            Bu haklarınızın çoğunu doğrudan <Link to="/account">Hesabım</Link> sayfasından kullanabilirsiniz: görünen
            adınızı ve parolanızı değiştirebilir, tüm verilerinizi tek bir dosya olarak indirebilir ya da hesabınızı
            tüm verileriyle silebilirsiniz. Diğer talepleriniz için <Mail /> adresine yazabilirsiniz; talebiniz en geç 30
            gün içinde ücretsiz olarak yanıtlanır.
          </p>

          <h2>8. Güvenlik</h2>
          <p>
            Siteyle tüm bağlantılar şifrelidir (HTTPS). Parolalar geri çevrilemez biçimde saklanır, oturumlar
            gerektiğinde tüm cihazlardan kapatılabilir ve hatalı giriş denemeleri sınırlıdır. Yine de internet üzerinden
            hiçbir sistem tamamen risksiz değildir; güçlü ve başka sitelerde kullanmadığınız bir parola seçmenizi öneririz.
          </p>

          <h2>9. 18 yaşından küçükler</h2>
          <p>
            18 yaşından küçükseniz siteyi veli ya da vasinizin izniyle kullanabilirsiniz. Veli ya da vasi olarak,
            çocuğunuza ait bir hesabın silinmesini istiyorsanız lütfen bize yazın.
          </p>

          <h2>10. Değişiklikler</h2>
          <p>
            Bu metin güncellenebilir. Önemli bir değişiklik olduğunda sitede duyurulur; güncel hali her zaman bu sayfada
            yer alır. Siteyi kullanmaya ilişkin kurallar için <Link to="/terms">Kullanım Koşulları</Link>'na bakın.
          </p>
        </article>
      </div>
    </div>
  );
};

export default Privacy;
