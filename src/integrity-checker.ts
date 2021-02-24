import knex from "./bin/knex";

async function main() {
  const ids = (
    await knex("res_presidente").select("juntaId").orderBy("juntaId", "desc")
  ).map((res) => res.juntaId);
  let prevId = 0;
  for (const id of ids) {
    if (prevId - id !== 1) {
      console.log(prevId, id);
    }
    prevId = id;
  }
}

main();
