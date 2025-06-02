# File Encryptor / Decryptor

A small **React + TypeScript** web app that encrypts or decrypts any file entirely in the browser using the **Web Crypto API**.

---

## What it does

| Action  | Details                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| Encrypt | Choose **AES‑GCM** (symmetric) or **Hybrid RSA‑OAEP + AES** (asymmetric) and download ciphertext + key(s). |
| Decrypt | Re‑upload the `.enc` file and paste or upload the saved key JSON to restore the original file.             |
| Privacy | All cryptography runs locally—no file ever leaves the browser.                                             |

---

## Project layout

```text
src/
 ├─ services/      # CryptoService.ts    – encryption logic
 ├─ components/    # EncryptDecrypt.tsx  – main UI
 ├─ App.tsx
 └─ main.tsx
index.css
```

---

## 🚀 Setup

```bash
# clone & install
git clone <repo-url>
cd file-encryptor
npm install   # or pnpm / yarn

# start dev server
npm run dev   # open http://localhost:5173
```

Then go to [http://localhost:5173](http://localhost:5173/)

---

## 🔐 Quick usage

### Encrypt

1. Pick **AES‑GCM** or **RSA‑OAEP**.
2. Select a file.
3. Click **Encrypt File**.
4. Download:

   - `file.ext.enc` – ciphertext
   - Key JSON:

     - AES → one `.aes_key.json`
     - RSA → `.rsa_pub.json` & `.rsa_priv.json`

### Decrypt

1. Choose the same algorithm.
2. Upload the `.enc` file.
3. Paste or upload the key JSON.
4. Click **Decrypt File** to retrieve the original.

---

## 🧠 How it works (30 sec)

| Step | AES‑GCM                    | Hybrid RSA‑OAEP + AES                          |
| ---- | -------------------------- | ---------------------------------------------- |
| 1    | Generate 256‑bit AES key   | Generate RSA‑2048 keys + 256‑bit AES key       |
| 2    | Encrypt file with AES‑GCM  | Encrypt file with AES‑GCM                      |
| 3    | Export key as JWK JSON     | Encrypt AES key with RSA‑OAEP (public key)     |
| 4    | Download `.enc` + key JSON | Bundle and download `.enc` + pub/priv key JSON |

---

## 📋 Notes

- Works in any modern browser that supports the Web Crypto API.
- Keep your key files safe, without them decryption is impossible.

---

**Author:** Muhammad Saleh, Subgroup 02
