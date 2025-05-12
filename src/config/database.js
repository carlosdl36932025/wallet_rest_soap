const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wallet_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Error al obtener conexión:', error);
      throw error;
    }
  }

  async beginTransaction() {
    const conn = await this.getConnection();
    try {
      await conn.beginTransaction();
      return conn;
    } catch (error) {
      await conn.release();
      console.error('Error al iniciar transacción:', error);
      throw error;
    }
  }

  async close() {
    try {
      await this.pool.end();
      console.log('Pool de conexiones cerrado');
    } catch (error) {
      console.error('Error al cerrar pool:', error);
      throw error;
    }
  }
}

module.exports = Database;