import { useState, type ChangeEvent } from "react";
import { CryptoService } from "../../services/CryptoService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Selector } from "../Selector";
import { withTimestamp } from "@/lib/utils";

export const EncryptDecrypt = () => {
  const service = new CryptoService();

  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [algorithm, setAlgorithm] = useState<"AES-GCM" | "RSA-OAEP">("AES-GCM");

  /* ---------- Encrypt state ---------- */
  const [fileToEncrypt, setFileToEncrypt] = useState<File | null>(null);
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [exportedAESKey, setExportedAESKey] = useState<string>("");
  const [exportedRSAPub, setExportedRSAPub] = useState<string>("");
  const [exportedRSAPriv, setExportedRSAPriv] = useState<string>("");

  /* ---------- Decrypt state ---------- */
  const [fileToDecrypt, setFileToDecrypt] = useState<File | null>(null);
  const [keyInput, setKeyInput] = useState<string>("");
  const [keyFile, setKeyFile] = useState<File | null>(null);

  /* ---------- Loading state ---------- */
  const [loading, setLoading] = useState(false);

  /* ---------- Handlers ---------- */
  const onEncryptFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileToEncrypt(withTimestamp(e.target.files[0]));
    }
  };

  const onDecryptFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileToDecrypt(e.target.files[0]);
  };

  const onKeyFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setKeyFile(e.target.files[0]);
  };

  /* ---------- Encryption ---------- */
  const encrypt = async () => {
    try {
      if (!fileToEncrypt) return;

      setLoading(true);

      const data = await service.readFileAsArrayBuffer(fileToEncrypt);

      if (algorithm === "AES-GCM") {
        const aesKey = await service.generateAESKey();
        const { iv, ciphertext } = await service.aesEncrypt(aesKey, data);

        const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.byteLength);

        setEncryptedBlob(
          service.arrayBufferToBlob(combined.buffer, "application/octet-stream")
        );

        setExportedAESKey(await service.exportAESKeyJWK(aesKey));
        setExportedRSAPub("");
        setExportedRSAPriv("");
      } else {
        const { publicKey, privateKey } = await service.generateRSAKeyPair();
        const hybrid = await service.hybridEncrypt(publicKey, data);

        setEncryptedBlob(
          service.arrayBufferToBlob(hybrid.buffer, "application/octet-stream")
        );

        setExportedRSAPub(await service.exportRSAKey(publicKey));
        setExportedRSAPriv(await service.exportRSAKey(privateKey));
        setExportedAESKey("");
      }

      alert(
        "Encryption successful! You can now download the result and key(s)."
      );
    } catch (err) {
      console.error(err);

      alert(
        `Encryption failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadEncrypted = () => {
    if (encryptedBlob) {
      service.downloadBlob(encryptedBlob, `${fileToEncrypt!.name}.enc`);
    }
  };

  const downloadKey = (json: string, filename: string) => {
    service.downloadBlob(
      new Blob([json], { type: "application/json" }),
      filename
    );
  };

  /* ---------- Decryption ---------- */
  const decrypt = async () => {
    try {
      if (!fileToDecrypt) return;

      setLoading(true);

      const payload = await service.readFileAsArrayBuffer(fileToDecrypt);

      let keyJson = keyInput;

      if (!keyJson && keyFile) {
        keyJson = new TextDecoder().decode(
          await service.readFileAsArrayBuffer(keyFile)
        );
      }

      if (!keyJson) return;

      let plaintext: ArrayBuffer;

      if (algorithm === "AES-GCM") {
        const aesKey = await service.importAESKeyJWK(keyJson);

        const u8 = new Uint8Array(payload);
        const iv = u8.slice(0, 12);
        const ciphertext = u8.slice(12).buffer;

        plaintext = await service.aesDecrypt(aesKey, iv, ciphertext);
      } else {
        const rsaPriv = await service.importRSAPrivateKey(keyJson);
        plaintext = await service.hybridDecrypt(rsaPriv, payload);
      }

      const originalName = fileToDecrypt.name.replace(/\.enc$/, "");

      service.downloadBlob(
        service.arrayBufferToBlob(plaintext, "application/octet-stream"),
        originalName || "decrypted"
      );

      alert("Decryption successful! The file has been downloaded.");
    } catch (err) {
      console.error(err);

      alert(
        `Decryption failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <Card className="max-w-3xl mx-auto mt-10 font-geist">
      <CardHeader>
        <CardTitle className="font-inter font-extrabold text-xl">
          Secure Your Files with Ease
        </CardTitle>

        <CardDescription className="text-base">
          Protect your files with advanced encryption technology. Select a file
          to get started
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
            <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
          </TabsList>

          {/* ---------------- Encrypt ---------------- */}
          <TabsContent value="encrypt" className="space-y-4">
            <Selector algorithm={algorithm} setAlgorithm={setAlgorithm} />

            <div>
              <Label htmlFor="enc-file" className="mb-3">
                File to Encrypt
              </Label>

              <Input
                id="enc-file"
                type="file"
                onChange={onEncryptFileChange}
                multiple={false}
              />

              <span className="text-neutral-600 text-sm">
                Please upload a single file. It is recommended to use small
                files.
              </span>
            </div>

            <Button disabled={!fileToEncrypt} onClick={encrypt}>
              {loading ? "Encrypting..." : "Encrypt File"}
            </Button>

            {encryptedBlob && (
              <div className="space-y-2">
                <Button onClick={downloadEncrypted}>
                  Download Encrypted File
                </Button>

                {algorithm === "AES-GCM" && (
                  <Button
                    onClick={() =>
                      downloadKey(
                        exportedAESKey,
                        `${fileToEncrypt!.name}.aes_key.json`
                      )
                    }
                  >
                    Download AES Key
                  </Button>
                )}

                {algorithm === "RSA-OAEP" && (
                  <>
                    <Button
                      onClick={() =>
                        downloadKey(
                          exportedRSAPub,
                          `${fileToEncrypt!.name}.rsa_pub.json`
                        )
                      }
                    >
                      Download RSA Public Key
                    </Button>

                    <Button
                      onClick={() =>
                        downloadKey(
                          exportedRSAPriv,
                          `${fileToEncrypt!.name}.rsa_priv.json`
                        )
                      }
                    >
                      Download RSA Private Key
                    </Button>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* ---------------- Decrypt ---------------- */}
          <TabsContent value="decrypt" className="space-y-4">
            <Selector algorithm={algorithm} setAlgorithm={setAlgorithm} />

            <div>
              <Label htmlFor="dec-file" className="mb-3">
                Encrypted File
              </Label>

              <Input
                id="dec-file"
                type="file"
                onChange={onDecryptFileChange}
                multiple={false}
              />
            </div>

            <div>
              <Label htmlFor="key-paste" className="mb-3">
                Paste Key (JWK JSON)
              </Label>

              <Textarea
                id="key-paste"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                rows={4}
                placeholder='{ "kty": ... } or upload file below'
              />

              <span className="text-neutral-600 text-sm">
                Please paste the contents of the file with the{" "}
                {algorithm === "RSA-OAEP" ? (
                  <code>rsa_priv.json</code>
                ) : (
                  <code>aes_key.json</code>
                )}{" "}
                ending
              </span>
            </div>

            <div>
              <Label htmlFor="key-file" className="mb-3">
                Or Upload Key File
              </Label>

              <Input
                id="key-file"
                type="file"
                accept="application/json"
                onChange={onKeyFileChange}
                multiple={false}
              />

              <span className="text-neutral-600 text-sm">
                Please upload the private key with the{" "}
                {algorithm === "RSA-OAEP" ? (
                  <code>rsa_priv.json</code>
                ) : (
                  <code>aes_key.json</code>
                )}{" "}
                ending
              </span>
            </div>

            <Button
              disabled={!fileToDecrypt || (!keyInput && !keyFile) || loading}
              onClick={decrypt}
            >
              {loading ? "Decrypting..." : "Decrypt File"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
