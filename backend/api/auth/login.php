<?php
// Configurações de CORS
header("Access-Control-Allow-Origin: *"); // Ajustar para o domínio real em produção
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

$input = json_decode(file_get_contents("php://input"), true);

$email = isset($input['email']) ? trim($input['email']) : null;
$senha = isset($input['senha']) ? $input['senha'] : null;

if (empty($email) || empty($senha)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "E-mail e senha são obrigatórios."]);
    exit();
}

try {
    $db = Database::getConnection();
    
    // Buscar usuário pelo e-mail
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "E-mail ou senha incorretos."]);
        exit();
    }
    
    // Gerar Token
    $token = AuthHelper::generateToken($user['id'], $user['nome'], $user['email'], $user['papel'], $user['acessos']);
    
    echo json_encode([
        "status" => "success",
        "message" => "Autenticado com sucesso!",
        "token" => $token,
        "usuario" => [
            "id" => $user['id'],
            "nome" => $user['nome'],
            "email" => $user['email'],
            "papel" => $user['papel'],
            "acessos" => $user['acessos']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro no servidor: " . $e->getMessage()]);
}
