import React, { useEffect, useMemo, useState } from 'react';
import {
  concluirProtocolo,
  createProtocolo,
  deleteProtocolo,
  getFuncionarios,
  getProtocolos,
  getServicos,
  updateProtocolo,
} from '../services/api';

const statusLabel = (s) => {
  if (s === 'andamento') return 'Em andamento';
  if (s === 'concluido') return 'Concluído';
  if (s === 'cancelado') return 'Cancelado';
  return s;
};

const statusBadge = (s) => {
  if (s === 'concluido') return 'badge badge-success';
  if (s === 'cancelado') return 'badge badge-danger';
  return 'badge badge-info';
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function Protocolos({ usuario }) {
  const [itens, setItens] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // filtros
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fResp, setFResp] = useState('');

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    numero: '',
    servico_id: '',
    responsavel_id: '',
    data_entrada: todayISO(),
    observacoes: '',
    status: 'andamento',
  });

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const [p, s, f] = await Promise.all([
        getProtocolos({ status: fStatus || undefined, responsavel_id: fResp || undefined }),
        getServicos(),
        getFuncionarios(),
      ]);
      setItens(Array.isArray(p) ? p : []);
      setServicos(Array.isArray(s) ? s : []);
      setFuncionarios(Array.isArray(f) ? f : []);
    } catch (e) {
      setErro(e?.message || 'Erro ao carregar protocolos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fStatus, fResp]);

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return itens;
    return itens.filter((p) => {
      return (
        String(p.numero || '').toLowerCase().includes(s) ||
        String(p.servico_nome || '').toLowerCase().includes(s) ||
        String(p.responsavel_nome || '').toLowerCase().includes(s)
      );
    });
  }, [itens, q]);

  const abrirNovo = () => {
    setEditId(null);
    setForm({
      numero: '',
      servico_id: servicos?.[0]?.id ? String(servicos[0].id) : '',
      responsavel_id: String(usuario?.id || ''),
      data_entrada: todayISO(),
      observacoes: '',
      status: 'andamento',
    });
    setModalOpen(true);
  };

  const abrirEdicao = (p) => {
    setEditId(p.id);
    setForm({
      numero: p.numero || '',
      servico_id: String(p.servico_id || ''),
      responsavel_id: String(p.responsavel_id || ''),
      data_entrada: String(p.data_entrada).slice(0, 10),
      observacoes: p.observacoes || '',
      status: p.status || 'andamento',
    });
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setEditId(null);
    setSaving(false);
    setErro('');
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      if (!form.numero || !form.servico_id || !form.responsavel_id || !form.data_entrada) {
        throw new Error('Preencha: número, serviço, responsável e data de entrada');
      }

      if (editId) {
        // No PUT, o backend aceita responsavel_id, observacoes, status
        await updateProtocolo(editId, {
          responsavel_id: Number(form.responsavel_id),
          observacoes: form.observacoes,
          status: form.status,
        });
      } else {
        await createProtocolo({
          numero: form.numero,
          servico_id: Number(form.servico_id),
          responsavel_id: Number(form.responsavel_id),
          data_entrada: form.data_entrada,
          observacoes: form.observacoes,
        });
      }

      fecharModal();
      await carregar();
    } catch (e2) {
      setErro(e2?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const concluir = async (id) => {
    if (!window.confirm('Concluir este protocolo?')) return;
    setErro('');
    try {
      await concluirProtocolo(id);
      await carregar();
    } catch (e) {
      setErro(e?.message || 'Erro ao concluir');
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir este protocolo? Essa ação não pode ser desfeita.')) return;
    setErro('');
    try {
      await deleteProtocolo(id);
      await carregar();
    } catch (e) {
      setErro(e?.message || 'Erro ao excluir');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Protocolos</h1>
        <p className="page-subtitle">Cadastro, acompanhamento e conclusão de protocolos.</p>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Lista</div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder="Buscar por número, serviço ou responsável…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="form-select" style={{ maxWidth: 180 }} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">Todos status</option>
              <option value="andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select className="form-select" style={{ maxWidth: 220 }} value={fResp} onChange={(e) => setFResp(e.target.value)}>
              <option value="">Todos responsáveis</option>
              {funcionarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={carregar} disabled={loading}>↻</button>
            <button className="btn btn-primary" onClick={abrirNovo}>+ Novo</button>
            <button className="btn btn-secondary"onClick={() => setModalServico(true)}
>+ Adicionar Serviço
</button>

          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Serviço</th>
                <th>Responsável</th>
                <th>Entrada</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th style={{ width: 220 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtrados.length === 0 && (
                <tr><td colSpan="7">Nenhum protocolo encontrado.</td></tr>
              )}
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.numero}</strong></td>
                  <td>{p.servico_nome}</td>
                  <td>{p.responsavel_nome}</td>
                  <td>{String(p.data_entrada).slice(0, 10)}</td>
                  <td>{String(p.data_vencimento).slice(0, 10)}</td>
                  <td><span className={statusBadge(p.status)}>{statusLabel(p.status)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={() => abrirEdicao(p)}>Editar</button>
                      {p.status === 'andamento' && (
                        <button className="btn btn-primary" onClick={() => concluir(p.id)}>Concluir</button>
                      )}
                      {usuario?.cargo === 'Supervisor' && (
                        <button className="btn btn-danger" onClick={() => excluir(p.id)}>Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Editar Protocolo' : 'Novo Protocolo'}</div>
            </div>

            <form onSubmit={salvar}>
              <div className="form-group">
                <label className="form-label">Número</label>
                <input
                  className="form-input"
                  value={form.numero}
                  onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                  disabled={!!editId}
                  placeholder="Ex: 2026-000123"
                  required
                />
              </div>

              {!editId && (
                <>
                  <div className="form-group">
                    <label className="form-label">Serviço</label>
                    <select
                      className="form-select"
                      value={form.servico_id}
                      onChange={(e) => setForm((f) => ({ ...f, servico_id: e.target.value }))}
                      required
                    >
                      <option value="">Selecione…</option>
                      {servicos.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome} ({s.prazo} {s.tipo_prazo})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de entrada</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.data_entrada}
                      onChange={(e) => setForm((f) => ({ ...f, data_entrada: e.target.value }))}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Responsável</label>
                <select
                  className="form-select"
                  value={form.responsavel_id}
                  onChange={(e) => setForm((f) => ({ ...f, responsavel_id: e.target.value }))}
                  required
                >
                  <option value="">Selecione…</option>
                  {funcionarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
                  ))}
                </select>
              </div>

              {editId && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea
                  className="form-textarea"
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Detalhes do protocolo…"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={fecharModal} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Protocolos;
