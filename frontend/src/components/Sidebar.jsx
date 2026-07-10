import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, ClipboardList, LifeBuoy } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, usuario }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', name: 'Leads', icon: Users },
    { id: 'os', name: 'Ordem de Serviço', icon: ClipboardList },
    { id: 'suportes', name: 'Suporte / Tickets', icon: LifeBuoy },
    { id: 'config', name: 'Configurações', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      flexShrink: 0
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
        <svg 
          width="36" 
          height="36" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 90, 0, 0.3))'
          }}
        >
          {/* Top-left square */}
          <rect x="30" y="20" width="20" height="20" fill="#FFFFFF" />
          {/* Bottom-left pillar */}
          <path d="M30,85 V70 L50,50 V85 Z" fill="#FFFFFF" />
          {/* Right horizontal branch */}
          <path d="M50,50 L62,38 H86 L74,50 Z" fill="#FFFFFF" />
        </svg>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.025em' }}>Rege Tech</span>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Controle</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {navItems.filter(item => {
          if (usuario?.papel === 'ceo') return true; // CEOs sempre têm acesso a tudo
          const allowed = usuario?.acessos ? usuario.acessos.split(',') : ['dashboard'];
          return allowed.includes(item.id);
        }).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                textAlign: 'left',
                fontWeight: 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--primary-color)' : 'inherit' }} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{usuario?.nome || 'Usuário'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{usuario?.papel || 'CEO'}</span>
        </div>
        
        <button 
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#EF4444',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
