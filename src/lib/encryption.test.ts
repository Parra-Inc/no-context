import { encrypt, decrypt } from "./encryption";

describe("encryption", () => {
  beforeAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = "0".repeat(64);
  });

  it("encrypts and decrypts a Slack bot token", () => {
    const token = "xoxb-123456789-abcdefghijklmnop";
    const encrypted = encrypt(token);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(token);
  });

  it("produces different ciphertext for same plaintext (unique IVs)", () => {
    const token = "xoxb-test-token";
    const encrypted1 = encrypt(token);
    const encrypted2 = encrypt(token);
    expect(encrypted1).not.toBe(encrypted2);
    // But both decrypt to the same value
    expect(decrypt(encrypted1)).toBe(token);
    expect(decrypt(encrypted2)).toBe(token);
  });

  it("throws on invalid ciphertext", () => {
    expect(() => decrypt("not-valid-ciphertext")).toThrow();
  });

  it("throws when encryption key is missing", () => {
    const originalKey = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("TOKEN_ENCRYPTION_KEY");
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
  });
});
