export class CryptoService {
  private subtle: SubtleCrypto;

  constructor() {
    this.subtle = window.crypto.subtle;
  }

  /* ---------- AES helpers ---------- */
  async generateAESKey(): Promise<CryptoKey> {
    return this.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  async exportAESKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
    return this.subtle.exportKey("raw", key);
  }

  async importAESKeyRaw(raw: ArrayBuffer): Promise<CryptoKey> {
    return this.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  async exportAESKeyJWK(key: CryptoKey): Promise<string> {
    const jwk = await this.subtle.exportKey("jwk", key);
    return JSON.stringify(jwk);
  }

  async importAESKeyJWK(jwkJson: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkJson);
    return this.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  async aesEncrypt(
    key: CryptoKey,
    data: ArrayBuffer
  ): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await this.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return { iv, ciphertext };
  }

  async aesDecrypt(
    key: CryptoKey,
    iv: Uint8Array,
    ciphertext: ArrayBuffer
  ): Promise<ArrayBuffer> {
    return this.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  }

  /* ---------- RSA helpers ---------- */
  async generateRSAKeyPair(): Promise<CryptoKeyPair> {
    return this.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async exportRSAKey(key: CryptoKey): Promise<string> {
    const jwk = await this.subtle.exportKey("jwk", key);
    return JSON.stringify(jwk);
  }

  async importRSAPublicKey(jwkJson: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkJson);
    return this.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
  }

  async importRSAPrivateKey(jwkJson: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkJson);
    return this.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  }

  async rsaEncrypt(
    publicKey: CryptoKey,
    data: ArrayBuffer
  ): Promise<ArrayBuffer> {
    return this.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data);
  }

  async rsaDecrypt(
    privateKey: CryptoKey,
    ciphertext: ArrayBuffer
  ): Promise<ArrayBuffer> {
    return this.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, ciphertext);
  }

  /* ---------- Hybrid RSA‑AES ---------- */
  async hybridEncrypt(
    publicKey: CryptoKey,
    data: ArrayBuffer
  ): Promise<Uint8Array> {
    //fresh AES key
    const aesKey = await this.generateAESKey();
    const rawAesKey = await this.exportAESKeyRaw(aesKey);

    //encrypt the file with AES-GCM
    const { iv, ciphertext } = await this.aesEncrypt(aesKey, data);

    //encrypt the raw AES key with RSA‑OAEP
    const encryptedKey = await this.rsaEncrypt(publicKey, rawAesKey);
    const encKeyU8 = new Uint8Array(encryptedKey);

    //build output buffer
    const keyLen = encKeyU8.byteLength;
    const header = new Uint8Array(4);
    new DataView(header.buffer).setUint32(0, keyLen, false);

    const combined = new Uint8Array(4 + keyLen + 12 + ciphertext.byteLength);
    combined.set(header, 0);
    combined.set(encKeyU8, 4);
    combined.set(iv, 4 + keyLen);
    combined.set(new Uint8Array(ciphertext), 4 + keyLen + 12);

    return combined;
  }

  async hybridDecrypt(
    privateKey: CryptoKey,
    payload: ArrayBuffer
  ): Promise<ArrayBuffer> {
    const u8 = new Uint8Array(payload);
    const keyLen = new DataView(u8.buffer).getUint32(0, false);

    const encKey = u8.slice(4, 4 + keyLen);
    const iv = u8.slice(4 + keyLen, 4 + keyLen + 12);
    const ciphertext = u8.slice(4 + keyLen + 12).buffer;

    // decrypt AES key
    const rawAesKey = await this.rsaDecrypt(privateKey, encKey.buffer);
    const aesKey = await this.importAESKeyRaw(rawAesKey);

    // decrypt payload
    return this.aesDecrypt(aesKey, iv, ciphertext);
  }

  /* ----------  helpers ---------- */
  readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);

      reader.readAsArrayBuffer(file);
    });
  }

  arrayBufferToBlob(buf: ArrayBuffer, mime: string): Blob {
    return new Blob([buf], { type: mime });
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }
}
