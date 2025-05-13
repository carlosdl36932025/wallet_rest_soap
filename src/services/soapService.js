const soap = require('soap');
const express = require('express');
const bodyParser = require('body-parser');
const WalletController = require('../controllers/walletController');
const Database = require('../config/database');
const fs = require('fs');
const path = require('path');

const db = new Database();
const walletController = new WalletController(db);

function ensureSoapResponse(response) {
  return {
    success: response?.success || false,
    cod_error: response?.cod_error || '99',
    message_error: response?.message_error || '',
    data: response?.data || {}
  };
}

function handleSoapError(error) {
  console.error('Error en servicio SOAP:', error);
  return {
    success: false,
    cod_error: '99',
    message_error: error.message || 'Error interno del servidor',
    data: {}
  };
}

const service = {
  WalletService: {
    WalletServiceSOAPPort: {
      registerClient: async function(args) {
        try {
          const response = await walletController.registerClient(
            args.document, 
            args.names, 
            args.email, 
            args.celular
          );
          return ensureSoapResponse(response);
        } catch (error) {
          return handleSoapError(error);
        }
      },
      rechargeWallet: async function(args) {
        try {
          const response = await walletController.rechargeWallet(
            args.document, 
            args.celular, 
            parseFloat(args.amount || 0)
          );
          return ensureSoapResponse(response);
        } catch (error) {
          return handleSoapError(error);
        }
      },
      checkBalance: async function(args) {
        try {
          const response = await walletController.checkBalance(
            args.document, 
            args.celular
          );
          return ensureSoapResponse(response);
        } catch (error) {
          return handleSoapError(error);
        }
      },
      initiatePayment: async function(args) {
        try {
          const response = await walletController.initiatePayment(
            args.document, 
            args.celular, 
            parseFloat(args.amount || 0)
          );
          return ensureSoapResponse(response);
        } catch (error) {
          return handleSoapError(error);
        }
      },
      confirmPayment: async function(args) {
        try {
          const response = await walletController.confirmPayment(
            args.sessionId,
            args.token
          );
          return ensureSoapResponse(response);
        } catch (error) {
          return handleSoapError(error);
        }
      }
    }
  }
};

const soapRouter = express.Router();
soapRouter.use(bodyParser.raw({ 
  type: () => true, 
  limit: '5mb'
}));

soapRouter.get('/wallet.wsdl', (req, res) => {
  try {
    const wsdlPath = path.join(__dirname, '../../soap.wsdl');
    if (!fs.existsSync(wsdlPath)) {
      throw new Error('Archivo WSDL no encontrado');
    }
    res.type('application/xml');
    res.sendFile(wsdlPath);
  } catch (error) {
    console.error('Error al servir WSDL:', error);
    res.status(500).send('Error al cargar el WSDL');
  }
});

soap.listen(soapRouter, '/soap', service, fs.readFileSync('./soap.wsdl', 'utf8'));

module.exports = soapRouter;