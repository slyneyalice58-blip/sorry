const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = overlay.querySelector(".title");
const overlaySubtitle = overlay.querySelector(".subtitle");
const startBtn = document.getElementById("start-btn");
const touchButtons = document.querySelectorAll(".touch-controls button");

const LANE_OFFSET = 220;
const MAX_DEPTH = 1400;
const HORIZON_Y = 120;
const PLAYER_Y = 430;

const game = {
  running: false,
  time: 0,
  speed: 390,
  score: 0,
  best: Number(localStorage.getItem("brain-brat-best") || 0),
  obstacles: [],
  pickups: [],
  spawnTimer: 0,
  pickupTimer: 0
};

const player = {
  lane: 1,
  jumpY: 0,
  jumpV: 0,
  sliding: false,
  slideTimer: 0
};

bestEl.textContent = String(game.best);

function resetRun() {
  game.running = true;
  game.time = 0;
  game.speed = 390;
  game.score = 0;
  game.obstacles = [];
  game.pickups = [];
  game.spawnTimer = 0.5;
  game.pickupTimer = 1.1;
  player.lane = 1;
  player.jumpY = 0;
  player.jumpV = 0;
  player.sliding = false;
  player.slideTimer = 0;
  scoreEl.textContent = "0";
  overlay.classList.add("hidden");
}

function laneScreenX(lane, t) {
  const center = canvas.width / 2;
  const depthScale = 0.4 + t * 0.6;
  return center + (lane - 1) * LANE_OFFSET * depthScale;
}

function makeObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const type = Math.random() < 0.62 ? "low" : "high";
  game.obstacles.push({ lane, type, z: MAX_DEPTH, done: false });
}

function makePickup() {
  const lane = Math.floor(Math.random() * 3);
  game.pickups.push({ lane, z: MAX_DEPTH + 80, done: false });
}

function jump() {
  if (player.jumpY > 1 || player.sliding || !game.running) {
    return;
  }
  player.jumpV = 760;
}

function slide() {
  if (player.jumpY > 1 || player.sliding || !game.running) {
    return;
  }
  player.sliding = true;
  player.slideTimer = 0.58;
}

function moveLane(dir) {
  if (!game.running) {
    return;
  }
  player.lane = Math.max(0, Math.min(2, player.lane + dir));
}

function update(dt) {
  if (!game.running) {
    return;
  }

  game.time += dt;
  game.speed += dt * 5.5;
  game.score += dt * 18;

  player.jumpV -= dt * 1900;
  player.jumpY += player.jumpV * dt;
  if (player.jumpY < 0) {
    player.jumpY = 0;
    player.jumpV = 0;
  }

  if (player.sliding) {
    player.slideTimer -= dt;
    if (player.slideTimer <= 0) {
      player.sliding = false;
      player.slideTimer = 0;
    }
  }

  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    makeObstacle();
    game.spawnTimer = 0.58 + Math.random() * 0.38;
  }

  game.pickupTimer -= dt;
  if (game.pickupTimer <= 0) {
    makePickup();
    game.pickupTimer = 1.3 + Math.random() * 1.2;
  }

  for (const obstacle of game.obstacles) {
    obstacle.z -= game.speed * dt;
    if (!obstacle.done && obstacle.z < 65) {
      obstacle.done = true;
      game.score += 14;
    }

    if (obstacle.z < 80 && obstacle.z > -20 && obstacle.lane === player.lane) {
      const needsJump = obstacle.type === "low";
      const needsSlide = obstacle.type === "high";
      const jumpedOver = player.jumpY > 95;
      const slidUnder = player.sliding && player.jumpY < 1;

      if ((needsJump && !jumpedOver) || (needsSlide && !slidUnder)) {
        endRun();
        return;
      }
    }
  }

  for (const pickup of game.pickups) {
    pickup.z -= game.speed * dt;
    if (!pickup.done && pickup.z < 85 && pickup.z > -15 && pickup.lane === player.lane) {
      pickup.done = true;
      game.score += 35;
    }
  }

  game.obstacles = game.obstacles.filter((item) => item.z > -100);
  game.pickups = game.pickups.filter((item) => item.z > -100 && !item.done);

  scoreEl.textContent = String(Math.floor(game.score));
}

function endRun() {
  game.running = false;
  const finalScore = Math.floor(game.score);
  if (finalScore > game.best) {
    game.best = finalScore;
    localStorage.setItem("brain-brat-best", String(finalScore));
    bestEl.textContent = String(finalScore);
  }
  overlayTitle.textContent = "Game Over";
  overlaySubtitle.textContent = `Final Score: ${finalScore}`;
  startBtn.textContent = "Play Again";
  overlay.classList.remove("hidden");
}

function drawRoad() {
  const cx = canvas.width / 2;
  const topW = 180;
  const bottomW = 710;

  ctx.fillStyle = "#090c13";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 20);
  skyGrad.addColorStop(0, "#202a3f");
  skyGrad.addColorStop(1, "#0f121a");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, HORIZON_Y + 20);

  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, HORIZON_Y);
  ctx.lineTo(cx + topW / 2, HORIZON_Y);
  ctx.lineTo(cx + bottomW / 2, canvas.height);
  ctx.lineTo(cx - bottomW / 2, canvas.height);
  ctx.closePath();
  const roadGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, canvas.height);
  roadGrad.addColorStop(0, "#242838");
  roadGrad.addColorStop(1, "#111520");
  ctx.fillStyle = roadGrad;
  ctx.fill();

  ctx.strokeStyle = "#4f5d78";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const laneBlend = (i + 1) / 3;
    ctx.beginPath();
    ctx.moveTo(cx + (laneBlend - 0.5) * topW, HORIZON_Y);
    ctx.lineTo(cx + (laneBlend - 0.5) * bottomW, canvas.height);
    ctx.stroke();
  }
}

function drawBrainBrat() {
  const x = laneScreenX(player.lane, 1);
  const y = PLAYER_Y - player.jumpY;
  const bodyH = player.sliding ? 40 : 70;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#3b455e";
  ctx.beginPath();
  ctx.ellipse(0, -bodyH - 14, 36, 31, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#7e8aa8";
  ctx.lineWidth = 2;
  for (let i = -20; i <= 20; i += 10) {
    ctx.beginPath();
    ctx.moveTo(i, -bodyH - 30);
    ctx.lineTo(i + 5, -bodyH - 4);
    ctx.stroke();
  }

  ctx.fillStyle = "#11141c";
  ctx.fillRect(-20, -bodyH - 24, 40, 11);
  ctx.fillStyle = "#55b6da";
  ctx.fillRect(-17, -bodyH - 22, 14, 7);
  ctx.fillRect(3, -bodyH - 22, 14, 7);

  ctx.fillStyle = "#df6b38";
  ctx.beginPath();
  ctx.arc(0, -bodyH - 7, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#28354a";
  ctx.fillRect(-16, -bodyH, 32, bodyH);

  ctx.fillStyle = "#161b28";
  ctx.fillRect(-15, 0, 10, 18);
  ctx.fillRect(5, 0, 10, 18);

  ctx.strokeStyle = "#5e6a84";
  ctx.strokeRect(-16, -bodyH, 32, bodyH);
  ctx.restore();
}

function drawObstacle(obstacle) {
  const t = 1 - obstacle.z / MAX_DEPTH;
  const x = laneScreenX(obstacle.lane, t);
  const y = HORIZON_Y + t * t * (PLAYER_Y - HORIZON_Y) + 6;
  const scale = 0.26 + t * 0.95;

  if (obstacle.type === "low") {
    ctx.fillStyle = "#b3513f";
    ctx.fillRect(x - 25 * scale, y - 42 * scale, 50 * scale, 42 * scale);
    ctx.fillStyle = "#61312a";
    ctx.fillRect(x - 25 * scale, y - 42 * scale, 50 * scale, 8 * scale);
  } else {
    ctx.fillStyle = "#7d468d";
    ctx.fillRect(x - 47 * scale, y - 108 * scale, 94 * scale, 18 * scale);
    ctx.fillStyle = "#4f2a59";
    ctx.fillRect(x - 50 * scale, y - 106 * scale, 6 * scale, 100 * scale);
    ctx.fillRect(x + 44 * scale, y - 106 * scale, 6 * scale, 100 * scale);
  }
}

function drawPickup(pickup) {
  const t = 1 - pickup.z / MAX_DEPTH;
  const x = laneScreenX(pickup.lane, t);
  const y = HORIZON_Y + t * t * (PLAYER_Y - HORIZON_Y) - 14;
  const s = 6 + t * 10;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#4ca5c4";
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1e3b49";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

let lastTs = 0;
function frame(ts) {
  const dt = Math.min((ts - lastTs) / 1000 || 0, 0.033);
  lastTs = ts;

  update(dt);
  drawRoad();
  game.pickups.forEach(drawPickup);
  game.obstacles.forEach(drawObstacle);
  drawBrainBrat();

  requestAnimationFrame(frame);
}

function startOrRestart() {
  resetRun();
  overlayTitle.textContent = "Night Shift Run";
  overlaySubtitle.textContent = "Stay alive. Switch lanes, jump low barriers, slide under gates.";
  startBtn.textContent = "Start Game";
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "enter" && !game.running) {
    startOrRestart();
    return;
  }

  if (key === "a" || key === "arrowleft") {
    moveLane(-1);
  } else if (key === "d" || key === "arrowright") {
    moveLane(1);
  } else if (key === "w" || key === "arrowup" || key === " ") {
    jump();
  } else if (key === "s" || key === "arrowdown") {
    slide();
  }
});

touchButtons.forEach((button) => {
  const trigger = () => {
    const action = button.dataset.action;
    if (!game.running) {
      startOrRestart();
    }
    if (action === "left") {
      moveLane(-1);
    } else if (action === "right") {
      moveLane(1);
    } else if (action === "jump") {
      jump();
    } else if (action === "slide") {
      slide();
    }
  };

  button.addEventListener("pointerdown", trigger);
});

startBtn.addEventListener("click", () => {
  startOrRestart();
});

requestAnimationFrame(frame);
