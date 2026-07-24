<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// ROTA POST (PÚBLICA - CAPTAÇÃO DA LANDING PAGE)
// ==========================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Dados em formato inválido ou corpo vazio."]);
        exit();
    }
    
    $nome = isset($input['nome_completo']) ? trim(strip_tags($input['nome_completo'])) : null;
    $email = isset($input['email_corporativo']) ? trim(filter_var($input['email_corporativo'], FILTER_SANITIZE_EMAIL)) : null;
    $cnpj = isset($input['cnpj']) ? trim(strip_tags($input['cnpj'])) : null;
    $empresa = isset($input['empresa']) ? trim(strip_tags($input['empresa'])) : null;
    $whatsapp = isset($input['whatsapp']) ? trim(strip_tags($input['whatsapp'])) : null;
    
    if (empty($nome) || empty($email) || empty($empresa) || empty($whatsapp)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nome completo, e-mail corporativo, empresa e whatsapp são obrigatórios."]);
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Formato de e-mail inválido."]);
        exit();
    }
    
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    
    try {
        $db = Database::getConnection();
        
        // Ignorar rate limit para requisições autenticadas (cadastro interno via painel)
        $is_auth = AuthHelper::validateTokenFromHeader() !== false;
        
        if (!$is_auth) {
            // Anti-spam: Max 5 leads por hora por IP (cálculo de data em PHP para portabilidade)
            $hour_ago = date('Y-m-d H:i:s', strtotime('-1 hour'));
            $spam_stmt = $db->prepare("
                SELECT COUNT(*) FROM leads 
                WHERE ip_origem = :ip AND data_cadastro > :hour_ago
            ");
            $spam_stmt->execute([':ip' => $ip, ':hour_ago' => $hour_ago]);
            $leads_recentes = $spam_stmt->fetchColumn();
            
            if ($leads_recentes >= 5) {
                http_response_code(429);
                echo json_encode(["status" => "error", "message" => "Muitas solicitações a partir deste IP. Tente novamente mais tarde."]);
                exit();
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO leads (nome_completo, email_corporativo, cnpj, empresa, whatsapp, ip_origem, status) 
            VALUES (:nome, :email, :cnpj, :empresa, :whatsapp, :ip, 'novo')
        ");
        
        $success = $stmt->execute([
            ':nome' => $nome,
            ':email' => $email,
            ':cnpj' => $cnpj,
            ':empresa' => $empresa,
            ':whatsapp' => $whatsapp,
            ':ip' => $ip
        ]);
        
        if ($success) {
            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "message" => "Lead cadastrado com sucesso!",
                "id" => $db->lastInsertId()
            ]);
        } else {
            throw new Exception("Falha ao salvar lead.");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit();
}

// ==========================================
// ROTAS AUTENTICADAS (GET, PUT, DELETE)
// ==========================================
$userData = AuthHelper::validateTokenFromHeader();

if (!$userData) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Token inválido ou ausente. Acesso não autorizado."]);
    exit();
}

try {
    $db = Database::getConnection();

    // ------------------------------------------
    // ROTA GET: Detalhes de um Lead (?id=X) ou Listagem geral
    // ------------------------------------------
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Buscar lead específico
            $id = intval($_GET['id']);
            $stmt = $db->prepare("
                SELECT l.*, u.nome as responsavel_nome 
                FROM leads l 
                LEFT JOIN usuarios u ON l.responsavel_id = u.id 
                WHERE l.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $lead = $stmt->fetch();
            
            if (!$lead) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Lead não encontrado."]);
                exit();
            }
            
            echo json_encode(["status" => "success", "data" => $lead]);
            exit();
        } else {
            // Listagem com Filtros
            $status = isset($_GET['status']) ? trim($_GET['status']) : null;
            $busca = isset($_GET['busca']) ? trim($_GET['busca']) : null;
            $periodo = isset($_GET['periodo']) ? intval($_GET['periodo']) : null; // dias, ex: 7, 30
            $meusAtendimentos = isset($_GET['meus_atendimentos']) && $_GET['meus_atendimentos'] === 'true';
            
            $query = "SELECT l.*, u.nome as responsavel_nome 
                      FROM leads l 
                      LEFT JOIN usuarios u ON l.responsavel_id = u.id 
                      WHERE 1=1";
            $params = [];
            
            // Filtro por papel do usuário (Se CEO com flag meusAtendimentos, filtra)
            if ($meusAtendimentos || ($userData['papel'] === 'ceo' && $meusAtendimentos)) {
                $query .= " AND l.responsavel_id = :user_id";
                $params[':user_id'] = $userData['id'];
            }
            
            // Filtro por Status
            if ($status === 'os') {
                $query .= " AND l.status IN ('fechado', 'concluido')";
            } else if (!empty($status)) {
                $query .= " AND l.status = :status";
                $params[':status'] = $status;
            }
            
            // Filtro de Busca (empresa, nome, email)
            if (!empty($busca)) {
                $query .= " AND (l.nome_completo LIKE :busca OR l.email_corporativo LIKE :busca OR l.empresa LIKE :busca)";
                $params[':busca'] = "%" . $busca . "%";
            }
            
            // Filtro de Período (em dias)
            if ($periodo) {
                $query .= " AND l.data_cadastro >= :periodo_date";
                $params[':periodo_date'] = date('Y-m-d H:i:s', strtotime("-$periodo days"));
            }

            // Filtro de Período por Mês e Ano
            $mes = isset($_GET['mes']) && $_GET['mes'] !== '' ? intval($_GET['mes']) : null;
            $ano = isset($_GET['ano']) && $_GET['ano'] !== '' ? intval($_GET['ano']) : null;
            
            if ($mes && $ano) {
                $start = new DateTime("$ano-$mes-01 00:00:00");
                $end = clone $start;
                $end->modify('last day of this month');
                $end->setTime(23, 59, 59);
                
                $params[':start_date'] = $start->format('Y-m-d H:i:s');
                $params[':end_date'] = $end->format('Y-m-d H:i:s');

                if ($status === 'fechado' || $status === 'concluido' || $status === 'os') {
                    $query .= " AND l.data_atualizacao >= :start_date AND l.data_atualizacao <= :end_date";
                } else {
                    $query .= " AND l.data_cadastro >= :start_date AND l.data_cadastro <= :end_date";
                }
            }
            
            $query .= " ORDER BY l.data_cadastro DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $leads = $stmt->fetchAll();
            
            echo json_encode(["status" => "success", "data" => $leads]);
            exit();
        }
    }

    // ------------------------------------------
    // ROTA PUT: Atualizar lead (?id=X)
    // ------------------------------------------
    if ($method === 'PUT') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID do lead é obrigatório para atualização."]);
            exit();
        }
        
        $id = intval($_GET['id']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Dados em formato inválido ou corpo vazio."]);
            exit();
        }
        
        // Validar existência do lead
        $stmt_check = $db->prepare("SELECT id FROM leads WHERE id = :id");
        $stmt_check->execute([':id' => $id]);
        if (!$stmt_check->fetch()) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Lead não encontrado."]);
            exit();
        }
        
        // Coletar campos atualizáveis
        $status = isset($input['status']) ? trim($input['status']) : null;
        $orcamento = isset($input['orcamento_solicitado']) ? floatval($input['orcamento_solicitado']) : null;
        $proposto = isset($input['valor_proposto']) ? floatval($input['valor_proposto']) : null;
        $fechado = isset($input['valor_fechado']) ? floatval($input['valor_fechado']) : null;
        $observacoes = isset($input['observacoes']) ? trim(strip_tags($input['observacoes'])) : null;
        $responsavel_id = isset($input['responsavel_id']) ? intval($input['responsavel_id']) : null;
        
        // Novos campos corporativos
        $nome = isset($input['nome_completo']) ? trim(strip_tags($input['nome_completo'])) : null;
        $email = isset($input['email_corporativo']) ? trim(filter_var($input['email_corporativo'], FILTER_SANITIZE_EMAIL)) : null;
        $cnpj = isset($input['cnpj']) ? trim(strip_tags($input['cnpj'])) : null;
        $empresa = isset($input['empresa']) ? trim(strip_tags($input['empresa'])) : null;
        $whatsapp = isset($input['whatsapp']) ? trim(strip_tags($input['whatsapp'])) : null;
        
        // Se responsavel_id for informado, verificar se o usuário existe
        if ($responsavel_id) {
            $user_check = $db->prepare("SELECT id FROM usuarios WHERE id = :user_id");
            $user_check->execute([':user_id' => $responsavel_id]);
            if (!$user_check->fetch()) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Usuário responsável inválido."]);
                exit();
            }
        }
        
        // Montar query de UPDATE dinamicamente
        $fields = [];
        $params = [':id' => $id];
        
        if ($status !== null) {
            $fields[] = "status = :status";
            $params[':status'] = $status;
        }
        if (isset($input['orcamento_solicitado'])) {
            $fields[] = "orcamento_solicitado = :orcamento";
            $params[':orcamento'] = $orcamento;
        }
        if (isset($input['valor_proposto'])) {
            $fields[] = "valor_proposto = :proposto";
            $params[':proposto'] = $proposto;
        }
        if (isset($input['valor_fechado'])) {
            $fields[] = "valor_fechado = :fechado";
            $params[':fechado'] = $fechado;
        }
        if ($observacoes !== null) {
            $fields[] = "observacoes = :observacoes";
            $params[':observacoes'] = $observacoes;
        }
        if (isset($input['responsavel_id'])) {
            $fields[] = "responsavel_id = :responsavel_id";
            $params[':responsavel_id'] = $responsavel_id === 0 ? null : $responsavel_id;
        }
        if ($nome !== null) {
            $fields[] = "nome_completo = :nome";
            $params[':nome'] = $nome;
        }
        if ($email !== null) {
            $fields[] = "email_corporativo = :email";
            $params[':email'] = $email;
        }
        if (isset($input['cnpj'])) {
            $fields[] = "cnpj = :cnpj";
            $params[':cnpj'] = $cnpj;
        }
        if ($empresa !== null) {
            $fields[] = "empresa = :empresa";
            $params[':empresa'] = $empresa;
        }
        if ($whatsapp !== null) {
            $fields[] = "whatsapp = :whatsapp";
            $params[':whatsapp'] = $whatsapp;
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nenhum campo fornecido para atualização."]);
            exit();
        }
        
        $query = "UPDATE leads SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $success = $stmt->execute($params);
        
        if ($success) {
            echo json_encode(["status" => "success", "message" => "Lead atualizado com sucesso!"]);
        } else {
            throw new Exception("Falha ao atualizar o lead.");
        }
        exit();
    }

    // ------------------------------------------
    // ROTA DELETE: Remover lead (?id=X)
    // ------------------------------------------
    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID do lead é obrigatório para exclusão."]);
            exit();
        }
        
        $id = intval($_GET['id']);
        
        $stmt = $db->prepare("DELETE FROM leads WHERE id = :id");
        $success = $stmt->execute([':id' => $id]);
        
        if ($success && $stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "Lead removido com sucesso."]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Lead não encontrado ou já foi excluído."]);
        }
        exit();
    }

    // Método não suportado para as rotas autenticadas
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro de banco de dados: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
