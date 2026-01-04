"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptResponse = exports.decryptRequest = void 0;
const crypto = __importStar(require("crypto"));
const decryptRequest = (body, privatePem) => {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;
    // Decrypt the AES key created by the client
    const decryptedAesKey = crypto.privateDecrypt({
        key: crypto.createPrivateKey(privatePem),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    }, 
    //@ts-ignore
    Buffer.from(encrypted_aes_key, "base64"));
    // Decrypt the Flow data
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const initialVectorBuffer = Buffer.from(initial_vector, "base64");
    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);
    const decipher = crypto.createDecipheriv("aes-128-gcm", 
    //@ts-ignore
    decryptedAesKey, initialVectorBuffer);
    //@ts-ignore
    decipher.setAuthTag(encrypted_flow_data_tag);
    //@ts-ignore
    const decryptedJSONString = Buffer.concat([
        //@ts-ignore
        decipher.update(encrypted_flow_data_body),
        decipher.final(),
    ]).toString("utf-8");
    return {
        decryptedBody: JSON.parse(decryptedJSONString),
        aesKeyBuffer: decryptedAesKey,
        initialVectorBuffer,
    };
};
exports.decryptRequest = decryptRequest;
const encryptResponse = (response, aesKeyBuffer, initialVectorBuffer) => {
    // Flip the initialization vector
    const flipped_iv = [];
    for (const pair of initialVectorBuffer.entries()) {
        flipped_iv.push(~pair[1]);
    }
    // Encrypt the response data
    const cipher = crypto.createCipheriv("aes-128-gcm", 
    //@ts-ignore
    aesKeyBuffer, Buffer.from(flipped_iv));
    //@ts-ignore
    return Buffer.concat([
        cipher.update(JSON.stringify(response), "utf-8"),
        cipher.final(),
        cipher.getAuthTag(),
    ]).toString("base64");
};
exports.encryptResponse = encryptResponse;
