import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar, User, Trash2, ShieldAlert } from 'lucide-react';

export default function LeadModal({ lead, onClose, onSave, onDelete, usuariosDisponiveis = [], usuarioLogado, hasValoresAccess = true }) {
  const isCreationMode = !lead || !lead.id;

  // Estados dos campos de contato e empresa
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [emailCorporativo, setEmailCorporativo] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Estados dos campos comerciais
  const [status, setStatus] = useState('novo');
  const [orcamento, setOrcamento] = useState('');
  const [proposto, setProposto] = useState('');
  const [fechado, setFechado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  
  // Controle de novos andamentos de demanda (OS)
  const [novoAndamento, setNovoAndamento] = useState('');
  const timelineEndRef = useRef(null);

  // Reset/popular states ao abrir o modal ou mudar o lead
  useEffect(() => {
    if (lead) {
      setNomeCompleto(lead.nome_completo || '');
      setEmailCorporativo(lead.email_corporativo || '');
      setCnpj(lead.cnpj || '');
      setEmpresa(lead.empresa || '');
      setWhatsapp(lead.whatsapp || '');
      setStatus(lead.status || 'novo');
      setOrcamento(lead.orcamento_solicitado || '');
      setProposto(lead.valor_proposto || '');
      setFechado(lead.valor_fechado || '');
      setObservacoes(lead.observacoes || '');
      setResponsavelId(lead.responsavel_id || '');
    } else {
      setNomeCompleto('');
      setEmailCorporativo('');
      setCnpj('');
      setEmpresa('');
      setWhatsapp('');
      setStatus('novo');
      setOrcamento('');
      setProposto('');
      setFechado('');
      setObservacoes('');
      setResponsavelId('');
    }
    setNovoAndamento('');
  }, [lead]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nomeCompleto.trim() || !emailCorporativo.trim()) {
      alert('Nome completo e E-mail corporativo são obrigatórios.');
      return;
    }

    onSave({
      id: lead?.id || null, // nulo no cadastro
      nome_completo: nomeCompleto.trim(),
      email_corporativo: emailCorporativo.trim(),
      cnpj: cnpj.trim() || null,
      empresa: empresa.trim() || null,
      whatsapp: whatsapp.trim() || null,
      status,
      orcamento_solicitado: orcamento !== '' ? parseFloat(orcamento) : null,
      valor_proposto: proposto !== '' ? parseFloat(proposto) : null,
      valor_fechado: (status === 'fechado' || status === 'concluido') && fechado !== '' ? parseFloat(fechado) : null,
      observacoes: observacoes.trim(),
      responsavel_id: responsavelId !== '' ? parseInt(responsavelId) : null
    });
  };

  // Tratar exclusão do lead
  const handleDeleteClick = () => {
    if (window.confirm('Tem certeza de que deseja excluir permanentemente esta demanda?')) {
      onDelete(lead.id);
      onClose();
    }
  };

  // Adicionar um novo andamento estruturado à timeline nas observações
  const handleAddAndamento = () => {
    if (!novoAndamento.trim()) return;

    const dataAtual = new Date();
    const timestamp = dataAtual.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const autor = usuarioLogado ? usuarioLogado.nome : 'Sistema';
    const novaLinha = `[${timestamp}] ${autor}: ${novoAndamento.trim()}`;

    const observacoesAtualizadas = observacoes.trim() 
      ? `${observacoes.trim()}\n${novaLinha}`
      : novaLinha;

    setObservacoes(observacoesAtualizadas);
    setNovoAndamento('');

    // Scroll para o fim da timeline após adicionar
    setTimeout(() => {
      if (timelineEndRef.current) {
        timelineEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Função para parsear observações brutas em entradas da timeline
  const parseTimeline = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const result = [];
    let genericLines = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Regex para encontrar "[DD/MM/AAAA HH:MM] Autor: Mensagem"
      const match = trimmed.match(/^\[(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2})\]\s*([^:]+)\s*:\s*(.*)$/);
      
      if (match) {
        if (genericLines.length > 0) {
          result.push({
            tipo: 'nota_geral',
            texto: genericLines.join('\n')
          });
          genericLines = [];
        }
        result.push({
          tipo: 'timeline',
          data: match[1],
          autor: match[2],
          mensagem: match[3]
        });
      } else {
        genericLines.push(trimmed);
      }
    });

    if (genericLines.length > 0) {
      result.push({
        tipo: 'nota_geral',
        texto: genericLines.join('\n')
      });
    }

    return result;
  };

  const timelineEntries = parseTimeline(observacoes);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
        maxWidth: '650px',
        maxHeight: '95vh',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>
              {isCreationMode ? 'Novo Cadastro de Lead' : (status === 'fechado' || status === 'concluido' ? 'Ordem de Serviço (OS)' : 'Gerenciar Lead')}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isCreationMode ? 'Insira os dados iniciais do cliente no painel' : `Empresa: ${empresa || 'Sem Empresa'} • Cliente: ${nomeCompleto}`}
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#FFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Seção 1: Dados do Cliente e Empresa */}
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Informações do Cliente / Empresa
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nome & Email */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nome Completo *</label>
                  <input 
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Ex: Guilherme Moura"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>E-mail Corporativo *</label>
                  <input 
                    type="email"
                    required
                    value={emailCorporativo}
                    onChange={(e) => setEmailCorporativo(e.target.value)}
                    placeholder="Ex: guilherme@ragetech.com"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Empresa, CNPJ & WhatsApp */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Empresa</label>
                  <input 
                    type="text"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex: Rage Tech Lab"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>CNPJ</label>
                  <input 
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>WhatsApp</label>
                  <input 
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 11999999999"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

          {/* Seção 2: Detalhamento Comercial */}
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Informações Comerciais
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Status & Responsável */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="novo">Novo Lead</option>
                    <option value="em_contato">Em Contato</option>
                    <option value="ativo">Ativo (Negociação)</option>
                    <option value="fechado">Fechado (OS em Andamento)</option>
                    <option value="concluido">Concluído (OS Finalizada)</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
                
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Responsável</label>
                  <select 
                    value={responsavelId} 
                    onChange={(e) => setResponsavelId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Não atribuído</option>
                    {usuariosDisponiveis.map(user => (
                      <option key={user.id} value={user.id}>{user.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valores */}
              {hasValoresAccess && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Valor Orçado (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={orcamento} 
                      onChange={(e) => setOrcamento(e.target.value)}
                      placeholder="Ex: 5000"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Valor Proposto (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={proposto} 
                      onChange={(e) => setProposto(e.target.value)}
                      placeholder="Ex: 4800"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Valor Fechado (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={fechado} 
                      disabled={status !== 'fechado' && status !== 'concluido'}
                      onChange={(e) => setFechado(e.target.value)}
                      placeholder={(status === 'fechado' || status === 'concluido') ? "Ex: 4500" : "Habilitado se Fechado/Concluído"}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        backgroundColor: (status === 'fechado' || status === 'concluido') ? 'var(--bg-main)' : 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: (status === 'fechado' || status === 'concluido') ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        cursor: (status === 'fechado' || status === 'concluido') ? 'text' : 'not-allowed'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline de Andamentos (Apenas no modo Edição) */}
          {!isCreationMode && (
            <>
              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: 'rgba(255,255,255,0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.05em' }}>
                  Andamento da OS / Atendimento (Timeline)
                </span>

                {/* Lista dos registros da timeline */}
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  paddingRight: '0.5rem',
                  borderBottom: timelineEntries.length > 0 ? '1px solid var(--border-color)' : 'none',
                  paddingBottom: timelineEntries.length > 0 ? '1rem' : '0'
                }}>
                  {timelineEntries.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                      Nenhum andamento registrado ainda.
                    </div>
                  ) : (
                    timelineEntries.map((entry, index) => {
                      if (entry.tipo === 'timeline') {
                        return (
                          <div key={index} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', alignItems: 'flex-start' }}>
                            <div style={{
                              marginTop: '0.25rem',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-color)',
                              boxShadow: '0 0 8px var(--primary-color)',
                              flexShrink: 0
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                {entry.data} &bull; <strong style={{ color: '#FFF' }}>{entry.autor}</strong>
                              </span>
                              <span style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                {entry.mensagem}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nota Geral:</span>
                            {entry.texto}
                          </div>
                        );
                      }
                    })
                  )}
                  <div ref={timelineEndRef} />
                </div>

                {/* Input para adicionar novo andamento */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    value={novoAndamento}
                    onChange={(e) => setNovoAndamento(e.target.value)}
                    placeholder="Ex: OS marcada como Concluída..."
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAndamento();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAndamento}
                    style={{
                      padding: '0.65rem 1rem',
                      backgroundColor: 'var(--primary-color)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus size={16} />
                    Lançar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Campo Geral para Visualização Manual */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Observações Gerais (Texto Bruto)
            </label>
            <textarea 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações gerais ou anote contatos..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: isCreationMode ? 'flex-end' : 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem',
            marginTop: '0.5rem',
            flexShrink: 0
          }}>
            {/* Delete button (Apenas no modo Edição) */}
            {!isCreationMode && (
              <button
                type="button"
                onClick={handleDeleteClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
              >
                <Trash2 size={16} />
                Excluir Demanda
              </button>
            )}

            {/* Cancel & Save */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#FFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary-color)',
                  border: 'none',
                  color: '#FFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.9; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
              >
                {isCreationMode ? 'Cadastrar Lead' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
