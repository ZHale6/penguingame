window.startBolum2 = function(onComplete) {

    // Oyunun çizileceği canvas elementi alınır.
    const canvas = document.getElementById("game");

    // Canvas üzerinde 2D çizim yapabilmek için context alınır.
    const ctx = canvas.getContext("2d");

    // Oyunun tasarlandığı sabit genişlik ve yükseklik.
    const GAME_W = 1300;
    const GAME_H = 750;

    // Ekrana göre ölçekleme ve ortalama değişkenleri.
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    // requestAnimationFrame id'si burada tutulur.
    let animationId;

    // Canvas boyutunu pencereye göre ayarlar.
    function resize(){

        // Canvas ekran boyutuna eşitlenir.
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Oyunun ekran boyutu değitirildiğinde oranı bozmadan ekrana sığdırılmasını sağlar.
        scale = Math.min(canvas.width / GAME_W, canvas.height / GAME_H);

        // Oyunu ekranın ortasında görünmesini sağlar.
        offsetX = (canvas.width - GAME_W * scale) / 2;
        offsetY = (canvas.height - GAME_H * scale) / 2;
    }

    // oyun başlar başlamaz ilk resize fonksiyonu çalıştırlır.
    resize();

    // Pencere boyutu değiştiğinde resize() fonksiyonunu çalıştıracak fonksiyon oluşturulur
    const handleResize = () => resize();
    // Tarayıcı penceresi yeniden boyutlandırıldığında handleResize fonksiyonu çağrılır
    window.addEventListener("resize", handleResize);

    //penguenin ilk konumunu verir.
    const startX = 70;
    const startY = 645;

    // penguenin fiziksel özelliklerini tutar.
    const player = {
        x:startX,
        y:startY,

        width:40,
        height:55,

       //penguenin hız değerlerini tutar.
        velX:0,
        velY:0,

        // penguenin hareket özellikleri.
        speed:0.34,
        maxSpeed:3.4,
        friction:0.78,
        gravity:0.58,

       //penguen yere basıyor mu kontrolü yapar.
        grounded:false,
        //kalan zıplama hakkını gösterir.
        jumpsLeft:7,
        //maksimum zıplama hakkını gösyerir.
        maxJumps:7,

        // Yürüme animasyonu için ayak hareketinin oluşmasını sağlar.
        legOffset:0,
        legDirection:1,

        // Güçlendirme sonrası ekstra zıplama kuvveti.
        jumpBoost:0
    };

    // penguenin hareket ettiği platformların konum ve boyutunu ayarlar.
    const platforms = [
        { x:0, y:700, width:850, height:40 },
        { x:920, y:650, width:500, height:20 },
        { x:600, y:330, width:260, height:20 },
        { x:930, y:440, width:180, height:20 },
        { x:0, y:450, width:180, height:20 },
        { x:230, y:230, width:190, height:20 },
        { x:650, y:70, width:230, height:20 }
    ];

    // toplanan buz kutlularının konum ve boyutunu ayarlar.
    const breakables = [
        { x:70, y:400, width:50, height:50, broken:false },
        { x:285, y:180, width:50, height:50, broken:false },
        { x:650, y:370, width:50, height:50, broken:false },
        { x:965, y:550, width:50, height:50, broken:false }
    ];

    //alındığında güçlendirme sağlayan coin nesnesi. 
    const coins = [
        { x:1150, y:630, radius:15, taken:false }
    ];

    // penguenin temas ettiğinde öleceği diken nesneleri.
    const spikes = [
        { x:930, y:426, width:180 * 0.5, height:14 }
    ];

    //  // penguenin kapıyı açabilmesi için gerekli olan kutu nesnesi.
    const pushBox = {
        x:300,
        y:650,
        width:50,
        height:50,
        velX:0
    };

    // Kapıyı açan düğme nesnesi.
    const button = {
        x:720,
        y:680,
        width:70,
        height:20,
         //kapı butonun üzerine geldiğinde true olur.
        pressed:false
    };

     // Hareketli kapı nesnesi.
    const door = {

        x: 870,
        y: 450,

        width: 45,
        height: 220,

         // Kapı açık mı kontrolünü yapar.
        open: false,

        // Kapının başlangıç konumunu verir
        startY: 450,

        // Kapının aşağı kayacağı hedef konumu verir
        targetY: 660
    };

     // Bölüm sonu ulaşması gereken iglo nesnesi
    const goal = {
        x:710,
        y:-10,
        width:90,
        height:80
    };

    // Basılı tuşları tutan nesne.
    const keys = {};

     // kırılma zıplama parıltı gibi efektleri tutar.
    const particles = [];

    // arkaplandaki kar tanelerini gösterir.
    const snowflakes = [];

     // arkaplanda rastgele konumlarda kar taneleri oluşturulur.
    for(let i = 0; i < 120; i++){
        //snowflakes bir dizi push() ile içine yeni bir kar tanesi nesnesi ekleniyor.
        snowflakes.push({
            x:Math.random() * canvas.width,
            y:Math.random() * canvas.height,
            size:Math.random() * 3 + 1,
            speed:Math.random() * 1.2 + 0.4,
            drift:(Math.random() - 0.5) * 0.6
        });
    }

    // İglo giriş animasyonu aktif mi kontrolü yapar.
    let iglooAnimation = false;

    // Penguenin uyku animasyonu kontrolü yapar.
    let penguinSleeping = false;

    // Oyun bitti mi kontrolü yapar.
    let gameFinished = false;

    //Bir tuşa basılınca çalışır.
    const handleKeyDown = function(e){

        // Escape tusuna basıldıgında oyun kapanması, animasyon durması, menüye dönme gibi işlemler yapılmasını sağlar.
        if (e.key === "Escape") {

            gameFinished = true;

            cancelAnimationFrame(animationId);

             // Klavye basma olay dinleyicisi kaldırılır,oyun inputları kapanır.
            document.removeEventListener("keydown", handleKeyDown);
             // Klavye bırakma olay dinleyicisi kaldırılır.
            document.removeEventListener("keyup", handleKeyUp);
            // Ekran boyutu değişim dinleyicisi kaldırılır
            window.removeEventListener("resize", handleResize);

             // Eğer varsa menüye dönüş fonksiyonu çalıştırılır
            if(window.returnToMenu) window.returnToMenu();

            return;
        }
        // Basılan tuşu küçük harfe çevirir.
        const key = e.key.toLowerCase();

        // Tarayıcı varsayılan hareketleri engellemek için kotrol yapılır.
        if(
            key === "a" ||                           // A tuşu
            key === "d" ||                          // D tuşu
            key === "arrowleft" ||                 // Sol ok tuşu
            key === "arrowright" ||               // Sağ ok tuşu
            key === "r" ||                       // R tuşu   
            e.code === "Space"                  // Boşluk tuşu
        ){
             // Varsayılan tarayıcı davranışını engeller
            e.preventDefault();
        }

        // basılan tuşu aktif olarak işaretler, keys objesi genelde hangi tuşlara basıldığını takip eder
        keys[key] = true;

       // Eğer basılan tuş Space (boşluk) ise ve oyuncu yerdeyse ve zıplama hakkı varsa
        if(e.code === "Space" && player.grounded && player.jumpsLeft > 0){

            // Kaç kere zıplama kullanıldığını hesaplar
            let used = player.maxJumps - player.jumpsLeft;

            // Her zıplamada güç artar.
            let jumpPower = 9.5 + used * 1.5 + player.jumpBoost;
            
             // pengueni yukarı fırlatır
            player.velY = -jumpPower;
            // Artık yerde değil
            player.grounded = false;

            // Zıplama hakkı 1 tane azaltılır.
            player.jumpsLeft--;

            // Zıplama efekti oluşturulur.
            createJumpEffect();
        }

        // R ile oyun resetlenir.
        if(key === "r") resetGame();
    };

    // Tuş bırakıldığında çalışır.
    const handleKeyUp = function(e){
        //tuş artık basılı değil
        keys[e.key.toLowerCase()] = false;
    };

    // Klavye olayları dinlenmeye başlar.
    //tuşa basınca tetiklenir.
    document.addEventListener("keydown", handleKeyDown);
    //tuş bırakılınca tetiklenir.
    document.addEventListener("keyup", handleKeyUp);

    // Oyunu tamamen başlangıç haline döndüren fonksiyondur.
    function resetGame(){

        // pengueni başlangıç noktasına geri alınır.
        player.x = startX;
        player.y = startY;

        //penguenin harreket hızlarını sıfıra alır.
        player.velX = 0;
        player.velY = 0;

        // penguenin hareket değerlerini başlangıç haline getirir.
        player.speed = 0.34;
        player.maxSpeed = 3.4;
        player.friction = 0.78;
        player.gravity = 0.58;

        player.grounded = false;

        // Zıplama hakkını tam doldurur.
        player.jumpsLeft = player.maxJumps;
        player.jumpBoost = 0;

        // Ayak animasyonu sıfırlanır.
        player.legOffset = 0;
        player.legDirection = 1;

        // İtilebilir kutu başlangıç konumuna alınır.
        pushBox.x = 300;
        pushBox.y = 650;
        pushBox.velX = 0;

        // Düğme ve kapı sıfırlanır.
        button.pressed = false;
        door.open = false;
        door.y = door.startY;

        // Oyun durumları sıfırlanır.
        iglooAnimation = false;
        penguinSleeping = false;
        gameFinished = false;

        // Tüm kırılabilir buzları eski haline döndürür.
        breakables.forEach(function(box){
            box.broken = false;
        });

        // Tüm paraları tekrar görünür, alınmamış yap
        coins.forEach(function(coin){
            coin.taken = false;
        });

        // Parçacık efektleri temizlenir.
        particles.length = 0;

        // Basılı tuşlar temizlenir. Klavyedeki tuşlar sıfırlanır.
        for(let k in keys){
            keys[k] = false;
        }
    }

    // iki nesnenin çakışıp çakışmadığını kontrol eder.
    function rectsOverlap(a,b){
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    // penguenin platformlarla çarpışmasını kontrol eder.
    function collideWithPlatforms(){

        // Başta penguen havada kabul edilir.
        player.grounded = false;

        //tüm platformlar tek tek kontrol edilir.
        platforms.forEach(function(p){

            // penguen platform ile temas ediyor mu diye kontrolü.
            if(
                player.x + player.width > p.x &&
                player.x < p.x + p.width &&
                player.y + player.height > p.y &&
                player.y < p.y + p.height
            ){

                // Üstten çarpışma (üstüne düşme)
                if(player.y + player.height - player.velY <= p.y && player.velY >= 0){

                     // pengueni platformun üstüne koy
                    player.y = p.y - player.height;

                    player.velY = 0;
                    player.grounded = true;
                }

                // ALTTAN ÇARPIŞMA (başını vurma)
                else if(player.y - player.velY >= p.y + p.height && player.velY < 0){
                    
                    // pengueni platformun altına yapıştır
                    player.y = p.y + p.height;
                    player.velY = 0;
                }

                 // SOLDAN ÇARPIŞMA (duvara sağdan çarpma)
                else if(player.x + player.width - player.velX <= p.x && player.velX > 0){
                    
                    // pengueni platformun soluna koy
                    player.x = p.x - player.width;
                    player.velX = 0;
                }

                 // SAĞDAN ÇARPIŞMA (duvara soldan çarpma)
                else if(player.x - player.velX >= p.x + p.width && player.velX < 0){
                    
                    // pengueni platformun sağına koy
                    player.x = p.x + p.width;
                    player.velX = 0;
                }
            }
        });
    }

    // İtilebilir kutunun fizik ve düğme güncellemeleri ve kontrolleri.
    function updatePushBox(){

        // Kutuya sürtünme uygulanır.
        pushBox.velX *= 0.92;

        // Kutunun konumu güncellenir.
        pushBox.x += pushBox.velX;

        // Kutunun hareket sınırları.

        if(pushBox.x < 250){
            pushBox.x = 250;
            pushBox.velX = 0;
        }

        if(pushBox.x + pushBox.width > 800){
            pushBox.x = 800 - pushBox.width;
            pushBox.velX = 0;
        }

        // penguen kutuyla temas ediyor mu kontrol edilir.
        if(rectsOverlap(player, pushBox)){
            
             // penguenin önceki ve şimdiki alt pozisyonu
            let playerBottomBefore = player.y + player.height - player.velY;
            let playerBottomNow = player.y + player.height;

            // penguenin kutunun üstüne çıkabilmesini sağlar.
            if(
                playerBottomBefore <= pushBox.y &&
                playerBottomNow >= pushBox.y &&
                player.velY >= 0
            ){
                player.y = pushBox.y - player.height;
                player.velY = 0;
                player.grounded = true;

                return;
            }

            // penguen kutuyu sağa veya sola iter.
            if(player.y + player.height > pushBox.y + 15){

                if(player.x + player.width / 2 < pushBox.x + pushBox.width / 2){

                    player.x = pushBox.x - player.width;
                    pushBox.velX = 1.15;

                } else {

                    player.x = pushBox.x + pushBox.width;
                    pushBox.velX = -1.15;
                }

                player.velX = 0;
            }
        }

        // Kutu düğmenin üzerinde mi kontrol edilir.
        let onButton =
            pushBox.x < button.x + button.width &&
            pushBox.x + pushBox.width > button.x &&
            pushBox.y + pushBox.height >= button.y;

        // Düğmeye basıldıysa kapı açılır.
        if(onButton){
            button.pressed = true;
            door.open = true;
        }

        // Düğme bırakıldıysa kapı kapanır.
        else{
            button.pressed = false;
            door.open = false;
        }
    }

    // Kapının aşağı yukarı kayma animasyonu.
    function updateDoor() {

        let slideSpeed = 4;

        // Kapı açılıyorsa aşağı kayar.
        if (door.open) {

            if (door.y < door.targetY) {
                door.y += slideSpeed;
            }
        }

        // Kapı kapanıyorsa eski yerine geri gelir.
        else {

            if (door.y > door.startY) {
                door.y -= slideSpeed;
            }
        }
    }
    // penguenin kapıyla çarpışmasını kontrol eder.
    function checkDoorCollision(){

        // penguen kapıya temas ederse kapının içinden geçmesi engellenir.
        if(rectsOverlap(player, door)){

            if(player.x < door.x){
                player.x = door.x - player.width;
            }
  
            else{
                player.x = door.x + door.width;
            }

            // Çarpışma sonrası yatay hız sıfırlanır.
            player.velX = 0;
        }
    }

    // penguenin güçlendirme nesnesi olan coin'le temasını kontrol eder.
    function checkCoins(){

        coins.forEach(function(coin){

            // Daha önce alınmış coin tekrar kontrol edilmez.
            if(coin.taken) return;

            // penguen ile coin arasındaki mesafe hesaplanır.
            let dx = player.x + player.width / 2 - coin.x;
            let dy = player.y + player.height / 2 - coin.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // penguen coin'e yeterince yaklaşırsa güçlendirme alınır.
            if(distance < coin.radius + 20){

                coin.taken = true;

                // Coin alındığında penguenin hareket özellikleri güçlenir.
                player.speed = 0.42;
                player.maxSpeed = 4.1;
                player.friction = 0.8;
                player.jumpBoost = 3.5;

                // Altın renkli parçacık efekti oluşturulur.
                createCoinEffect(coin.x, coin.y);

                // Ses çalınır.
                if(window.boxBreakSound) {
                    window.boxBreakSound.currentTime = 0;
                    window.boxBreakSound.play().catch(e => console.log("Ses çalınamadı:", e));
                }
            }
        });
    }

    // penguenin dikenlerle temasını kontrol eden fonksiyon
    function checkSpikes(){

        spikes.forEach(function(spike){

            if(
                player.x < spike.x + spike.width &&
                player.x + player.width > spike.x &&
                player.y < spike.y + spike.height &&
                player.y + player.height > spike.y
            ){
                //dikene değdiğinde oyun resetlenir. Bu yüzden resetGame() fonksiyonu çağrılır.
                resetGame();
            }
        });
    }

    // penguenin toplanabilir buzlara temasını kontrol eder.
    function checkBreakables(){

        breakables.forEach(function(box){

            // kırılabilir buzlar tekrar kırılamaz.
            if(box.broken) return;

            // penguen buza değerse buz kırılır.
            if(rectsOverlap(player, box)){

                box.broken = true;

                // buz kırılma efekti oluşturulur.
                createBreakEffect(box.x + box.width / 2, box.y + box.height / 2);

                // buz kırılma sesi çalınır.
                if(window.boxBreakSound) {
                    window.boxBreakSound.currentTime = 0;
                    window.boxBreakSound.play().catch(e => console.log("Kutu sesi çalınamadı:", e));
                }
            }
        });
    }

    // Tüm kırılabilir buzların kırılıp kırılmadığını kontrol eder.
    function allBoxesBroken(){

        for(let i=0; i<breakables.length; i++){
            
            // Eğer kırılmamış bir buz varsa oyun henüz bitmemiştir
            if(!breakables[i].broken) return false;
        }

        return true;
    }

    // penguenin igloya ulaşıp ulaşmadığını kontrol eder.
    function checkGoal(){

        // İglonun giriş kısmı hedef alan olarak belirlenir.
        const iglooEntrance = {
            x:goal.x + 28,
            y:goal.y + 60,
            width:34,
            height:30
        };

        // Bölümün tamamlanması için tüm buzlar kırılmış olmalıdır.
        if(!gameFinished && allBoxesBroken() && rectsOverlap(player, iglooEntrance)){

            player.velX = 0;
            player.velY = 0;

            startIglooAnimation();
        }
    }

    // İgloya giriş animasyonunu başlatır.
    function startIglooAnimation(){
        iglooAnimation = true;
    }

    // Oyunun tüm fiziksel ve mantıksal güncellemelerini yapar.
    function update(){

        // İglo animasyonu aktifken oyuncu kontrol edilmez.
        if(iglooAnimation){

            let targetX = goal.x + 45 - player.width / 2;
            let targetY = goal.y + 58;

            // Oyuncu yavaşça iglonun girişine çekilir.
            player.x += (targetX - player.x) * 0.08;
            player.y += (targetY - player.y) * 0.08;

            // penguen hedef noktaya yaklaştığında bölüm tamamlanır.
            if(Math.abs(player.x - targetX) < 2 && Math.abs(player.y - targetY) < 2){

                iglooAnimation = false;
                gameFinished = true;

                // Oyun bitince event listenerlar kaldırılır.
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("keyup", handleKeyUp);
                window.removeEventListener("resize", handleResize);

                // Animasyon döngüsü durdurulur.
                cancelAnimationFrame(animationId);

                // Başarı ekranı gösterilir.
                // false değeri oyunun tamamen bitmediğini, Level 3 olduğunu belirtir.
                if(window.showSuccessScreen) {
                    window.showSuccessScreen(() => {
                        //level tamamlandı callback
                        if(onComplete) onComplete();
                        else if(window.returnToMenu) window.returnToMenu();
                    }, false);
                }
            }

            return;
        }

        // penguen yerdeyken kontrol daha güçlü, havadayken daha zayıftır.
        let control = player.grounded ? player.speed : player.speed * 0.75;

        // Sola hareket.
        if(keys["a"] || keys["arrowleft"]) player.velX -= control;

        // Sağa hareket.
        if(keys["d"] || keys["arrowright"]) player.velX += control;

        // Yerde ve havada farklı sürtünme uygulanır.
        if(player.grounded) player.velX *= player.friction;
        else player.velX *= 0.96;

        // Yatay hız sınırlandırılır.
        if(player.velX > player.maxSpeed) player.velX = player.maxSpeed;
        if(player.velX < -player.maxSpeed) player.velX = -player.maxSpeed;

        // penguenin yatay konumu güncellenir.
        player.x += player.velX;

        // penguenin oyun alanından dışarı çıkması engellenir.
        if(player.x < 0) player.x = 0;
        if(player.x + player.width > GAME_W) player.x = GAME_W - player.width;

        // Yer çekimi uygulanır.
        player.velY += player.gravity;

        // Oyuncunun dikey konumu güncellenir.
        player.y += player.velY;

        // Platform çarpışmaları kontrol edilir.
        collideWithPlatforms();

        // İtilebilir kutu güncellenir.
        updatePushBox();

        // Kapı animasyonu güncellenir.
        updateDoor();

        // Kapıyla çarpışma kontrol edilir.
        checkDoorCollision();

        // Coin güçlendirmesi kontrol edilir.
        checkCoins();

        // Dikenlere temas kontrol edilir.
        checkSpikes();

        // Kırılabilir buzlar kontrol edilir.
        checkBreakables();

        // Hedefe ulaşma kontrol edilir.
        checkGoal();

        // Kar taneleri hareket ettirilir.
        updateSnow();

        // penguen yerde hareket ediyorsa ayak animasyonu yapılır.
        if(Math.abs(player.velX) > 0.5 && player.grounded){

            player.legOffset += 0.4 * player.legDirection;

            if(player.legOffset > 3 || player.legOffset < -3){
                player.legDirection *= -1;
            }
        }

        // penguen aşağı düşerse oyun başa alınır.
        if(player.y > GAME_H + 100) resetGame();
    }

    // Arka planı, dağları ve kar zeminini çizer.
    function drawBackground(){

        // Gece gökyüzü.
        ctx.fillStyle = "#0b2238";
        ctx.fillRect(0, 0, GAME_W, GAME_H);

        // Sol dağ.
        ctx.fillStyle = "#123a55";
        ctx.beginPath();
        ctx.moveTo(0, 700);
        ctx.lineTo(130, 430);
        ctx.lineTo(280, 700);
        ctx.closePath();
        ctx.fill();

        // Orta dağ.
        ctx.beginPath();
        ctx.moveTo(230, 700);
        ctx.lineTo(520, 360);
        ctx.lineTo(760, 700);
        ctx.closePath();
        ctx.fill();

        // Sağ dağ.
        ctx.beginPath();
        ctx.moveTo(650, 700);
        ctx.lineTo(980, 340);
        ctx.lineTo(1300, 700);
        ctx.closePath();
        ctx.fill();

        // Zemindeki kar tabakası.
        ctx.fillStyle = "#dff7ff";
        ctx.fillRect(0, 720, GAME_W, 30);
    }

    // Buz platformlarını çizer.
    function drawPlatforms(){

        platforms.forEach(function(p){

            // Platform ana rengi.
            ctx.fillStyle = "#64c7e8";
            ctx.fillRect(p.x, p.y, p.width, p.height);

            // Üst parlak buz çizgisi.
            ctx.fillStyle = "#e9fbff";
            ctx.fillRect(p.x, p.y, p.width, 6);

            // Alt gölge çizgisi.
            ctx.fillStyle = "#2f8fb8";
            ctx.fillRect(p.x, p.y + p.height - 6, p.width, 6);

            // Platform kenarlığı.
            ctx.strokeStyle = "#b8f3ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        });
    }

    // Coin güçlendirme nesnesini çizer.
    function drawCoins(){

        coins.forEach(function(coin){

            // Alındıysa çizilmez.
            if(coin.taken) return;

            // Coin'in dış dairesi.
            ctx.fillStyle = "gold";
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
            ctx.fill();

            // Coin'in iç çizgisi.
            ctx.strokeStyle = "#c28b00";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.radius - 5, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    // Dikenleri üçgenler halinde çizer.
    function drawSpikes(){

        spikes.forEach(function(spike){

            ctx.fillStyle = "#c1f0ff";

            let spikeCount = 5;
            let spikeWidth = spike.width / spikeCount;

            // Her diken ayrı üçgen olarak çizilir.
            for(let i = 0; i < spikeCount; i++){

                ctx.beginPath();
                ctx.moveTo(spike.x + i * spikeWidth, spike.y + spike.height);
                ctx.lineTo(spike.x + i * spikeWidth + spikeWidth / 2, spike.y);
                ctx.lineTo(spike.x + (i + 1) * spikeWidth, spike.y + spike.height);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    // Kırılabilir buz kutularını çizer.
    function drawBreakables(){

        breakables.forEach(function(box){

            // Kırılan buz kutuları görünmez.
            if(box.broken) return;

            ctx.fillStyle = "#9fe9ff";
            ctx.fillRect(box.x, box.y, box.width, box.height);

            // Üst parlama efekti.
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.fillRect(box.x + 5, box.y + 5, box.width - 15, 8);

            // Kenarlık.
            ctx.strokeStyle = "#eaffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Çatlak çizimleri.
            ctx.strokeStyle = "#3aaed1";
            ctx.lineWidth = 2;
            ctx.beginPath();

            ctx.moveTo(box.x + 10, box.y + 10);
            ctx.lineTo(box.x + 25, box.y + 26);
            ctx.lineTo(box.x + 17, box.y + 42);

            ctx.moveTo(box.x + 34, box.y + 12);
            ctx.lineTo(box.x + 26, box.y + 30);
            ctx.lineTo(box.x + 38, box.y + 43);

            ctx.stroke();
        });
    }

    // İtilebilir kutuyu çizer.
    function drawPushBox(){

        // Kutunun ana gövdesi.
        ctx.fillStyle = "#2c729c";
        ctx.fillRect(pushBox.x, pushBox.y, pushBox.width, pushBox.height);

        // Kutunun kenarlığı.
        ctx.strokeStyle = "#8ecfe3";
        ctx.lineWidth = 3;
        ctx.strokeRect(pushBox.x, pushBox.y, pushBox.width, pushBox.height);

        // Kutunun parlak buz efekti.
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(pushBox.x + 5, pushBox.y + 5, pushBox.width - 15, 8);
    }

    // Düğmeyi çizer.
    function drawButton(){

        // Basılıysa mavi, değilse kırmızı görünür.
        ctx.fillStyle = button.pressed ? "#64c7e8" : "#ff5555";
        ctx.fillRect(button.x, button.y, button.width, button.height);
    }

    // Kapıyı çizer.
    function drawDoor(){

        // Kapı açıldığında kaydığı için tamamen kaybolmaz, konumu değişir.
        ctx.fillStyle = "rgba(100, 199, 232, 0.6)";
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Kapı kenarlığı.
        ctx.strokeStyle = "#e9fbff";
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x, door.y, door.width, door.height);

        // Kapı ortasına küçük daire detayı.
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(door.x + door.width/2, door.y + door.height/2, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bölüm hedefi olan igloyu çizer.
    function drawGoal(){

        // İglonun dış kısmı.
        ctx.fillStyle = "#e8fbff";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 80, 55, Math.PI, 0);
        ctx.fill();

        // İglonun iç kısmı.
        ctx.fillStyle = "#bde6f2";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 80, 42, Math.PI, 0);
        ctx.fill();

        // İglo girişi.
        ctx.fillStyle = "#263746";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 80, 20, Math.PI, 0);
        ctx.fill();

        // Küçük ışık/süs detayı.
        ctx.fillStyle = "#ffd36b";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 72, 6, 0, Math.PI * 2);
        ctx.fill();

        // İglo blok çizgileri.
        ctx.strokeStyle = "#8ecfe3";
        ctx.lineWidth = 2;
        ctx.beginPath();

        ctx.moveTo(goal.x + 5, goal.y + 55);
        ctx.lineTo(goal.x + 85, goal.y + 55);

        ctx.moveTo(goal.x + 18, goal.y + 38);
        ctx.lineTo(goal.x + 72, goal.y + 38);

        ctx.moveTo(goal.x + 45, goal.y + 25);
        ctx.lineTo(goal.x + 45, goal.y + 55);

        ctx.stroke();
    }

    // Oyuncu karakteri olan pengueni çizer.
    function drawPlayer(){

        // Penguenin siyah dış gövdesi.
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            player.y + player.height / 2,
            20,
            28,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Penguenin beyaz karın bölgesi.
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            player.y + player.height / 2 + 5,
            11,
            16,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Uyku durumunda gözler çizgi şeklinde çizilir.
        if(penguinSleeping){

            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.beginPath();

            ctx.moveTo(player.x + 10, player.y + 18);
            ctx.lineTo(player.x + 18, player.y + 18);

            ctx.moveTo(player.x + 22, player.y + 18);
            ctx.lineTo(player.x + 30, player.y + 18);

            ctx.stroke();
        }

        // Normal durumda açık gözler çizilir.
        else{

            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(player.x + 14, player.y + 18, 4, 0, Math.PI * 2);
            ctx.arc(player.x + 26, player.y + 18, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(player.x + 14, player.y + 18, 2, 0, Math.PI * 2);
            ctx.arc(player.x + 26, player.y + 18, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Penguenin turuncu gagası.
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(player.x + 20, player.y + 25);
        ctx.lineTo(player.x + 27, player.y + 28);
        ctx.lineTo(player.x + 20, player.y + 31);
        ctx.fill();

        // Penguenin ayakları.
        ctx.fillRect(player.x + 8, player.y + 50 + player.legOffset, 8, 10);
        ctx.fillRect(player.x + 24, player.y + 50 - player.legOffset, 8, 10);
    }

    // Ekrandaki yazılı bilgileri çizer.
    function drawUI(){

        ctx.fillStyle = "white";
        ctx.font = "26px Arial";

        // Bölüm adı ve kalan zıplama hakkını gösterir.
        ctx.fillText("Level 2", 15, 35);
        ctx.fillText("Kalan Zıplama Hakkı: " + player.jumpsLeft, 15, 65);

        // Kırılan buz kutusu sayısını hesaplar.
        let broken = 0;

        breakables.forEach(function(box){
            if(box.broken) broken++;
        });

        ctx.font = "20px Arial";
        ctx.fillText("Kırılmış Kutular: " + broken + "/" + breakables.length, 15, 95);

        // Kapı durumuna göre penguene bilgi verilir.
        if(!door.open){
            ctx.fillText("Kutuyu düğmeye it: kapı açılsın!", 15, 125);
        }
        else{
            ctx.fillText("Kapı açıldı! Sağ tarafa geçebilirsin.", 15, 125);
        }

        // Kutuların durumuna göre hedef bilgisi verilir.
        if(!allBoxesBroken()){
            ctx.fillText("Tüm kutuları kırmadan igloya ulaşamazsın!", 15, 155);
        }
        else{
            ctx.fillText("Tüm kutular kırıldı! İgloya git.", 15, 155);
        }

        // Zıplama hakkı bittiyse reset uyarısı ekranda gösterilir.
        if(player.jumpsLeft === 0){
            ctx.fillStyle = "red";
            ctx.fillText("R BASARAK RESETLE", 15, 185);
        }
    }

    // Zıplama sırasında kar parçacıkları oluşturur.
    function createJumpEffect(){

        for(let i = 0; i < 10; i++){

            particles.push({
                x:player.x + player.width / 2,
                y:player.y + player.height,
                size:Math.random() * 5 + 2,
                velX:(Math.random() - 0.5) * 6,
                velY:Math.random() * -4,
                life:30,
                color:"white"
            });
        }
    }

    // buz kutuları kırıldığında buz parçacıkları oluşturur.
    function createBreakEffect(x,y){

        for(let i = 0; i < 18; i++){

            particles.push({
                x:x,
                y:y,
                size:Math.random() * 6 + 3,
                velX:(Math.random() - 0.5) * 8,
                velY:(Math.random() - 0.5) * 8,
                life:35,
                color:"white"
            });
        }
    }

    // Coin alındığında altın renkli parçacık efekti oluşturulur.
    function createCoinEffect(x,y){

        for(let i=0; i<16; i++){

            particles.push({
                x:x,
                y:y,
                size:Math.random() * 5 + 2,
                velX:(Math.random() - 0.5) * 6,
                velY:(Math.random() - 0.5) * 6,
                life:30,
                color:"gold"
            });
        }
    }

    // Parçacıkları hareket ettirir ve ömrü bitenleri siler.
    function updateParticles(){

        // Silme işlemi yapılacağı için sondan başa doğru ilerlenir.
        for(let i = particles.length - 1; i >= 0; i--){

            let p = particles[i];

            p.x += p.velX;
            p.y += p.velY;
            p.life--;

            // Parçacığın ömrü bittiyse listeden çıkarılır.
            if(p.life <= 0){
                particles.splice(i, 1);
            }
        }
    }

    // Parçacıkları ekrana çizer.
    function drawParticles(){

        particles.forEach(function(p){

            ctx.fillStyle = p.color || "white";
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }

    // Kar tanelerinin hareketini günceller.
    function updateSnow(){

        snowflakes.forEach(function(snow){

            snow.y += snow.speed;
            snow.x += snow.drift;

            // Kar tanesi ekranın altından çıkarsa tekrar yukarı gönderilir.
            if(snow.y > canvas.height){
                snow.y = -10;
                snow.x = Math.random() * canvas.width;
            }

            // Kar tanesi soldan çıkarsa sağdan geri gelir.
            if(snow.x < -10){
                snow.x = canvas.width + 10;
            }

            // Kar tanesi sağdan çıkarsa soldan geri gelir.
            if(snow.x > canvas.width + 10){
                snow.x = -10;
            }
        });
    }

    // Kar tanelerini çizer.
    function drawSnow(){

        snowflakes.forEach(function(snow){

            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath();
            ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Oyunun ana döngüsüdür.
    function gameLoop(){

        // Ölçekleme nedeniyle kenarlarda boşluk kalmaması için tüm ekran boyanır.
        ctx.fillStyle = "#071827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Oyun bitmediyse güncellemeler yapılır.
        if(!gameFinished){

            update();
            updateParticles();
        }

        // Oyun dünyası ekranın ortasına alınır ve ölçeklenir.
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Oyun içindeki tüm nesneler çizilir.
        drawBackground();
        drawPlatforms();
        drawButton();
        drawPushBox();
        drawDoor();
        drawCoins();
        drawBreakables();
        drawSpikes();
        drawGoal();
        drawPlayer();
        drawParticles();

        // Ölçekleme etkisi kaldırılır.
        ctx.restore();

        // Kar ve arayüz ekran koordinatlarına göre çizilir.
        drawSnow();
        drawUI();

        // Oyun bitmediyse bir sonraki kare istenir.
        if(!gameFinished) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Oyun başlatılır.
    gameLoop();
};