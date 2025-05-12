class WalletModel {
  constructor(db) {
    this.db = db;
  }

  async createWallet(conn, clientId) {
    const [result] = await conn.execute(
      'INSERT INTO wallets (client_id, balance) VALUES (?, 0)',
      [clientId]
    );
    return result.insertId;
  }

  async getWalletByClientId(conn, clientId) {
    const [rows] = await conn.execute(
      'SELECT * FROM wallets WHERE client_id = ?',
      [clientId]
    );
    return rows[0];
  }

  async updateBalance(conn, clientId, amount) {
    if (amount < 0) {
      const [result] = await conn.execute(
        'UPDATE wallets SET balance = balance + ? WHERE client_id = ? AND balance >= ?',
        [amount, clientId, -amount]
      );
      if (result.affectedRows === 0) {
        throw new Error('Saldo insuficiente para realizar la operación');
      }
    } else {
      await conn.execute(
        'UPDATE wallets SET balance = balance + ? WHERE client_id = ?',
        [amount, clientId]
      );
    }
  }
}

module.exports = WalletModel;