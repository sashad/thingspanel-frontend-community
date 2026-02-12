/**
 * Unified export of security configurations
 * Security Configuration Unified Exports
 */

// Export RSA Configuration
export { 
  rsaPublicKey, 
  rsaConfig, 
  getRSAPublicKey, 
  validateRSAPublicKey 
} from './rsa'

// Export type definition
export type {
  RSASecurityConfig,
  SecurityConfig,
  RSAEncryptionOptions,
  RSADecryptionOptions,
  RSAKeyPair,
  SecurityConfigConstants
} from './types'

/**
 * security configuration object
 * Security Configuration Object
 */
export const securityConfig = {
  rsa: {
    publicKey: '',
    keySize: 2048,
    algorithm: 'RSA-OAEP',
    hashAlgorithm: 'SHA-256',
    enableEnvOverride: true,
  }
} as const

/**
 * Get complete security configuration
 * Get Complete Security Configuration
 * @returns Complete security configuration object
 */
export function getSecurityConfig() {
  return {
    rsa: {
      publicKey: getRSAPublicKey(),
      keySize: rsaConfig.keySize,
      algorithm: rsaConfig.algorithm,
      hashAlgorithm: rsaConfig.hashAlgorithm,
      enableEnvOverride: rsaConfig.enableEnvOverride,
    }
  }
}
