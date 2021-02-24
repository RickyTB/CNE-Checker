import * as csv from "csv-parser";
import * as fs from "fs";
import knex from "./bin/knex";

async function readFile(path: string): Promise<any[]> {
  return new Promise((res) => {
    const results = [];
    fs.createReadStream(path)
      .pipe(
        csv({
          headers: [
            "id",
            "cand_1",
            "cand_2",
            "cand_3",
            "cand_4",
            "cand_5",
            "cand_6",
            "cand_7",
            "cand_8",
            "cand_9",
            "cand_10",
            "cand_11",
            "cand_12",
            "cand_13",
            "cand_14",
            "cand_15",
            "cand_16",
            "total_suf",
            "blanco",
            "nulo",
            "juntaId",
          ],
        })
      )
      .on("data", (data) => results.push(data))
      .on("end", () => res(results));
  });
}

async function main() {
  const results = await readFile("csv/data.csv");
  const body = results.map(({ id, ...result }) => result);
  for (const row of body) {
    try {
      await knex("res_presidente").insert(row);
    } catch (e) {
      console.error(e);
    }
  }
  return "LISTO";
}

main().then(console.log).catch(console.error);
