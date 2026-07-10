import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function SuporteModal({ ticket, onClose, onSave, onDelete, leadsDisponiveis = [], usuarioLogado }) {
  const isCreationMode = !ticket || !ticket.id;

  const [leadId, setLeadId] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [tipo, setTipo] = useState('suporte');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('aberto');
  const [observacoes, setObservacoes] = useState('');
  
  const [novoAndamento, setNovoAndamento] = useState('');
  const timelineEndRef = useRef(null);

  // Popular campos ao carregar ticket
  useEffect(() => {
    if (ticket) {
      setLeadId(ticket.lead_id || '');
      setEmpresa(ticket.empresa || '');
      setSolicitante(ticket.solicitante || '');
      setTipo(ticket.tipo || 'suporte');
      setDescricao(ticket.descricao || '');
      setStatus(ticket.status || 'aberto');
      setObservacoes(ticket.observacoes || '');
    } else {
      setLeadId('');
      setEmpresa('');
      setSolicitante('');
      setTipo('suporte');
      setDescricao('');
      setStatus('aberto');
      setObservacoes('');
    }
    setNovoAndamento('');
  }, [ticket]);

  // Ao selecionar um lead, preencher empresa e solicitante automaticamente se for criação
  const handleLeadChange = (selectedId) => {
    setLeadId(selectedId);
    if (selectedId && isCreationMode) {
      const selected = leadsDisponiveis.find(l => String(l.id) === String(selectedId));
      if (selected) {
        setEmpresa(selected.empresa || '');
        setSolicitante(selected.nome_completo || '');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!empresa.trim() || !descricao.trim()) {
      alert('Empresa e Descrição do chamado são campos obrigatórios.');
      return;
    }

    onSave({
      id: ticket?.id || null,
      lead_id: leadId !== '' ? parseInt(leadId) : null,
      empresa: empresa.trim(),
      solicitante: solicitante.trim() || null,
      tipo,
      descricao: descricao.trim(),
      status,
      observacoes: observacoes.trim()
    });
  };

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

    setTimeout(() => {
      if (timelineEndRef.current) {
        timelineEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const parseTimeline = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const result = [];
    let genericLines = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

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
        maxWidth: '600px',
        maxHeight: '92vh',
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
              {isCreationMode ? 'Registrar Novo Chamado' : 'Gerenciar Chamado / Ticket'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isCreationMode ? 'Suporte técnico ou atualização de sistema' : `Ticket #${ticket.id} • ${empresa}`}
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
          {/* Seção 1: Vínculo com Lead/Cliente */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Vincular a uma Empresa Cadastrada</label>
            <select
              value={leadId}
              onChange={(e) => handleLeadChange(e.target.value)}
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
              <option value="" style={{ color: '#000', backgroundColor: '#FFF' }}>-- Digitar Empresa Avulsa (Não Cadastrada) --</option>
              {leadsDisponiveis.map(lead => (
                <option key={lead.id} value={lead.id} style={{ color: '#000', backgroundColor: '#FFF' }}>
                  {lead.empresa || 'Sem Empresa'} ({lead.nome_completo})
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: Empresa & Solicitante */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Empresa Requisitante *</label>
              <input 
                type="text"
                required
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Nome da empresa"
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
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Solicitante (Contato)</label>
              <input 
                type="text"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
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
          </div>

          {/* Row 2: Tipo & Status */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tipo da Solicitação</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)}
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
                <option value="suporte" style={{ color: '#000', backgroundColor: '#FFF' }}>Suporte Técnico</option>
                <option value="atualizacao" style={{ color: '#000', backgroundColor: '#FFF' }}>Solicitação de Atualização</option>
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status do Ticket</label>
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
                <option value="aberto" style={{ color: '#000', backgroundColor: '#FFF' }}>Aberto (Pendente)</option>
                <option value="em_andamento" style={{ color: '#000', backgroundColor: '#FFF' }}>Em Andamento</option>
                <option value="concluido" style={{ color: '#000', backgroundColor: '#FFF' }}>Resolvido (Concluído)</option>
              </select>
            </div>
          </div>

          {/* O que foi solicitado */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Descrição da Demanda (O que a empresa está pedindo?) *</label>
            <textarea 
              required
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva aqui o problema relatado ou a atualização solicitada..."
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* Timeline de Atendimento (Apenas Edição) */}
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
                  Timeline de Resolução / Histórico do Chamado
                </span>

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
                      Nenhuma atualização registrada na timeline do chamado.
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
                            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nota:</span>
                            {entry.texto}
                          </div>
                        );
                      }
                    })
                  )}
                  <div ref={timelineEndRef} />
                </div>

                {/* Adicionar nota ao suporte */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    value={novoAndamento}
                    onChange={(e) => setNovoAndamento(e.target.value)}
                    placeholder="Adicionar nota de progresso / resolução..."
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
                    Registrar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Observações do Chamado (Texto Completo) */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Histórico / Observações de Resolução (Texto Completo)
            </label>
            <textarea 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações gerais sobre a resolução deste chamado..."
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
            {!isCreationMode && usuarioLogado?.papel === 'ceo' && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja remover este ticket permanentemente?')) {
                    onDelete(ticket.id);
                    onClose();
                  }
                }}
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
                Remover Ticket
              </button>
            )}

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
                {isCreationMode ? 'Criar Ticket' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
