import * as webdriver from "selenium-webdriver";
import { until } from "selenium-webdriver";
import * as fs from "fs/promises";
import { CNEVote } from "./entities";
import knex from "./bin/knex";
import { Circunscripcion } from "./entities/Circunscripcion";

let driver = new webdriver.Builder().forBrowser("chrome").build();

async function select(id: string, optionValue: string | number) {
  const selectEl = await driver.findElement({ id });
  await driver.wait(until.elementIsEnabled(selectEl), 5000);
  await selectEl.click();
  await selectEl.findElement({ css: `option[value="${optionValue}"]` }).click();
}

async function waitLoader() {
  const loaderEl = await driver.wait(
    until.elementLocated({ className: "preloader-content-accion-Template" }),
    5000
  );
  await driver.wait(until.elementIsNotVisible(loaderEl), 5000);
}

const collectResultsJS = `
  const tableEl = document.getElementById("tablaCandi");
  const candidates = Array.from(tableEl.querySelectorAll("td:nth-child(2)"));
  const results = Array.from(tableEl.querySelectorAll("td:nth-child(3)"));
  return candidates.map((c, i) => ({
    name: c.innerText,
    votes: +results[i].innerText,
  }));
`;

const collectActasJS = `
const slider = document.querySelector('.slider');
return Array.from(slider.querySelectorAll('img')).map(img => img.src).filter((_, index) => index < 2)
`;

const collectSummaryJS = `
const sufragantes = document.querySelector('label[for="TOTAL_FIRMAS_Y_HUELLAS_DACTILARES_QUE_CONSTAN_EN_EL_PADR_N_ELECTORAL__Total_de_Sufragantes_"]+div').innerText;
const blanco = document.querySelector('label[for="VOTOS_BLANCOS"]+div').innerText;
const nulo = document.querySelector('label[for="VOTOS_NULOS"]+div').innerText;
return [{name: 'SUFRAGANTES', votes: +sufragantes},{name: 'BLANCO', votes: +blanco},{name: 'NULO', votes: +nulo}];
`;

async function collectJunta(
  codJunta: number,
  codZona: number,
  codParroquia: number,
  codCanton: number,
  codCir: number,
  codProvincia: number
) {
  await select("ddlProvincia", codProvincia);

  if (codCir) {
    await waitLoader();
    await select("ddlCircunscripcion", codCir);
  }

  await waitLoader();
  await select("ddlCanton", codCanton);

  await waitLoader();
  await select("ddlParroquia", codParroquia);

  await waitLoader();
  await select("ddlZona", codZona);

  await waitLoader();
  await select("ddlJunta", codJunta);

  const consultarBtn = await driver.findElement({ id: "btnConsultar" });
  await driver.wait(until.elementIsVisible(consultarBtn));
  await consultarBtn.click();

  await waitLoader();
  await driver.wait(until.elementLocated({ id: "tablaCandi" }));
  const results = (await driver.executeScript(collectResultsJS)) as CNEVote[];

  const verActaBtn = await driver.findElement({ id: "tdVerActa" });
  await driver.wait(until.elementIsVisible(verActaBtn));
  await verActaBtn.click();

  await driver.wait(until.elementLocated({ id: "pupupContenido" }));
  const actas = (await driver.executeScript(collectActasJS)) as string[];

  await Promise.all(
    actas.map((acta, index) =>
      fs.writeFile(
        `./actas/${codJunta}_${index + 1}.jpg`,
        acta.replace(/^data:image\/jpg;base64,/, ""),
        "base64"
      )
    )
  );

  const summary = (await driver.executeScript(collectSummaryJS)) as CNEVote[];
  return { results, summary };
}

async function resetPage() {
  await driver.findElement({ css: "#pupupHeader>button" }).click();
  const limpiarBtn = await driver.findElement({ id: "btnLimpiar" });
  await driver.wait(until.elementIsVisible(limpiarBtn));
  await limpiarBtn.click();
  await waitLoader();
}

async function buildCirMap(): Promise<Record<number, number>> {
  const cirs = (await knex({ cr: "circunscripcion" })
    .select("*")
    .orderBy("id", "asc")) as Circunscripcion[];
  return cirs.reduce((obj, cir) => ({ ...obj, [cir.id]: cir.codigo }), {});
}

async function queryJuntas(
  limit: number = 50,
  skip: number = 0,
): Promise<
  {
    juntaId: number;
    codJunta: number;
    codZona: number;
    codParroquia: number;
    codCanton: number;
    cirId: number;
    provinciaId: number;
  }[]
> {
  return knex({ j: "junta" })
    .join({ z: "zona" }, "z.id", "j.zonaId")
    .join({ p: "parroquia" }, "p.id", "z.parroquiaId")
    .join({ c: "canton" }, "c.id", "p.cantonId")
    .select({
      juntaId: "j.id",
      codJunta: "j.codigo",
      codZona: "z.codigo",
      codParroquia: "p.codigo",
      codCanton: "c.codigo",
      cirId: "c.cirId",
      provinciaId: "c.provinciaId",
    })
    .where('j.id', '>', skip)
    .orderBy("j.id", "asc")
    .limit(limit) as any;
}

async function main() {
  const cirMap = await buildCirMap();

  await driver.get("https://resultados.cne.gob.ec/");
  await waitLoader();

  const presidentBtn = await driver.wait(
    until.elementLocated({ className: "myButtonDig" })
  );
  await presidentBtn.click();
  await waitLoader();

  const juntas = await queryJuntas(1000, 114);
  for (const junta of juntas) {
    console.log(`Analizando junta ${junta.juntaId} de 39985 (${(junta.juntaId / 39985 * 100).toFixed(2)}%)`)
    const { results, summary } = await collectJunta(
      junta.codJunta,
      junta.codZona,
      junta.codParroquia,
      junta.codCanton,
      cirMap[junta.cirId] || 0,
      junta.provinciaId
    );
    const body = results.reduce(
      (obj, vote, index) => ({ ...obj, [`cand_${index + 1}`]: vote.votes }),
      {
        total_suf: summary[0].votes,
        blanco: summary[1].votes,
        nulo: summary[2].votes,
        juntaId: junta.juntaId,
      }
    );
    await knex("res_presidente").insert(body, "id");
    await resetPage();
  }

  return "LISTO";
}

main().then(console.log).catch(console.error);
