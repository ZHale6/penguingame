window.startMenu = function(onStart, onLevelSelect) {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let animationId;
    let currentView = "main"; 

    //menü arka planı için görsel yüklenir.
    const bgImage = new Image();
    bgImage.src = "src/menu.png";

    //menüdeki butonların özellikleri tanımlanır.
    const buttons = {
        start: { w: 250, h: 60, text: "OYUNA BAŞLA", color: "#64c7e8" },
        levelSelect: { w: 250, h: 60, text: "BÖLÜM SEÇ", color: "#64c7e8" },
        lvl1: { w: 200, h: 50, text: "Level 1", color: "#64c7e8" },
        lvl2: { w: 200, h: 50, text: "Level 2", color: "#64c7e8" },
        lvl3: { w: 200, h: 50, text: "Level 3", color: "#64c7e8" }
    };

    //butonları çizer.
    function drawButton(btn, x, y) {
        ctx.fillStyle = btn.color;
        ctx.beginPath();
        ctx.roundRect(x - btn.w / 2, y, btn.w, btn.h, 10);
        ctx.fill();
        ctx.fillStyle = "#0b2238"; 
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(btn.text, x, y + btn.h / 1.6);
        
        btn.lastX = x - btn.w / 2;
        btn.lastY = y;
    }

    //menüyü çizer.
    function drawMenu() {
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        
        if (bgImage.complete) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        else {
            ctx.fillStyle = "#071827"; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        
        if (currentView === "main") {
            ctx.font = "bold 65px Arial";
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 10;
            ctx.fillText("PENGUIN ADVENTURE", canvas.width / 2, canvas.height / 2 - 100);
            ctx.shadowBlur = 0;

            drawButton(buttons.start, canvas.width / 2, canvas.height / 2);
            drawButton(buttons.levelSelect, canvas.width / 2, canvas.height / 2 + 80);
        }
        else {
            ctx.font = "bold 50px Arial";
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 10;
            ctx.fillText("BÖLÜMLER", canvas.width / 2, canvas.height / 2 - 130);
            ctx.shadowBlur = 0;

            drawButton(buttons.lvl1, canvas.width / 2, canvas.height / 2 - 40);
            drawButton(buttons.lvl2, canvas.width / 2, canvas.height / 2 + 30);
            drawButton(buttons.lvl3, canvas.width / 2, canvas.height / 2 + 100);
        }

        animationId = requestAnimationFrame(drawMenu);
    }

    //oyunun arkaplan müziği bölüme başlanınca çalmaya başlar.
    function startMusic() {
        if(window.bgMusic && window.bgMusic.paused) {
            window.bgMusic.play().catch(e => console.log("Müzik başlatılamadı:", e));
        }
    }

    //menüdeki butonlara tıklama işlemi yapılır.
    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (currentView === "main") {
            if (isInside(mx, my, buttons.start)) {
                cleanup();
                startMusic();
                onStart();
            }
            else if (isInside(mx, my, buttons.levelSelect)) {
                currentView = "levels";
            }
        }
        else {
            if (isInside(mx, my, buttons.lvl1)) {
                cleanup();
                startMusic();
                onLevelSelect(1);
            }
            else if (isInside(mx, my, buttons.lvl2)) {
                cleanup();
                startMusic();
                onLevelSelect(2);
            }
            else if (isInside(mx, my, buttons.lvl3)) {
                cleanup();
                startMusic();
                onLevelSelect(3);
            }
        }
    }

    //tıklanan konumun butonların içinde olup olmadığını kontrol eder.
    function isInside(mx, my, btn) {
        return mx > btn.lastX && mx < btn.lastX + btn.w && my > btn.lastY && my < btn.lastY + btn.h;
    }

    //menüden çıkarken event listener'ları temizler.
    function cleanup() {
        cancelAnimationFrame(animationId);
        canvas.removeEventListener("mousedown", handleClick);
        window.removeEventListener("resize", resize);
    }

    //menüyü başlatır.
    canvas.addEventListener("mousedown", handleClick);
    drawMenu();
};

window.showSuccessScreen = function(onContinue, isGameFinish = false) {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    let animationId;

    //zafer ekranı açıldığında arkaplan müziği kısılır ve zafer sesi çalınır.
    if(window.bgMusic) {
        window.bgMusic.volume = 0.15; 
    }
    
    //zafer sesi tanımlanır eğer dosya bulunamazsa hata konsola yazılır.
    if(window.victorySound) {
        window.victorySound.currentTime = 0; 
        window.victorySound.volume = 1.0; 
        window.victorySound.play().catch(e => console.log("Zafer sesi çalınamadı:", e));
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    //zafer ekranını çizer.
    function draw() {
        ctx.fillStyle = "#071827"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        
        ctx.fillStyle = "#64c7e8"; 
        ctx.font = "bold 60px Arial";
        ctx.fillText("TEBRİKLER!", canvas.width / 2, canvas.height / 2 - 50);

        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        
        if(isGameFinish) {
             ctx.fillText("Tüm bölümleri tamamladın! Penguen güvenle iglosuna yerleşti.", canvas.width / 2, canvas.height / 2 + 10);
        }
        else {
             ctx.fillText("Bu bölümü başarıyla tamamladın.", canvas.width / 2, canvas.height / 2 + 10);
        }

        ctx.fillStyle = "#9fe9ff";
        ctx.font = "italic 20px Arial";
        ctx.fillText("Devam etmek için ENTER tuşuna bas...", canvas.width / 2, canvas.height / 2 + 80);

        animationId = requestAnimationFrame(draw);
    }

    //ENTER tuşuna basıldığında zafer ekranından çıkılır ve müzik eski seviyesine getirilir.
    const handleKey = (e) => {
        if (e.key === "Enter") {
            cancelAnimationFrame(animationId);
            window.removeEventListener("keydown", handleKey);

            if(window.victorySound) {
                window.victorySound.pause();
            }
            if(window.bgMusic) {
                window.bgMusic.volume = 0.4; 
            }

            if(onContinue) onContinue();
        }
    };

    window.addEventListener("keydown", handleKey);
    draw();
};