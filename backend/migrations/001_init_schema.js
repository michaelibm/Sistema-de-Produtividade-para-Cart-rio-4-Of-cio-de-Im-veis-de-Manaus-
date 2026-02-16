/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // usuarios
  pgm.createTable("usuarios", {
    id: "id",
    nome: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    senha: { type: "varchar(255)", notNull: true },
    cargo: { type: "varchar(50)", notNull: true },
    ativo: { type: "boolean", default: true },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });

  // CHECK cargo
  pgm.addConstraint(
    "usuarios",
    "usuarios_cargo_check",
    "CHECK (cargo IN ('Supervisor', 'Escrevente', 'Auxiliar'))"
  );

  // servicos
  pgm.createTable("servicos", {
    id: "id",
    nome: { type: "varchar(255)", notNull: true },
    prazo: { type: "integer", notNull: true },
    tipo_prazo: { type: "varchar(20)", notNull: true },
    ativo: { type: "boolean", default: true },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });

  pgm.addConstraint(
    "servicos",
    "servicos_tipo_prazo_check",
    "CHECK (tipo_prazo IN ('uteis', 'corridos'))"
  );

  // protocolos
  pgm.createTable("protocolos", {
    id: "id",
    numero: { type: "varchar(100)", notNull: true, unique: true },
    servico_id: {
      type: "integer",
      notNull: false,
      references: "servicos",
      onDelete: "RESTRICT"
    },
    responsavel_id: {
      type: "integer",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT"
    },
    data_entrada: { type: "date", notNull: true },
    data_vencimento: { type: "date", notNull: true },
    data_conclusao: { type: "date" },
    status: { type: "varchar(20)", default: "andamento" },
    observacoes: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });

  pgm.addConstraint(
    "protocolos",
    "protocolos_status_check",
    "CHECK (status IN ('andamento', 'concluido', 'cancelado'))"
  );

  // tabela para múltiplos serviços por protocolo
  pgm.createTable("protocolo_servicos", {
    id: "id",
    protocolo_id: {
      type: "integer",
      notNull: true,
      references: "protocolos",
      onDelete: "CASCADE"
    },
    servico_id: {
      type: "integer",
      notNull: true,
      references: "servicos",
      onDelete: "RESTRICT"
    },
    adicionado_em: { type: "timestamp", default: pgm.func("now()") },
    adicionado_por: {
      type: "integer",
      references: "usuarios",
      onDelete: "SET NULL"
    }
  });

  pgm.createIndex("protocolo_servicos", "protocolo_id", {
    name: "idx_protocolo_servicos_protocolo"
  });

  // feriados
  pgm.createTable("feriados", {
    id: "id",
    data: { type: "date", notNull: true, unique: true },
    descricao: { type: "varchar(255)", notNull: true },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });

  // historico
  pgm.createTable("historico", {
    id: "id",
    protocolo_id: {
      type: "integer",
      references: "protocolos",
      onDelete: "CASCADE"
    },
    usuario_id: {
      type: "integer",
      references: "usuarios",
      onDelete: "SET NULL"
    },
    acao: { type: "varchar(100)", notNull: true },
    descricao: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });

  // indices
  pgm.createIndex("protocolos", "status", { name: "idx_protocolos_status" });
  pgm.createIndex("protocolos", "responsavel_id", { name: "idx_protocolos_responsavel" });
  pgm.createIndex("protocolos", "data_vencimento", { name: "idx_protocolos_data_vencimento" });
  pgm.createIndex("feriados", "data", { name: "idx_feriados_data" });

  // triggers updated_at
  pgm.createFunction(
    "update_updated_at_column",
    [],
    {
      returns: "trigger",
      language: "plpgsql"
    },
    `
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger("usuarios", "update_usuarios_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW"
  });

  pgm.createTrigger("servicos", "update_servicos_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW"
  });

  pgm.createTrigger("protocolos", "update_protocolos_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW"
  });

  // seed (igual teu init.sql)
  pgm.sql(`
    INSERT INTO usuarios (nome, email, senha, cargo)
    VALUES ('Administrador', 'admin@cartorio.com',
      '$2b$10$U12/wJRP2m7XXf.aDzingeLjY1DLMZ7xkLCUT42eCjmaFgi/nFVBW',
      'Supervisor'
    )
    ON CONFLICT (email) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO servicos (nome, prazo, tipo_prazo) VALUES
    ('Usucapião', 20, 'uteis'),
    ('Registro de Compra e Venda', 15, 'uteis'),
    ('Averbação', 10, 'uteis'),
    ('Certidão', 5, 'uteis'),
    ('Escritura Pública', 12, 'uteis')
    ON CONFLICT DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO feriados (data, descricao) VALUES
    ('2026-01-01', 'Ano Novo'),
    ('2026-02-16', 'Carnaval'),
    ('2026-02-17', 'Carnaval'),
    ('2026-04-03', 'Sexta-feira Santa'),
    ('2026-04-21', 'Tiradentes'),
    ('2026-05-01', 'Dia do Trabalho'),
    ('2026-06-04', 'Corpus Christi'),
    ('2026-09-07', 'Independência do Brasil'),
    ('2026-10-12', 'Nossa Senhora Aparecida'),
    ('2026-11-02', 'Finados'),
    ('2026-11-15', 'Proclamação da República'),
    ('2026-12-25', 'Natal')
    ON CONFLICT (data) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  // derruba na ordem correta
  pgm.dropTrigger("protocolos", "update_protocolos_updated_at", { ifExists: true });
  pgm.dropTrigger("servicos", "update_servicos_updated_at", { ifExists: true });
  pgm.dropTrigger("usuarios", "update_usuarios_updated_at", { ifExists: true });
  pgm.dropFunction("update_updated_at_column", [], { ifExists: true });

  pgm.dropTable("historico", { ifExists: true });
  pgm.dropTable("feriados", { ifExists: true });
  pgm.dropTable("protocolo_servicos", { ifExists: true });
  pgm.dropTable("protocolos", { ifExists: true });
  pgm.dropTable("servicos", { ifExists: true });
  pgm.dropTable("usuarios", { ifExists: true });
};
