import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateVerificationCode(length = 6): string {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

