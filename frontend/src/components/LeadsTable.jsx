import React from 'react';
import { MessageCircle, Edit3, Trash2 } from 'lucide-react';

export default function LeadsTable({ leads, onEdit, onDelete, usuario, hasValoresAccess = true }) {
  const getBadgeStyle = (status) => {
    const colors = {
      novo: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--status-novo)' },
      em_contato: { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--status-em-contato)' },
      ativo: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--status-ativo)' },
      fechado: { bg: 'rgba(139, 92, 246, 0.1)', text: 'var(--status-fechado)' },
      concluido: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' }, // Verde para Concluído
      perdido: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--status-perdido)' }
    };
    return colors[status] || { bg: 'rgba(255, 255, 255, 0.05)', text: '#FFF' };
  };

  const getWhatsAppLink = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    return `https://wa.me/55${cleanNumber}`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const translateStatus = (status) => {
    const translations = {
      novo: 'Novo',
      em_contato: 'Em Contato',
      ativo: 'Ativo',
      fechado: 'Fechado',
      concluido: 'Concluído',
      perdido: 'Perdido'
    };
    return translations[status] || status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Empresa / Data</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Contato</th>
              {hasValoresAccess && <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Orçamento Proposto</th>}
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Responsável</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum lead encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr 
                  key={lead.id} 
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
                  {/* Empresa */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>{lead.empresa || 'Sem Empresa'}</span>
                      {lead.cnpj && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 500, backgroundColor: 'rgba(255, 90, 0, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          CNPJ: {lead.cnpj}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Criado em {formatDate(lead.data_cadastro)}
                    </div>
                  </td>
                  
                  {/* Contato */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{lead.nome_completo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {lead.email_corporativo}
                    </div>
                  </td>
                  
                  {/* Orçamento */}
                  {hasValoresAccess && (
                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(lead.valor_proposto || lead.orcamento_solicitado)}</div>
                      {lead.valor_fechado && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--status-novo)', marginTop: '0.15rem' }}>
                          Fechado por {formatCurrency(lead.valor_fechado)}
                        </div>
                      )}
                    </td>
                  )}

                  {/* Responsável */}
                  <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: lead.responsavel_nome ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {lead.responsavel_nome || 'Não atribuído'}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: getBadgeStyle(lead.status).bg,
                      color: getBadgeStyle(lead.status).text,
                      display: 'inline-block'
                    }}>
                      {translateStatus(lead.status)}
                    </span>
                  </td>

                  {/* Ações */}
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                      {lead.whatsapp && (
                        <a 
                          href={getWhatsAppLink(lead.whatsapp)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="Chamar no WhatsApp"
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#25D366',
                            color: '#FFF',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 0.85}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                      
                      <button 
                        onClick={() => onEdit(lead)}
                        title="Editar Lead"
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                      >
                        <Edit3 size={16} />
                      </button>

                      {usuario?.papel === 'admin' && (
                        <button 
                          onClick={() => onDelete(lead.id)}
                          title="Excluir Lead"
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
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
