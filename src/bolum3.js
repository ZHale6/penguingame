//startBolum3 adında bir fonksiyon oluşturur ve window nesnesine bağlandığı için bu fonksiyona sayfanın her yerinden erişilebilir.
window.startBolum3 = function(onComplete) {
    //Oyunun çizileceği canvas alanını bulur.
    const canvas = document.getElementById("game");

    //Canvas üzerinde 2 boyutlu çizim yapabilmek için context alınır.
    const ctx = canvas.getContext("2d");

    //Oyunun tasarlandığı sabit genişlik ve yükseklik değerleri.
    const GAME_W = 1300;
    const GAME_H = 750;

    //Farklı ekran boyutlarında oyunun boyutunu ayarlar.
    let scale = 1;

    //Oyun alanını ekranda yatay ve dikey olarak ortalamak için gereken boşluk değerleri.
    let offsetX = 0;
    let offsetY = 0;

    //Animasyon döngüsünü durdurabilmek için kullanılan id.
    let animationId;

    //Canvas boyutunu tarayıcı penceresine göre ayarlar.
    function resize(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

         //Oyunu ekrana sığdırırken ekran boyutuna göre oranı ayarlar.
        scale = Math.min(canvas.width / GAME_W, canvas.height / GAME_H);

        //Ölçeklenen oyun alanı ekranın ortasına alınır.
        offsetX = (canvas.width - GAME_W * scale) / 2;
        offsetY = (canvas.height - GAME_H * scale) / 2;
    }

    //Sayfayı ilk açtığımızda boyutlandırma yapılır.
    resize();

    //Pencere boyutu değişirse oyun boyutlandırması güncellenir.
    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    //Penguenin başlangıç konumu.
    const startX = 0;
    const startY = 500;

    //Penguenin temel özellikleri burada tutuluyor.
    const player = {
        x:startX,
        y:startY,
        width:40,
        height:55,

        //Penguenin anlık yatay ve dikey hızları.
        velX:0,
        velY:0,

        //Hareket hızı, sürtünme ve yer çekimi değerleri.
        speed:0.34,
        maxSpeed:3.4,
        friction:0.78,
        gravity:0.5,

        //Bu level'da penguenin 10 zıplama hakkı var.
        grounded:false,
        jumpsLeft:10,
        maxJumps:10,

        //Penguenin yürürken ayaklarının hareket etmesi için
        legOffset:0,
        legDirection:1,

        //Ek zıplama gücü için 
        jumpBoost:0,

        //Penguen engellerden birine takılırsa ölür.
        dead:false
    };

    //Oyun içinde bulunan platformlar. (collapsing:true olan platform üstünde bir süre durunca kırılıp düşer ve penguenin de düşmesine sebep olur.)
    const platforms = [
        { x:-200, y:600, width:2000, height:20 },
        { x:870, y:500, width:400, height:20 },
        { x:-80, y:400, width:150, height:20 },
        { x:-200, y:230, width:120, height:20, collapsing:true, timer:0, fallen:false },
        { x:1120, y:210, width:180, height:20 }
    ];

    //Penguenin kırması gereken buz kutuları. (Son kutu hareketli platforma bağlı olduğu için ona göre hareket ediyor.)
    const breakables = [
        { x:1400, y:550, width:50, height:50, broken:false },
        { x:1000, y:450, width:50, height:50, broken:false },
        { x:-165, y:180, width:50, height:50, broken:false },
        { x:-50, y:350, width:50, height:50, broken:false },
        { width:50, height:50, offsetX:60, offsetY:-50, x:210, y:400, broken:false, attachedToMovingPlatform:0 }
    ];

    //Yatay hareketli platform.
    const movingPlatforms = [
        { x:150, y:450, width:170, height:20, startX:150, startY:450, endX:600, speed:1.5, direction:1 }
    ];

    //Penguenin ulaşması gereken iglo.
    const goal = { x:1160, y:130, width:90, height:80 };

    //Mekanizmadan düşen buz sarkıtları.
    const icicles = [
        { x:540, startY:40, y:40, width:24, height:50, speed:6, active:false, warning:false, timer:0, delay:120, warningTime:50, scale:0 }
    ];

    //Penguen temas ettiğinde öldüren zehirli sular.
    const poisonWaters = [
        { x:155, y:594, width:75, height:14 },
        { x:650, y:594, width:80, height:14 },
        { x:-200, y:594, width:120, height:14 }
    ];

    //Açılıp kapanan lazer.
    const lasers = [
        { x:1080, y:100, width:12, height:160, active:true, timer:0 }
    ];

    //Basılı olan tuşları saklar.
    const keys = {};

    //Zıplama, kırılma ve ölüm efektleri için parçacıklar.
    const particles = [];

    //Ekranda düşen kar taneleri.
    const snowflakes = [];

    //Rastgele kar taneleri oluşturulur.
    for(let i = 0; i < 120; i++){
        snowflakes.push({
            x:Math.random() * canvas.width,
            y:Math.random() * canvas.height,
            size:Math.random() * 3 + 1,
            speed:Math.random() * 1.2 + 0.4,
            drift:(Math.random() - 0.5) * 0.6
        });
    }

    //Penguen igloya girerken animasyonun aktif olup olmadığını tutar.
    let iglooAnimation = false;

    let penguinSleeping = false;

    //Oyun tamamlandıysa ana döngünün durmasını sağlar.
    let gameFinished = false;

    //Klavyede basılan tuşları kontrol etmek için
    const handleKeyDown = function(e){

        //Escape tuşuna basılırsa oyun durdurulur ve menüye dönülür.
        if (e.key === "Escape") {
            gameFinished = true;
            cancelAnimationFrame(animationId);

            //Bölümden çıkarken gereksiz dinleyicileri kaldırıyoruz.
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("resize", handleResize);

            if(window.returnToMenu) window.returnToMenu();
            return;
        }

        const key = e.key.toLowerCase();

        //Space ve yön tuşları sayfayı kaydırmasın diye engelliyoruz.
        if(["a", "d", "arrowleft", "arrowright", "r", " "].includes(key) || e.code === "Space"){
            e.preventDefault();
        }

        //Basılan tuş aktif olarak işaretlenir.
        keys[key] = true;

        //Penguen yerdeyse ve zıplama hakkı kaldıysa zıplayabilir. Burada penguenin zıplama gücü hesaplanr.
        if(e.code === "Space" && player.grounded && player.jumpsLeft > 0){
            let jumpPower = 13.5 + (6 - player.jumpsLeft) * 1.1;

            player.velY = -jumpPower;
            player.grounded = false;
            player.jumpsLeft--;

            createJumpEffect();
        }

        //R tuşu ile oyun resetlenir.
        if(key === "r") resetGame();
    };

    //Tuş bırakıldığında ilgili tuş pasif yapılır.
    const handleKeyUp = function(e){
        keys[e.key.toLowerCase()] = false;
    };

    //Klavye kontrolleri dinlenir.
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    //Penguen öldüğünde veya R'ye bastığımızda her şeyin ilk haline dönmesi için bir fonksiyon.
    function resetGame(){
        player.x = startX;
        player.y = startY;

        player.velX = 0;
        player.velY = 0;

        player.speed = 0.34;
        player.maxSpeed = 3.4;
        player.friction = 0.78;
        player.gravity = 0.5;

        player.grounded = false;
        player.jumpsLeft = player.maxJumps;
        player.jumpBoost = 0;

        player.width = 40;
        player.height = 55;

        player.legOffset = 0;
        player.legDirection = 1;
        player.dead = false;

        iglooAnimation = false;
        penguinSleeping = false;
        gameFinished = false;

        //Hareketli platform başlangıç konumuna gelir.
        movingPlatforms.forEach(function(p){
            p.x = p.startX;
            p.y = p.startY;
            p.direction = 1;
        });

        //Kırılabilir kutular tekrar sağlam hale getirilir.
        breakables.forEach(function(box){
            box.broken = false;

            //Hareketli platforma bağlı kutu varsa platformun üstündeki yerine geri koyulur.
            if(box.attachedToMovingPlatform !== undefined){
                let platform = movingPlatforms[box.attachedToMovingPlatform];
                box.x = platform.x + box.offsetX;
                box.y = platform.y + box.offsetY;
            }

            //Başlangıç konumu belirli kutular varsa eski yerine alınır.
            else if(box.startX !== undefined){
                box.x = box.startX;
                box.y = box.startY;
            }
        });

        //Düşen platform tekrar kullanılabilir hale gelir.
        platforms.forEach(function(p){
            if(p.collapsing){
                p.timer = 0;
                p.fallen = false;
            }
        });

        //Parçacıklar temizlenir.
        particles.length = 0;

        //Basılı kalmış tuşlar sıfırlanır.
        for(let k in keys){
            keys[k] = false;
        }
    }

    //İki dikdörtgenin çakışıp çakışmadığını kontrol eden yardımcı fonksiyon.
    function rectsOverlap(a,b){
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    //Penguenin platformlarla çarpışmasını kontrol eder.
    function collideWithPlatforms(){
        player.grounded = false;

        //Sabit platformlar ve hareketli platform tek listede kontrol edilir.
        platforms.concat(movingPlatforms).forEach(function(p){

            //Düşmüş platform artık çarpışmaya dahil edilmez.
            if(p.fallen) return;

            if(rectsOverlap(player,p)){

                //Penguen platformun üstüne düşerse.
                if(player.y + player.height - player.velY <= p.y && player.velY >= 0){
                    player.y = p.y - player.height;
                    player.velY = 0;
                    player.grounded = true;
                }

                //Penguen platformun altına çarpıyorsa yukarı çıkamaz.
                else if(player.y - player.velY >= p.y + p.height && player.velY < 0){
                    player.y = p.y + p.height;
                    player.velY = 0;
                }

                //Penguen platformun sol veya sağ kenarına çarparsa platform içinden geçemez.
                else if(player.x + player.width - player.velX <= p.x && player.velX > 0){
                    player.x = p.x - player.width;
                    player.velX = 0;
                }

                else if(player.x - player.velX >= p.x + p.width && player.velX < 0){
                    player.x = p.x + p.width;
                    player.velX = 0;
                }
            }
        });
    }

    //Penguen kırılabilir kutuya temas ederse kutunun kırılmasını sağlayan fonksiyon.
    function checkBreakables(){
        breakables.forEach(function(box){
            if(box.broken) return;

            //Penguen ve kutu çakıştığında kutu kırılır.
            if(rectsOverlap(player, box)){
                box.broken = true;

                //Kırılma noktasında parçacık efekti oluşturulur.
                createBreakEffect(box.x + box.width / 2, box.y + box.height / 2);

                //Kutu kırılınca ses çalar.
                if(window.boxBreakSound) {
                    window.boxBreakSound.currentTime = 0;
                    window.boxBreakSound.play().catch(e => console.log("Kutu sesi çalınamadı:", e));
                }
            }
        });
    }

    //Bütün kutuların kırılıp kırılmadığını kontrol eden fonksiyon.
    function allBoxesBroken(){
        for(let i = 0; i < breakables.length; i++){
            if(!breakables[i].broken) return false;
        }

        return true;
    }

    //Penguen iglo girişine geldiğinde tüm kutular kırılmışsa level tamamlanmış olur.
    function checkGoal(){
        const iglooEntrance = {
            x:goal.x + 28,
            y:goal.y + 60,
            width:34,
            height:30
        };

        if(!gameFinished && allBoxesBroken() && rectsOverlap(player, iglooEntrance)){
            player.velX = 0;
            player.velY = 0;

            startIglooAnimation();
        }
    }

    //İgloya giriş animasyonunu başlatır.
    function startIglooAnimation(){
        iglooAnimation = true;
    }

    //Oyunun hareket ve kontrol kısmı burada çalışıyor.
    function update(){

        //İglo animasyonu aktifken penguenin kontrolü durur.
        if(iglooAnimation){
            let targetX = goal.x + 45 - player.width / 2;
            let targetY = goal.y + 58;

            //Penguen yavaşça iglo girişine doğru çekilir.
            player.x += (targetX - player.x) * 0.08;
            player.y += (targetY - player.y) * 0.08;

            //Penguen igloya yeterince yaklaştığında oyun biter.
            if(Math.abs(player.x - targetX) < 2 && Math.abs(player.y - targetY) < 2){
                iglooAnimation = false;
                gameFinished = true;

                //Oyun bitince dinleyiciler kaldırılır.
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("keyup", handleKeyUp);
                window.removeEventListener("resize", handleResize);

                cancelAnimationFrame(animationId);

                //Bölüm tamamlandığında başarı ekranına gösteren ve başka level kalmadığı için oyuncuyu menüye yönlendiren kısım.
                if(window.showSuccessScreen) {
                    window.showSuccessScreen(() => {
                        if(onComplete) onComplete();
                        else if(window.returnToMenu) window.returnToMenu();
                    }, true);
                }
            }

            return;
        }

        //Penguen yerdeyken kontrol daha kolay, havadayken daha zor.
        let control = player.grounded ? player.speed : player.speed * 0.75;

        //a veya sol ok tuşuyla sola hareket.
        if(keys["a"] || keys["arrowleft"]) player.velX -= control;

        //d veya sağ ok tuşuyla sağa hareket.
        if(keys["d"] || keys["arrowright"]) player.velX += control;

        //Yerde ve havada farklı sürtünme uygulanır.
        if(player.grounded) player.velX *= player.friction;
        else player.velX *= 0.96;

        //Penguenin aşırı hızlanması engellenir.
        if(player.velX > player.maxSpeed) player.velX = player.maxSpeed;
        if(player.velX < -player.maxSpeed) player.velX = -player.maxSpeed;

        //Penguenin konumu güncellenir.
        player.x += player.velX;
        player.velY += player.gravity;
        player.y += player.velY;

        //Tüm oyun mekanikleri güncellenir.
        collideWithPlatforms();
        updateMovingPlatforms();
        updateCollapsingPlatforms();
        updatePoisonWater();
        checkBreakables();
        checkGoal();
        updateSnow();
        updateIcicles();
        updateLasers();

        //Hareket ederken penguenin ayakları oynasın diye.
        if(Math.abs(player.velX) > 0.5 && player.grounded){
            player.legOffset += 0.4 * player.legDirection;

            if(player.legOffset > 3 || player.legOffset < -3){
                player.legDirection *= -1;
            }
        }

        //Penguen ekranın altına düşerse bölüm yeniden başlar.
        if(player.y > GAME_H + 100) resetGame();
    }

    //Arka planı, dağları ve karlı zemini çizmek için fonksiyon.
    function drawBackground(){
        ctx.fillStyle = "#0b2238";
        ctx.fillRect(0, 0, GAME_W, GAME_H);

        ctx.fillStyle = "#123a55";

        ctx.beginPath();
        ctx.moveTo(0, 700);
        ctx.lineTo(130, 430);
        ctx.lineTo(280, 700);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(230, 700);
        ctx.lineTo(520, 360);
        ctx.lineTo(760, 700);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(650, 700);
        ctx.lineTo(980, 340);
        ctx.lineTo(1300, 700);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#dff7ff";
        ctx.fillRect(0, 720, GAME_W, 30);
    }

    //Sabit platformları çizmek için fonksiyon.
    function drawPlatforms(){
        platforms.forEach(function(p){
            if(p.fallen) return;

            //Düşen platform farklı renkte.
            ctx.fillStyle = p.collapsing ? "#7fd8f2" : "#64c7e8";
            ctx.fillRect(p.x, p.y, p.width, p.height);

            ctx.fillStyle = "#e9fbff";
            ctx.fillRect(p.x, p.y, p.width, 6);

            ctx.fillStyle = "#2f8fb8";
            ctx.fillRect(p.x, p.y + p.height - 6, p.width, 6);

            ctx.strokeStyle = "#b8f3ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, p.y, p.width, p.height);

            //Düşen platformun çatlak çizimleri.
            if(p.collapsing){
                ctx.strokeStyle = "#14384a";
                ctx.lineWidth = 2;
                ctx.beginPath();

                ctx.moveTo(p.x + 20, p.y + 4);
                ctx.lineTo(p.x + 45, p.y + 15);
                ctx.lineTo(p.x + 70, p.y + 8);
                ctx.lineTo(p.x + 95, p.y + 18);

                ctx.moveTo(p.x + 55, p.y + 8);
                ctx.lineTo(p.x + 50, p.y + 17);

                ctx.moveTo(p.x + 85, p.y + 12);
                ctx.lineTo(p.x + 110, p.y + 5);

                ctx.stroke();
            }
        });
    }

    //Hareketli platformu çizmek için fonksiyon.
    function drawMovingPlatforms(){
        movingPlatforms.forEach(function(p){
            ctx.fillStyle = "#9ff3ff";
            ctx.fillRect(p.x, p.y, p.width, p.height);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(p.x, p.y, p.width, 6);

            ctx.fillStyle = "#237fa3";
            ctx.fillRect(p.x, p.y + p.height - 6, p.width, 6);

            ctx.strokeStyle = "#dffcff";
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        });
    }

    //Kırılabilir buz kutularını çizmek için fonksiyon.
    function drawBreakables(){
        breakables.forEach(function(box){
            if(box.broken) return;

            ctx.fillStyle = "#9fe9ff";
            ctx.fillRect(box.x, box.y, box.width, box.height);

            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.fillRect(box.x + 5, box.y + 5, box.width - 15, 8);

            ctx.strokeStyle = "#eaffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

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

    //İgloyu çizmek için fonksiyon.
    function drawGoal(){
        ctx.fillStyle = "#e8fbff";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 80, 55, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = "#bde6f2";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 80, 42, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = "#263746";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 80, 20, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = "#ffd36b";
        ctx.beginPath();
        ctx.arc(goal.x + 45, goal.y + 72, 6, 0, Math.PI * 2);
        ctx.fill();

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

    //Penguen karakterini çizen fonksiyon.
    function drawPlayer(){
        //Penguen öldüyse kısa süreliğine çizilmez.
        if(player.dead) return;

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.ellipse(player.x + player.width / 2, player.y + player.height / 2, 20, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.ellipse(player.x + player.width / 2, player.y + player.height / 2 + 5, 11, 16, 0, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(player.x + 20, player.y + 25);
        ctx.lineTo(player.x + 27, player.y + 28);
        ctx.lineTo(player.x + 20, player.y + 31);
        ctx.fill();

        //Penguenin ayakları yürürken legOffset ile hareket eder.
        ctx.fillRect(player.x + 8, player.y + 50 + player.legOffset, 8, 10);
        ctx.fillRect(player.x + 24, player.y + 50 - player.legOffset, 8, 10);
    }

    //Ekrandaki bilgi yazılarını çizen fonksiyon.
    function drawUI(){
        ctx.fillStyle = "white";
        ctx.font = "26px Arial";

        ctx.fillText("Level 3", 15, 35);
        ctx.fillText("Kalan Zıplama Hakkı: " + player.jumpsLeft, 15, 65);

        let broken = 0;
        breakables.forEach(function(box){
            if(box.broken) broken++;
        });

        ctx.font = "20px Arial";
        ctx.fillText("Kırılmış Kutular: " + broken + "/" + breakables.length, 15, 95);

        if(!allBoxesBroken()){
            ctx.fillText("Tüm kutuları kırmadan igloya ulaşamazsın!", 15, 125);
        }
        else {
            ctx.fillText("Tüm kutular kırıldı! İgloya git.", 15, 125);
        }

        ctx.fillText("Hareketli platformu kullan!", 15, 155);

        if(player.jumpsLeft === 0){
            ctx.fillStyle = "red";
            ctx.fillText("R BASARAK RESETLE", 15, 185);
        }
    }

    //Zıplarken kar parçacıkları oluşturan fonksiyon.
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

    //Kutu kırınca buz parçacıkları oluşturan fonksiyon.
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

    //Zehirli su veya lazere değince kırmızı parçacık efekti oluşturan fonksiyon.
    function createPoisonEffect(x, y){
        for(let i = 0; i < 25; i++){
            particles.push({
                x:x,
                y:y,
                size:Math.random() * 10 + 4,
                velX:(Math.random() - 0.5) * 10,
                velY:(Math.random() - 0.5) * 10,
                life:40,
                color:Math.random() > 0.5 ? "#ff3b3b" : "#ff9b9b"
            });
        }
    }

    //Parçacıkları hareket ettirip ömrü bitenleri silen fonksiyon.
    function updateParticles(){
        for(let i = particles.length - 1; i >= 0; i--){
            let p = particles[i];

            p.x += p.velX;
            p.y += p.velY;
            p.life--;

            if(p.life <= 0){
                particles.splice(i, 1);
            }
        }
    }

    //Parçacıkları ekrana çizen fonksiyon.
    function drawParticles(){
        particles.forEach(function(p){
            ctx.fillStyle = p.color || "white";

            //Parçacıkların ömrü azaldıkça saydamlığı da azalır.
            ctx.globalAlpha = p.life / 40;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();

            //Sonraki çizimlerin etkilenmemesi için alpha tekrar 1 yapılır.
            ctx.globalAlpha = 1;
        });
    }

    //Kar tanelerinin hareketini günceller.
    function updateSnow(){
        snowflakes.forEach(function(snow){
            snow.y += snow.speed;
            snow.x += snow.drift;

            if(snow.y > canvas.height){
                snow.y = -10;
                snow.x = Math.random() * canvas.width;
            }

            if(snow.x < -10){
                snow.x = canvas.width + 10;
            }

            if(snow.x > canvas.width + 10){
                snow.x = -10;
            }
        });
    }

    //Kar tanelerini çizen fonksiyon.
    function drawSnow(){
        snowflakes.forEach(function(snow){
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath();
            ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    //Zehirli su alanlarını çizen fonksiyon.
    function drawPoisonWater(){
        poisonWaters.forEach(function(water){

            //Suyun kenarlarındaki buz çerçeveleri.
            ctx.fillStyle = "#dff7ff";
            ctx.fillRect(water.x - 8, water.y + 3, 8, water.height + 14);
            ctx.fillRect(water.x + water.width, water.y + 3, 8, water.height + 14);

            ctx.strokeStyle = "#8ecfe3";
            ctx.lineWidth = 2;
            ctx.strokeRect(water.x - 8, water.y + 3, 8, water.height + 14);
            ctx.strokeRect(water.x + water.width, water.y + 3, 8, water.height + 14);

            //Zehirli suyun koyu tabanı.
            ctx.fillStyle = "#4a0000";
            ctx.fillRect(water.x, water.y + 6, water.width, water.height);

            //Dalgalı kırmızı yüzey.
            ctx.fillStyle = "#d40000";
            ctx.beginPath();
            ctx.moveTo(water.x, water.y + 8);

            for(let i = 0; i <= water.width; i += 12){
                let waveY = water.y + 8 + Math.sin((i + Date.now() / 120) * 0.4) * 3;
                ctx.lineTo(water.x + i, waveY);
            }

            ctx.lineTo(water.x + water.width, water.y + water.height + 6);
            ctx.lineTo(water.x, water.y + water.height + 6);
            ctx.closePath();
            ctx.fill();

            //Su üzerindeki küçük baloncuklar.
            ctx.fillStyle = "rgba(255,120,120,0.8)";
            for(let i = 10; i < water.width; i += 24){
                ctx.beginPath();
                ctx.arc(water.x + i, water.y + 8, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    //Hareketli platformların konumunu güncelleyen fonksiyon.
    function updateMovingPlatforms(){
        movingPlatforms.forEach(function(p, index){
            let oldX = p.x;

            //Platform kendi yönünde hareket eder.
            p.x += p.speed * p.direction;

            //Platform uç noktalara gelince yön değiştirir.
            if(p.x > p.endX || p.x < p.startX){
                p.direction *= -1;
            }

            let moveX = p.x - oldX;

            //Platforma bağlı kırılabilir kutunun konumunu platformla birlikte günceller.
            breakables.forEach(function(box){
                if(box.broken) return;

                if(box.attachedToMovingPlatform === index){
                    box.x = p.x + box.offsetX;
                    box.y = p.y + box.offsetY;
                }
            });

            //Penguen hareketli platformun üstündeyse platformla birlikte taşınır.
            const playerOnPlatform =
                player.grounded &&
                player.y + player.height >= p.y - 2 &&
                player.y + player.height <= p.y + 4 &&
                player.x + player.width > p.x &&
                player.x < p.x + p.width &&
                player.velY === 0;

            if(playerOnPlatform){
                player.x += moveX;
            }
        });
    }

    //Düşen platformları güncelleyen fonksiyon.
    function updateCollapsingPlatforms(){
        platforms.forEach(function(p){
            if(!p.collapsing || p.fallen) return;

            //Penguen düşen platformun üstünde mi kontrol edilir.
            const playerOnPlatform =
                player.y + player.height >= p.y - 2 &&
                player.y + player.height <= p.y + 6 &&
                player.x + player.width > p.x &&
                player.x < p.x + p.width &&
                player.velY >= 0;

            //Penguen platformun üstünde durdukça sayaç artar, inerse sıfırlanır.
            if(playerOnPlatform){
                p.timer++;
            }
            else {
                p.timer = 0;
            }

            //Bir süre sonra platform düşer.
            if(p.timer > 90){
                p.fallen = true;
            }
        });
    }

    //Buz sarkıtının düşme olayını sağlayan fonksiyon.
    function updateIcicles(){
        icicles.forEach(function(i){
            i.timer++;

            //Belirli süre geçince sarkıt önce uyarı moduna girer.
            if(i.timer >= i.delay && !i.active && !i.warning){
                i.warning = true;
                i.scale = 0;
                i.y = i.startY;
            }

            //Uyarı aşamasında buz sarkıtı yavaş yavaş görünür olur.
            if(i.warning){
                i.scale += 0.04;

                if(i.scale > 1){
                    i.scale = 1;
                }

                //Uyarı süresi bitince sarkıt düşmeye başlar.
                if(i.timer >= i.delay + i.warningTime){
                    i.warning = false;
                    i.active = true;
                }
            }

            //Sarkıt aşağı doğru düşer.
            if(i.active){
                i.y += i.speed;
            }

            //Uyarı veya düşme sırasında oyuncuya temas ederse oyun resetlenir.
            if((i.active || i.warning) && rectsOverlap(player, {
                x:i.x,
                y:i.y,
                width:i.width,
                height:i.height * i.scale
            })){
                resetGame();
            }

            //Sarkıt ekranın altına inince döngü baştan başlar.
            if(i.y > GAME_H){
                i.active = false;
                i.warning = false;
                i.timer = 0;
                i.y = i.startY;
                i.scale = 0;
            }
        });
    }

    //Buz sarkıtını çizen fonksiyon.
    function drawIcicles(){
        icicles.forEach(function(i){

            //Sarkıtın çıktığı mekanizma hep ekranda olur.
            drawIceShooter(i.x, i.startY - 25);

            if(!i.active && !i.warning) return;

            let drawHeight = i.height * i.scale;

            ctx.fillStyle = "#dff7ff";
            ctx.beginPath();
            ctx.moveTo(i.x, i.y);
            ctx.lineTo(i.x + i.width / 2, i.y + drawHeight);
            ctx.lineTo(i.x + i.width, i.y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#9fe9ff";
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    //Buz sarkıtının tavandaki fırlatıcı mekanizmasını çizen fonksiyon.
    function drawIceShooter(x, y){
        ctx.fillStyle = "#6fcbe8";
        ctx.fillRect(x - 10, y, 44, 25);

        ctx.fillStyle = "#dff7ff";
        ctx.fillRect(x - 5, y + 5, 34, 8);

        ctx.strokeStyle = "#b8f3ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y, 44, 25);

        ctx.fillStyle = "#263746";
        ctx.beginPath();
        ctx.arc(x + 12, y + 25, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    //Penguenin zehirli suya temas edip etmediğini kontrol eden fonksiyon.
    function updatePoisonWater(){
        poisonWaters.forEach(function(water){

            //Penguenin sadece ayak bölgesi su temasında kontrol edilir.
            const playerFeet = {
                x: player.x + 6,
                y: player.y + player.height - 10,
                width: player.width - 12,
                height: 12
            };

            //Zehirli suyun gerçek temas alanı.
            const poisonHitbox = {
                x: water.x + 2,
                y: water.y + 6,
                width: water.width - 4,
                height: water.height + 10
            };

            if(rectsOverlap(playerFeet, poisonHitbox)){
                if(player.dead) return;

                player.dead = true;

                //Ölüm efekti oluşturulur.
                createPoisonEffect(player.x + player.width / 2, player.y + player.height);

                player.velX = 0;
                player.velY = 0;

                //Kısa bekleme sonrası oyun sıfırlanır.
                setTimeout(function(){
                    resetGame();
                }, 250);
            }
        });
    }

    //Lazerlerin açılıp kapanmasını ve penguene temasını kontrol eden fonksiyon.
    function updateLasers(){
        lasers.forEach(function(laser){
            laser.timer++;

            //Lazer belirli aralıklarla açılıp kapanır.
            if(laser.timer > 90){
                laser.active = !laser.active;
                laser.timer = 0;
            }

            //Lazer aktifken penguene temas ederse penguen ölür.
            if(laser.active && rectsOverlap(player, laser)){
                if(player.dead) return;

                player.dead = true;

                createPoisonEffect(player.x + player.width / 2, player.y + player.height / 2);

                setTimeout(function(){
                    resetGame();
                }, 250);
            }
        });
    }

    //Lazeri ve mekanizmasını çizen fonksiyon.
    function drawLasers(){
        lasers.forEach(function(laser){

            // Üst lazer cihazı.
            ctx.fillStyle = "#4cb7d6";
            ctx.fillRect(laser.x - 12, laser.y - 22, 36, 22);

            ctx.fillStyle = "#dff7ff";
            ctx.fillRect(laser.x - 6, laser.y - 16, 24, 6);

            // Alt lazer cihazı.
            ctx.fillStyle = "#4cb7d6";
            ctx.fillRect(laser.x - 12, laser.y + laser.height, 36, 22);

            ctx.fillStyle = "#dff7ff";
            ctx.fillRect(laser.x - 6, laser.y + laser.height + 6, 24, 6);

            // Lazer aktif değilse sadece cihazlar görünür.
            if(!laser.active) return;

            // Lazer ışınının dış parlama alanı.
            ctx.fillStyle = "rgba(120,220,255,0.25)";
            ctx.fillRect(laser.x - 10, laser.y, laser.width + 20, laser.height);

            // Lazerin parlak görünmesi için gölge efekti.
            ctx.shadowColor = "#9ff3ff";
            ctx.shadowBlur = 20;

            ctx.fillStyle = "#8fe9ff";
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);

            ctx.fillStyle = "#eaffff";
            ctx.fillRect(laser.x + 3, laser.y, laser.width - 6, laser.height);

            // Sonraki çizimlerin etkilenmemesi için gölge sıfırlanır.
            ctx.shadowBlur = 0;
        });
    }

    //Oyunun ana döngüsüdür.
    function gameLoop(){

        //Ölçekleme nedeniyle kenarlarda boşluk kalmaması için tüm ekran koyu renge boyanır.
        ctx.fillStyle = "#071827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //Oyun bitmediyse tüm güncellemeler yapılır.
        if(!gameFinished){
            update();
            updateParticles();
        }

        //Oyun dünyası ekranın ortasına alınır ve ölçeklenir.
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        //Oyun içi nesneler çizilir.
        drawBackground();
        drawPlatforms();
        drawPoisonWater();
        drawMovingPlatforms();
        drawLasers();
        drawBreakables();
        drawGoal();
        drawIcicles();
        drawPlayer();
        drawParticles();

        //Ölçekleme etkisi kaldırılır.
        ctx.restore();

        //Kar ve arayüz ekran koordinatlarına göre çizilir.
        drawSnow();
        drawUI();

        //Oyun bitmediyse döngü devam eder.
        if(!gameFinished) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    //Ana oyun döngüsü başlatılır.
    gameLoop();
};