import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  renameSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
interface Encryption {
  isEncryptionAvailable: () => boolean;
  encryptString: (text: string) => Buffer;
  decryptString: (buffer: Buffer) => string;
  getSelectedStorageBackend?: () => string;
}
export class Credentials {
  private token: string | undefined;
  private persistent = false;
  constructor(
    private path: string,
    private encryption: Encryption,
  ) {
    if (existsSync(path) && this.secure()) {
      try {
        this.token = encryption.decryptString(readFileSync(path));
        this.persistent = true;
      } catch {
        /* Keep ciphertext intact if the OS key store is unavailable. */
      }
    }
  }
  private secure() {
    return (
      this.encryption.isEncryptionAvailable() &&
      this.encryption.getSelectedStorageBackend?.() !== "basic_text"
    );
  }
  get() {
    return this.token;
  }
  status() {
    return { present: !!this.token, persistent: this.persistent };
  }
  set(token: string, persist: boolean) {
    if (persist) {
      if (!this.secure())
        throw new Error(
          "OS-backed encryption is unavailable. Choose session-only storage.",
        );
      // Encrypt first, then atomically replace on the same filesystem. A failed
      // encryption/write/rename leaves both the previous file and session intact.
      const encrypted = this.encryption.encryptString(token);
      const temporary = `${this.path}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporary, encrypted, { mode: 0o600, flag: "wx" });
        renameSync(temporary, this.path);
      } finally {
        if (existsSync(temporary)) unlinkSync(temporary);
      }
    } else if (existsSync(this.path)) unlinkSync(this.path);
    this.token = token;
    this.persistent = persist;
  }
  clear() {
    if (existsSync(this.path)) unlinkSync(this.path);
    this.token = undefined;
    this.persistent = false;
  }
}
