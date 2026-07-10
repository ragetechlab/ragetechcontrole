import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardCards from '../components/DashboardCards';
import LeadsTable from '../components/LeadsTable';
import LeadModal from '../components/LeadModal';
import SuportesTable from '../components/SuportesTable';
import SuporteModal from '../components/SuporteModal';
import { Search, Filter, RefreshCw, Plus, Edit3, Trash2, ShieldAlert, X } from 'lucide-react';

export default function Dashboard({ token, usuario, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, ativos: 0, fechados: 0, conversao: 0, totalValor: 0 });
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState(''); // vazio, 7, 30
  const [meusAtendimentos, setMeusAtendimentos] = useState(false);
  
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros de Mês e Ano para faturamento histórico e métricas
  const [mesFiltro, setMesFiltro] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [anoFiltro, setAnoFiltro] = useState(() => String(new Date().getFullYear()));

  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);

  // Estados da aba de Suporte
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Estados de Gerenciamento de Usuários
  const [selectedUsuarioToEdit, setSelectedUsuarioToEdit] = useState(null);
  const [uNome, setUNome] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uSenha, setUSenha] = useState('');
  const [uPapel, setUPapel] = useState('funcionario');
  const [uAcessos, setUAcessos] = useState(['dashboard', 'leads', 'os', 'suportes']);

  const hasValoresAccess = usuario?.papel === 'ceo' || (usuario?.acessos && usuario.acessos.split(',').includes('valores'));

  // Helper para obter URL base
  const getApiUrl = (endpoint) => {
    return import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/${endpoint}`
      : window.location.origin.includes('5173') 
        ? `http://localhost:8000/api/${endpoint}`
        : `/backend/api/${endpoint}`;
  };

  // Carregar Estatísticas
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const url = getApiUrl(`stats.php?meus_atendimentos=${meusAtendimentos}&mes=${mesFiltro}&ano=${anoFiltro}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Carregar Leads
  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      
      // Se a aba ativa for OS, filtra usando o status especial 'os' (fechado/concluido)
      if (activeTab === 'os') {
        params.append('status', 'os');
      } else if (statusFiltro) {
        params.append('status', statusFiltro);
      }
      
      if (periodoFiltro) params.append('periodo', periodoFiltro);
      if (meusAtendimentos) params.append('meus_atendimentos', 'true');
      
      // Filtros de mês/ano
      params.append('mes', mesFiltro);
      params.append('ano', anoFiltro);

      const url = getApiUrl(`leads.php?${params.toString()}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setLeads(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Carregar lista de usuários para atribuição no Modal
  const fetchUsuarios = async () => {
    try {
      const url = getApiUrl('usuarios.php');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUsuariosDisponiveis(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  // Carregar Tickets de Suporte
  const fetchTickets = async () => {
    if (activeTab !== 'suportes') return;
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      params.append('mes', mesFiltro);
      params.append('ano', anoFiltro);

      const url = getApiUrl(`suportes.php?${params.toString()}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar tickets de suporte:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLeads();
    fetchUsuarios();
    fetchTickets();
  }, [busca, statusFiltro, periodoFiltro, meusAtendimentos, refreshKey, token, activeTab, mesFiltro, anoFiltro]);

  // Redirecionar usuário caso tente acessar aba não permitida
  useEffect(() => {
    if (usuario) {
      if (usuario.papel === 'ceo') return; // CEOs sempre têm acesso a tudo
      const allowed = usuario.acessos ? usuario.acessos.split(',') : ['dashboard'];
      if (!allowed.includes(activeTab)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [activeTab, usuario]);

  // Sincronizar formulário de usuário ao editar
  useEffect(() => {
    if (selectedUsuarioToEdit) {
      setUNome(selectedUsuarioToEdit.nome || '');
      setUEmail(selectedUsuarioToEdit.email || '');
      setUSenha('');
      setUPapel(selectedUsuarioToEdit.papel || 'funcionario');
      setUAcessos(selectedUsuarioToEdit.acessos ? selectedUsuarioToEdit.acessos.split(',') : ['dashboard', 'leads', 'os', 'suportes']);
    } else {
      setUNome('');
      setUEmail('');
      setUSenha('');
      setUPapel('funcionario');
      setUAcessos(['dashboard', 'leads', 'os', 'suportes']);
    }
  }, [selectedUsuarioToEdit]);

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
  };

  const handleSaveLead = async (updatedFields) => {
    try {
      const isCreate = !updatedFields.id;
      const url = isCreate 
        ? getApiUrl('leads.php') 
        : getApiUrl(`leads.php?id=${updatedFields.id}`);
        
      const method = isCreate ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSelectedLead(null);
        setRefreshKey(prev => prev + 1); // Atualiza os dados
      } else {
        alert(data.message || 'Erro ao salvar o lead.');
      }
    } catch (err) {
      console.error('Erro ao salvar lead:', err);
      alert('Erro de conexão ao salvar lead.');
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este lead?')) return;
    try {
      const url = getApiUrl(`leads.php?id=${id}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRefreshKey(prev => prev + 1);
      } else {
        alert(data.message || 'Erro ao excluir o lead.');
      }
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
    }
  };

  const handleSaveTicket = async (fields) => {
    try {
      const isCreate = !fields.id;
      const url = isCreate 
        ? getApiUrl('suportes.php') 
        : getApiUrl(`suportes.php?id=${fields.id}`);
        
      const method = isCreate ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSelectedTicket(null);
        setRefreshKey(prev => prev + 1);
      } else {
        alert(data.message || 'Erro ao salvar o chamado.');
      }
    } catch (err) {
      console.error('Erro ao salvar ticket:', err);
      alert('Erro de conexão ao salvar chamado.');
    }
  };

  const handleDeleteTicket = async (id) => {
    try {
      const url = getApiUrl(`suportes.php?id=${id}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSelectedTicket(null);
        setRefreshKey(prev => prev + 1);
      } else {
        alert(data.message || 'Erro ao excluir o chamado.');
      }
    } catch (err) {
      console.error('Erro ao excluir ticket:', err);
      alert('Erro de conexão ao excluir chamado.');
    }
  };

  const handleSaveUsuario = async (uFields) => {
    try {
      const isCreate = !uFields.id;
      const url = isCreate 
        ? getApiUrl('usuarios.php') 
        : getApiUrl(`usuarios.php?id=${uFields.id}`);
        
      const method = isCreate ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(uFields)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSelectedUsuarioToEdit(null);
        setRefreshKey(prev => prev + 1); // Atualiza usuários e dropdowns
      } else {
        alert(data.message || 'Erro ao salvar funcionário.');
      }
    } catch (err) {
      console.error('Erro ao salvar funcionário:', err);
      alert('Erro de conexão ao salvar funcionário.');
    }
  };

  const handleDeleteUsuario = async (id) => {
    if (id === usuario.id) {
      alert('Você não pode excluir sua própria conta.');
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este funcionário permanentemente?')) return;
    
    try {
      const url = getApiUrl(`usuarios.php?id=${id}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRefreshKey(prev => prev + 1);
      } else {
        alert(data.message || 'Erro ao excluir funcionário.');
      }
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err);
      alert('Erro de conexão ao excluir funcionário.');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', width: '100vw', overflowX: 'hidden' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        usuario={usuario} 
      />
      
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFF' }}>
              {activeTab === 'dashboard' ? 'Painel de Controle' : activeTab === 'leads' ? 'Gerenciador de Leads' : activeTab === 'os' ? 'Ordem de Serviço (OS)' : activeTab === 'suportes' ? 'Suporte & Chamados' : 'Configurações'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Rege Tech Controle &bull; {usuario?.papel === 'admin' ? 'Administrador' : 'CEO'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Seletor de Período para Faturamento e Histórico */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.25rem 0.5rem',
              height: '38px'
            }}>
              <select 
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
              <select 
                value={anoFiltro}
                onChange={(e) => setAnoFiltro(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                  borderLeft: '1px solid var(--border-color)',
                  paddingLeft: '0.5rem',
                  fontWeight: 500
                }}
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <button 
              onClick={handleRefresh}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.85rem',
                transition: 'background-color 0.2s',
                height: '38px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            >
              <RefreshCw size={16} />
              Sincronizar
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            {/* Metric Cards */}
            {loadingStats ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando métricas...</div>
            ) : (
              <DashboardCards stats={stats} hasValoresAccess={hasValoresAccess} />
            )}

            {/* Leads Quick Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Leads em Aberto</h2>
              </div>
              
              {loadingLeads ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando listagem...</div>
              ) : (
                <LeadsTable 
                  leads={leads.slice(0, 5)} 
                  onEdit={handleEditLead} 
                  onDelete={handleDeleteLead}
                  usuario={usuario}
                  hasValoresAccess={hasValoresAccess}
                />
              )}
            </div>
          </>
        )}

        {activeTab === 'leads' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filtros Bar */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '1rem 1.5rem',
              borderRadius: '12px'
            }}>
              {/* Pesquisa */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar por empresa, nome ou e-mail..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status */}
              <div style={{ minWidth: '150px' }}>
                <select 
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Todos os Status</option>
                  <option value="novo">Novo</option>
                  <option value="em_contato">Em Contato</option>
                  <option value="ativo">Ativo</option>
                  <option value="fechado">Fechado</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>

              {/* Período */}
              <div style={{ minWidth: '150px' }}>
                <select 
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Qualquer Período</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </div>

              {/* Meus Atendimentos Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="meusAtendimentos"
                  checked={meusAtendimentos}
                  onChange={(e) => setMeusAtendimentos(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="meusAtendimentos" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                  Meus Atendimentos
                </label>
              </div>

              <button
                onClick={() => setSelectedLead({})}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'var(--primary-color)',
                  border: 'none',
                  color: '#FFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginLeft: 'auto'
                }}
              >
                <Plus size={16} />
                Novo Lead
              </button>
            </div>

            {/* Leads Table */}
            {loadingLeads ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando dados dos leads...</div>
            ) : (
              <LeadsTable 
                leads={leads} 
                onEdit={handleEditLead} 
                onDelete={handleDeleteLead}
                usuario={usuario}
                hasValoresAccess={hasValoresAccess}
              />
            )}
          </div>
        )}

        {activeTab === 'os' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Cards de Métricas específicos para OS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              width: '100%'
            }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Ordens de Serviço em Entrega</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: '#FFF' }}>{leads.length}</div>
              </div>
              {hasValoresAccess && (
                <>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Faturamento Total Contratado</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--primary-color)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        leads.reduce((sum, lead) => sum + (parseFloat(lead.valor_fechado) || 0), 0)
                      )}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Ticket Médio do Serviço</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-color)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        leads.length > 0
                          ? (leads.reduce((sum, lead) => sum + (parseFloat(lead.valor_fechado) || 0), 0) / leads.length)
                          : 0
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Barra de Filtros OS */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '1rem 1.5rem',
              borderRadius: '12px'
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar OS por empresa, cliente ou e-mail..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="meusAtendimentosOS"
                  checked={meusAtendimentos}
                  onChange={(e) => setMeusAtendimentos(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="meusAtendimentosOS" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                  Minhas Demandas (OS)
                </label>
              </div>

              <button
                onClick={() => setSelectedLead({ status: 'fechado' })}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'var(--primary-color)',
                  border: 'none',
                  color: '#FFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginLeft: 'auto'
                }}
              >
                <Plus size={16} />
                Nova OS
              </button>
            </div>

            {/* Tabela de OS */}
            {loadingLeads ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando Ordens de Serviço...</div>
            ) : (
              <LeadsTable 
                leads={leads} 
                onEdit={handleEditLead} 
                onDelete={handleDeleteLead}
                usuario={usuario}
                hasValoresAccess={hasValoresAccess}
              />
            )}
          </div>
        )}

        {activeTab === 'suportes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Barra de Filtros Suporte */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '1rem 1.5rem',
              borderRadius: '12px'
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar chamados por empresa, solicitante ou descrição..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={() => setSelectedTicket({})}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'var(--primary-color)',
                  border: 'none',
                  color: '#FFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginLeft: 'auto'
                }}
              >
                <Plus size={16} />
                Novo Chamado
              </button>
            </div>

            {/* Tabela de Suportes */}
            {loadingTickets ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando chamados de suporte...</div>
            ) : (
              <SuportesTable 
                tickets={tickets} 
                onEdit={setSelectedTicket} 
                onDelete={handleDeleteTicket}
                usuario={usuario}
              />
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
            {/* System Info Box */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '600px'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#FFF' }}>Configurações do Sistema</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Gerenciamento de preferências técnicas do Rege Tech Controle.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>Conexão com Banco de Dados</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: Conectado a localhost (regetech_controle)</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>Domínio Autorizado para CORS</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Permitindo qualquer origem (*) durante desenvolvimento.</span>
                </div>
              </div>
            </div>

            {/* Gerenciamento de Funcionários (Exclusivo CEO) */}
            {usuario?.papel === 'ceo' && (
              <div style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>Gerenciamento de Funcionários</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Crie funcionários, edite permissões e controle quem pode ver cada aba do sistema.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUsuarioToEdit({})}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: 'var(--primary-color)',
                      border: 'none',
                      color: '#FFF',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus size={16} />
                    Novo Funcionário
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nome</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>E-mail</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Função</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Acessos Liberados</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosDisponiveis.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.nome}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              backgroundColor: u.papel === 'ceo' ? 'rgba(255, 90, 0, 0.15)' : u.papel === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                              color: u.papel === 'ceo' ? 'var(--primary-color)' : u.papel === 'admin' ? '#3B82F6' : 'var(--text-secondary)'
                            }}>
                              {u.papel === 'ceo' ? 'CEO' : u.papel === 'admin' ? 'Administrador' : 'Funcionário'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap', border: 'none' }}>
                            {u.acessos ? u.acessos.split(',').map(acc => (
                              <span key={acc} style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.15rem 0.35rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                {acc === 'dashboard' ? 'Dashboard' : acc === 'leads' ? 'Leads' : acc === 'os' ? 'OS' : acc === 'suportes' ? 'Suporte' : 'Config'}
                              </span>
                            )) : <span style={{ fontStyle: 'italic', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Nenhum</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => setSelectedUsuarioToEdit(u)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Edit3 size={14} />
                              </button>
                              {u.id !== usuario.id && (
                                <button
                                  onClick={() => handleDeleteUsuario(u.id)}
                                  style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail & Edit Modal */}
      {selectedLead && (
        <LeadModal 
          lead={selectedLead} 
          onClose={handleCloseModal} 
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          usuariosDisponiveis={usuariosDisponiveis}
          usuarioLogado={usuario}
          hasValoresAccess={hasValoresAccess}
        />
      )}

      {selectedTicket && (
        <SuporteModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onSave={handleSaveTicket}
          onDelete={handleDeleteTicket}
          leadsDisponiveis={leads}
          usuarioLogado={usuario}
        />
      )}

      {/* Modal de Criar/Editar Usuários (Funcionários) */}
      {selectedUsuarioToEdit && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(6px)',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF' }}>
                  {!selectedUsuarioToEdit.id ? 'Cadastrar Funcionário' : 'Editar Cadastro / Acessos'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {!selectedUsuarioToEdit.id ? 'Crie as credenciais de acesso do novo funcionário' : `Modificando cadastro de ${uNome}`}
                </span>
              </div>
              <button 
                onClick={() => setSelectedUsuarioToEdit(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!uNome.trim() || !uEmail.trim()) {
                alert('Nome e E-mail são obrigatórios.');
                return;
              }
              if (!selectedUsuarioToEdit.id && !uSenha) {
                alert('A senha é obrigatória para cadastros novos.');
                return;
              }
              handleSaveUsuario({
                id: selectedUsuarioToEdit.id || null,
                nome: uNome.trim(),
                email: uEmail.trim(),
                senha: uSenha || null,
                papel: uPapel,
                acessos: uAcessos.join(',')
              });
            }} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nome Completo *</label>
                <input 
                  type="text" required value={uNome} onChange={(e) => setUNome(e.target.value)}
                  placeholder="Ex: Guilherme Moura"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>E-mail de Acesso *</label>
                <input 
                  type="email" required value={uEmail} onChange={(e) => setUEmail(e.target.value)}
                  placeholder="Ex: guilherme@ragetech.com"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {selectedUsuarioToEdit.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                </label>
                <input 
                  type="password" required={!selectedUsuarioToEdit.id} value={uSenha} onChange={(e) => setUSenha(e.target.value)}
                  placeholder="Ex: SenhaForte@123"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Função / Papel</label>
                  <select 
                    value={uPapel} onChange={(e) => setUPapel(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                  >
                    <option value="funcionario" style={{ color: '#000', backgroundColor: '#FFF' }}>Funcionário</option>
                    <option value="admin" style={{ color: '#000', backgroundColor: '#FFF' }}>Administrador</option>
                    <option value="ceo" style={{ color: '#000', backgroundColor: '#FFF' }}>CEO</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Acessos Permitidos no Painel</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'leads', label: 'Leads' },
                    { id: 'os', label: 'Ordem de Serviço (OS)' },
                    { id: 'suportes', label: 'Suporte / Tickets' },
                    { id: 'valores', label: 'Valores / Financeiro' },
                    { id: 'config', label: 'Configurações / Usuários' }
                  ].map(acc => {
                    const isChecked = uAcessos.includes(acc.id);
                    return (
                      <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" id={`chk-${acc.id}`} checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUAcessos([...uAcessos, acc.id]);
                            } else {
                              setUAcessos(uAcessos.filter(x => x !== acc.id));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor={`chk-${acc.id}`} style={{ fontSize: '0.85rem', color: '#FFF', cursor: 'pointer', userSelect: 'none' }}>
                          {acc.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" onClick={() => setSelectedUsuarioToEdit(null)}
                  style={{ padding: '0.65rem 1.25rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', backgroundColor: 'var(--primary-color)', border: 'none', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {selectedUsuarioToEdit.id ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
