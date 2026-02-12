/**
 * Security configuration type definition
 * Security Configuration Type Definitions
 */

/**
 * RSA Security configuration interface
 * RSA Security Configuration Interface
 */
export interface RSASecurityConfig {
  /** RSA public key */
  publicKey: string
  /** Key size */
  keySize: number
  /** encryption algorithm */
  algorithm: string
  /** Hash algorithm */
  hashAlgorithm: string
  /** Whether to enable environment variable override */
  enableEnvOverride: boolean
}

/**
 * Security configuration interface
 * Security Configuration Interface
 */
export interface SecurityConfig {
  /** RSA Configuration */
  rsa: RSASecurityConfig
}

/**
 * RSA Encryption options
 * RSA Encryption Options
 */
export interface RSAEncryptionOptions {
  /** Data to be encrypted */
  data: string
  /** public key（Optional，默认使用配置中的public key） */
  publicKey?: string
  /** encoding format */
  encoding?: 'base64' | 'hex'
}

/**
 * RSA Decryption options
 * RSA Decryption Options
 */
export interface RSADecryptionOptions {
  /** Data to be decrypted */
  encryptedData: string
  /** private key */
  privateKey: string
  /** encoding format */
  encoding?: 'base64' | 'hex'
}

/**
 * RSA key pair
 * RSA Key Pair
 */
export interface RSAKeyPair {
  /** public key */
  publicKey: string
  /** private key */
  privateKey: string
}

/**
 * Security configuration constant type
 * Security Configuration Constants Type
 */
export type SecurityConfigConstants = {
  readonly keySize: number
  readonly algorithm: string
  readonly hashAlgorithm: string
  readonly enableEnvOverride: boolean
}
