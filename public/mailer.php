<?php
// mailer.php
// Este script recibe peticiones desde Render y envía el correo localmente desde Hostinger
header('Content-Type: application/json');

// Una clave secreta básica para evitar que cualquiera use este archivo para enviar spam
$API_SECRET = 'AFS_Secret_Relay_2030';

// Leer los datos JSON que envía Render
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['secret']) || $data['secret'] !== $API_SECRET) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$to = $data['email'] ?? '';
$otpCode = $data['otpCode'] ?? '';

if (empty($to) || empty($otpCode)) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan datos']);
    exit;
}

$subject = 'Tu Código de Acceso / Your Access Code';

$htmlMessage = "
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #f9fafb; border-radius: 12px;'>
    <h2 style='color: #4f46e5;'>Affiliate Content Studio</h2>
    <p style='color: #374151; font-size: 16px;'>Aquí tienes tu código de acceso para iniciar sesión:</p>
    <div style='background-color: #e0e7ff; color: #4338ca; font-size: 32px; font-weight: bold; letter-spacing: 0.25em; padding: 20px; border-radius: 8px; margin: 20px 0;'>
        $otpCode
    </div>
    <p style='color: #6b7280; font-size: 14px;'>Este código expirará en 15 minutos.</p>
</div>
";

// Cabeceras para enviar correo HTML
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Affiliate Content Studio <afs@maper.tech>" . "\r\n";
$headers .= "Reply-To: afs@maper.tech" . "\r\n";

// Usar la función nativa de PHP mail() que viaja internamente en Hostinger
$sent = mail($to, $subject, $htmlMessage, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'La función mail() de PHP falló al enviar el correo']);
}
?>
