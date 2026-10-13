import React from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { CONTACT_EMAIL, CONTROLLER_NAME, LEGAL_UPDATED } from "../utils/legal";

// Kullanım Koşulları. Üyeler kayıtta kabul eder; değişince LEGAL_UPDATED ve sunucudaki TERMS_VERSION güncellenir.
const Terms = () => {
  useDocumentTitle("Kullanım Koşulları");
  return (
    <div className="page">
      <div className="container container-narrow">
        <header className="legal-header">
          <p className="eyebrow">Koşullar</p>
          <h1 className="page-title">Kullanım Koşulları</h1>
          <p className="text-muted">Son güncelleme: {LEGAL_UPDATED}</p>
        </header>

        <article className="card legal">
          <p>
            Pawfect Care, evcil dostlarınızın sağlık kayıtlarını tutmanıza ve blogda deneyim paylaşmanıza yarayan
            ücretsiz bir sitedir. {CONTROLLER_NAME} tarafından kişisel bir portföy projesi olarak yayınlanır; lütfen
            hassas bilgiler girmeyin. Siteye üye olarak bu koşulları kabul etmiş olursunuz. Kişisel verilerinizin nasıl işlendiği{" "}
            <Link to="/privacy">Gizlilik ve Aydınlatma Metni</Link>'nde anlatılır.
          </p>

          <h2>1. Üyelik</h2>
          <ul>
            <li>18 yaşından küçükseniz siteyi veli ya da vasinizin izniyle kullanabilirsiniz.</li>
            <li>
              Hesabınızın güvenliğinden siz sorumlusunuz: parolanızı kimseyle paylaşmayın. Hesabınızın izinsiz
              kullanıldığından şüphelenirseniz parolanızı değiştirin ve Hesabım sayfasından tüm cihazlardan çıkış yapın.
            </li>
            <li>
              Görünen adınız başka bir kişiyi ya da kurumu taklit edemez; yanıltıcı ya da saldırgan olamaz.
            </li>
          </ul>

          <h2>2. Sağlık bilgileri hakkında önemli not</h2>
          <p>
            Pawfect Care bir kayıt ve hatırlatma aracıdır; <strong>veteriner hekim muayenesinin, teşhisinin ya da
            tedavisinin yerini tutmaz</strong>. Sitedeki bakım önerileri, aşı hatırlatmaları ve blog yazıları genel
            bilgi amaçlıdır. Evcil dostunuzun sağlığıyla ilgili kararlar için veteriner hekiminize danışın; acil bir
            durumda vakit kaybetmeden bir veteriner kliniğine başvurun.
          </p>

          <h2>3. Paylaştığınız içerik</h2>
          <ul>
            <li>
              Blog yazıları ve kapak fotoğrafları herkese açık yayınlanır. Yayınladığınız içerikten siz sorumlusunuz ve
              paylaşma hakkına sahip olduğunuz içerikleri (kendi yazınız, kendi çektiğiniz ya da kullanma izniniz olan
              fotoğraflar) paylaşmalısınız.
            </li>
            <li>
              İçeriğinizin hakları sizde kalır. Yayınladığınız sürece, içeriğin sitede gösterilmesi için Pawfect Care'e
              ücretsiz ve münhasır olmayan bir izin vermiş olursunuz; içeriği sildiğinizde bu izin de sona erer.
            </li>
            <li>
              Şunları paylaşmak yasaktır: hukuka aykırı, hakaret ya da tehdit içeren, nefret söylemi barındıran,
              müstehcen içerikler; başkalarının kişisel bilgileri (telefon, adres vb.); başkasına ait telif hakkıyla
              korunan içerikler; reklam, spam ya da yanıltıcı bilgiler; hayvanlara kötü muameleyi özendiren içerikler.
            </li>
            <li>
              Bu kurallara aykırı içerikler önceden bildirim yapılmadan kaldırılabilir; tekrarlanan ya da ağır
              ihlallerde hesap kapatılabilir.
            </li>
          </ul>

          <h2>4. Siteyi kullanma kuralları</h2>
          <p>
            Siteyi bozmaya, güvenlik önlemlerini aşmaya, başkalarının hesaplarına erişmeye ya da siteyi otomatik
            araçlarla aşırı yüklemeye çalışmayın. Kötüye kullanımı önlemek için bazı işlemlerin sayısı sınırlıdır.
          </p>

          <h2>5. Hizmetin sunulması</h2>
          <ul>
            <li>
              Site ücretsizdir ve "olduğu gibi" sunulur. Kesintisiz ve hatasız çalışacağı garanti edilmez; bakım ya da
              teknik sorunlar nedeniyle zaman zaman erişilemeyebilir. Uzun süre kullanılmadığında ilk açılış birkaç
              saniye sürebilir.
            </li>
            <li>
              Verileriniz özenle saklanır, ancak veri kaybı riski tamamen ortadan kaldırılamaz. Önemli kayıtlarınızın
              bir kopyasını <Link to="/account">Hesabım</Link> sayfasındaki "Verilerimi indir" ile düzenli olarak
              almanızı öneririz.
            </li>
            <li>
              Site geliştirilirken özellikler değişebilir. Hizmet tamamen sona erecekse, verilerinizi indirebilmeniz
              için önceden sitede duyurulur.
            </li>
          </ul>

          <h2>6. Sorumluluk</h2>
          <p>
            Yürürlükteki mevzuatın izin verdiği ölçüde, sitenin kullanımından ya da kullanılamamasından doğan dolaylı
            zararlardan ve kullanıcıların paylaştığı içeriklerden Pawfect Care sorumlu tutulamaz. Bu madde, kanunen
            sınırlandırılamayan sorumlulukları ve tüketici olarak sahip olduğunuz hakları etkilemez.
          </p>

          <h2>7. Hesabınızı kapatma</h2>
          <p>
            Hesabınızı istediğiniz zaman <Link to="/account">Hesabım</Link> sayfasından, tüm verileriyle birlikte
            kalıcı olarak silebilirsiniz.
          </p>

          <h2>8. Değişiklikler</h2>
          <p>
            Bu koşullar güncellenebilir. Önemli değişiklikler sitede duyurulur; değişiklikten sonra siteyi kullanmaya
            devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.
          </p>

          <h2>9. Uygulanacak hukuk ve iletişim</h2>
          <p>
            Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. Sorularınız ve bildirimleriniz için:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </article>
      </div>
    </div>
  );
};

export default Terms;
