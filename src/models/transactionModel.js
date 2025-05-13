class TransactionModel {
  constructor(db) {
    this.db = db;
  }

  async createTransaction(conn, clientId, type, amount,status= "pending",sessionId = null, token = null, expiresAt = null) {
    const [result] = await conn.execute(
      `INSERT INTO transactions 
       (client_id, type, amount, session_id, token, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, type, amount, sessionId, token, status,expiresAt]
    );
    return result.insertId;
  }

  async getPendingPayment(conn, sessionId) {
    const [rows] = await conn.execute(
      `SELECT t.*, c.document, c.celular 
       FROM transactions t
       JOIN clients c ON t.client_id = c.id
       WHERE t.session_id = ? 
       AND t.type = 'payment'
       AND t.status = 'pending'
       AND t.expires_at > NOW()`,
      [sessionId]
    );
    return rows[0];
  }

  async completeTransaction(conn, sessionId) {
    const [result] = await conn.execute(
      `UPDATE transactions 
       SET status = 'completed', updated_at = NOW()
       WHERE session_id = ? AND status = 'pending'`,
      [sessionId]
    );
    return result.affectedRows > 0;
  }

  async cancelTransaction(conn, sessionId) {
    const [result] = await conn.execute(
      `UPDATE transactions 
       SET status = 'cancelled', updated_at = NOW()
       WHERE session_id = ? AND status = 'pending'`,
      [sessionId]
    );
    return result.affectedRows > 0;
  }

  async getClientTransactions(conn, clientId, limit = 10) {
    const [rows] = await conn.execute(
      `SELECT * FROM transactions 
       WHERE client_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [clientId, limit]
    );
    return rows;
  }
}

module.exports = TransactionModel;