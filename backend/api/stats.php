<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
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

try {
    $db = Database::getConnection();
    
    $meusAtendimentos = isset($_GET['meus_atendimentos']) && $_GET['meus_atendimentos'] === 'true';
    $mes = isset($_GET['mes']) && $_GET['mes'] !== '' ? intval($_GET['mes']) : intval(date('m'));
    $ano = isset($_GET['ano']) && $_GET['ano'] !== '' ? intval($_GET['ano']) : intval(date('Y'));
    
    // Calcular range de datas padrão para compatibilidade entre MySQL e PostgreSQL
    $start = new DateTime("$ano-$mes-01 00:00:00");
    $end = clone $start;
    $end->modify('last day of this month');
    $end->setTime(23, 59, 59);
    
    $startDateStr = $start->format('Y-m-d H:i:s');
    $endDateStr = $end->format('Y-m-d H:i:s');
    
    // Filtro básico de atendimentos
    $userFilter = "";
    $params = [
        ':start_date' => $startDateStr,
        ':end_date' => $endDateStr
    ];
    
    if ($meusAtendimentos || ($userData['papel'] === 'ceo' && $meusAtendimentos)) {
        $userFilter = " AND responsavel_id = :user_id";
        $params[':user_id'] = $userData['id'];
    }
    
    // 1. Total de Leads criados no mês selecionado
    $stmtTotal = $db->prepare("
        SELECT COUNT(*) FROM leads 
        WHERE data_cadastro >= :start_date AND data_cadastro <= :end_date" . $userFilter
    );
    $stmtTotal->execute($params);
    $total = (int)$stmtTotal->fetchColumn();
    
    // 2. Leads Ativos criados no mês selecionado
    $stmtAtivos = $db->prepare("
        SELECT COUNT(*) FROM leads 
        WHERE status IN ('em_contato', 'ativo') 
        AND data_cadastro >= :start_date AND data_cadastro <= :end_date" . $userFilter
    );
    $stmtAtivos->execute($params);
    $ativos = (int)$stmtAtivos->fetchColumn();
    
    // 3. Leads Fechados / Concluídos no mês selecionado (faturamento ocorre quando fecha/conclui)
    $stmtFechados = $db->prepare("
        SELECT COUNT(*) FROM leads 
        WHERE status IN ('fechado', 'concluido') 
        AND data_atualizacao >= :start_date AND data_atualizacao <= :end_date" . $userFilter
    );
    $stmtFechados->execute($params);
    $fechados = (int)$stmtFechados->fetchColumn();
    
    // 4. Taxa de Conversão (%) no período
    $conversao = 0;
    if ($total > 0) {
        $conversao = round(($fechados / $total) * 100, 1);
    }
    
    // 5. Valor Total Fechado/Faturamento no mês selecionado
    $stmtValor = $db->prepare("
        SELECT SUM(valor_fechado) FROM leads 
        WHERE status IN ('fechado', 'concluido') 
        AND data_atualizacao >= :start_date AND data_atualizacao <= :end_date" . $userFilter
    );
    $stmtValor->execute($params);
    $totalValor = (float)$stmtValor->fetchColumn() ?: 0.0;

    echo json_encode([
        "status" => "success",
        "data" => [
            "total" => $total,
            "ativos" => $ativos,
            "fechados" => $fechados,
            "conversao" => $conversao,
            "totalValor" => $totalValor
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro de banco de dados: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
