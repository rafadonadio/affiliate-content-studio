<?php
/**
 * Affiliate Content Studio - Promote User to Admin
 */
$dbHost = '127.0.0.1'; // Hostinger Database IP
$dbName = 'u528769934_afs'; 
$dbUser = 'u528769934_afsmanager';       
$dbPass = 'Regent@LakeNona#2030';    

if (isset($_GET['email'])) {
    $email = $_GET['email'];
    try {
        $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            echo "✅ ¡Éxito! El usuario <b>$email</b> ahora tiene rol de superadmin.";
        } else {
            echo "❌ El usuario <b>$email</b> no fue encontrado en la base de datos. Asegúrate de haber iniciado sesión al menos una vez en la app para que se cree tu cuenta.";
        }
    } catch (PDOException $e) {
        echo "❌ Error: " . $e->getMessage();
    }
} else {
    echo "Agrega tu correo en la URL de esta forma:<br><br><b>https://tu-dominio.com/promote.php?email=tu_correo@ejemplo.com</b>";
}
?>
