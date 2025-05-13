CREATE DATABASE IF NOT EXISTS wallet_db;
USE wallet_db;

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document VARCHAR(20) NOT NULL UNIQUE,
  names VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  celular VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de billeteras
CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  type ENUM('recharge', 'payment') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  session_id VARCHAR(100),
  token VARCHAR(6),
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Índices para mejor performance
CREATE INDEX idx_transactions_session ON transactions(session_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_client ON transactions(client_id);