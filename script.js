// Canvas ve Context'i tanımlama
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

// --- Oyun Değişkenleri ve Sabitler ---

const PLAYER_WIDTH = 120;
const PLAYER_HEIGHT = 200;

const groundY = canvas.height - PLAYER_HEIGHT; 

const WIN_SCORE = 25; 

// Resim Yüklemeleri
const backgroundImage = new Image();
backgroundImage.src = 'background.png'; 
backgroundImage.onerror = () => { console.warn("UYARI: background.png yüklenemedi."); };

// KAZANMA RESMİ 1: Sağdan gelen buluşma resmi (26. Engel)
const winScreenImage = new Image();
winScreenImage.src = 'win_screen.png'; 
winScreenImage.onerror = () => { console.warn("UYARI: win_screen.png yüklenemedi."); };

// KAZANMA RESMİ 2: Buluşma sonrası tüm ekranı kaplayan fotoğraf
const finalPhoto = new Image();
finalPhoto.src = 'final_photo.png'; 
finalPhoto.onerror = () => { console.warn("UYARI: final_photo.png yüklenemedi."); };


let player = {
    x: 50, y: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, 
    hitboxOffset: { x: 25, y: 5 },
    image: new Image(), vy: 0, gravity: 0.6, isJumping: false
};

let finalObstacleCreated = false;
let obstacles = [];
let gameSpeed = 2;
let score = 0;
let isGameOver = false;
let isGameWon = false; 
let obstacleTimer = 0; 
let hearts = []; 

player.image.src = 'player.png'; 
player.image.onload = () => {
    player.y = groundY; gameLoop();
};
player.image.onerror = () => {
    console.error("HATA: 'player.png' yüklenemedi!"); isGameOver = true; 
};

// ==========================================================
//                   ANA FONKSİYONLAR
// ==========================================================

function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function updatePlayer() {
    if (isGameOver) return; 

    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y > groundY) {
        player.y = groundY; 
        player.vy = 0;
        player.isJumping = false;
    }
}

// Engel Oluşturma
function createObstacle() {
    // Final Engel Oluşturma Kontrolü (Skor 25 olduğunda)
    if (score === WIN_SCORE && !finalObstacleCreated) {
        const finalObstacle = {
            x: canvas.width, y: groundY, 
            width: PLAYER_WIDTH * 2, 
            height: PLAYER_HEIGHT, isWinObstacle: true, color: 'blue' 
        };
        obstacles.push(finalObstacle);
        finalObstacleCreated = true;
        obstacleTimer = 0; 
        return;
    }
    if (score > WIN_SCORE) return; 
    
    // Normal Engel Oluşturma
    const minHeight = 20; const maxHeight = 60;
    const obstacleHeight = minHeight + Math.random() * (maxHeight - minHeight);
    
    const obstacle = {
        x: canvas.width, y: groundY + player.height - obstacleHeight, 
        width: 20, height: obstacleHeight, color: 'red', isWinObstacle: false
    };
    obstacles.push(obstacle);
}

// Engelleri Güncelleme ve Çizme (Çarpışma Mantığı)
function updateObstacles() {
    if (isGameOver) return; 

    const playerHitX = player.x + player.hitboxOffset.x;
    const playerHitY = player.y + player.hitboxOffset.y;
    const playerHitWidth = player.width - (player.hitboxOffset.x * 2); 
    const playerHitHeight = player.height - player.hitboxOffset.y;     

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        
        obs.x -= gameSpeed;

        if (obs.isWinObstacle) {
            // BULUŞMA RESMİ ÇİZİMİ
            if (winScreenImage.complete && winScreenImage.naturalWidth > 0) {
                 ctx.drawImage(winScreenImage, obs.x, obs.y, obs.width, obs.height);
            } else {
                 ctx.fillStyle = obs.color; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }
            
            // KAZANMA ÇARPIŞMA KONTROLÜ (BULUŞMA ANI)
            if (
                player.x + player.width > obs.x && player.x < obs.x + obs.width      
            ) {
                isGameWon = true;
                isGameOver = true; 
            }

        } else {
            // NORMAL ENGEL ÇİZİMİ ve KAYBETME KONTROLÜ
            ctx.fillStyle = obs.color; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            if (
                playerHitX < obs.x + obs.width && playerHitX + playerHitWidth > obs.x &&
                playerHitY < obs.y + obs.height && playerHitY + playerHitHeight > obs.y
            ) {
                isGameOver = true; isGameWon = false;
            }

            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                score++; i--;
            }
        }
    }
}

// ==========================================================
//                   KALP/ZIPLAMA MANTIKLARI
// ==========================================================

function createHeartParticle() {
    // Kalp başlangıç konumu: Karakterin kafasının üstü
    const startX = player.x + player.width / 2; 
    const startY = player.y - 20; 

    hearts.push({
        x: startX, y: startY, size: 30, 
        vy: -5 - Math.random() * 3, 
        vx: (Math.random() - 0.5) * 2, 
        alpha: 1, life: 60       
    });
}

function drawHeartParticle(heart) {
    // Kalp çizimi (Basit Geometri)
    ctx.save(); ctx.globalAlpha = heart.alpha; ctx.fillStyle = 'purple'; 
    const size = heart.size; const r = size / 4; const y_top = heart.y - r; 
    ctx.beginPath();
    ctx.arc(heart.x - r, heart.y - r, r, Math.PI, 0); 
    ctx.arc(heart.x + r, heart.y - r, r, Math.PI, 0); 
    ctx.lineTo(heart.x + 2 * r, y_top); 
    ctx.lineTo(heart.x, heart.y + size * 0.6); 
    ctx.lineTo(heart.x - 2 * r, y_top); 
    ctx.closePath(); ctx.fill();
    ctx.restore(); 
}

function updateHearts() {
    if (isGameOver) return; 
    for (let i = 0; i < hearts.length; i++) {
        let heart = hearts[i];
        heart.x += heart.vx; heart.y += heart.vy; heart.vy += 0.2; 
        heart.alpha -= 0.02; heart.life--;
        if (heart.life <= 0 || heart.alpha <= 0) {
            hearts.splice(i, 1); i--;
        }
    }
}

// Zıplama İşlevi (Tıklama/Dokunma burada çağırılır)
function jump() {
    if (!isGameOver && !player.isJumping) {
        player.isJumping = true;
        player.vy = -20; 
        createHeartParticle(); 
    }
}

// ==========================================================
//                   EKRAN VE DÖNGÜ YÖNETİMİ
// ==========================================================

// Kazanma/Kaybetme Ekranı Çizimi
function drawEndScene(win) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    if (win) {
        // KAZANMA: FINAL FOTOĞRAFI TAM EKRAN
        if (finalPhoto.complete && finalPhoto.naturalWidth > 0) {
            ctx.drawImage(finalPhoto, 0, 0, canvas.width, canvas.height);
        } else {
             ctx.fillStyle = '#ffc0cb'; 
             ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Kazanma Mesajı
        ctx.fillStyle = 'white'; 
        ctx.strokeStyle = 'black'; 
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';

        const line1 = 'Oyunu Kazandın';
        const line2 = 'Asla Ayrılmayacağız';
        const line3 = 've Seni Çok Seviyorum';

        ctx.font = '40px sans-serif';
        ctx.strokeText(line1, canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText(line1, canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '30px sans-serif';
        ctx.strokeText(line2, canvas.width / 2, canvas.height / 2 + 5);
        ctx.fillText(line2, canvas.width / 2, canvas.height / 2 + 5);

        ctx.font = '30px sans-serif';
        ctx.strokeText(line3, canvas.width / 2, canvas.height / 2 + 45);
        ctx.fillText(line3, canvas.width / 2, canvas.height / 2 + 45);
        
        ctx.font = '24px sans-serif';
        ctx.strokeText('Yeniden Oynamak İçin Tıkla', canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText('Yeniden Oynamak İçin Tıkla', canvas.width / 2, canvas.height / 2 + 100);

    } else {
        // KAYBETME
        if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.fillStyle = 'green'; ctx.fillRect(0, groundY + player.height, canvas.width, canvas.height);
        
        // Engelleri ve Karakteri çiz (son konumda)
        obstacles.forEach(obs => { ctx.fillStyle = obs.color; ctx.fillRect(obs.x, obs.y, obs.width, obs.height); });
        drawPlayer();

        ctx.fillStyle = 'black';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OYUN BİTTİ!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px sans-serif';
        ctx.fillText('Yeniden Oynamak İçin Tıkla', canvas.width / 2, canvas.height / 2 + 40);
    }
    scoreDisplay.textContent = `Skor: ${score}`;
}

// Ana Oyun Döngüsü
function gameLoop() {
    
    // OYUN BİTTİ/KAZANILDI
    if (isGameOver) {
        drawEndScene(isGameWon);
        return; 
    }

    // NORMAL OYUN AKIŞI
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'green';
    ctx.fillRect(0, groundY + player.height, canvas.width, canvas.height);
    
    obstacleTimer++;
    if (obstacleTimer > 60 + Math.random() * 60) { 
        createObstacle();
        obstacleTimer = 0;
    }

    // GÜNCELLEMELER
    updatePlayer();
    updateObstacles(); 
    updateHearts(); 
    
    // ÇİZİMLER
    drawPlayer(); 
    hearts.forEach(drawHeartParticle);

    scoreDisplay.textContent = `Skor: ${score}`;

    requestAnimationFrame(gameLoop);
}

// Kontrol Olayları (Zıplama buradan tetiklenir)
const handleInteraction = (e) => {
    e.preventDefault(); 
    if (isGameOver) {
        resetGame();
    } else {
        jump(); // Tıklama/dokunma burada zıplamayı çağırır
    }
};

canvas.addEventListener('mousedown', handleInteraction);
canvas.addEventListener('touchstart', handleInteraction);

// Oyunu Sıfırlama
function resetGame() {
    player.y = groundY; player.x = 50; player.vy = 0; player.isJumping = false;
    obstacles = []; score = 0; isGameOver = false; isGameWon = false; 
    obstacleTimer = 0; hearts = []; 
    finalObstacleCreated = false; 
    if (player.image.complete && !isGameOver) {
        gameLoop();
    }

}


