// test-alerta-hoje.js
// Cria protocolo que vence HOJE para garantir que o alerta seja enviado

require('dotenv').config();
const pool = require('./config/database');

async function testarAlertaHoje() {
  try {
    console.log('🧪 Criando protocolo que vence HOJE...\n');

    const servico = await pool.query('SELECT id, nome FROM servicos LIMIT 1');
    const usuario = await pool.query('SELECT id, nome FROM usuarios WHERE ativo = true LIMIT 1');

    if (servico.rows.length === 0 || usuario.rows.length === 0) {
      throw new Error('Crie pelo menos um serviço e um usuário!');
    }

    const hoje = new Date().toISOString().split('T')[0];
    const numeroTeste = `TESTE-HOJE-${Date.now()}`;

    // Criar protocolo que vence HOJE
    await pool.query(`
      INSERT INTO protocolos 
        (numero, servico_id, responsavel_id, data_entrada, data_vencimento, status, observacoes)
      VALUES 
        ($1, $2, $3, $4, $5, 'andamento', 'TESTE - Vence HOJE')
    `, [numeroTeste, servico.rows[0].id, usuario.rows[0].id, hoje, hoje]);

    console.log('✅ Protocolo criado:');
    console.log('   Número:', numeroTeste);
    console.log('   Vence em:', hoje, '(HOJE)');
    console.log('\n🔔 Agora clique no botão "Enviar Alertas" novamente!');
    console.log('   Este protocolo DEVE aparecer no n8n!');
    
    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

testarAlertaHoje();
