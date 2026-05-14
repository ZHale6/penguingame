# AI Kullanım Raporu

Bu projeyi geliştirirken bazı teknik konularda yapay zeka araçlarından destek aldık.

Kullanılan yapay zeka araçları: **Gemini ve ChatGPT**

---

## 1. Framerate (FPS) Bağımsız Hareket Optimizasyonu

**Prompt:**  
Canvas üzerinde `requestAnimationFrame` kullanıyoruz ancak penguen karakterinin hareketi ekran yenileme hızına (FPS) göre farklı cihazlarda farklı hızlarda gerçekleşiyor. Bu senkronizasyon sorununu cihazdan bağımsız olarak nasıl çözebiliriz?

**Cevap:**  
Karakterin hareket hızını sabit bir piksel değeri yerine geçen zamana (Delta Time) bağlamanız gerekir. Önceki kare ile mevcut kare arasındaki zaman farkını hesaplayıp, bu değeri hareket vektörünüze çarpan olarak ekleyerek tüm cihazlarda tutarlı bir hız elde edebilirsiniz.

---

## 2. Platformlarda Yer Çekimi ve Fizik Mantığı

**Prompt:**  
JavaScript ile yaptığımız 2D platform oyununda karakterin gerçekçi şekilde yere düşmesi ve platformların içinden geçmeyip üstünde durması için yer çekimi mantığını nasıl kurabiliriz?

**Cevap:**  
Karakter için dikey hız (velocity Y) değeri tutulmalıdır. Her oyun döngüsünde bu hıza küçük bir yer çekimi (gravity) değeri eklenir. Karakter aşağı düşerken alt kenarı ile platformun üst kenarı kesişiyorsa dikey hız sıfırlanır ve karakterin y konumu platformun üstüne sabitlenir.

---

## 3. AABB Çarpışma Tespiti (Collision Detection)

**Prompt:**  
Penguenin engellere, butonlara veya kutulara çarpıp çarpmadığını HTML5 Canvas'ta en performanslı şekilde nasıl kontrol edebiliriz?

**Cevap:**  
2D objeler için AABB (Axis-Aligned Bounding Box) algoritması en uygun olanıdır. İki objenin x, y koordinatlarını ve genişlik/yükseklik değerlerini kullanarak basit bir koşul (`rect1.x < rect2.x + rect2.width ...`) ile sınır kesişim kontrolü yazabilirsiniz.

---

## 4. Sprite Animasyon Hızı ve Döngü Kontrolü

**Prompt:**  
Penguenin yürüme animasyonu için sprite sheet kullanıyoruz ancak `requestAnimationFrame` çok hızlı çalıştığı için animasyon aşırı hızlı oynuyor. Animasyonu oyun hızından bağımsız nasıl yavaşlatabiliriz?

**Cevap:**  
Bir "Frame Counter" (kare sayacı) veya "Timer" eklemelisiniz. Sayacı her döngüde artırıp, belirlediğiniz bir eşik değere ulaştığında sprite'ın yatay (`frameX`) değerini bir sonraki resme kaydırarak animasyon hızını oyun döngüsünden bağımsız kontrol edebilirsiniz.

---

## 5. Hareketli Platformlar ve Karakter Senkronizasyonu

**Prompt:**  
Oyuna hareketli platform eklemek istiyoruz ancak karakter platformun üzerindeyken platform hareket edince karakter havada kalıyor veya düşüyor. İkisini nasıl bağlayabiliriz?

**Cevap:**  
Hareketli platformun her döngüdeki x veya y eksenindeki değişim miktarı (delta) hesaplanmalıdır. Eğer oyuncunun platformun üzerinde olduğu çarpışma tespitiyle doğrulanırsa, platformun hareket miktarı doğrudan oyuncunun konumuna da eklenerek senkronize hareket sağlanır.

---

## 6. Düğme / Kapı ve Kompleks Etkileşimler

**Prompt:**  
Bir bölümde kutuyu itip düğmenin üstüne getirince kapı açılsın istiyoruz. Bunun mantığını nasıl kurabiliriz?

**Cevap:**  
Düğme ve kutu arasında sürekli çarpışma kontrolü yapılmalıdır. Eğer kutu düğmenin alanına girerse `isDoorOpen` değişkeni `true` yapılır. Kapı çizim mantığı ve oyuncunun kapıdan geçmesini engelleyen fizik (solid) özelliği bu değişkene bağlanarak yönetilir.

---

## 7. Kutuların Kırılması ve Bölüm Sonu Kontrolü

**Prompt:**  
Tüm kutular kırılmadan igloya (bölüm sonuna) geçiş izni vermek istemiyoruz. Karakter igloya temas edince bu durumu nasıl kontrol edeceğiz?

**Cevap:**  
Kutuları bir dizi içinde tutup her birine `isDestroyed` gibi bir özellik verebilirsiniz. Karakter iglo ile temas ettiğinde önce dizideki tüm kutuların durumları kontrol edilir. Hepsi kırılmışsa bölüm tamamlanır, aksi halde oyuncuya uyarı gösterilir.

---

## 8. Oyun Durum Yönetimi (State Machine)

**Prompt:**  
Projeyi geliştirirken 'Ana Menü', 'Oyun İçi' ve 'Oyun Bitti' ekranları arası geçişleri yönetmek için çok fazla boolean değişken ve if/else bloğu birikti. Canvas projelerinde bu geçişleri daha modüler nasıl yaparız?

**Cevap:**  
Bir State Machine (Durum Makinesi) kurgulayabilirsiniz. Mevcut durumu tutan tek bir `currentState` değişkeni tanımlayıp, ana `update()` ve `draw()` fonksiyonlarınızda `switch-case` kullanarak sadece aktif ekranın mantığını çalıştırıp çizdirerek kod karmaşasını önleyebilirsiniz.

---

## 9. Oyun Menüsü Arkaplan Tasarımı

**Prompt:**
A minimalist flat vector background for a game menu titled 'Penguin Adventure'. The style is clean and modern, matching a winter night theme. Deep navy blue night sky with many tiny white circular snowflakes. At the bottom, dark teal geometric triangular mountains. In the lower left corner, a cute small penguin stands on a light blue floating ice platform. In the far distance on the right, a tiny glowing white igloo. The center of the image is left mostly empty/clear to accommodate menu buttons. Vector art style, no text, smooth gradients, consistent with the provided game screenshots.

**Cevap:**
Oyun menü arkaplanı oluşturuldu.

## Genel Değerlendirme

Yapay zeka araçları, özellikle oyun motoru döngüsü (game loop) optimizasyonu, AABB çarpışma algoritmaları, fizik kuralları ve oyun akış mantığını (durum makinesi) kurgulamak için danışman olarak kullanıldı.
