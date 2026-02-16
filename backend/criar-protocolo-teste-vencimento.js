// criar-protocolo-teste-vencimento.js
// Execute: node criar-protocolo-teste-vencimento.js

require('dotenv').config();
const pool = require('./config/database');

async function criarProtocoloTesteVencimento() {
  try {
    console.log('📝 Criando protocolo de teste...\n');

    // Buscar primeiro serviço e usuário
    const servico = await pool.query('SELECT id, nome, dias_alerta FROM servicos LIMIT 1');
    const usuario = await pool.query('SELECT id, nome FROM usuarios WHERE ativo = true LIMIT 1');

    if (servico.rows.length === 0 || usuario.rows.length === 0) {
      console.log('❌ Crie pelo menos um serviço e um usuário primeiro!');
      return;
    }

    const s = servico.rows[0];
    const u = usuario.rows[0];

    // Criar protocolo que vence em X dias (baseado no dias_alerta do serviço)
    const diasAteVencimento = s.dias_alerta || 3; // Usa dias_alerta do serviço
    const hoje = new Date();
    const dataVencimento = new Date(hoje);
    dataVencimento.setDate(dataVencimento.getDate() + diasAteVencimento);

    const numeroTeste = `TESTE-ALERTA-${Date.now()}`;
    const dataHoje = hoje.toISOString().split('T')[0];
    const dataVenc = dataVencimento.toISOString().split('T')[0];

    const resultado = await pool.query(`
      INSERT INTO protocolos 
        (numero, servico_id, responsavel_id, data_entrada, data_vencimento, status, observacoes)
      VALUES 
        ($1, $2, $3, $4, $5, 'andamento', 'Protocolo para testar alertas')
      RETURNING *
    `, [numeroTeste, s.id, u.id, dataHoje, dataVenc]);

    console.log('✅ Protocolo de teste criado!');
    console.log('   Número:', resultado.rows[0].numero);
    console.log('   Serviço:', s.nome);
    console.log('   Dias de alerta configurado:', s.dias_alerta);
    console.log('   Responsável:', u.nome);
    console.log('   Data de hoje:', dataHoje);
    console.log('   Vence em:', dataVenc);
    console.log('   Dias até vencer:', diasAteVencimento);
    console.log('\n💡 Agora clique no botão "🔔 Enviar Alertas" novamente!');
    console.log('   O alerta deve ser enviado para o n8n!');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

criarProtocoloTesteVencimento();
