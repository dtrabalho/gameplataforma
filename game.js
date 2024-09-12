const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 320;
canvas.height = 160;

const player = {
  x: 50,
  y: canvas.height / 2 - 8,
  width: 16,
  height: 16,
  speed: 2,
  color: '#F28705',
};

const npc = {
  x: canvas.width - 80,
  y: canvas.height / 2 - 8,
  width: 16,
  height: 16,
  color: '#A62103',
  dialog: "You take my love away",
  showDialog: false,
  isFleeing: false,
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  action: false,
};

let inCutscene = true;
let dialogVisible = false;
let npcEscaped = false;
let playerNearDoor = false;
let currentRoom = 'corridor'; // Controle da sala atual

const doorWidth = 15;
const doorHeight = 25;
const doorWidthRoom2 = 43;
const doorHeightRoom2 = 8;

const rooms = {
  corridor: {
    doors: [
      { x: canvas.width - doorWidth, y: canvas.height / 2 - doorHeight / 2, width: doorWidth, height: doorHeight, color: '#A62103', leadsTo: 'room2' }, // Porta na borda direita
    ],
  },
  room2: {
    doors: [
      { x: canvas.width / 2 - doorWidthRoom2 / 2, y: canvas.height - doorHeightRoom2, width: doorWidthRoom2, height: doorHeightRoom2, color: '#A62103', leadsTo: 'corridor' }, // Porta na borda inferior
    ],
  },
};

const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');
const actionButton = document.getElementById('actionButton');
const toggleJoystick = document.getElementById('toggleJoystick');

let joystickEnabled = true; // Variável para controlar o estado do joystick

let joystickCenterX = joystick.offsetWidth / 2;
let joystickCenterY = joystick.offsetHeight / 2;
let joystickRadius = joystick.offsetWidth / 2;

let joystickKnobOffsetX = 0;
let joystickKnobOffsetY = 0;

joystick.addEventListener('touchstart', e => {
  if (!joystickEnabled) return;
  const touch = e.touches[0];
  joystickKnobOffsetX = touch.clientX - joystick.getBoundingClientRect().left - joystickCenterX;
  joystickKnobOffsetY = touch.clientY - joystick.getBoundingClientRect().top - joystickCenterY;
  updateJoystick(touch.clientX, touch.clientY);
});

joystick.addEventListener('touchmove', e => {
  if (!joystickEnabled) return;
  const touch = e.touches[0];
  updateJoystick(touch.clientX, touch.clientY);
});

joystick.addEventListener('touchend', () => {
  if (!joystickEnabled) return;
  joystickKnob.style.left = `${joystickCenterX}px`;
  joystickKnob.style.top = `${joystickCenterY}px`;
  keys.left = false;
  keys.right = false;
  keys.up = false;
  keys.down = false;
});

function updateJoystick(touchX, touchY) {
  if (!joystickEnabled) return;
  let deltaX = touchX - joystick.getBoundingClientRect().left - joystickCenterX;
  let deltaY = touchY - joystick.getBoundingClientRect().top - joystickCenterY;
  let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > joystickRadius) {
    deltaX = (deltaX / distance) * joystickRadius;
    deltaY = (deltaY / distance) * joystickRadius;
  }

  joystickKnob.style.left = `${joystickCenterX + deltaX}px`;
  joystickKnob.style.top = `${joystickCenterY + deltaY}px`;

  keys.left = deltaX < -10;
  keys.right = deltaX > 10;
  keys.up = deltaY < -10;
  keys.down = deltaY > 10;
}

actionButton.addEventListener('touchstart', () => {
  keys.action = true;
});

actionButton.addEventListener('touchend', () => {
  keys.action = false;
});

toggleJoystick.addEventListener('click', () => {
  joystickEnabled = !joystickEnabled;
  joystick.style.display = joystickEnabled ? 'block' : 'none';
  toggleJoystick.textContent = joystickEnabled ? 'Desativar Joystick' : 'Ativar Joystick';
});

document.addEventListener('keydown', (e) => {
  if (joystickEnabled) return; // Se o joystick estiver ativado, ignorar as teclas do teclado
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      keys.up = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = true;
      break;
    case 'Enter':
      keys.action = true;
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      keys.up = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = false;
      break;
    case 'Enter':
      keys.action = false;
      break;
  }
});

function startCutscene() {
  let playerMoveInterval = setInterval(() => {
    player.x += 1;
    if (player.x + player.width >= npc.x - 40) {
      clearInterval(playerMoveInterval);
      dialogVisible = true;
      setTimeout(() => {
        npc.isFleeing = true;
      }, 1000);
    }
  }, 30);
}

function npcFlee() {
  if (npc.isFleeing) {
    npc.x += 3;
    if (npc.x + npc.width > rooms[currentRoom].doors[0].x && !npcEscaped) {
      npcEscaped = true;
      npc.isFleeing = false;
      inCutscene = false;
      dialogVisible = false;
    }
  }
}

function checkPlayerDoorCollision() {
  rooms[currentRoom].doors.forEach(door => {
    if (
      player.x + player.width > door.x &&
      player.x < door.x + door.width &&
      player.y + player.height > door.y &&
      player.y < door.y + door.height
    ) {
      playerNearDoor = true;
      if (joystickEnabled ? keys.action : keys.action) { // O botão de ação funciona para joystick ou teclado
        currentRoom = door.leadsTo;
        player.x = 50;
        player.y = canvas.height / 2 - player.height / 2;
        keys.action = false;
      }
    } else {
      playerNearDoor = false;
    }
  });
}

function updatePlayer() {
  if (joystickEnabled) {
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    if (keys.up) player.y -= player.speed;
    if (keys.down) player.y += player.speed;
  } else {
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    if (keys.up) player.y -= player.speed;
    if (keys.down) player.y += player.speed;
  }

  // Limitar o movimento do jogador às bordas do canvas
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  checkPlayerDoorCollision();
}

function drawRoom() {
  const room = rooms[currentRoom];
  room.doors.forEach(door => {
    ctx.fillStyle = door.color;
    ctx.fillRect(door.x, door.y, door.width, door.height);
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawNPC() {
  ctx.fillStyle = npc.color;
  ctx.fillRect(npc.x, npc.y, npc.width, npc.height);

  if (dialogVisible) {
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText(npc.dialog, npc.x - 30, npc.y - 10);
  }
}

function drawTransitionMessage() {
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Pressione o botão de ação para entrar', canvas.width / 2, 20);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoom();

  if (inCutscene) {
    drawPlayer();
    drawNPC();
    npcFlee();
  } else {
    updatePlayer();
    drawPlayer();
    drawTransitionMessage();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
startCutscene();
