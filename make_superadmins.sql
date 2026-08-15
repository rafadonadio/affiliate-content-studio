-- 1. Agregar la columna 'role' a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 2. Asignar rol de admin a los usuarios
UPDATE users 
SET role = 'admin' 
WHERE email IN ('maperdona@gmail.com', 'marcosdonarome@gmail.com', 'rafadonadio@gmail.com');

-- 3. Crear o actualizar suscripción vitalicia para los administradores
-- Estableciendo el plan a 'lifetime' y la fecha de expiración en 2099
INSERT INTO subscriptions (user_id, plan_id, status, current_period_end)
SELECT id, 'lifetime_pro', 'active', '2099-12-31 23:59:59'
FROM users 
WHERE email IN ('maperdona@gmail.com', 'marcosdonarome@gmail.com', 'rafadonadio@gmail.com')
ON DUPLICATE KEY UPDATE 
    plan_id = 'lifetime_pro', 
    status = 'active', 
    current_period_end = '2099-12-31 23:59:59';
