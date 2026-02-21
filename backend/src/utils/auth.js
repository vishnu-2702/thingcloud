/**
 * Authentication Utilities
 * JWT and password handling utilities
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/app');

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, config.SECURITY.BCRYPT_ROUNDS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Password match result
 */
const verifyPassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Password verification failed');
  }
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  try {
    return jwt.sign(
      { 
        userId: user.userId, 
        email: user.email,
        role: user.role || 'user'
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT.SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate API key for devices
 * @returns {string} UUID-based API key
 */
const generateApiKey = () => {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateApiKey
};