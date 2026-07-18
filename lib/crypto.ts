import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
// The secret must be exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || crypto.randomBytes(32).toString("hex").substring(0, 32);

export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const authTag = cipher.getAuthTag().toString("base64");
  
  // Format: iv:authTag:encrypted
  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
