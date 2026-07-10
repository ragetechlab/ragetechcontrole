<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth_helper.php';

$userData = AuthHelper::validateTokenFromHeader();

if (!$userData) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Acesso não autorizado."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getConnection();

    // ------------------------------------------
    // ROTA GET: Listar usuários
    // ------------------------------------------
    if ($method === 'GET') {
        // Se for CEO, retorna todos os detalhes para o painel de gerenciamento
        // Caso contrário, retorna apenas nome e id para popular dropdowns
        if ($userData['papel'] === 'ceo') {
            $stmt = $db->query("SELECT id, nome, email, papel, acessos, data_cadastro FROM usuarios ORDER BY nome ASC");
        } else {
            $stmt = $db->query("SELECT id, nome, papel FROM usuarios ORDER BY nome ASC");
        }
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success",
            "data" => $usuarios
        ]);
        exit();
    }

    // A partir daqui, apenas CEOs podem fazer modificações (POST, PUT, DELETE)
    if ($userData['papel'] !== 'ceo') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Apenas CEOs têm permissão para gerenciar usuários."]);
        exit();
    }

    // ------------------------------------------
    // ROTA POST: Criar novo usuário/funcionário
    // ------------------------------------------
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Dados inválidos."]);
            exit();
        }

        $nome = isset($input['nome']) ? trim(strip_tags($input['nome'])) : '';
        $email = isset($input['email']) ? trim(filter_var($input['email'], FILTER_SANITIZE_EMAIL)) : '';
        $senha = isset($input['senha']) ? $input['senha'] : '';
        $papel = isset($input['papel']) ? trim($input['papel']) : 'funcionario';
        $acessos = isset($input['acessos']) ? trim(strip_tags($input['acessos'])) : 'dashboard,leads,os,suportes';

        if (empty($nome) || empty($email) || empty($senha)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nome, e-mail e senha são obrigatórios."]);
            exit();
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Formato de e-mail inválido."]);
            exit();
        }

        if (!in_array($papel, ['ceo', 'admin', 'funcionario'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Função/Papel inválido."]);
            exit();
        }

        // Verificar se e-mail já está em uso
        $stmt_check = $db->prepare("SELECT id FROM usuarios WHERE email = :email");
        $stmt_check->execute([':email' => $email]);
        if ($stmt_check->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Este endereço de e-mail já está cadastrado."]);
            exit();
        }

        $senha_hash = password_hash($senha, PASSWORD_BCRYPT);

        $stmt = $db->prepare("
            INSERT INTO usuarios (nome, email, senha_hash, papel, acessos) 
            VALUES (:nome, :email, :senha_hash, :papel, :acessos)
        ");
        $success = $stmt->execute([
            ':nome' => $nome,
            ':email' => $email,
            ':senha_hash' => $senha_hash,
            ':papel' => $papel,
            ':acessos' => $acessos
        ]);

        if ($success) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Usuário criado com sucesso!", "id" => $db->lastInsertId()]);
        } else {
            throw new Exception("Falha ao salvar o usuário.");
        }
        exit();
    }

    // ------------------------------------------
    // ROTA PUT: Editar usuário
    // ------------------------------------------
    if ($method === 'PUT') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID do usuário não informado."]);
            exit();
        }

        $id = intval($_GET['id']);
        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Dados em formato inválido."]);
            exit();
        }

        // Validar se usuário existe
        $stmt_check = $db->prepare("SELECT id, email FROM usuarios WHERE id = :id");
        $stmt_check->execute([':id' => $id]);
        $existingUser = $stmt_check->fetch();
        if (!$existingUser) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Usuário não encontrado."]);
            exit();
        }

        $nome = isset($input['nome']) ? trim(strip_tags($input['nome'])) : null;
        $email = isset($input['email']) ? trim(filter_var($input['email'], FILTER_SANITIZE_EMAIL)) : null;
        $senha = isset($input['senha']) && $input['senha'] !== '' ? $input['senha'] : null;
        $papel = isset($input['papel']) ? trim($input['papel']) : null;
        $acessos = isset($input['acessos']) ? trim(strip_tags($input['acessos'])) : null;

        $fields = [];
        $params = [':id' => $id];

        if ($nome !== null) {
            $fields[] = "nome = :nome";
            $params[':nome'] = $nome;
        }

        if ($email !== null) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Formato de e-mail inválido."]);
                exit();
            }
            if ($email !== $existingUser['email']) {
                $stmt_email_check = $db->prepare("SELECT id FROM usuarios WHERE email = :email");
                $stmt_email_check->execute([':email' => $email]);
                if ($stmt_email_check->fetch()) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => "Este e-mail já está em uso por outro usuário."]);
                    exit();
                }
            }
            $fields[] = "email = :email";
            $params[':email'] = $email;
        }

        if ($senha !== null) {
            $fields[] = "senha_hash = :senha_hash";
            $params[':senha_hash'] = password_hash($senha, PASSWORD_BCRYPT);
        }

        if ($papel !== null) {
            if (!in_array($papel, ['ceo', 'admin', 'funcionario'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Papel inválido."]);
                exit();
            }
            $fields[] = "papel = :papel";
            $params[':papel'] = $papel;
        }

        if ($acessos !== null) {
            $fields[] = "acessos = :acessos";
            $params[':acessos'] = $acessos;
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nenhum campo fornecido para atualização."]);
            exit();
        }

        $query = "UPDATE usuarios SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $success = $stmt->execute($params);

        if ($success) {
            echo json_encode(["status" => "success", "message" => "Usuário atualizado com sucesso!"]);
        } else {
            throw new Exception("Falha ao atualizar o usuário.");
        }
        exit();
    }

    // ------------------------------------------
    // ROTA DELETE: Excluir usuário
    // ------------------------------------------
    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID do usuário não fornecido."]);
            exit();
        }

        $id = intval($_GET['id']);

        if ($id === intval($userData['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Você não pode excluir a sua própria conta."]);
            exit();
        }

        $stmt = $db->prepare("DELETE FROM usuarios WHERE id = :id");
        $success = $stmt->execute([':id' => $id]);

        if ($success) {
            echo json_encode(["status" => "success", "message" => "Usuário removido com sucesso!"]);
        } else {
            throw new Exception("Falha ao remover o usuário.");
        }
        exit();
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro de banco: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
