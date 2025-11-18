#!/usr/bin/env node

/**
 * Script para generar un JWT_SECRET seguro
 *
 * Uso:
 *   node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generando JWT_SECRET seguro...\n');

const secret = crypto.randomBytes(64).toString('hex');

console.log('Tu JWT_SECRET es:\n');
console.log('\x1b[32m%s\x1b[0m', secret);
console.log('\n📋 Copia este valor y agrégalo a tu archivo .env o variables de Railway\n');
console.log('JWT_SECRET=' + secret + '\n');
