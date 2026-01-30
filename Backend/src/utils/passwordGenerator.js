const crypto = require('crypto');

/**
 * Generate a secure random password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} Generated password
 */
const generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate a unique user ID
 * @param {string} role - User role (e.g., 'teacher', 'sales_team')
 * @returns {string} Unique user ID
 */
const generateUserId = (role) => {
  const prefix = {
    teacher: 'TCH',
    sales_team: 'SLS',
    team_leader: 'TLD',
    admin: 'ADM',
  }[role] || 'USR';
  
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = { generatePassword, generateUserId };
