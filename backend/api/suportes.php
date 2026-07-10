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
    // ROTA GET: Listar suportes/atualizações
    // ------------------------------------------
    if ($method === 'GET') {
        $mes = isset($_GET['mes']) && $_GET['mes'] !== '' ? intval($_GET['mes']) : null;
        $ano = isset($_GET['ano']) && $_GET['ano'] !== '' ? intval($_GET['ano']) : null;
        $busca = isset($_GET['busca']) ? trim(strip_tags($_GET['busca'])) : null;
        $tipo = isset($_GET['tipo']) ? trim(strip_tags($_GET['tipo'])) : null;
        $status = isset($_GET['status']) ? trim(strip_tags($_GET['status'])) : null;

        $query = "SELECT s.*, l.nome_completo as lead_nome, l.empresa as lead_empresa 
                  FROM suportes s 
                  LEFT JOIN leads l ON s.lead_id = l.id 
                  WHERE 1=1";
        $params = [];

        if ($mes && $ano) {
            $start = new DateTime("$ano-$mes-01 00:00:00");
            $end = clone $start;
            $end->modify('last day of this month');
            $end->setTime(23, 59, 59);

            $query .= " AND s.data_cadastro >= :start_date AND s.data_cadastro <= :end_date";
            $params[':start_date'] = $start->format('Y-m-d H:i:s');
            $params[':end_date'] = $end->format('Y-m-d H:i:s');
        }

        if (!empty($busca)) {
            $query .= " AND (s.empresa LIKE :busca OR s.solicitante LIKE :busca OR s.descricao LIKE :busca)";
            $params[':busca'] = "%" . $busca . "%";
        }

        if (!empty($tipo)) {
            $query .= " AND s.tipo = :tipo";
            $params[':tipo'] = $tipo;
        }

        if (!empty($status)) {
            $query .= " AND s.status = :status";
            $params[':status'] = $status;
        }

        $query .= " ORDER BY s.data_cadastro DESC";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $suportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $suportes]);
        exit();
    }

    // ------------------------------------------
    // ROTA POST: Cadastrar novo chamado
    // ------------------------------------------
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Dados inválidos."]);
            exit();
        }

        $empresa = isset($input['empresa']) ? trim(strip_tags($input['empresa'])) : '';
        $solicitante = isset($input['solicitante']) ? trim(strip_tags($input['solicitante'])) : null;
        $tipo = isset($input['tipo']) ? trim(strip_tags($input['tipo'])) : 'suporte';
        $descricao = isset($input['descricao']) ? trim(strip_tags($input['descricao'])) : '';
        $lead_id = isset($input['lead_id']) && $input['lead_id'] !== '' ? intval($input['lead_id']) : null;
        $status = isset($input['status']) ? trim(strip_tags($input['status'])) : 'aberto';
        $observacoes = isset($input['observacoes']) ? trim(strip_tags($input['observacoes'])) : null;

        if (empty($empresa) || empty($descricao)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Empresa e descrição são obrigatórios."]);
            exit();
        }

        if (!in_array($tipo, ['suporte', 'atualizacao'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Tipo inválido."]);
            exit();
        }

        $stmt = $db->prepare("
            INSERT INTO suportes (lead_id, empresa, solicitante, tipo, descricao, status, observacoes) 
            VALUES (:lead_id, :empresa, :solicitante, :tipo, :descricao, :status, :observacoes)
        ");
        
        $success = $stmt->execute([
            ':lead_id' => $lead_id,
            ':empresa' => $empresa,
            ':solicitante' => $solicitante,
            ':tipo' => $tipo,
            ':descricao' => $descricao,
            ':status' => $status,
            ':observacoes' => $observacoes
        ]);

        if ($success) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Ticket registrado com sucesso!", "id" => $db->lastInsertId()]);
        } else {
            throw new Exception("Falha ao salvar ticket de suporte.");
        }
        exit();
    }

    // ------------------------------------------
    // ROTA PUT: Atualizar ticket
    // ------------------------------------------
    if ($method === 'PUT') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID do ticket não fornecido."]);
            exit();
        }
        
        $id = intval($_GET['id']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Corpo da requisição inválido."]);
            exit();
        }

        // Validar existência do ticket
        $stmt_check = $db->prepare("SELECT id FROM suportes WHERE id = :id");
        $stmt_check->execute([':id' => $id]);
        if (!$stmt_check->fetch()) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Ticket não encontrado."]);
            exit();
        }

        $status = isset($input['status']) ? trim($input['status']) : null;
        $descricao = isset($input['descricao']) ? trim(strip_tags($input['descricao'])) : null;
        $observacoes = isset($input['observacoes']) ? trim(strip_tags($input['observacoes'])) : null;
        $empresa = isset($input['empresa']) ? trim(strip_tags($input['empresa'])) : null;
        $solicitante = isset($input['solicitante']) ? trim(strip_tags($input['solicitante'])) : null;
        $tipo = isset($input['tipo']) ? trim(strip_tags($input['tipo'])) : null;
        $lead_id = isset($input['lead_id']) ? ($input['lead_id'] !== '' ? intval($input['lead_id']) : null) : null;

        $fields = [];
        $params = [':id' => $id];

        if ($status !== null) {
            $fields[] = "status = :status";
            $params[':status'] = $status;
        }
        if ($descricao !== null) {
            $fields[] = "descricao = :descricao";
            $params[':descricao'] = $descricao;
        }
        if ($observacoes !== null) {
            $fields[] = "observacoes = :observacoes";
            $params[':observacoes'] = $observacoes;
        }
        if ($empresa !== null) {
            $fields[] = "empresa = :empresa";
            $params[':empresa'] = $empresa;
        }
        if ($solicitante !== null) {
            $fields[] = "solicitante = :solicitante";
            $params[':solicitante'] = $solicitante;
        }
        if ($tipo !== null) {
            $fields[] = "tipo = :tipo";
            $params[':tipo'] = $tipo;
        }
        if (isset($input['lead_id'])) {
            $fields[] = "lead_id = :lead_id";
            $params[':lead_id'] = $lead_id;
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nenhum campo fornecido para atualização."]);
            exit();
        }

        $query = "UPDATE suportes SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $success = $stmt->execute($params);

        if ($success) {
            echo json_encode(["status" => "success", "message" => "Ticket atualizado com sucesso!"]);
        } else {
            throw new Exception("Falha ao atualizar o ticket.");
        }
        exit();
    }

    // ------------------------------------------
    // ROTA DELETE: Excluir chamado
    // ------------------------------------------
    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID do ticket não fornecido."]);
            exit();
        }

        $id = intval($_GET['id']);
        
        $stmt = $db->prepare("DELETE FROM suportes WHERE id = :id");
        $success = $stmt->execute([':id' => $id]);

        if ($success) {
            echo json_encode(["status" => "success", "message" => "Ticket removido com sucesso!"]);
        } else {
            throw new Exception("Falha ao remover o ticket.");
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
