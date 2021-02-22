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
}

main().then(console.log).catch(console.log).finally(console.log);
