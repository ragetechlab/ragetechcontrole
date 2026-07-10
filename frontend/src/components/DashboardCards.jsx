import React from 'react';
import { Users, Activity, CheckCircle2, Percent, DollarSign } from 'lucide-react';

export default function DashboardCards({ stats, hasValoresAccess = true }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const cardItems = [
    {
      title: 'Total de Leads',
      value: stats.total,
      icon: Users,
      color: '#3B82F6', // Blue
      glow: 'rgba(59, 130, 246, 0.15)'
    },
    {
      title: 'Leads Ativos',
      value: stats.ativos,
      icon: Activity,
      color: 'var(--status-ativo)', // Orange
      glow: 'rgba(245, 158, 11, 0.15)'
    },
    {
      title: 'Leads Fechados',
      value: stats.fechados,
      icon: CheckCircle2,
      color: 'var(--status-novo)', // Green/Emerald
      glow: 'rgba(16, 185, 129, 0.15)'
    },
    {
      title: 'Taxa de Conversão',
      value: `${stats.conversao}%`,
      icon: Percent,
      color: '#8B5CF6', // Purple
      glow: 'rgba(139, 92, 246, 0.15)'
    },
    {
      title: 'Valor Fechado (Mês)',
      value: formatCurrency(stats.totalValor),
      icon: DollarSign,
      color: '#EC4899', // Pink
      glow: 'rgba(236, 72, 153, 0.15)'
    }
  ];

  const filteredItems = hasValoresAccess 
    ? cardItems 
    : cardItems.filter(item => item.title !== 'Valor Fechado (Mês)');

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.25rem',
      width: '100%'
    }}>
      {filteredItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '130px',
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.15)`,
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {/* Top Row: Title & Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                {item.title}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: item.glow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}>
                <Icon size={20} />
              </div>
            </div>

            {/* Bottom Row: Value */}
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em' }}>
                {item.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
