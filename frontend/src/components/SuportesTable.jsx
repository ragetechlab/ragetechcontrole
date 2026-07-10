import React from 'react';
import { Edit3, Trash2, MessageCircle, AlertCircle, Wrench, LifeBuoy } from 'lucide-react';

export default function SuportesTable({ tickets, onEdit, onDelete, usuario }) {
  const getBadgeStyle = (status) => {
    const colors = {
      aberto: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' }, // Vermelho
      em_andamento: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' }, // Amarelo
      concluido: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' } // Verde
    };
    return colors[status] || { bg: 'rgba(255, 255, 255, 0.05)', text: '#FFF' };
  };

  const translateStatus = (status) => {
    const translations = {
      aberto: 'Aberto',
      em_andamento: 'Em Andamento',
      concluido: 'Resolvido'
    };
    return translations[status] || status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 25px rgba(0,0,0,0.2)'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ 
              borderBottom: '1px solid var(--border-color)', 
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Empresa / Solicitante</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Tipo</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Descrição da Demanda</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Data da Abertura</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum chamado de suporte ou atualização registrado neste período.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border-color)', 
                    transition: 'background-color 0.2s ease' 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Empresa / Solicitante */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {ticket.empresa}
                      {ticket.lead_id && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: 600, backgroundColor: 'rgba(255, 90, 0, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          Vinculado
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Solicitado por: <strong>{ticket.solicitante || 'Não informado'}</strong>
                    </div>
                  </td>
                  
                  {/* Tipo */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: ticket.tipo === 'atualizacao' ? '#A78BFA' : '#60A5FA'
                    }}>
                      {ticket.tipo === 'atualizacao' ? <Wrench size={14} /> : <LifeBuoy size={14} />}
                      {ticket.tipo === 'atualizacao' ? 'Atualização' : 'Suporte'}
                    </span>
                  </td>
                  
                  {/* Descrição */}
                  <td style={{ padding: '1.25rem 1.5rem', maxWidth: '300px' }}>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} title={ticket.descricao}>
                      {ticket.descricao}
                    </div>
                  </td>

                  {/* Data Abertura */}
                  <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(ticket.data_cadastro)}
                  </td>
                  
                  {/* Status Badge */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      backgroundColor: getBadgeStyle(ticket.status).bg,
                      color: getBadgeStyle(ticket.status).text,
                      display: 'inline-block'
                    }}>
                      {translateStatus(ticket.status)}
                    </span>
                  </td>
                  
                  {/* Ações */}
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => onEdit(ticket)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#FFF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <Edit3 size={16} />
                      </button>
                      
                      {usuario?.papel === 'ceo' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Tem certeza de que deseja remover este ticket permanentemente?')) {
                              onDelete(ticket.id);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.7)',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
