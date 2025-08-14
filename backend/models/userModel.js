const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async create(userData) {
    const { username, email, password, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    return result;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM Users WHERE email = ? AND isActive = TRUE',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT userID, username, email, role, createdAt FROM Users WHERE userID = ? AND isActive = TRUE',
      [id]
    );
    return rows[0];
  }
}

module.exports = UserModel;