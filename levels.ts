import { LevelData, Obstacle, ToolType } from './types';

declare const CryptoJS: any;

let decryptedFunction: Function | null = null;

export const getLevel = (index: number, width: number, height: number): LevelData => {
  const payload = (window as any).__BALLINIUM_ENCRYPTED_LEVELS__;

  if (!payload) {
    return createEmptyFallback(index, width, height);
  }

  if (!decryptedFunction) {
    try {
      const keyStr = "PRIMEDEV_SECURE_KEYS_2026_AES!!!";
      const ivStr = "AES_SECURE_IV_12";

      const key = CryptoJS.enc.Utf8.parse(keyStr);
      const iv = CryptoJS.enc.Utf8.parse(ivStr);

      const decrypted = CryptoJS.AES.decrypt(payload, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const codeString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!codeString) {
        throw new Error("Decrypted string is empty. Invalid key or corrupted payload.");
      }

      // Compile the decrypted string back into a functional closure
      decryptedFunction = new Function('index', 'width', 'height', codeString);

    } catch (e) {
      return createEmptyFallback(index, width, height);
    }
  }

  return decryptedFunction(index, width, height);
};

const createEmptyFallback = (index: number, width: number, height: number): LevelData => {
  return {
    id: index,
    name: "CONNECTION ERRROR",
    description: "Failed to establish secure link to level data.",
    obstacles: [],
    spawnPos: { x: 100, y: 100 },
    spawnVelocity: { x: 0, y: 0 },
    target: { x: width - 100, y: height - 100, width: 100, height: 100, active: true },
    inventory: { REFLECTOR: 0, ACCELERATOR: 0, GRAVITY_WELL: 0 }
  };
};
