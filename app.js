const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const soapRouter = require('./services/soapService');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(soapRouter);

app.get('/status', (req, res) => {
  res.status(200).json({ status: 'SOAP Service running' });
});

module.exports = app;