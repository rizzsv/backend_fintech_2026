import crypto from 'crypto';

/**
 * Generate a unique 10-digit account number for wallet identification.
 * 
 * Format: 10 digits (1000000000 - 9999999999)
 * 
 * Uses cryptographically secure random generation to avoid:
 * - Sequential patterns
 * - Predictable user ID derivation
 * - Collision with existing account numbers
 * 
 * Collision safety: 9 billion possible values provide sufficient space
 * for uniqueness. The caller must enforce database UNIQUE constraint
 * and retry on collision.
 */
export function generateAccountNumber(): string {
    // Generate random 10-digit number: 1000000000 to 9999999999
    const min = 1000000000;
    const max = 9999999999;
    
    // Use crypto.randomInt for cryptographic randomness
    const accountNumber = crypto.randomInt(min, max + 1);
    
    return accountNumber.toString();
}

/**
 * Validate account number format.
 * Must be exactly 10 digits, no leading zeros (enforced by range).
 */
export function isValidAccountNumber(value: string): boolean {
    return /^[1-9][0-9]{9}$/.test(value);
}
