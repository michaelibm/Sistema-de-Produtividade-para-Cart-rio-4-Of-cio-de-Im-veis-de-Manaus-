import React, { useEffect, useState } from 'react';
import { createServico, deleteServico, getServicos, updateServico } from '../services/api';

const TIPO_PRAZO_LABEL = {
  uteis: 'Dias Úteis',
  corridos: 'Dias Corridos',
  sem_prazo: 'Sem Prazo Definido',
};

function Servicos() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    prazo: 5,
    tipo_prazo: 'uteis',
    dias_alerta: 3,
    visivel_atendimento: true,
  });

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await getServicos();
      setItens(Array.isArray(res) ? res : []);
    } catch (e) {
      setErro(e?.message || 'Erro ao listar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirNovo = () => {
    setEditId(null);
    setForm({ nome: '', prazo: 5, tipo_prazo: 'uteis', dias_alerta: 3, visivel_atendimento: true });
    setModalOpen(true);
  };

  const abrirEdicao = (s) => {
    setEditId(s.id);
    setForm({
      nome: s.nome || '',
      prazo: s.prazo || 5,
      tipo_prazo: s.tipo_prazo || 'uteis',
      dias_alerta: s.dias_alerta || 3,
      visivel_atendimento: s.visivel_atendimento !== false,
    });
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setEditId(null);
    setSaving(false);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      const semPrazo = form.tipo_prazo === 'sem_prazo';

      if (!form.nome) {
        throw new Error('Preencha o nome');
      }
      if (!semPrazo && !form.prazo) {
        throw new Error('Preencha o prazo');
      }
      if (!semPrazo && (form.dias_alerta < 1 || form.dias_alerta > 30)) {
        throw new Error('Dias de alerta deve estar entre 1 e 30');
      }

      const dados = {
        nome: form.nome,
        prazo: semPrazo ? null : Number(form.prazo),
        tipo_prazo: form.tipo_prazo,
        dias_alerta: semPrazo ? null : Number(form.dias_alerta),
        visivel_atendimento: form.visivel_atendimento,
      };

      if (editId) {
        await updateServico(editId, dados);
      } else {
        await createServico(dados);
      }

      fecharModal();
      await carregar();
    } catch (e2) {
      setErro(e2?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const remover = async (id) => {
    if (!window.confirm('Desativar este serviço?')) return;
    setErro('');
    try {
      await deleteServico(id);
      await carregar();
    } catch (e) {
      setErro(e?.message || 'Erro ao desativar');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Serviços</h1>
        <p>Gerenciamento dos serviços disponíveis.</p>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Serviços</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={carregar} disabled={loading}>
              {loading ? '⟳' : '↻'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={abrirNovo}>+ Novo</button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Prazo</th>
                  <th>Tipo</th>
                  <th>🔔 Alertar em</th>
                  <th>🎫 Atendimento</th>
                  <th style={{ width: 220 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Carregando...</td></tr>
                )}
                {!loading && itens.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum serviço cadastrado.</td></tr>
                )}
                {!loading && itens.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.nome}</strong></td>
                    <td>{s.tipo_prazo === 'sem_prazo' ? '—' : `${s.prazo} dias`}</td>
                    <td>
                      <span className="status-badge info">
                        {TIPO_PRAZO_LABEL[s.tipo_prazo] || s.tipo_prazo}
                      </span>
                    </td>
                    <td>
                      {s.tipo_prazo === 'sem_prazo' ? (
                        <span className="status-badge info">—</span>
                      ) : (
                        <span className="status-badge warning">
                          {s.dias_alerta} {s.dias_alerta === 1 ? 'dia' : 'dias'} antes
                        </span>
                      )}
                    </td>
                    <td>
                      {s.visivel_atendimento !== false ? (
                        <span className="status-badge success">Visível</span>
                      ) : (
                        <span className="status-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Oculto</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" onClick={() => abrirEdicao(s)}>
                          Editar
                        </button>
                        <button className="btn-action btn-delete" onClick={() => remover(s.id)}>
                          Desativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editId ? 'Editar Serviço' : 'Novo Serviço'}</h2>

            <form onSubmit={salvar}>
              <div className="form-group">
                <label htmlFor="nome">Nome do Serviço</label>
                <input
                  type="text"
                  id="nome"
                  className="form-input"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Certidão, Registro de Imóvel..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo_prazo">Tipo de Prazo</label>
                <select
                  id="tipo_prazo"
                  className="form-select"
                  value={form.tipo_prazo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_prazo: e.target.value }))}
                >
                  <option value="uteis">Dias Úteis</option>
                  <option value="corridos">Dias Corridos</option>
                  <option value="sem_prazo">Sem Prazo Definido</option>
                </select>
              </div>

              {form.tipo_prazo !== 'sem_prazo' && (
                <>
                  <div className="form-group">
                    <label htmlFor="prazo">Prazo (em dias)</label>
                    <input
                      type="number"
                      id="prazo"
                      className="form-input"
                      min="1"
                      max="365"
                      value={form.prazo}
                      onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))}
                      required
                    />
                  </div>

                  {/* ✅ CAMPO NOVO: Dias de Alerta */}
                  <div className="form-group">
                    <label htmlFor="dias_alerta">🔔 Alertar com quantos dias de antecedência?</label>
                    <input
                      type="number"
                      id="dias_alerta"
                      className="form-input"
                      min="1"
                      max="30"
                      value={form.dias_alerta}
                      onChange={(e) => setForm((f) => ({ ...f, dias_alerta: e.target.value }))}
                      required
                    />
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                      O sistema enviará alertas quando faltar essa quantidade de dias para o vencimento.
                      <br />
                      Exemplo: Se definir 3 dias, o alerta será enviado 3 dias antes do vencimento.
                    </small>
                  </div>
                </>
              )}

              {form.tipo_prazo === 'sem_prazo' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13, color: '#1e40af', marginBottom: '1rem' }}>
                  💡 Serviços sem prazo definido não geram data de vencimento nem alertas de atraso.
                </div>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.visivel_atendimento}
                    onChange={(e) => setForm((f) => ({ ...f, visivel_atendimento: e.target.checked }))}
                  />{' '}
                  🎫 Aparece no Balcão de Atendimento
                </label>
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                  Se desmarcado, esse serviço não aparecerá na lista de opções do Balcão de Atendimento —
                  ainda pode ser usado normalmente pelos registradores.
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={fecharModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicos;
