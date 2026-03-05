const crypto = require('crypto');
const fs = require('fs');

const generateLevelCode = `
  const levelNum = index + 1;
  const obstacles = [];
  const cx = width / 2;
  const cy = height / 2;

  const wallColor = '#222';
  const hazardColor = '#ff0055';
  const accentColor = '#334455';

  const inventory = {
    REFLECTOR: 10, ACCELERATOR: 0, GRAVITY_WELL: 0
  };

  let spawnPos = { x: 100, y: 100 };
  let spawnVelocity = { x: 0, y: 0 };
  let target = { x: width - 100, y: height - 100, width: 100, height: 100, active: true };
  let name = "SECTOR " + levelNum;
  let description = "Objective: Guide the payload.";

  const addWall = (x, y, w, h, angle = 0, color = wallColor) => {
    obstacles.push({
      id: "w-" + obstacles.length,
      type: 'rect',
      x: x, y: y, width: w, height: h, angle: angle, angularVelocity: 0, color: color
    });
  };

  switch (index) {
    case 0:
      name = "INITIATION";
      description = "Use Reflectors to bridge the gap.";
      inventory.REFLECTOR = 10;
      spawnPos = { x: width * 0.1, y: height * 0.3 };
      target = { x: width * 0.9, y: height * 0.4, width: 100, height: 20, active: true };
      addWall(width * 0.15, height * 0.5, width * 0.3, 20);
      addWall(width * 0.85, height * 0.5, width * 0.3, 20);
      break;
    case 1:
      name = "THE BARRIER";
      description = "Trajectory obstructed. Vertical bounce required.";
      inventory.REFLECTOR = 10;
      spawnPos = { x: width * 0.1, y: height * 0.5 };
      target = { x: width * 0.9, y: height * 0.5, width: 80, height: 20, active: true };
      addWall(width * 0.5, height * 0.5, 40, height * 0.6);
      break;
    case 2:
      name = "VELOCITY";
      description = "Insufficient energy. Acceleration required.";
      inventory.ACCELERATOR = 2;
      inventory.REFLECTOR = 5;
      spawnPos = { x: width * 0.1, y: height * 0.7 };
      target = { x: width * 0.9, y: height * 0.2, width: 100, height: 100, active: true };
      addWall(width * 0.3, height * 0.6, 200, 20, -0.3);
      addWall(width * 0.6, height * 0.4, 200, 20, -0.3);
      addWall(width * 0.5, height * 0.1, width, 20);
      break;
    case 3:
      name = "ORBITAL";
      description = "Linear path blocked. Use Gravity Wells to curve.";
      inventory.GRAVITY_WELL = 3;
      inventory.REFLECTOR = 5;
      spawnPos = { x: width * 0.1, y: cy };
      spawnVelocity = { x: 300, y: 0 };
      target = { x: width * 0.9, y: cy + 200, width: 80, height: 80, active: true };
      addWall(cx, cy, 40, height * 0.5, 0, hazardColor);
      break;
    case 4:
      name = "THE CHIMNEY";
      description = "Precision vertical injection.";
      inventory.ACCELERATOR = 2;
      inventory.REFLECTOR = 10;
      spawnPos = { x: width * 0.1, y: height * 0.4 };
      target = { x: width * 0.8, y: height * 0.15, width: 80, height: 20, active: true };
      addWall(width * 0.75, height * 0.175, 20, height * 0.35);
      addWall(width * 0.85, height * 0.175, 20, height * 0.35);
      break;
    case 5:
      name = "CONTAINMENT";
      description = "Target is shielded. Bank shot required.";
      inventory.REFLECTOR = 10;
      spawnPos = { x: width * 0.1, y: height * 0.4 };
      target = { x: width * 0.8, y: height * 0.6, width: 60, height: 60, active: true };
      const boxX = width * 0.8;
      const boxY = height * 0.6;
      addWall(boxX - 50, boxY, 20, 100);
      addWall(boxX + 50, boxY, 20, 100);
      addWall(boxX, boxY + 50, 120, 20);
      addWall(width * 0.5, height * 0.2, 400, 20);
      break;
    case 6:
      name = "SLALOM";
      description = "Navigate the obstacles.";
      inventory.REFLECTOR = 8;
      inventory.ACCELERATOR = 1;
      spawnPos = { x: width * 0.1, y: height * 0.1 };
      target = { x: width * 0.9, y: height * 0.9, width: 80, height: 80, active: true };
      addWall(width * 0.3, 0, 20, height * 1.2, 0, accentColor);
      addWall(width * 0.6, height, 20, height * 1.2, 0, accentColor);
      break;
    case 7:
      name = "THE GRINDER";
      description = "Timing is everything.";
      inventory.REFLECTOR = 5;
      inventory.ACCELERATOR = 3;
      spawnPos = { x: 100, y: cy };
      target = { x: width - 100, y: cy, width: 100, height: 100, active: true };
      obstacles.push({ id: 'r1', type: 'rotating-line', x: cx - 150, y: cy, width: 250, height: 20, angle: 0, angularVelocity: 1.5, color: hazardColor });
      obstacles.push({ id: 'r2', type: 'rotating-line', x: cx + 150, y: cy, width: 250, height: 20, angle: Math.PI / 2, angularVelocity: -1.5, color: hazardColor });
      break;
    case 8:
      name = "RICOCHET";
      description = "Geometric precision.";
      inventory.REFLECTOR = 15;
      spawnPos = { x: width * 0.1, y: height * 0.1 };
      spawnVelocity = { x: 200, y: 200 };
      target = { x: width * 0.5, y: height * 0.9, width: 100, height: 20, active: true };
      addWall(width * 0.2, height * 0.5, 400, 20, Math.PI / 4);
      addWall(width * 0.8, height * 0.5, 400, 20, -Math.PI / 4);
      addWall(width * 0.5, height * 0.6, 100, 20, 0, hazardColor);
      break;
    case 9:
      name = "THREAD THE NEEDLE";
      description = "Tiny margins. Steady hand.";
      inventory.ACCELERATOR = 3;
      inventory.REFLECTOR = 10;
      spawnPos = { x: 100, y: cy };
      target = { x: width - 100, y: cy, width: 50, height: 50, active: true };
      addWall(width * 0.4, cy - 200, 20, 400);
      addWall(width * 0.4, cy + 200, 20, 400);
      addWall(width * 0.7, cy - 200, 20, 400);
      addWall(width * 0.7, cy + 200, 20, 400);
      break;
    case 10:
      name = "BOOMERANG";
      description = "Round trip.";
      inventory.REFLECTOR = 5;
      inventory.GRAVITY_WELL = 1;
      spawnPos = { x: 100, y: height * 0.3 };
      target = { x: 100, y: height * 0.7, width: 80, height: 80, active: true };
      addWall(width * 0.3, height * 0.5, width * 0.6, 20);
      addWall(width * 0.9, height * 0.5, 20, height * 0.8, 0, accentColor);
      break;
    case 11:
      name = "ENTROPY";
      description = "Order from chaos.";
      inventory.REFLECTOR = 10;
      inventory.ACCELERATOR = 5;
      inventory.GRAVITY_WELL = 5;
      spawnPos = { x: cx, y: 100 };
      target = { x: cx, y: height - 100, width: 100, height: 50, active: true };
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          obstacles.push({
            id: "e-" + row + "-" + col,
            type: 'rotating-line',
            x: width * 0.2 + (col * (width * 0.15)),
            y: height * 0.3 + (row * (height * 0.1)),
            width: 60,
            height: 10,
            angle: Math.random() * Math.PI,
            angularVelocity: (Math.random() - 0.5) * 2,
            color: hazardColor
          });
        }
      }
      break;
    default:
      name = "DEEP SPACE " + (index - 11);
      description = "Uncharted territory.";
      inventory.REFLECTOR = 10;
      inventory.ACCELERATOR = 2 + Math.floor(index / 5);
      inventory.GRAVITY_WELL = 1 + Math.floor(index / 10);
      spawnPos = { x: 100, y: 100 };
      target = { x: width - 100, y: height - 100, width: 100, height: 100, active: true };
      const complexity = Math.min((index - 10) * 2, 20);
      for (let i = 0; i < complexity; i++) {
        obstacles.push({
          id: "proc-" + i,
          type: Math.random() > 0.8 ? 'rotating-line' : 'rect',
          x: Math.random() * width,
          y: Math.random() * height,
          width: 50 + Math.random() * 200,
          height: 20,
          angle: Math.random() * Math.PI,
          angularVelocity: Math.random() > 0.8 ? (Math.random() - 0.5) * 2 : 0,
          color: Math.random() > 0.9 ? hazardColor : wallColor
        });
      }
      break;
  }

  return { id: index, name: name, description: description, obstacles: obstacles, spawnPos: spawnPos, spawnVelocity: spawnVelocity, target: target, inventory: inventory };
`;

// Simple AES-CBC mode compatible with crypto-js standard out-of-the-box settings!
const keyStr = "PRIMEDEV_SECURE_KEYS_2026_AES!!!"; // 32 bytes
const ivStr = "AES_SECURE_IV_12"; // 16 bytes

const key = Buffer.from(keyStr, "utf8");
const iv = Buffer.from(ivStr, "utf8");

const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
let encrypted = cipher.update(generateLevelCode, 'utf8', 'base64');
encrypted += cipher.final('base64');

fs.writeFileSync('payload_cbc.txt', encrypted);
