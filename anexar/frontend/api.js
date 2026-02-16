const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function cleanParams(params = {}) {
  const clean = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    clean[k] = v;
  });
  return clean;
}

async function parseBody(res) {
  const contentType = res.headers.get('content-type') || '';
  if (res.status === 204) return null;

  // tenta JSON, mas sem quebrar se vier texto
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function request(path, { method = 'GET', data, params, headers: extraHeaders } = {}) {
  const urlParams = new URLSearchParams(cleanParams(params)).toString();
  const url = `${API_URL}${path}${urlParams ? `?${urlParams}` : ''}`;

  const headers = {
    ...(extraHeaders || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // só seta content-type se for JSON
  const hasBody = data !== undefined && data !== null && method !== 'GET';
  if (hasBody && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: hasBody ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
  });

  const payload = await parseBody(res);

  if (!res.ok) {
    const msg = (payload && payload.message) ? payload.message : `Erro ${res.status}`;
    throw new Error(msg);
  }

  return payload;
}

// AUTH
export function login(email, senha) {
  return request('/auth/login', { method: 'POST', data: { email, senha } });
}
export function register(dados) {
  return request('/auth/register', { method: 'POST', data: dados });
}

// SERVIÇOS
export function getServicos() {
  return request('/servicos');
}
export function createServico(data) {
  return request('/servicos', { method: 'POST', data });
}
export function updateServico(id, data) {
  return request(`/servicos/${id}`, { method: 'PUT', data });
}
export function deleteServico(id) {
  return request(`/servicos/${id}`, { method: 'DELETE' });
}

// FUNCIONÁRIOS
export function getFuncionarios() {
  return request('/funcionarios');
}
export function createFuncionario(data) {
  return request('/funcionarios', { method: 'POST', data });
}
export function updateFuncionario(id, data) {
  return request(`/funcionarios/${id}`, { method: 'PUT', data });
}
export function deleteFuncionario(id) {
  return request(`/funcionarios/${id}`, { method: 'DELETE' });
}

// FERIADOS
export function getFeriados() {
  return request('/feriados');
}
export function createFeriado(data) {
  return request('/feriados', { method: 'POST', data });
}
export function deleteFeriado(id) {
  return request(`/feriados/${id}`, { method: 'DELETE' });
}

// PROTOCOLOS
export function getProtocolos(filtros = {}) {
  // IMPORTANTÍSSIMO: não mandar undefined pro backend (evita "integer: undefined")
  return request('/protocolos', { params: filtros });
}
export function getProtocolo(id) {
  return request(`/protocolos/${id}`);
}
export function createProtocolo(data) {
  return request('/protocolos', { method: 'POST', data });
}
export function updateProtocolo(id, data) {
  return request(`/protocolos/${id}`, { method: 'PUT', data });
}
export function deleteProtocolo(id) {
  return request(`/protocolos/${id}`, { method: 'DELETE' });
}
export function concluirProtocolo(id) {
  return request(`/protocolos/${id}/concluir`, { method: 'PATCH' });
}

// DASHBOARD
export function getDashboardStats() {
  return request('/protocolos/dashboard/stats');
}

// RELATÓRIOS
export function getRelatorioGeral() {
  return request('/relatorios/geral');
}
export function getRelatorioPorFuncionario() {
  return request('/relatorios/por-funcionario');
}
export function getRelatorioPorServico() {
  return request('/relatorios/por-servico');
}
export function getProtocolosVencendo() {
  return request('/relatorios/vencendo');
}
export function getProtocolosAtrasados() {
  return request('/relatorios/atrasados');
}
export function getHistoricoProtocolo(protocoloId) {
  return request(`/relatorios/historico/${protocoloId}`);
}

// ✅ default export (pra não quebrar se alguém importar default)
const api = {
  request,
  login,
  register,
  getServicos,
  createServico,
  updateServico,
  deleteServico,
  getFuncionarios,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  getFeriados,
  createFeriado,
  deleteFeriado,
  getProtocolos,
  getProtocolo,
  createProtocolo,
  updateProtocolo,
  deleteProtocolo,
  concluirProtocolo,
  getDashboardStats,
  getRelatorioGeral,
  getRelatorioPorFuncionario,
  getRelatorioPorServico,
  getProtocolosVencendo,
  getProtocolosAtrasados,
  getHistoricoProtocolo,
};

export default api;
