class ClientModel {
  constructor(db) {
    this.db = db;
  }

  async registerClient(conn, document, names, email, celular) {
    const [result] = await conn.execute(
      'INSERT INTO clients (document, names, email, celular) VALUES (?, ?, ?, ?)',
      [document, names, email, celular]
    );
    return result.insertId;
  }

  async getClientByDocument(conn, document) {
    const [rows] = await conn.execute(
      'SELECT * FROM clients WHERE document = ?',
      [document]
    );
    return rows[0];
  }

  async getClientByDocumentAndCelular(conn, document, celular) {
    const [rows] = await conn.execute(
      'SELECT * FROM clients WHERE document = ? AND celular = ?',
      [document, celular]
    );
    return rows[0];
  }
}

module.exports = ClientModel;