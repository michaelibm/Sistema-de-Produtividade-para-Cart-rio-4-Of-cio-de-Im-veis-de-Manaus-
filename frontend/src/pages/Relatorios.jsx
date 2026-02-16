import React, { useEffect, useState } from 'react';
import {
  getRelatorioGeral,
  getRelatorioPorFuncionario,
  getRelatorioPorServico,
} from '../services/api';

function Relatorios() {
  const [geral, setGeral] = useState(null);
  const [porFuncionario, setPorFuncionario] = useState([]);
  const [porServico, setPorServico] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = {};
      if (dataInicio) filtros.data_inicio = dataInicio;
      if (dataFim) filtros.data_fim = dataFim;

      const [g, f, s] = await Promise.all([
        getRelatorioGeral(filtros),
        getRelatorioPorFuncionario(filtros),
        getRelatorioPorServico(filtros),
      ]);
      setGeral(g);
      setPorFuncionario(Array.isArray(f) ? f : []);
      setPorServico(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error('Erro ao carregar relatórios:', e);
      setErro(e?.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    carregar();
  };

  const handleLimparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    // Recarrega sem filtros
    setTimeout(() => carregar(), 100);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Relatórios</h1>
        <p>Visão geral e produtividade por funcionário e serviço.</p>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <h3 className="filters-title">Filtros</h3>
        <form onSubmit={handleFiltrar}>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="dataInicio" className="filter-label">Data Início</label>
              <input
                type="date"
                id="dataInicio"
                className="filter-input"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="dataFim" className="filter-label">Data Fim</label>
              <input
                type="date"
                id="dataFim"
                className="filter-input"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <button type="submit" className="btn-filter" disabled={loading}>
                {loading ? 'Carregando...' : 'Filtrar'}
              </button>
              <button 
                type="button" 
                className="btn-clear" 
                onClick={handleLimparFiltros}
                disabled={loading}
              >
                Limpar
              </button>
            </div>
          </div>
        </form>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{geral?.total_protocolos ?? (loading ? '…' : 0)}</div>
          <div className="stat-label" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Protocolos no sistema</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Em andamento</div>
          <div className="stat-value">{geral?.em_andamento ?? (loading ? '…' : 0)}</div>
          <div className="stat-label" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Abertos/ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Concluídos</div>
          <div className="stat-value">{geral?.concluidos ?? (loading ? '…' : 0)}</div>
          <div className="stat-label" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Finalizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tempo médio</div>
          <div className="stat-value">
            {geral?.tempo_medio_conclusao ?? (loading ? '…' : 0)}
          </div>
          <div className="stat-label" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Dias para concluir</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Produtividade por Funcionário</h3>
          <button className="btn btn-secondary btn-sm" onClick={carregar} disabled={loading}>
            {loading ? '⟳' : '↻'}
          </button>
        </div>

        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Total</th>
                  <th>Em andamento</th>
                  <th>Concluídos</th>
                  <th>Taxa sucesso</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>Carregando...</td>
                  </tr>
                )}
                {!loading && porFuncionario.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum dado disponível</td>
                  </tr>
                )}
                {!loading && porFuncionario.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.nome}</strong></td>
                    <td>
                      <span className="status-badge info">
                        {u.cargo === 'Auxiliar' ? 'Registrador' : 
                         u.cargo === 'Escrevente' ? 'Coordenador' : 
                         u.cargo}
                      </span>
                    </td>
                    <td>{u.total_protocolos}</td>
                    <td>{u.em_andamento}</td>
                    <td>{u.concluidos}</td>
                    <td>
                      <span className={`status-badge ${
                        u.taxa_sucesso >= 80 ? 'success' : 
                        u.taxa_sucesso >= 50 ? 'warning' : 'danger'
                      }`}>
                        {u.taxa_sucesso}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Desempenho por Serviço</h3>
        </div>

        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Prazo</th>
                  <th>Total</th>
                  <th>Em andamento</th>
                  <th>Concluídos</th>
                  <th>No prazo</th>
                  <th>Tempo médio (dias)</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>Carregando...</td>
                  </tr>
                )}
                {!loading && porServico.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>Nenhum dado disponível</td>
                  </tr>
                )}
                {!loading && porServico.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.nome}</strong></td>
                    <td>
                      <span className="status-badge info">
                        {s.prazo} {s.tipo_prazo === 'uteis' ? 'úteis' : 'corridos'}
                      </span>
                    </td>
                    <td>{s.total_protocolos}</td>
                    <td>{s.em_andamento}</td>
                    <td>{s.concluidos}</td>
                    <td>
                      <span className={`status-badge ${
                        s.no_prazo === s.concluidos && s.concluidos > 0 ? 'success' : 'warning'
                      }`}>
                        {s.no_prazo} / {s.concluidos}
                      </span>
                    </td>
                    <td>{s.tempo_medio > 0 ? s.tempo_medio : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Relatorios;
