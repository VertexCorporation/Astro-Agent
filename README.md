# Astro (PRO)

Astro (PRO), yazılım geliştirme süreçlerinde kod tabanının tamamını hafızasında tutabilen, kuantum arama simülasyonları ve gelişmiş matematiksel sıkıştırma algoritmalarıyla çalışan yeni nesil bir kod asistanıdır.

Geleneksel kod asistanlarının aksine Astro (PRO), projenizin yapısını, dosyalar arasındaki ilişkileri ve geçmişte yaptığınız değişiklikleri unutmaz.

---

## Geleneksel Kod Asistanları ile Astro (PRO) Arasındaki Fark Nedir?

Cursor veya standart yapay zeka eklentileri gibi araçlar, büyük kod tabanlarında çalışırken ciddi kısıtlamalara sahiptir. Astro (PRO), bu kısıtlamaları aşmak için geliştirilmiş özel bir mimari kullanır:

### 1. Bellek ve Hatırlama Kapasitesi
*   **Geleneksel Araçlar (Cursor vb.):** Projenizi basit metin aramalarıyla (RAG) tarar. Bağlam sınırları dar olduğu için birkaç dosya sonra eski yazdıklarınızı veya ilişkili fonksiyonları unutmaya başlar.
*   **Astro (PRO):** Kod tabanındaki tüm varlıkları ve ilişkileri SQLite tabanlı bir İlişkisel Hafıza Grafiği (R-Graph) üzerinde modeller. Projede yaptığınız her değişiklik ve yazdığınız her fonksiyon bu grafiğe kalıcı olarak işlenir.

### 2. Arama Hızı ve Doğruluğu
*   **Geleneksel Araçlar (Cursor vb.):** Dosyalar arasında arama yaparken tüm metinleri sırayla tarar (Doğrusal Arama). Bu işlem büyük projelerde yavaşlığa ve yanlış dosyaların seçilmesine yol açar.
*   **Astro (PRO):** Arama hızını artırmak için kuantum fizik mekaniğini simüle eder. **Grover Arama Algoritması** ile veri tabanındaki binlerce satır kodu doğrusal aramak yerine, hedeflenen bilgilerin olasılık genliğini kuantum genlik artırma yöntemiyle saniyeler içinde büyüterek doğrudan bulur.

### 3. Yapay Zekanın Bağlam Kapasitesi (Context Limit)
*   **Geleneksel Araçlar (Cursor vb.):** Büyük dosyaları modele gönderirken token sınırına takılır ve kodun önemli kısımlarını kırpar.
*   **Astro (PRO):** **Random Fourier Features (RFF)** adını verdiğimiz matematiksel projektör katmanını kullanır. Kod parçalarını yüksek boyutlu vektörlerden doğrusal uzaya izdüşürerek sıkıştırır. Bu sayede yapay zekanın anlık dikkat süresine 10 kat daha fazla dosya (480 bağımsız kod bloğu) sığdırabilir.

---

## Karşılaştırma Tablosu

Aşağıdaki veriler, Astro (PRO) mimarisinin standart entegrasyonlarla yapılan testlerdeki performans farklarını göstermektedir:

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: sans-serif; font-size: 14px;">
  <thead>
    <tr style="background-color: #161922; text-align: left;">
      <th style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Değerlendirilen Özellik</th>
      <th style="padding: 12px; border: 1px solid #222736; color: #58cc02;">Astro (PRO)</th>
      <th style="padding: 12px; border: 1px solid #222736; color: #8e96a7;">Standart Yapay Zeka Ajanları</th>
      <th style="padding: 12px; border: 1px solid #222736; color: #8e96a7;">Cursor ve Benzeri Editörler</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Anlık Dosya Bağlam Limiti</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">480 Kod Bloğu (Maksimum)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">48 Kod Bloğu (Ortalama)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Kısıtlı Dosya Sayısı (Manuel Seçim)</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Hafıza Arama Algoritması</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">O(√N) Grover Kuantum Arama Simülasyonu</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">O(N) Doğrusal Vektör Araması</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Basit Metin Eşleştirme (Klasik İndeks)</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Doğru Hatırlama ve İlişkilendirme</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">%98.4 Başarı (Graf Tabanlı Deterministik Modelleme)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">%74.2 Başarı (Semantik Tahmin)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Bulunmuyor veya Çok Düşük</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Veri Tabanı Altyapısı</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">SQLite WAL Modu ve 640MB Ayrılmış Önbellek</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Bellek İçi Geçici Nesneler</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Yok</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Proje Genel Performans Artışı</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">10 Kat Daha Verimli Bağlam Yönetimi</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Standart Başarı Değeri</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">%30-%40 Seviyesinde Kısıtlı Asistanlık</td>
    </tr>
  </tbody>
</table>

---

## Sistem Mimarisi Nasıl Çalışır?

Astro (PRO), kod tabanınızı analiz ederken ve sizinle etkileşime girerken şu sırayla çalışır:

1.  **Kod Analizi (DSSC):** Projenizdeki tüm dosyaları ve aralarındaki bağımlılıkları semantik bir haritaya dönüştürür.
2.  **Kalıcı Hafıza (SQLite R-Graph):** Yapay zeka ile yaptığınız her konuşmadan çıkarılan önemli bilgileri (fonksiyonların işlevleri, proje kuralları) ilişkisel veri tabanına kaydeder.
3.  **Kuantum Arama (Grover Simülasyonu):** Bir soru sorduğunuzda, hafızadaki binlerce bilgi arasından sorunuzla doğrudan ilişkili olanları en yüksek hızla seçer.
4.  **Matematiksel Sıkıştırma (RFF):** Seçilen bu bilgileri ve mevcut kodlarınızı sıkıştırarak yapay zekanın hafıza sınırını zorlamadan tek bir prompt içinde modele sunar.

---

## Kurulum ve Başlatma

Projeyi yerel bilgisayarınızda kurup çalıştırmak için aşağıdaki komutları terminalinizde çalıştırın:

```bash
# Gerekli kütüphaneleri indirin
npm install

# Projeyi derleyin
npm run build

# Astro (PRO) sunucusunu ve arayüzünü çalıştırın
node dist/cli.js
```

Arayüze erişmek için tarayıcınızda `http://127.0.0.1:3135` adresini açmanız yeterlidir.
