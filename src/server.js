const app = require('./app');
const Database = require('./config/database');
const db = new Database();

db.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SOAP service available at http://localhost:${PORT}/soap`);
  console.log(`WSDL available at http://localhost:${PORT}/wallet.wsdl`);
});

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});