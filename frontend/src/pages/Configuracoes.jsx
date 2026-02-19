import React, { useEffect, useState } from 'react';
import { getFeriados, createFeriado, deleteFeriado } from '../services/api';
import { API_URL } from "../services/api";


// Cores disponíveis para os badges
const CORES_BADGE = [
  { value: 'info', label: 'Azul', preview: '#3b82f6' },
  { value: 'success', label: 'Verde', preview: '#10b981' },
  { value: 'warning', label: 'Amarelo', preview: '#f59e0b' },
  { value: 'danger', label: 'Vermelho', preview: '#ef4444' },
  { value: 'primary', label: 'Roxo', preview: '#8b5cf6' },
  { value: 'secondary', label: 'Cinza', preview: '#6b7280' },
];

function Configuracoes() {
  // ===== FERIADOS =====
  const [feriados, setFeriados] = useState([]);
  const [novoFeriado, setNovoFeriado] = useState({ data: '', descricao: '' });
  
  // ===== STATUS =====
  const [statusList, setStatusList] = useState([]);
  const [novoStatus, setNovoStatus] = useState({ nome: '', cor: 'info', ordem: 0 });
  const [editandoStatus, setEditandoStatus] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    setErro('');
    try {
      const [feriadosData, statusData] = await Promise.all([
        getFeriados(),
        fetch(`${API_URL}/status`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json())
      ]);
      
      setFeriados(Array.isArray(feriadosData) ? feriadosData : []);
      setStatusList(Array.isArray(statusData) ? statusData : []);
    } catch (e) {
      setErro(e?.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ===== FERIADOS =====
  const adicionarFeriado = async (e) => {
    e.preventDefault();
    if (!novoFeriado.data || !novoFeriado.descricao) return;
    
    setSaving(true);
    setErro('');
    try {
      await createFeriado(novoFeriado);
      setNovoFeriado({ data: '', descricao: '' });
      await carregarDados();
    } catch (e) {
      setErro(e?.message || 'Erro ao adicionar feriado');
    } finally {
      setSaving(false);
    }
  };

  const removerFeriado = async (id) => {
    if (!window.confirm('Remover este feriado?')) return;
    setErro('');
    try {
      await deleteFeriado(id);
      await carregarDados();
    } catch (e) {
      setErro(e?.message || 'Erro ao remover feriado');
    }
  };

  // ===== STATUS =====
  const adicionarStatus = async (e) => {
    e.preventDefault();
    if (!novoStatus.nome.trim()) return;
    
    setSaving(true);
    setErro('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoStatus),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar status');
      }

      setNovoStatus({ nome: '', cor: 'info', ordem: 0 });
      await carregarDados();
    } catch (e) {
      setErro(e?.message || 'Erro ao adicionar status');
    } finally {
      setSaving(false);
    }
  };

  const removerStatus = async (id) => {
    if (!window.confirm('Desativar este status?')) return;
    setErro('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/status/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao remover status');
      }

      await carregarDados();
    } catch (e) {
      setErro(e?.message || 'Erro ao remover status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Parâmetros do sistema (Supervisor).</p>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {/* ===== STATUS PERSONALIZADOS ===== */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div className="card-title">📊 Status de Protocolos</div>
          <button className="btn btn-secondary" onClick={carregarDados} disabled={loading}>
            ↻
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={adicionarStatus} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px auto', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nome do Status</label>
                <input
                  type="text"
                  className="form-input"
                  value={novoStatus.nome}
                  onChange={(e) => setNovoStatus({ ...novoStatus, nome: e.target.value })}
                  placeholder="Ex: Aguardando Documentos"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cor</label>
                <select
                  className="form-select"
                  value={novoStatus.cor}
                  onChange={(e) => setNovoStatus({ ...novoStatus, cor: e.target.value })}
                >
                  {CORES_BADGE.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Ordem</label>
                <input
                  type="number"
                  className="form-input"
                  value={novoStatus.ordem}
                  onChange={(e) => setNovoStatus({ ...novoStatus, ordem: Number(e.target.value) })}
                  min="0"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '+ Adicionar'}
              </button>
            </div>
          </form>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Preview</th>
                  <th>Ordem</th>
                  <th style={{ width: 120 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {!loading && statusList.length === 0 && (
                  <tr><td colSpan="4">Nenhum status cadastrado.</td></tr>
                )}
                {statusList.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.nome}</strong></td>
                    <td>
                      <span className={`badge badge-${s.cor}`}>
                        {s.nome}
                      </span>
                    </td>
                    <td>{s.ordem}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => removerStatus(s.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== FERIADOS (mantém o código existente) ===== */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Feriados</div>
          <button className="btn btn-secondary" onClick={carregarDados} disabled={loading}>
            ↻
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={adicionarFeriado} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={novoFeriado.data}
                  onChange={(e) => setNovoFeriado({ ...novoFeriado, data: e.target.value })}
                  placeholder="dd/mm/aaaa"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Descrição</label>
                <input
                  type="text"
                  className="form-input"
                  value={novoFeriado.descricao}
                  onChange={(e) => setNovoFeriado({ ...novoFeriado, descricao: e.target.value })}
                  placeholder="Ex: Corpus Christi"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '+ Adicionar'}
              </button>
            </div>
          </form>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>DATA</th>
                  <th>DESCRIÇÃO</th>
                  <th style={{ width: 120 }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {!loading && feriados.length === 0 && (
                  <tr><td colSpan="3">Nenhum feriado cadastrado.</td></tr>
                )}
                {feriados.map((f) => (
                  <tr key={f.id}>
                    <td>{String(f.data).slice(0, 10)}</td>
                    <td>{f.descricao}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => removerFeriado(f.id)}>
                        Remover
                      </button>
                    </td>
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

export default Configuracoes;
