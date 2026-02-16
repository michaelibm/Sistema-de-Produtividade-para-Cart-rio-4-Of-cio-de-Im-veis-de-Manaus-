import React, { useEffect, useState } from 'react';
import { getProtocolos } from '../services/api';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ativos: 0,
    concluidosMes: 0,
    atrasados: 0,
    vencendo3Dias: 0,
  });
  const [vencendo7Dias, setVencendo7Dias] = useState([]);
  const [atrasados, setAtrasados] = useState([]);

  const carregar = async () => {
    setLoading(true);
    try {
      const protocolos = await getProtocolos();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Início do mês atual
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Calcular estatísticas
      const ativos = protocolos.filter(p => p.status === 'andamento').length;
      
      const concluidosMes = protocolos.filter(p => {
        if (p.status !== 'concluido') return false;
        const dataConclusao = new Date(p.updated_at);
        return dataConclusao >= inicioMes;
      }).length;

      const protocolosAtrasados = protocolos.filter(p => {
        if (p.status !== 'andamento') return false;
        const vencimento = new Date(p.data_vencimento);
        return vencimento < hoje;
      });

      const protocolosVencendo3 = protocolos.filter(p => {
        if (p.status !== 'andamento') return false;
        const vencimento = new Date(p.data_vencimento);
        const diff = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 3;
      });

      const protocolosVencendo7 = protocolos.filter(p => {
        if (p.status !== 'andamento') return false;
        const vencimento = new Date(p.data_vencimento);
        const diff = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      }).map(p => {
        const vencimento = new Date(p.data_vencimento);
        const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
        return { ...p, diasRestantes };
      });

      setStats({
        ativos,
        concluidosMes,
        atrasados: protocolosAtrasados.length,
        vencendo3Dias: protocolosVencendo3.length,
      });

      setVencendo7Dias(protocolosVencendo7);
      setAtrasados(protocolosAtrasados.map(p => {
        const vencimento = new Date(p.data_vencimento);
        const diasAtraso = Math.ceil((hoje - vencimento) / (1000 * 60 * 60 * 24));
        return { ...p, diasAtraso };
      }));

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const corDiasRestantes = (dias) => {
    if (dias === 0) return { bg: '#fee2e2', text: '#991b1b', label: 'HOJE' };
    if (dias === 1) return { bg: '#fef3c7', text: '#92400e', label: '1 dia' };
    if (dias <= 3) return { bg: '#fef3c7', text: '#92400e', label: `${dias} dias` };
    return { bg: '#dbeafe', text: '#1e40af', label: `${dias} dias` };
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>Visão geral dos protocolos</p>
      </div>

      {/* Cards de Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: Ativos */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>
            ATIVOS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
            {stats.ativos}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Protocolos em andamento
          </div>
        </div>

        {/* Card 2: Concluídos no Mês */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>
            CONCLUÍDOS NO MÊS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
            {stats.concluidosMes}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Total do mês atual
          </div>
        </div>

        {/* Card 3: Atrasados */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>
            ATRASADOS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.25rem' }}>
            {stats.atrasados}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Precisa de atenção
          </div>
        </div>

        {/* Card 4: Vencendo em 3 dias */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>
            VENCENDO (3 DIAS)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
            {stats.vencendo3Dias}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Priorize esses
          </div>
        </div>
      </div>

      {/* Vencendo (próximos 7 dias) */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Vencendo (próximos 7 dias)
          </h2>
          <button 
            onClick={carregar}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '500',
              color: '#374151'
            }}
          >
            ↻ Atualizar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  NÚMERO
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  SERVIÇO
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  RESPONSÁVEL
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  VENCIMENTO
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {vencendo7Dias.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    🎉 Nenhum protocolo vencendo nos próximos 7 dias
                  </td>
                </tr>
              ) : (
                vencendo7Dias.map((p, idx) => {
                  const cor = corDiasRestantes(p.diasRestantes);
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ color: '#1f2937' }}>{p.numero}</strong>
                      </td>
                      <td style={{ padding: '1rem', color: '#4b5563' }}>{p.servico_nome}</td>
                      <td style={{ padding: '1rem', color: '#4b5563' }}>{p.responsavel_nome}</td>
                      <td style={{ padding: '1rem', color: '#4b5563' }}>
                        {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          background: cor.bg,
                          color: cor.text,
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {cor.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Atrasados */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Atrasados
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fef2f2' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  NÚMERO
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  SERVIÇO
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  RESPONSÁVEL
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  VENCIMENTO
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  ATRASO
                </th>
              </tr>
            </thead>
            <tbody>
              {atrasados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    🎉 Nenhum protocolo atrasado
                  </td>
                </tr>
              ) : (
                atrasados.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #fee2e2', background: '#fef2f2' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ color: '#991b1b' }}>{p.numero}</strong>
                    </td>
                    <td style={{ padding: '1rem', color: '#4b5563' }}>{p.servico_nome}</td>
                    <td style={{ padding: '1rem', color: '#4b5563' }}>{p.responsavel_nome}</td>
                    <td style={{ padding: '1rem', color: '#4b5563' }}>
                      {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {p.diasAtraso} {p.diasAtraso === 1 ? 'dia' : 'dias'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
