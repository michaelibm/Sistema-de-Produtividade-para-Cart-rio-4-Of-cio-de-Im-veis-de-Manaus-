// Nome exibido na Sidebar, no Login e no Painel.
// Definido por instalação via REACT_APP_ORG_NAME / REACT_APP_ORG_SUBTITLE no .env
// (precisa rebuildar o frontend para aplicar, pois são variáveis de build do React).
export const ORG_NAME = process.env.REACT_APP_ORG_NAME || 'Sistema Cartorial';
export const ORG_SUBTITLE = process.env.REACT_APP_ORG_SUBTITLE || 'Sistema de Produtividade';
