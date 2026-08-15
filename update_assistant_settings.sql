-- Ejecutar este script en Hostinger para agregar la personalización del asistente a la base de datos existente
ALTER TABLE users ADD COLUMN assistant_name VARCHAR(255) DEFAULT 'Assistant';
ALTER TABLE users ADD COLUMN assistant_avatar TEXT;
