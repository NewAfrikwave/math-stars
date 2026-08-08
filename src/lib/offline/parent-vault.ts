import { loadSnapshot, saveSnapshot } from "@/lib/offline/database";

interface ParentVaultRecord {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
  savedAt: string;
}

const VAULT_KEY = "parent-report-vault";

export async function hasOfflineParentReport() {
  return Boolean(await loadSnapshot<ParentVaultRecord>(VAULT_KEY));
}

export async function sealOfflineParentReport(pin: string, report: unknown) {
  if (!/^\d{4}$/.test(pin)) throw new Error("A four-digit PIN is required");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(report));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  await saveSnapshot<ParentVaultRecord>(VAULT_KEY, { version: 1, salt: encode(salt), iv: encode(iv), ciphertext: encode(ciphertext), savedAt: new Date().toISOString() });
}

export async function unlockOfflineParentReport<T>(pin: string): Promise<T | null> {
  const vault = await loadSnapshot<ParentVaultRecord>(VAULT_KEY);
  if (!vault || !/^\d{4}$/.test(pin)) return null;
  try {
    const salt = decode(vault.salt);
    const iv = decode(vault.iv);
    const key = await deriveKey(pin, salt);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, decode(vault.ciphertext));
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}

async function deriveKey(pin: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: 310_000 }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function encode(value: Uint8Array) { return btoa(String.fromCharCode(...value)); }
function decode(value: string) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); }
