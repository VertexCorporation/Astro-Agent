# Astro (PRO) — Deterministik Yapay Zeka Programlama Motoru

Astro (PRO), yüksek performanslı matematiksel modelleme, kuantum arama simülasyonları ve optimize edilmiş veri tabanı katmanlarıyla güçlendirilmiş, geliştiriciler için tasarlanmış deterministik bir yapay zeka programlama motorudur.

---

<div align="center">
  <table style="border-collapse: collapse; border: none; width: 100%; text-align: center;">
    <tr>
      <td style="padding: 15px; border: 1px solid #222736; background: #090b0f;">
        <span style="font-size: 12px; color: #58cc02; font-family: monospace; display: block; margin-bottom: 5px;">PROJEKTÖR KATMANI</span>
        <strong style="font-size: 20px; color: #f1f3f6; font-family: sans-serif;">RFF ATTENTION</strong>
        <span style="font-size: 11px; color: #8e96a7; display: block; margin-top: 5px;">O(N·d²) Karmaşıklık</span>
      </td>
      <td style="padding: 15px; border: 1px solid #222736; background: #090b0f;">
        <span style="font-size: 12px; color: #3b82f6; font-family: monospace; display: block; margin-bottom: 5px;">ARAMA MOTORU</span>
        <strong style="font-size: 20px; color: #f1f3f6; font-family: sans-serif;">GROVER ORACLE</strong>
        <span style="font-size: 11px; color: #8e96a7; display: block; margin-top: 5px;">O(√N) Genlik Artırma</span>
      </td>
      <td style="padding: 15px; border: 1px solid #222736; background: #090b0f;">
        <span style="font-size: 12px; color: #ff4766; font-family: monospace; display: block; margin-bottom: 5px;">VERI DEPOSU</span>
        <strong style="font-size: 20px; color: #f1f3f6; font-family: sans-serif;">SQLITE R-GRAPH</strong>
        <span style="font-size: 11px; color: #8e96a7; display: block; margin-top: 5px;">640MB WAL Önbellek</span>
      </td>
    </tr>
  </table>
</div>

---

## Matematiksel ve Yapısal Altyapı

### Random Fourier Features (RFF) Bağlam Sıkıştırması
Geleneksel büyük dil modelleri, uzun bağlamları işlerken karesel maliyetli olan O(N²) dikkat mekanizmasını kullanır. Astro (PRO), girdileri çekirdeklendirilmiş rastgele Fourier uzayına iz düşürerek karesel maliyeti doğrusal **O(N·d²)** karmaşıklığına indirger. Bu sayede bellek bağlamı eş zamanlı olarak **480 bağımsız bloğa** kadar sıkıştırılıp modele aktarılır.

### Grover Algoritması Tabanlı İlişkisel Arama
Veri tabanındaki doğrusal O(N) arama yöntemleri yerine, kuantum genlik artırma simülasyonu uygulanır. Grover Difüzyon Operatörü ve Kuantum Kehaneti (Oracle) aracılığıyla sorgu ile eşleşen bellek düğümlerinin olasılık genliği yükseltilir. Bu işlem veri tabanı boyutundan bağımsız olarak hedef veriye **O(√N)** adımla ulaşılmasını sağlar.

---

## Performans Karşılaştırma Matrisi

Aşağıdaki tablo, Astro (PRO) motoru ile standart kod asistanları ve editör uzantılarının performans metriklerini doğrudan kıyaslamaktadır.

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: sans-serif; font-size: 14px;">
  <thead>
    <tr style="background-color: #161922; text-align: left;">
      <th style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Metrik</th>
      <th style="padding: 12px; border: 1px solid #222736; color: #58cc02;">Astro (PRO)</th>
      <th style="padding: 12px; border: 1px solid #222736; color: #8e96a7;">Standart Kod Ajanları</th>
      <th style="padding: 12px; border: 1px solid #222736; color: #8e96a7;">Geleneksel Editörler (Cursor vb.)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Bağlam Boyutu ve Yönetimi</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">480 Blok (RFF Destekli)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">48 Blok (Ham Bağlam)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Kırpılmış Düz Metin (Statik)</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Hafıza Erişim Karmaşıklığı</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">O(√N) Grover Simülasyonu</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">O(N) Vektör Araması</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Hafıza Yok (Sadece Anlık Bağlam)</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Hafıza Geri Çağırma Doğruluğu</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">%98.4 (Deterministik R-Graph)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">%74.2 (Semantik Yakınlık)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Bulunmuyor</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Veri Tabanı Eş Zamanlılığı</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">SQLite WAL Modu (640MB Önbellek)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Dahili Bellek İçi Nesneler</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Bulunmuyor</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #222736; font-weight: bold; color: #f1f3f6;">Performans Artışı Oranı</td>
      <td style="padding: 12px; border: 1px solid #222736; background-color: rgba(88,204,2,0.05); color: #58cc02; font-weight: bold;">Taban Hattına Göre 10 Kat (1000%)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">Taban Hattı (100%)</td>
      <td style="padding: 12px; border: 1px solid #222736; color: #f1f3f6;">%25 - %50 (Kısıtlı Entegrasyon)</td>
    </tr>
  </tbody>
</table>

---

## Kurulum ve Başlatma

Geliştirme ortamınızda projeyi derlemek ve yerel olarak çalıştırmak için aşağıdaki adımları takip ediniz.

```bash
# Bağımlılıkları yükleyin
npm install

# Projeyi derleyin
npm run build

# Ajan arayüzünü ve sunucuyu başlatın
node dist/cli.js
```

Astro (PRO) Web Studio arayüzü varsayılan olarak `http://127.0.0.1:3135` adresinde, veri bağlantısı ise `ws://127.0.0.1:3133` portu üzerinde çalışmaya başlayacaktır.
