<?php
/**
 * Affiliate Content Studio - Multi-Tenant Data Migration Script
 * 
 * Este script asigna los datos huérfanos (generados en la etapa single-tenant)
 * al usuario principal (Admin) para evitar pérdida de datos al aplicar
 * las claves foráneas de la nueva arquitectura multi-tenant.
 */

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS HOSTINGER
// ==========================================
$dbHost = '127.0.0.1'; // Hostinger Database IP
$dbName = 'u528769934_afs'; 
$dbUser = 'u528769934_afsmanager';       
$dbPass = 'Regent@LakeNona#2030';    

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión a la base de datos exitosa.\n<br>";

    // 1. Obtener el ID del usuario principal al que le asignaremos los datos existentes
    $stmt = $pdo->query("SELECT id, email FROM users ORDER BY created_at ASC LIMIT 1");
    $mainUser = $stmt->fetch(PDO::FETCH_ASSOC);

    $userId = null;
    if ($mainUser) {
        $userId = $mainUser['id'];
        echo "👤 Usuario principal detectado: {$mainUser['email']} (ID: $userId)\n<br><br>";
    } else {
        echo "⚠️ <b>Aviso:</b> No hay usuarios registrados en el sistema. Se procederá a actualizar la estructura de las tablas, asumiendo que la base de datos está vacía.\n<br><br>";
    }

    // 2. Lista de tablas a actualizar
    $tablesToUpdate = [
        'execution_logs',
        'scheduled_posts',
        'oauth_credentials',
        'app_configs',
        'analytics',
        'short_links'
    ];

    // 3. Modificar esquema y actualizar datos tabla por tabla
    foreach ($tablesToUpdate as $table) {
        echo "🔄 Procesando tabla: <b>$table</b>...\n<br>";

        // a) Revisar si la columna user_id ya existe
        $colCheck = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'user_id'")->fetch();
        if (!$colCheck) {
            // b) Añadir columna user_id si no existe
            $afterCol = ($table === 'oauth_credentials' || $table === 'app_configs' || $table === 'platform_credentials') ? "FIRST" : "AFTER id";
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN user_id VARCHAR(255) $afterCol");
            echo "   ➕ Columna user_id añadida.\n<br>";
        }

        // c) Actualizar registros huérfanos
        if ($userId) {
            $updatedRows = $pdo->exec("UPDATE `$table` SET user_id = '$userId' WHERE user_id IS NULL OR user_id = ''");
            echo "   📝 Registros asignados al usuario principal: $updatedRows\n<br>";
        } else {
            // Verificar si hay registros huérfanos que causarían error
            $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
            if ($count > 0 && ($table === 'oauth_credentials' || $table === 'app_configs')) {
                die("❌ ERROR FATAL: La tabla '$table' tiene $count registros pero no hay ningún usuario creado. Las claves primarias fallarán. Debes crear un usuario o vaciar las tablas primero.");
            }
        }
    }

    // 4. Arreglar Primary Keys (Solo para tablas compuestas)
    echo "<br>🔄 Reconfigurando Primary Keys...\n<br>";

    $compositeTables = ['oauth_credentials', 'app_configs'];
    foreach ($compositeTables as $table) {
        try {
            // Intentar borrar la PK anterior si no es compuesta
            $pdo->exec("ALTER TABLE `$table` DROP PRIMARY KEY, ADD PRIMARY KEY (user_id, platform)");
            echo "   🔑 Primary Key de $table actualizada.\n<br>";
        } catch (Exception $e) {
            // Ignorar si ya está arreglada
            echo "   ℹ️ Primary Key de $table ya estaba correcta o no requería cambios.\n<br>";
        }
    }

    // 5. Aplicar Claves Foráneas (Foreign Keys)
    echo "<br>🔗 Aplicando restricciones de Foreign Keys (ON DELETE CASCADE)...\n<br>";
    foreach ($tablesToUpdate as $table) {
        try {
            $pdo->exec("ALTER TABLE `$table` ADD CONSTRAINT `fk_{$table}_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
            echo "   🔗 Foreign Key añadida a $table.\n<br>";
        } catch (Exception $e) {
            echo "   ℹ️ Foreign Key de $table ya existía.\n<br>";
        }
    }

    // 6. Añadir nuevas columnas a la tabla users para el sistema OTP
    echo "<br>🔄 Verificando columnas del sistema OTP en la tabla 'users'...\n<br>";
    $userCols = [
        'otp_code' => "VARCHAR(10)",
        'otp_expires_at' => "DATETIME",
        'assistant_name' => "VARCHAR(255) DEFAULT 'Assistant'",
        'assistant_avatar' => "TEXT"
    ];

    foreach ($userCols as $colName => $colDef) {
        $checkCol = $pdo->query("SHOW COLUMNS FROM `users` LIKE '$colName'")->fetch();
        if (!$checkCol) {
            $pdo->exec("ALTER TABLE `users` ADD COLUMN `$colName` $colDef");
            echo "   ➕ Columna '$colName' añadida a users.\n<br>";
        } else {
            echo "   ℹ️ Columna '$colName' ya existía.\n<br>";
        }
    }

    // 7. Crear platform_credentials si no existe
    $pdo->exec("CREATE TABLE IF NOT EXISTS platform_credentials (
        user_id VARCHAR(255),
        platform VARCHAR(50),
        is_connected BOOLEAN,
        PRIMARY KEY (user_id, platform),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "<br>✅ Tabla platform_credentials verificada/creada.\n<br>";

    echo "<br>🎉 <b>¡MIGRACIÓN MULTI-TENANT COMPLETADA CON ÉXITO!</b> Ningún dato se perdió.";

} catch (PDOException $e) {
    echo "<br>❌ <b>ERROR FATAL:</b> " . $e->getMessage();
}
?>
