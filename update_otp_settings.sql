-- Ejecutar este script en Hostinger para agregar las columnas de inicio de sesión por código (OTP)
ALTER TABLE users ADD COLUMN otp_code VARCHAR(10);
ALTER TABLE users ADD COLUMN otp_expires_at DATETIME;
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) DEFAULT '*OTP*';
