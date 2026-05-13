window.startBolum1 = function(onComplete) {
    //oyun birden fazla bölümden oluştuğu için çakışma yaşanmaması adına tüm kodu bir fonksiyon içine aldık. onComplete parametresi, bu bölüm tamamlandığında çağrılacak fonksiyonu temsil eder.
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const GAME_W = 1300;
    const GAME_H = 750;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let animationId;

    function resize(){
        //ekran boyutuna göre oyunun boyutunun ayarlanmasını sağlar.
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        scale = Math.min(canvas.width / GAME_W, canvas.height / GAME_H);
        offsetX = (canvas.width - GAME_W * scale) / 2;
        offsetY = (canvas.height - GAME_H * scale) / 2;
    }

    resize();
    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    //penguenin başlangıç konumu
    const startX = 100;
    const startY = 300;

    const player = {
        //penguenin fiziksel özelliklerini tanımlar.
        x:startX,
        y:startY,
        width:40,
        height:55,
        velX:0,
        velY:0,
        speed:0.34,
        maxSpeed:3.4,
        friction:0.78,
        gravity:0.5,
        grounded:false,
        jumpsLeft:6,
        maxJumps:6,
        legOffset:0,
        legDirection:1,
        jumpBoost:0
    };

    const platforms = [
        //oyun alanındaki platformların konumu ve boyutunu belirler.
        { x:90, y:580, width:200, height:20 },
        { x:340, y:400, width:150, height:20 },
        { x:490, y:650, width:150, height:20 },
        { x:700, y:230, width:250, height:20 },
        { x:800, y:550, width:300, height:20 },
        { x:1100, y:220, width:200, height:20 }
    ];

    const breakables = [
        //oyun alanındaki buzlar nesnelerinin konumunu ve boyutunu belirler.
        { x:400, y:350, width:50, height:50, broken:false },
        { x:850, y:180, width:50, height:50, broken:false },
        { x:900, y:500, width:50, height:50, broken:false }
    ];

    //iglonun konumunu ve boyutunu belirler.
    const goal = { x:1170, y:140, width:90, height:80 };

    //basılı olan tuşların durumunu saklar.
    const keys = {};

    //zıplama ve buz kırılma efektlerindeki parçacıkları saklar.
    const particles = [];

    //arkaplandaki kar tanelerini saklar
    const snowflakes = [];

    //bölüm başlarken rastgele konumlarda ve rastgele boyutlarda kar tanesi oluşturur.
    for(let i = 0; i < 120; i++){
        snowflakes.push({
            x:Math.random() * canvas.width,
            y:Math.random() * canvas.height,
            size:Math.random() * 3 + 1,
            speed:Math.random() * 1.2 + 0.4,
            drift:(Math.random() - 0.5) * 0.6
        });
    }

    //bölüm başında iglo animasyonunu kapalı olarak tutar.
    let iglooAnimation = false;
    
    //bölüm başında penguenin uyanık olduğunu belirler. bu değişken true olduğunda penguen igloya girdiğinde uyuyor olarak kabul edilir.
    let penguinSleeping = false;

    //bölümün tamamlanıp tamamlanmadığını takip eder. oyun bitince true olur ve oyun döngüsünü durdurur.
    let gameFinished = false;

    //klavye tuşlarına basıldığında ve bırakıldığında çalışacak fonksiyonları tanımlar.
    const handleKeyDown = function(e){
        
        //esc tuşuna basıldığında oyunu bitirir ve menüye dönülmesini sağlar.
        if (e.key === "Escape") {
            gameFinished = true;
            cancelAnimationFrame(animationId);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("resize", handleResize);
            if(window.returnToMenu) window.returnToMenu();
            return;
        }

        const key = e.key.toLowerCase(); //büyük küçük harf duyarlılığını ortadan kaldırır.
        
        //hareket, zıplama ve reset tuşlarının varsayılan tarayıcı davranışını engeller (örneğin sayfa kaydırma).
        if(key === "a" || key === "d" || key === "arrowleft" || key === "arrowright" || key === "r" || e.code === "Space"){
            e.preventDefault();
        }

        keys[key] = true; //tuşun basılı olduğunu kaydeder.

        //space tuşuna basıldığında, penguenin yerde olup olmadığını ve zıplama hakkının kalıp kalmadığını kontrol eder. Eğer zıplayabiliyorsa, zıplama gücünü hesaplar, yerde olmadığını kaydeder ve zıplama hakkını azaltır. Ayrıca zıplama efektini oluşturur.
        if(e.code === "Space" && player.grounded && player.jumpsLeft > 0){
           let jumpPower = 12 + (6 - player.jumpsLeft) * 2.5;
            player.velY = -jumpPower;
            player.grounded = false;
            player.jumpsLeft--;
            createJumpEffect();
        }

        if(key === "r") resetGame(); //r tuşuna basıldığında oyunu resetler.
    };

    //klavye tuşları bırakıldığında, ilgili tuşun durumunu false yapar.
    const handleKeyUp = function(e){
        keys[e.key.toLowerCase()] = false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    //oyunu başlangıç durumuna sıfırlar.
    function resetGame(){
        player.x = startX;
        player.y = startY;
        player.velX = 0;
        player.velY = 0;
        player.speed = 0.34;
        player.maxSpeed = 3.4;
        player.friction = 0.78;
        player.gravity = 0.58;
        player.grounded = false;
        player.jumpsLeft = player.maxJumps;
        player.jumpBoost = 0;
        player.width = 40;
        player.height = 55;
        player.legOffset = 0;
        player.legDirection = 1;
        iglooAnimation = false;
        penguinSleeping = false;
        gameFinished = false;
        breakables.forEach(function(box){ box.broken = false; });
        particles.length = 0;
        for(let k in keys){ keys[k] = false; }
    }

    //iki dikdörtgenin çakışıp çakışmadığını kontrol eder.
    //bu, penguenin platformlarla, kırılabilir kutularla ve hedefle etkileşime girmesini sağlamak için kullanılır.
    function rectsOverlap(a,b){
        return (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y);
    }

    //penguenin platformlarla çarpışmasını kontrol eder ve gerekli durumlarda konumunu ve hızını düzeltir.
    function collideWithPlatforms(){
        player.grounded = false;
        platforms.forEach(function(p){
            if(rectsOverlap(player,p)){
                if(player.y + player.height - player.velY <= p.y && player.velY >= 0){
                    player.y = p.y - player.height;
                    player.velY = 0;
                    player.grounded = true;
                }
                else if(player.y - player.velY >= p.y + p.height && player.velY < 0){
                    player.y = p.y + p.height;
                    player.velY = 0;
                }
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

    //penguenin kırılabilir buzlarla çarpışmasını kontrol eder.
    //Eğer bir buz kırılırsa, kırılma efektini oluşturur ve kutunun kırıldığını kaydeder.
    //Ayrıca buz kırılma sesini çalar.
    function checkBreakables(){
        breakables.forEach(function(box){
            if(box.broken) return;
            if(rectsOverlap(player, box)){
                box.broken = true;
                createBreakEffect(box.x + box.width / 2, box.y + box.height / 2);
                
                //buz kırılma sesini çalar eğer ses dosyası yoksa hata mesajı verir.
                if(window.snowBreakSound) {
                    window.snowBreakSound.currentTime = 0; // Hızlı kırılmalarda sesin kesilmeden baştan başlaması için
                    window.snowBreakSound.play().catch(e => console.log("Buz sesi çalınamadı:", e));
                }
            }
        });
    }

    //tüm buzların kırılıp kırılmadığını kontrol eder.
    //Eğer herhangi bir buz kırılmamışsa false döner, tüm buzlar kırılmışsa true döner.
    function allBoxesBroken(){
        for(let i = 0; i < breakables.length; i++){
            if(!breakables[i].broken) return false;
        }
        return true;
    }

    //penguenin hedefle çarpışmasını kontrol eder.
    function checkGoal(){
        const iglooEntrance = { x:goal.x + 28, y:goal.y + 60, width:34, height:30 };
        if(!gameFinished && allBoxesBroken() && rectsOverlap(player, iglooEntrance)){
            player.velX = 0; player.velY = 0;
            startIglooAnimation();
        }
    }

    //penguenin igloya girdiğinde başlayacak animasyonu başlatır.
    //bu animasyon sırasında penguen iglonun içine doğru hareket eder ve bölüm tamamlanır.
    function startIglooAnimation(){ iglooAnimation = true; }

    //igloo animasyonu sırasında penguenin iglonun içine doğru hareket etmesini sağlar.
    function update(){
        if(iglooAnimation){
            let targetX = goal.x + 45 - player.width / 2;
            let targetY = goal.y + 58;

            player.x += (targetX - player.x) * 0.08;
            player.y += (targetY - player.y) * 0.08;

            if(Math.abs(player.x - targetX) < 2 && Math.abs(player.y - targetY) < 2){
                iglooAnimation = false;
                gameFinished = true; // Oyunu bitirir ve döngüyü durdurur
                
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("keyup", handleKeyUp);
                window.removeEventListener("resize", handleResize);
                cancelAnimationFrame(animationId);

                //bölüm tamamlandığında çağrılacak fonksiyonu çalıştırır.
                if(window.showSuccessScreen) {
                    window.showSuccessScreen(onComplete, false);
                }
            }
            return;
        }

        //hareket tuşlarına basıldığında, penguenin hızını günceller.
        //penguen yerdeyse tam hızda hareket eder, havadaysa hareket hızı biraz azalır.
        let control = player.grounded ? player.speed : player.speed * 0.75;
        if(keys["a"] || keys["arrowleft"]) player.velX -= control;
        if(keys["d"] || keys["arrowright"]) player.velX += control;

        //penguen yerdeyse sürtünme kuvveti uygular, havadaysa hafif bir hava direnci uygular.
        if(player.grounded) player.velX *= player.friction;
        else player.velX *= 0.96;

        //penguenin hızını maksimum hızla sınırlar.
        if(player.velX > player.maxSpeed) player.velX = player.maxSpeed;
        if(player.velX < -player.maxSpeed) player.velX = -player.maxSpeed;

        //penguenin konumunu hızına göre günceller ve ekrandan çımasını engeller.
        player.x += player.velX;
        if(player.x < 0) player.x = 0;
        if(player.x + player.width > GAME_W) player.x = GAME_W - player.width;

        //yerçekimi uygular ve penguenin düşmesini sağlar.
        player.velY += player.gravity;
        player.y += player.velY;

        collideWithPlatforms();
        checkBreakables();
        checkGoal();
        updateSnow();

        //penguen hareket ederken bacaklarının sallanmasını sağlar.
        //hareket hızı arttıkça bacakların sallanma hızı da artar.
        if(Math.abs(player.velX) > 0.5 && player.grounded){
            player.legOffset += 0.4 * player.legDirection;
            if(player.legOffset > 3 || player.legOffset < -3) player.legDirection *= -1;
        }

        //penguen ekranın altına düştüğünde oyunu resetler.
        if(player.y > GAME_H + 100) resetGame();
    }

    //bölümün arkaplanını çizer.
    function drawBackground(){
        ctx.fillStyle = "#0b2238";
        ctx.fillRect(0, 0, GAME_W, GAME_H);

        ctx.fillStyle = "#123a55";
        ctx.beginPath();
        ctx.moveTo(0, 700); ctx.lineTo(130, 430); ctx.lineTo(280, 700);
        ctx.closePath(); ctx.fill();

        ctx.beginPath();
        ctx.moveTo(230, 700); ctx.lineTo(520, 360); ctx.lineTo(760, 700);
        ctx.closePath(); ctx.fill();

        ctx.beginPath();
        ctx.moveTo(650, 700); ctx.lineTo(980, 340); ctx.lineTo(1300, 700);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = "#dff7ff";
        ctx.fillRect(0, 720, GAME_W, 30);
    }

    //platformları çizer.
    function drawPlatforms(){
        platforms.forEach(function(p){
            ctx.fillStyle = "#64c7e8"; ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = "#e9fbff"; ctx.fillRect(p.x, p.y, p.width, 6);
            ctx.fillStyle = "#2f8fb8"; ctx.fillRect(p.x, p.y + p.height - 6, p.width, 6);
            ctx.strokeStyle = "#b8f3ff"; ctx.lineWidth = 2; ctx.strokeRect(p.x, p.y, p.width, p.height);
        });
    }

    
    //kırılabilir buzları çizer.
    function drawBreakables(){
        breakables.forEach(function(box){
            if(box.broken) return;
            ctx.fillStyle = "#9fe9ff"; ctx.fillRect(box.x, box.y, box.width, box.height);
            ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(box.x + 5, box.y + 5, box.width - 15, 8);
            ctx.strokeStyle = "#eaffff"; ctx.lineWidth = 3; ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            ctx.strokeStyle = "#3aaed1"; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(box.x + 10, box.y + 10); ctx.lineTo(box.x + 25, box.y + 26); ctx.lineTo(box.x + 17, box.y + 42);
            ctx.moveTo(box.x + 34, box.y + 12); ctx.lineTo(box.x + 26, box.y + 30); ctx.lineTo(box.x + 38, box.y + 43);
            ctx.stroke();
        });
    }
    
    //igloyu çizer.
    function drawGoal(){
        ctx.fillStyle = "#e8fbff"; ctx.beginPath(); ctx.arc(goal.x + 45, goal.y + 80, 55, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#bde6f2"; ctx.beginPath(); ctx.arc(goal.x + 45, goal.y + 80, 42, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#263746"; ctx.beginPath(); ctx.arc(goal.x + 45, goal.y + 80, 20, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.arc(goal.x + 45, goal.y + 72, 6, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = "#8ecfe3"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(goal.x + 5, goal.y + 55); ctx.lineTo(goal.x + 85, goal.y + 55);
        ctx.moveTo(goal.x + 18, goal.y + 38); ctx.lineTo(goal.x + 72, goal.y + 38);
        ctx.moveTo(goal.x + 45, goal.y + 25); ctx.lineTo(goal.x + 45, goal.y + 55);
        ctx.stroke();
    }

    //pengueni çizer.
    function drawPlayer(){
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.ellipse(player.x + player.width / 2, player.y + player.height / 2, 20, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.ellipse(player.x + player.width / 2, player.y + player.height / 2 + 5, 11, 16, 0, 0, Math.PI * 2); ctx.fill();

        if(penguinSleeping){
            ctx.strokeStyle = "black"; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(player.x + 10, player.y + 18); ctx.lineTo(player.x + 18, player.y + 18);
            ctx.moveTo(player.x + 22, player.y + 18); ctx.lineTo(player.x + 30, player.y + 18);
            ctx.stroke();
        } 
        else {
            ctx.fillStyle = "white";
            ctx.beginPath(); ctx.arc(player.x + 14, player.y + 18, 4, 0, Math.PI * 2); ctx.arc(player.x + 26, player.y + 18, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.arc(player.x + 14, player.y + 18, 2, 0, Math.PI * 2); ctx.arc(player.x + 26, player.y + 18, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(player.x + 20, player.y + 25); ctx.lineTo(player.x + 27, player.y + 28); ctx.lineTo(player.x + 20, player.y + 31);
        ctx.fill();
        
        ctx.fillRect(player.x + 8, player.y + 50 + player.legOffset, 8, 10);
        ctx.fillRect(player.x + 24, player.y + 50 - player.legOffset, 8, 10);
    }

    //ipucuları çizer.
    function drawUI(){
        ctx.fillStyle = "white"; ctx.font = "26px Arial";
        ctx.fillText("Level 1", 15, 35);
        ctx.fillText("Kalan Zıplama Hakkı: " + player.jumpsLeft, 15, 65);

        let broken = 0;
        breakables.forEach(function(box){ if(box.broken) broken++; });

        ctx.font = "20px Arial";
        ctx.fillText("Kırılmış Kutular: " + broken + "/" + breakables.length, 15, 95);
        
        if(!allBoxesBroken()){ ctx.fillText("Tüm kutuları kırmadan igloya ulaşamazsın!", 15, 125); } 
        else { ctx.fillText("Tüm kutular kırıldı! İgloya git.", 15, 125); }

        if(player.jumpsLeft === 0){
            ctx.fillStyle = "red"; ctx.fillText("R BASARAK RESETLE", 15, 155);
        }
    }

    //zıplama efektini oluşturur.
    //her zıplamada, penguenin altından rastgele yönlere doğru hareket eden küçük parçacıklar oluşturur.
    function createJumpEffect(){
        for(let i = 0; i < 10; i++){
            particles.push({
                x:player.x + player.width / 2, y:player.y + player.height,
                size:Math.random() * 5 + 2, velX:(Math.random() - 0.5) * 6, velY:Math.random() * -4, life:30, color:"white"
            });
        }
    }

    //kırılma efektini oluşturur.
    //bir buz kırıldığında, onun yerinden rastgele yönlere doğru hareket eden küçük parçacıklar oluşturur.
    function createBreakEffect(x,y){
        for(let i = 0; i < 18; i++){
            particles.push({
                x:x, y:y, size:Math.random() * 6 + 3, velX:(Math.random() - 0.5) * 8, velY:(Math.random() - 0.5) * 8, life:35, color:"white"
            });
        }
    }

    //parçacıkları günceller.
    function updateParticles(){
        for(let i = particles.length - 1; i >= 0; i--){
            let p = particles[i];
            p.x += p.velX; p.y += p.velY; p.life--;
            if(p.life <= 0){ particles.splice(i, 1); }
        }
    }

    //parçacıkları çizer.
    function drawParticles(){
        particles.forEach(function(p){ ctx.fillStyle = p.color || "white"; ctx.fillRect(p.x, p.y, p.size, p.size); });
    }

    //kar taneciklerini günceller.
    function updateSnow(){
        snowflakes.forEach(function(snow){
            snow.y += snow.speed; snow.x += snow.drift;
            if(snow.y > canvas.height){ snow.y = -10; snow.x = Math.random() * canvas.width; }
            if(snow.x < -10){ snow.x = canvas.width + 10; }
            if(snow.x > canvas.width + 10){ snow.x = -10; }
        });
    }

    //kar taneciklerini çizer.
    function drawSnow(){
        snowflakes.forEach(function(snow){
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath(); ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2); ctx.fill();
        });
    }
    
    //ana oyun döngüsü.
    //her frame'de çalışır ve oyunun durumunu günceller, çizer ve gerekli kontrolleri yapar.
    function gameLoop(){
        //Tüm ekranı koyu maviye boyar
        ctx.fillStyle = "#071827"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(!gameFinished){ 
            update(); 
            updateParticles(); 
        }

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        drawBackground();
        drawPlatforms();
        drawBreakables();
        drawGoal();
        drawPlayer();
        drawParticles();
        ctx.restore();

        drawSnow();
        drawUI();
        
        //bölüm bitince döngüyü tamamen durdurur (Menü ekranının çalışmasını sağlar)
        if(!gameFinished) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    gameLoop();
};