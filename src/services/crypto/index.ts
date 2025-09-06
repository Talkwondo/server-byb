import crypto from "crypto";

export interface FlowToken {
  token: string;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface EncryptedFlowData {
  encrypted: string;
  iv: string;
  tag: string;
}

export class CryptoService {
  private algorithm = "aes-256-gcm";
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;

  constructor(
    private secretKey: string = process.env.CRYPTO_SECRET_KEY ||
      "default-secret-key-32-chars-long"
  ) {
    if (this.secretKey.length < 32) {
      throw new Error("Secret key must be at least 32 characters long");
    }
  }

  /**
   * Generate a dynamic flow token for WhatsApp flows
   */
  generateFlowToken(metadata: Record<string, any> = {}): FlowToken {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      token,
      expiresAt,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  /**
   * Encrypt flow data for secure storage/transmission
   */
  encryptFlowData(data: any): EncryptedFlowData {
    const iv = crypto.randomBytes(this.ivLength);
    const key = Buffer.from(this.secretKey, "utf8");

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: "",
    };
  }

  /**
   * Decrypt flow data
   */
  decryptFlowData(encryptedData: EncryptedFlowData): any {
    const key = Buffer.from(this.secretKey, "utf8");
    const iv = Buffer.from(encryptedData.iv, "hex");
    const tag = Buffer.from(encryptedData.tag, "hex");

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

  /**
   * Generate a secure hash for flow validation
   */
  hashFlowData(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  /**
   * Create a dynamic flow configuration with encrypted metadata
   */
  createDynamicFlow(
    flowType: string,
    customerData: Record<string, any> = {}
  ): {
    flowToken: string;
    encryptedMetadata: EncryptedFlowData;
    hash: string;
  } {
    const flowToken = this.generateFlowToken({
      flowType,
      customerData,
    });

    const metadata = {
      flowType,
      customerData,
      timestamp: Date.now(),
      token: flowToken.token,
    };

    const encryptedMetadata = this.encryptFlowData(metadata);
    const hash = this.hashFlowData(metadata);

    return {
      flowToken: flowToken.token,
      encryptedMetadata,
      hash,
    };
  }

  /**
   * Validate a flow token and extract metadata
   */
  validateFlowToken(
    token: string,
    encryptedMetadata: EncryptedFlowData
  ): {
    valid: boolean;
    metadata?: any;
    error?: string;
  } {
    try {
      const metadata = this.decryptFlowData(encryptedMetadata);

      if (metadata.token !== token) {
        return { valid: false, error: "Token mismatch" };
      }

      if (
        new Date(metadata.timestamp) <
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) {
        return { valid: false, error: "Token expired" };
      }

      return { valid: true, metadata };
    } catch (error) {
      return { valid: false, error: "Invalid token" };
    }
  }

  /**
   * Generate a unique session ID for customer flows
   */
  generateSessionId(customerPhone: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(`${customerPhone}-${timestamp}-${randomBytes}`)
      .digest("hex")
      .substring(0, 16);

    return `${hash}-${timestamp}`;
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();
