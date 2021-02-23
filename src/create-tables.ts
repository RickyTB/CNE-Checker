import knex from "./bin/knex";

async function main() {
  await knex.schema.createTable("provincia", function (table) {
    table.integer("id").primary().notNullable().unsigned();
    table.string("nombre").notNullable();
    table.boolean("circunscripcion").notNullable();
  });

  await knex.schema.createTable("circunscripcion", function (table) {
    table.increments("id").primary();
    table.integer("codigo").notNullable();
    table.string("nombre").notNullable();
    table
      .integer("provinciaId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("provincia");
  });

  await knex.schema.createTable("canton", function (table) {
    table.increments("id").primary();
    table.integer("codigo").notNullable();
    table.string("nombre").notNullable();
    table
      .integer("provinciaId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("provincia");
    table
      .integer("cirId")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("circunscripcion");
  });

  await knex.schema.createTable("parroquia", function (table) {
    table.increments("id").primary();
    table.integer("codigo").notNullable();
    table.string("nombre").notNullable();
    table
      .integer("cantonId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("canton");
  });

  await knex.schema.createTable("zona", function (table) {
    table.increments("id").primary();
    table.integer("codigo").notNullable();
    table.string("nombre").notNullable();
    table
      .integer("parroquiaId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("parroquia");
  });

  await knex.schema.createTable("junta", function (table) {
    table.increments("id").primary();
    table.integer("codigo").notNullable();
    table.string("nombre").notNullable();
    table
      .integer("zonaId")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("zona");
  });

  await knex.schema.createTable("res_presidente", function (table) {
    table.increments("id").primary();
    table.integer("cand_1").notNullable();
    table.integer("cand_2").notNullable();
    table.integer("cand_3").notNullable();
    table.integer("cand_4").notNullable();
    table.integer("cand_5").notNullable();
    table.integer("cand_6").notNullable();
    table.integer("cand_7").notNullable();
    table.integer("cand_8").notNullable();
    table.integer("cand_9").notNullable();
    table.integer("cand_10").notNullable();
    table.integer("cand_11").notNullable();
    table.integer("cand_12").notNullable();
    table.integer("cand_13").notNullable();
    table.integer("cand_14").notNullable();
    table.integer("cand_15").notNullable();
    table.integer("cand_16").notNullable();
    table.integer("total_suf").notNullable();
    table.integer("blanco").notNullable();
    table.integer("nulo").notNullable();
    table
      .integer("juntaId")
      .unsigned()
      .notNullable()
      .unique()
      .references("id")
      .inTable("junta");
  });
}

main().then(console.log).catch(console.log).finally(console.log);
