import { config } from "dotenv";
import * as Knex from "knex";

config();

const knex = Knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

export default knex;
