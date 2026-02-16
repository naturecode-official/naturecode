import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const STORE_DIR = path.join(os.homedir(), ".naturecode", "secure");
const MASTER_KEY_FILE = path.join(STORE_DIR, ".master.key");
const ENCRYPTED_FILE = path.join(STORE_DIR, "data.enc");

class SecureStore {
  constructor() {
    this._ensureStoreDir();
    this._loadOrCreateMasterKey();
  }

  _ensureStoreDir() {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
      fs.chmodSync(STORE_DIR, 0o700);
    }
  }

  _loadOrCreateMasterKey() {
    if (!fs.existsSync(MASTER_KEY_FILE)) {
      // Generate a new master key
      this.masterKey = crypto.randomBytes(32); // 256-bit key
      fs.writeFileSync(MASTER_KEY_FILE, this.masterKey.toString("hex"), "utf8");
      fs.chmodSync(MASTER_KEY_FILE, 0o600);
    } else {
      const keyHex = fs.readFileSync(MASTER_KEY_FILE, "utf8").trim();
      this.masterKey = Buffer.from(keyHex, "hex");
    }
  }

  _encryptData(data) {
    const algorithm = "aes-256-gcm";
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, this.masterKey, iv);

    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      data: encrypted,
      authTag: authTag.toString("hex"),
      timestamp: new Date().toISOString(),
    };
  }

  _decryptData(encryptedData) {
    try {
      const algorithm = "aes-256-gcm";
      const decipher = crypto.createDecipheriv(
        algorithm,
        this.masterKey,
        Buffer.from(encryptedData.iv, "hex"),
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

      let decrypted = decipher.update(encryptedData.data, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error.message);
      return { keys: [] };
    }
  }

  _loadEncryptedData() {
    if (!fs.existsSync(ENCRYPTED_FILE)) {
      return { keys: [] };
    }

    try {
      const encrypted = JSON.parse(fs.readFileSync(ENCRYPTED_FILE, "utf8"));
      return this._decryptData(encrypted);
    } catch (error) {
      console.error("Failed to load encrypted data:", error.message);
      return { keys: [] };
    }
  }

  _saveEncryptedData(data) {
    const encrypted = this._encryptData(data);
    fs.writeFileSync(
      ENCRYPTED_FILE,
      JSON.stringify(encrypted, null, 2),
      "utf8",
    );
    fs.chmodSync(ENCRYPTED_FILE, 0o600);
  }

  saveApiKey(provider, keyId, apiKey, metadata = {}) {
    const data = this._loadEncryptedData();
    if (!data.keys) data.keys = [];

    // Remove existing key for this provider and keyId
    data.keys = data.keys.filter(
      (k) => !(k.provider === provider && k.keyId === keyId),
    );

    // Add new key with metadata
    data.keys.push({
      provider,
      keyId,
      apiKey,
      metadata: {
        name: metadata.name || `${provider}-${keyId}`,
        model: metadata.model || "default",
        modelType: metadata.modelType || "text",
        ...metadata,
      },
      createdAt: new Date().toISOString(),
      lastUsed: null,
    });

    this._saveEncryptedData(data);
    return true;
  }

  getApiKey(provider, keyId) {
    const data = this._loadEncryptedData();
    const key = data.keys.find(
      (k) => k.provider === provider && k.keyId === keyId,
    );

    if (key) {
      // Update last used timestamp
      key.lastUsed = new Date().toISOString();
      this._saveEncryptedData(data);
      return {
        key: key.apiKey,
        metadata: key.metadata || {},
      };
    }

    return null;
  }

  listApiKeys() {
    const data = this._loadEncryptedData();
    const result = {};

    data.keys.forEach((key) => {
      if (!result[key.provider]) {
        result[key.provider] = {};
      }
      result[key.provider][key.keyId] = {
        key: key.apiKey,
        metadata: key.metadata || {},
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
      };
    });

    return result;
  }

  deleteApiKey(provider, keyId) {
    const data = this._loadEncryptedData();
    if (!data.keys) data.keys = [];
    const initialLength = data.keys.length;

    data.keys = data.keys.filter(
      (k) => !(k.provider === provider && k.keyId === keyId),
    );

    if (data.keys.length < initialLength) {
      this._saveEncryptedData(data);
      return true;
    }

    return false;
  }

  clearAll() {
    if (fs.existsSync(ENCRYPTED_FILE)) {
      fs.unlinkSync(ENCRYPTED_FILE);
    }
    return true;
  }
}

export const secureStore = new SecureStore();
