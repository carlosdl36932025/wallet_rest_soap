const ClientModel = require('../models/clientModel');
const WalletModel = require('../models/walletModel');
const TransactionModel = require('../models/transactionModel');
const emailService = require('../services/emailService');

class WalletController {
  constructor(db) {
    this.db = db;
    this.clientModel = new ClientModel(db);
    this.walletModel = new WalletModel(db);
    this.transactionModel = new TransactionModel(db);
  }

  async registerClient(document, names, email, celular) {
    let conn;
    try {
      
      if (!document || !names || !email || !celular) {
        return this._formatResponse(false, '01', 'Todos los campos son requeridos');
      }

      if (!this._validateEmail(email)) {
        return this._formatResponse(false, '09', 'Formato de email inválido');
      }

      conn = await this.db.getConnection();
      
      const existingClient = await this.clientModel.getClientByDocument(conn, document);
      if (existingClient) {
        return this._formatResponse(false, '02', 'El cliente ya está registrado');
      }

      await conn.release();

      conn = await this.db.beginTransaction();

      const clientId = await this.clientModel.registerClient(conn, document, names, email, celular);
      
      await this.walletModel.createWallet(conn, clientId);
      
      await conn.commit();

      return this._formatResponse(true, '00', null, { 
        clientId,
        message: 'Cliente registrado exitosamente' 
      });
    } catch (error) {
      
      if (conn) await conn.rollback();
      console.error('Error en registerClient:', error);
      return this._formatResponse(false, '99', 'Error al registrar cliente');
    } finally {
      
      if (conn) await conn.release();
    }
  }

  async rechargeWallet(document, celular, amount) {
    let conn;
    try {
     
      if (!document || !celular || !amount || amount <= 0) {
        return this._formatResponse(false, '01', 'Documento, celular y monto válido son requeridos');
      }

      conn = await this.db.getConnection();
      
      const client = await this.clientModel.getClientByDocumentAndCelular(conn, document, celular);
      if (!client) {
        return this._formatResponse(false, '03', 'Cliente no encontrado');
      }

      await conn.release();

      conn = await this.db.beginTransaction();

      await this.transactionModel.createTransaction(
        conn,
        client.id, 
        'recharge', 
        amount,
        'completed'
      );
      
      await this.walletModel.updateBalance(conn, client.id, amount);
      
      const newBalance = (await this.walletModel.getWalletByClientId(conn, client.id)).balance;
      
      await conn.commit();

      return this._formatResponse(true, '00', null, { 
        message: 'Recarga exitosa',
        newBalance
      });
    } catch (error) {
      if (conn) await conn.rollback();
      console.error('Error en rechargeWallet:', error);
      return this._formatResponse(false, '99', 'Error al procesar recarga');
    } finally {
      if (conn) await conn.release();
    }
  }

  async checkBalance(document, celular) {
    let conn;
    try {
     
      if (!document || !celular) {
        return this._formatResponse(false, '01', 'Documento y celular son requeridos');
      }

      conn = await this.db.getConnection();

      const client = await this.clientModel.getClientByDocumentAndCelular(conn, document, celular);
      if (!client) {
        return this._formatResponse(false, '03', 'Cliente no encontrado');
      }

      const wallet = await this.walletModel.getWalletByClientId(conn, client.id);
      
      return this._formatResponse(true, '00', null, { 
        balance: wallet.balance,
        clientName: client.names
      });
    } catch (error) {
      console.error('Error en checkBalance:', error);
      return this._formatResponse(false, '99', 'Error al consultar saldo');
    } finally {
      if (conn) await conn.release();
    }
  }

  async initiatePayment(document, celular, amount) {
    let conn;
    try {
      if (!document || !celular || !amount || amount <= 0) {
        return this._formatResponse(false, '01', 'Documento, celular y monto válido son requeridos');
      }

      conn = await this.db.getConnection();

      const client = await this.clientModel.getClientByDocumentAndCelular(conn, document, celular);
      if (!client) {
        return this._formatResponse(false, '03', 'Cliente no encontrado');
      }

      const wallet = await this.walletModel.getWalletByClientId(conn, client.id);
      if (wallet.balance < amount) {
        return this._formatResponse(false, '04', 'Saldo insuficiente');
      }

      await conn.release();

      const sessionId = this._generateSessionId();
      const token = this._generateToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

      conn = await this.db.beginTransaction();

      try {
        await this.transactionModel.createTransaction(
          conn,
          client.id,
          'payment',
          amount,
          'pending',
          sessionId,
          token,
          expiresAt
        );
        
        const emailSent = await emailService.sendTokenEmail(client.email, token, sessionId);
        if (!emailSent) {
          await conn.rollback();
          return this._formatResponse(false, '06', 'Error al enviar el token de confirmación');
        }
        
        await conn.commit();

        return this._formatResponse(true, '00', null, {
          message: 'Token enviado al correo electrónico',
          sessionId,
          token: process.env.NODE_ENV === 'development' ? token : undefined
        });
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error en initiatePayment:', error);
      return this._formatResponse(false, '99', 'Error al iniciar pago');
    } finally {
      if (conn) await conn.release();
    }
  }

  async confirmPayment(sessionId, token) {
    let conn;
    try {
      if (!sessionId || !token) {
        return this._formatResponse(false, '01', 'Todos los campos son requeridos');
      }

      conn = await this.db.beginTransaction();

      const transaction = await this.transactionModel.getPendingPayment(conn, sessionId);
      if (!transaction) {
        await conn.rollback();
        return this._formatResponse(false, '07', 'Transacción no encontrada o expirada');
      }

      if (transaction.token !== token) {
        await conn.rollback();
        return this._formatResponse(false, '05', 'Token inválido');
      }

      await this.walletModel.updateBalance(conn, transaction.client_id, -transaction.amount);
      await this.transactionModel.completeTransaction(conn, sessionId);
      
      const newBalance = (await this.walletModel.getWalletByClientId(conn, transaction.client_id)).balance;
      
      await conn.commit();

      return this._formatResponse(true, '00', null, {
        message: 'Pago confirmado exitosamente',
        newBalance
      });
    } catch (error) {

      if (conn) await conn.rollback();
      console.error('Error en confirmPayment:', error);
      return this._formatResponse(false, '99', 'Error al confirmar pago');
    } finally {
      if (conn) await conn.release();
    }
  }

  _generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  _generateToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  _validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  _formatResponse(success, cod_error, message_error, data = {}) {
    return {
      success: Boolean(success),
      cod_error: String(cod_error || '00'),
      message_error: message_error || null,
      data: data || {} 
    };
  }
}

module.exports = WalletController;