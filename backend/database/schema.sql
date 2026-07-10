CREATE DATABASE IF NOT EXISTS regetech_controle
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE regetech_controle;

-- Tabela de Usuários (Administradores e CEOs)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    papel ENUM('admin', 'ceo', 'funcionario') NOT NULL DEFAULT 'funcionario',
    acessos VARCHAR(255) NOT NULL DEFAULT 'dashboard,leads,os,suportes',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de Leads
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    email_corporativo VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NULL,
    empresa VARCHAR(255) NULL,
    whatsapp VARCHAR(50) NULL,
    orcamento_solicitado DECIMAL(10,2) NULL,
    valor_proposto DECIMAL(10,2) NULL,
    valor_fechado DECIMAL(10,2) NULL,
    status ENUM('novo', 'em_contato', 'ativo', 'fechado', 'perdido', 'concluido') NOT NULL DEFAULT 'novo',
    observacoes TEXT NULL,
    responsavel_id INT NULL,
    ip_origem VARCHAR(45) NULL, -- Guardado para rate limiting / spam
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabela de Suportes e Atualizações
CREATE TABLE IF NOT EXISTS suportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NULL,
    empresa VARCHAR(255) NOT NULL,
    solicitante VARCHAR(255) NULL,
    tipo ENUM('suporte', 'atualizacao') NOT NULL DEFAULT 'suporte',
    descricao TEXT NOT NULL,
    status ENUM('aberto', 'em_andamento', 'concluido') NOT NULL DEFAULT 'aberto',
    observacoes TEXT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Índices recomendados para buscas e filtros rápidos
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_data_cadastro ON leads(data_cadastro);
CREATE INDEX idx_leads_responsavel ON leads(responsavel_id);
CREATE INDEX idx_suportes_data_cadastro ON suportes(data_cadastro);

-- Usuário Admin Padrão (Senha inicial: RegeTech@2026)
-- IMPORTANTE: Esta senha deve ser trocada no primeiro acesso
INSERT INTO usuarios (nome, email, senha_hash, papel, acessos) VALUES
('Talysson', 'talysson@ragetech.com', '$2y$10$ikCWGl453CFNY5VvkpIa6er1c9A54vGntyyBBrgUaP1fZGn1YwIma', 'ceo', 'dashboard,leads,os,suportes,config'),
('Gustavo', 'gustavo@ragetech.com', '$2y$10$ikCWGl453CFNY5VvkpIa6er1c9A54vGntyyBBrgUaP1fZGn1YwIma', 'ceo', 'dashboard,leads,os,suportes,config'),
('Brian', 'brian@ragetech.com', '$2y$10$ikCWGl453CFNY5VvkpIa6er1c9A54vGntyyBBrgUaP1fZGn1YwIma', 'ceo', 'dashboard,leads,os,suportes,config')
ON DUPLICATE KEY UPDATE id=id;
