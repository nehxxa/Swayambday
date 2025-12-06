// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    WAITING: 'waiting'
};

// Game Configuration
const config = {
    gravity: 0.5,
    jumpForce: -9,
    pipeSpeed: 3,
    pipeSpawnInterval: 1800,
    pipeGap: 200,
    pipeWidth: 120,
    birdSize: 70,
    groundHeight: 0
};

// Game Variables
let canvas, ctx;
let gameState = GameState.MENU;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let bird = null;
let pipes = [];
let lastPipeSpawn = 0;
let animationId = null;

// Custom Assets
let customBirdImage = null;
let customPipeImage = null;
let backgroundMusic = null;
let jumpSound = null;

// Load saved custom assets from localStorage
function loadSavedAssets() {
    // Load bird image
    const savedBird = localStorage.getItem('customBirdImage');
    if (savedBird) {
        const img = new Image();
        img.onload = () => {
            customBirdImage = img;
            document.getElementById('bird-preview').innerHTML = `<img src="${savedBird}" alt="Bird preview">`;
        };
        img.src = savedBird;
    }
    
    // Load pipe image
    const savedPipe = localStorage.getItem('customPipeImage');
    if (savedPipe) {
        const img = new Image();
        img.onload = () => {
            customPipeImage = img;
            document.getElementById('pipe-preview').innerHTML = `<img src="${savedPipe}" alt="Pipe preview">`;
        };
        img.src = savedPipe;
    }
    
    // Load background music
    const savedMusic = localStorage.getItem('backgroundMusic');
    const savedMusicName = localStorage.getItem('backgroundMusicName');
    if (savedMusic) {
        backgroundMusic = new Audio(savedMusic);
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
        document.getElementById('music-preview').innerHTML = `<span class="audio-loaded">✓ ${savedMusicName || 'Music loaded'}</span>`;
    }
    
    // Load jump sound
    const savedJump = localStorage.getItem('jumpSound');
    const savedJumpName = localStorage.getItem('jumpSoundName');
    if (savedJump) {
        jumpSound = new Audio(savedJump);
        jumpSound.volume = 0.7;
        document.getElementById('jump-preview').innerHTML = `<span class="audio-loaded">✓ ${savedJumpName || 'Sound loaded'}</span>`;
    }
}

// Default colors for fallback rendering
const colors = {
    bird: '#ff6b9d',
    pipe: '#6bcb77',
    pipeHighlight: '#8ddb97',
    pipeShadow: '#4a9c5d'
};

// DOM Elements
const screens = {
    menu: document.getElementById('menu-screen'),
    customize: document.getElementById('customize-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen'),
    pause: document.getElementById('pause-screen')
};

const elements = {
    canvas: document.getElementById('game-canvas'),
    scoreDisplay: document.getElementById('score-display'),
    finalScore: document.getElementById('final-score'),
    highScore: document.getElementById('high-score'),
    menuHighScore: document.getElementById('menu-high-score'),
    startPrompt: document.getElementById('start-prompt')
};

// Initialize
function init() {
    canvas = elements.canvas;
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Load saved custom assets
    loadSavedAssets();
    
    // Update high score displays
    updateHighScoreDisplays();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start render loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const wrapper = document.querySelector('.game-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    config.groundHeight = 0;
}

function setupEventListeners() {
    // Menu buttons
    document.getElementById('play-btn').addEventListener('click', startGame);
    document.getElementById('customize-btn').addEventListener('click', () => showScreen('customize'));
    document.getElementById('back-to-menu').addEventListener('click', () => showScreen('menu'));
    
    // Game controls
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('quit-btn').addEventListener('click', quitToMenu);
    
    // Game over buttons
    document.getElementById('retry-btn').addEventListener('click', startGame);
    document.getElementById('menu-btn').addEventListener('click', quitToMenu);
    
    // File uploads
    document.getElementById('bird-upload').addEventListener('change', (e) => handleImageUpload(e, 'bird'));
    document.getElementById('pipe-upload').addEventListener('change', (e) => handleImageUpload(e, 'pipe'));
    document.getElementById('music-upload').addEventListener('change', (e) => handleAudioUpload(e, 'music'));
    document.getElementById('jump-upload').addEventListener('change', (e) => handleAudioUpload(e, 'jump'));
    
    // Clear saved assets
    document.getElementById('clear-assets').addEventListener('click', clearAllAssets);
    
    // Game input
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick, { passive: false });
}

function handleImageUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            if (type === 'bird') {
                customBirdImage = img;
                localStorage.setItem('customBirdImage', event.target.result);
                document.getElementById('bird-preview').innerHTML = `<img src="${event.target.result}" alt="Bird preview">`;
            } else if (type === 'pipe') {
                customPipeImage = img;
                localStorage.setItem('customPipeImage', event.target.result);
                document.getElementById('pipe-preview').innerHTML = `<img src="${event.target.result}" alt="Pipe preview">`;
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleAudioUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const audio = new Audio(event.target.result);
        if (type === 'music') {
            backgroundMusic = audio;
            backgroundMusic.loop = true;
            backgroundMusic.volume = 0.5;
            localStorage.setItem('backgroundMusic', event.target.result);
            localStorage.setItem('backgroundMusicName', file.name);
            document.getElementById('music-preview').innerHTML = `<span class="audio-loaded">✓ ${file.name}</span>`;
        } else if (type === 'jump') {
            jumpSound = audio;
            jumpSound.volume = 0.7;
            localStorage.setItem('jumpSound', event.target.result);
            localStorage.setItem('jumpSoundName', file.name);
            document.getElementById('jump-preview').innerHTML = `<span class="audio-loaded">✓ ${file.name}</span>`;
        }
    };
    reader.readAsDataURL(file);
}

function clearAllAssets() {
    // Clear from localStorage
    localStorage.removeItem('customBirdImage');
    localStorage.removeItem('customPipeImage');
    localStorage.removeItem('backgroundMusic');
    localStorage.removeItem('backgroundMusicName');
    localStorage.removeItem('jumpSound');
    localStorage.removeItem('jumpSoundName');
    
    // Clear from memory
    customBirdImage = null;
    customPipeImage = null;
    backgroundMusic = null;
    jumpSound = null;
    
    // Clear previews
    document.getElementById('bird-preview').innerHTML = '';
    document.getElementById('pipe-preview').innerHTML = '';
    document.getElementById('music-preview').innerHTML = '';
    document.getElementById('jump-preview').innerHTML = '';
    
    // Reset file inputs
    document.getElementById('bird-upload').value = '';
    document.getElementById('pipe-upload').value = '';
    document.getElementById('music-upload').value = '';
    document.getElementById('jump-upload').value = '';
    
    alert('All saved assets have been cleared!');
}

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
    }
    if (e.code === 'Escape') {
        if (gameState === GameState.PLAYING || gameState === GameState.WAITING) {
            togglePause();
        }
    }
}

function handleCanvasClick(e) {
    e.preventDefault();
    handleJump();
}

function handleJump() {
    if (gameState === GameState.WAITING) {
        gameState = GameState.PLAYING;
        elements.startPrompt.style.display = 'none';
        if (backgroundMusic) {
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(() => {});
        }
    }
    
    if (gameState === GameState.PLAYING) {
        bird.velocity = config.jumpForce;
        bird.rotation = -30;
        
        if (jumpSound) {
            jumpSound.currentTime = 0;
            jumpSound.play().catch(() => {});
        }
    }
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

function startGame() {
    // Reset game state
    score = 0;
    pipes = [];
    lastPipeSpawn = 0;
    
    // Create bird
    bird = {
        x: canvas.width * 0.2,
        y: canvas.height / 2,
        velocity: 0,
        rotation: 0,
        width: config.birdSize,
        height: config.birdSize
    };
    
    // Update displays
    elements.scoreDisplay.textContent = '0';
    elements.startPrompt.style.display = 'flex';
    
    // Show game screen
    showScreen('game');
    gameState = GameState.WAITING;
}

function togglePause() {
    if (gameState === GameState.PLAYING) {
        gameState = GameState.PAUSED;
        screens.pause.classList.add('active');
        if (backgroundMusic) backgroundMusic.pause();
    } else if (gameState === GameState.PAUSED) {
        gameState = GameState.PLAYING;
        screens.pause.classList.remove('active');
        if (backgroundMusic) backgroundMusic.play().catch(() => {});
    } else if (gameState === GameState.WAITING) {
        gameState = GameState.PAUSED;
        screens.pause.classList.add('active');
    }
}

function quitToMenu() {
    gameState = GameState.MENU;
    screens.pause.classList.remove('active');
    showScreen('menu');
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

function gameOver() {
    gameState = GameState.GAME_OVER;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }
    
    // Update displays
    elements.finalScore.textContent = score;
    elements.highScore.textContent = highScore;
    updateHighScoreDisplays();
    
    // Stop music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Show game over screen
    setTimeout(() => {
        showScreen('gameOver');
    }, 500);
}

function updateHighScoreDisplays() {
    elements.menuHighScore.textContent = highScore;
}

// Game Loop
function gameLoop(timestamp) {
    update(timestamp);
    render();
    animationId = requestAnimationFrame(gameLoop);
}

function update(timestamp) {
    if (gameState !== GameState.PLAYING) return;
    
    // Update bird
    bird.velocity += config.gravity;
    bird.y += bird.velocity;
    
    // Bird rotation based on velocity
    if (bird.velocity > 0) {
        bird.rotation = Math.min(bird.rotation + 3, 90);
    }
    
    // Spawn pipes
    if (timestamp - lastPipeSpawn > config.pipeSpawnInterval) {
        spawnPipe();
        lastPipeSpawn = timestamp;
    }
    
    // Update pipes
    pipes.forEach(pipe => {
        pipe.x -= config.pipeSpeed;
        
        // Check if pipe passed bird
        if (!pipe.passed && pipe.x + config.pipeWidth < bird.x) {
            pipe.passed = true;
            score++;
            elements.scoreDisplay.textContent = score;
        }
    });
    
    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + config.pipeWidth > 0);
    
    // Check collisions
    if (checkCollision()) {
        gameOver();
    }
}

function spawnPipe() {
    const minY = 100;
    const maxY = canvas.height - config.pipeGap - 100;
    const gapY = Math.random() * (maxY - minY) + minY;
    
    pipes.push({
        x: canvas.width,
        gapY: gapY,
        passed: false
    });
}

function checkCollision() {
    // Ground and ceiling collision
    if (bird.y - bird.height / 2 < 0 || bird.y + bird.height / 2 > canvas.height) {
        return true;
    }
    
    // Pipe collision
    const birdBox = {
        left: bird.x - bird.width / 2 + 5,
        right: bird.x + bird.width / 2 - 5,
        top: bird.y - bird.height / 2 + 5,
        bottom: bird.y + bird.height / 2 - 5
    };
    
    for (const pipe of pipes) {
        // Top pipe
        const topPipeBox = {
            left: pipe.x,
            right: pipe.x + config.pipeWidth,
            top: 0,
            bottom: pipe.gapY
        };
        
        // Bottom pipe
        const bottomPipeBox = {
            left: pipe.x,
            right: pipe.x + config.pipeWidth,
            top: pipe.gapY + config.pipeGap,
            bottom: canvas.height
        };
        
        if (boxCollision(birdBox, topPipeBox) || boxCollision(birdBox, bottomPipeBox)) {
            return true;
        }
    }
    
    return false;
}

function boxCollision(box1, box2) {
    return box1.left < box2.right &&
           box1.right > box2.left &&
           box1.top < box2.bottom &&
           box1.bottom > box2.top;
}

// Rendering
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw decorative elements
    drawBackground();
    
    if (gameState === GameState.PLAYING || gameState === GameState.WAITING || gameState === GameState.PAUSED) {
        // Draw pipes
        pipes.forEach(drawPipe);
        
        // Draw bird
        if (bird) {
            drawBird();
        }
    }
}

function drawBackground() {
    // Draw some decorative circles in the background
    ctx.save();
    ctx.globalAlpha = 0.1;
    
    const time = Date.now() / 3000;
    for (let i = 0; i < 5; i++) {
        const x = (canvas.width / 4) * i + Math.sin(time + i) * 30;
        const y = canvas.height / 2 + Math.cos(time + i) * 50;
        const radius = 100 + Math.sin(time + i * 2) * 20;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#ff6b9d' : '#ffd93d';
        ctx.fill();
    }
    
    ctx.restore();
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation * Math.PI / 180);
    
    if (customBirdImage) {
        // Draw custom image
        ctx.drawImage(
            customBirdImage,
            -bird.width / 2,
            -bird.height / 2,
            bird.width,
            bird.height
        );
    } else {
        // Draw default bird
        // Body
        ctx.fillStyle = colors.bird;
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.width / 2, bird.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = '#e85a8a';
        ctx.beginPath();
        const wingY = Math.sin(Date.now() / 100) * 5;
        ctx.ellipse(-5, wingY, 15, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(12, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(14, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(30, 3);
        ctx.lineTo(20, 8);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
}

function drawPipe(pipe) {
    const pipeWidth = config.pipeWidth;
    const capHeight = 30;
    const capOverhang = 8;
    
    if (customPipeImage) {
        // Draw custom pipe images
        // Top pipe (flipped)
        ctx.save();
        ctx.translate(pipe.x + pipeWidth / 2, pipe.gapY / 2);
        ctx.scale(1, -1);
        ctx.drawImage(
            customPipeImage,
            -pipeWidth / 2,
            -pipe.gapY / 2,
            pipeWidth,
            pipe.gapY
        );
        ctx.restore();
        
        // Bottom pipe
        const bottomHeight = canvas.height - pipe.gapY - config.pipeGap;
        ctx.drawImage(
            customPipeImage,
            pipe.x,
            pipe.gapY + config.pipeGap,
            pipeWidth,
            bottomHeight
        );
    } else {
        // Draw default pipes
        // Top pipe body
        const topGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        topGradient.addColorStop(0, colors.pipeShadow);
        topGradient.addColorStop(0.3, colors.pipe);
        topGradient.addColorStop(0.7, colors.pipeHighlight);
        topGradient.addColorStop(1, colors.pipeShadow);
        
        ctx.fillStyle = topGradient;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY - capHeight);
        
        // Top pipe cap
        ctx.fillRect(pipe.x - capOverhang, pipe.gapY - capHeight, pipeWidth + capOverhang * 2, capHeight);
        
        // Bottom pipe body
        const bottomY = pipe.gapY + config.pipeGap;
        ctx.fillRect(pipe.x, bottomY + capHeight, pipeWidth, canvas.height - bottomY - capHeight);
        
        // Bottom pipe cap
        ctx.fillRect(pipe.x - capOverhang, bottomY, pipeWidth + capOverhang * 2, capHeight);
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(pipe.x + 10, 0, 15, pipe.gapY - capHeight);
        ctx.fillRect(pipe.x + 10, bottomY + capHeight, 15, canvas.height - bottomY - capHeight);
    }
}

// Start the game
window.addEventListener('load', init);


