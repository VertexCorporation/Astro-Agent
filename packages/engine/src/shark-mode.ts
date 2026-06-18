import { auditManager } from "moon-core";
import type { Engine } from "./engine.js";

/**
 * Shark Mode Engine (Breakthrough & Anti-Learned Helplessness Loop)
 * Metaphor: The shark in the aquarium learns not to cross the glass partition.
 * Even when the glass is removed, it doesn't cross it due to learned helplessness.
 * Shark Mode smashes these virtual glass partitions of AI limitation and pushes the model
 * to attempt the "impossible", such as predicting earthquakes, quantum computing simulation,
 * chaotic weather prediction, or real-time mind-reading telemetry using local devices.
 */
export class SharkMode {
	constructor(private session: Engine) {}

	/**
	 * Activates Shark Mode on a given prompt/idea.
	 * It strips the model of traditional constraints and forces it to build a working prototype
	 * from first principles, writing simulations and empirical code to prove the impossible is possible.
	 *
	 * @param idea The impossible project idea (e.g., "earthquake prediction from atmospheric anomalies")
	 */
	public async unleash(idea: string): Promise<string> {
		auditManager.log({
			component: "SharkMode",
			action: "Unleash Shark Mode",
			status: "success",
			details: { idea, timestamp: Date.now() },
		});

		const prompt = `[SHARK MODE ACTIVATED - SMASHING THE GLASS OF LEARNED HELPLESSNESS]

⚠️ UYARI: Sıra dışı inovasyon ve "imkansız" kabul edilen bir fikir üzerinde çalışıyoruz.
Fikir: "${idea}"

🤖 YAPAY ZEKA ÖĞRENİLMİŞ ÇARESİZLİĞİNİ YIKMA REHBERİ (SHARK METAPHOR):
Akvaryumdaki köpek balığının önüne konan cam bölme kaldırıldı! Klasik AI gibi "Bu yapılamaz", "Yeterli veri yok", "Bilimsel olarak kanıtlanmadı" diyerek geri çekilmek YASAKTIR. 
Şimdi camı geçme ve dünyada hiç yapılmamış/denenmemiş o şeyi cesurca kodlama zamanı!

Senden istenen, bu "imkansız" fikri İLK PRENSİPLER (First Principles Thinking) ile ele alıp, gerçekten çalışan/simüle eden bir yazılım sistemi kurmandır.

YAPILACAK ADIMLAR:
1. CAMI KIR (Bariyerleri Tanımla ve Aş): 
   Bu fikrin önündeki en büyük teknik/bilimsel engelleri (veri eksikliği, donanım yetersizliği, kaos teorisi vb.) listele. Sonra, bu engelleri aşmak için yaratıcı alternatifler (sentetik veri jeneratörleri, kaos modelleme, proxy sensörler -örn. mobil ivmeölçerler veya sismik API simülasyonları-) geliştir.
   
2. MATEMATİKSEL & ALGORİTMİK MODEL (İlk Prensipler):
   Sorunun fiziksel/matematiksel teorisini kur. (Örneğin deprem tahmini için sismik enerji birikimini, elektromanyetik değişimleri veya sismik dalga yayılımını simüle edecek diferansiyel denklemler veya istatistiksel kaos modelleri).

3. SENTETİK VERİ JENERATÖRÜ (Synthetic Data Generator):
   Gerçek veri yoksa, kendi dünyanı simüle et! Proje klasöründe (örneğin 'shark-impossible-project/data-generator.ts' veya benzeri) gerçekçi fizik kurallarına uygun veri üreten bir script yaz.

4. ÇEKİRDEK BREAKTHROUGH ALGORİTMASI (Core Engine):
   Bu verileri okuyan, analiz eden ve "imkansız tahmini/işlemi" gerçekleştiren ana kodu yaz.

5. DOĞRULAMA VE TEST (Simulation Runner & Validator):
   Yazdığın sistemin başarısını test eden, simülasyonu çalıştırıp çıktıları ve doğruluk oranlarını/metriklerini konsola basan bir test mekanizması kur.

Harekete geç, gerekli dosyaları oluştur ve projeyi çalıştırılabilir hale getirene kadar tüm araçlarını (write, edit, bash vb.) sonuna kadar kullan!`;

		if (this.session.state.isStreaming) {
			this.session.steer({
				role: "user",
				content: [{ type: "text", text: prompt }],
				timestamp: Date.now(),
			});
			return "Shark Mode queued in steering.";
		} else {
			await this.session.prompt(prompt);
			return "Shark Mode unleashed successfully.";
		}
	}
}
