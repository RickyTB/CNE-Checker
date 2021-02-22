import * as webdriver from "selenium-webdriver";
import { until } from "selenium-webdriver";
import * as fs from "fs/promises";
import { CNEVote } from "./entities";

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

async function main() {
  await driver.get("https://resultados.cne.gob.ec/");
  await waitLoader();

  const presidentBtn = await driver.findElement({ className: "myButtonDig" });
  await presidentBtn.click();

  await waitLoader();
  await select("ddlProvincia", 2);

  await waitLoader();
  await select("ddlCanton", 170);

  await waitLoader();
  await select("ddlParroquia", 5975);

  await waitLoader();
  await select("ddlZona", 0);

  await waitLoader();
  await select("ddlJunta", 53258);

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
        `./actas/out_${index}.jpg`,
        acta.replace(/^data:image\/jpg;base64,/, ""),
        "base64"
      )
    )
  );

  const summary = (await driver.executeScript(collectSummaryJS)) as CNEVote[];
  console.log(results, summary);
}

main().then(console.log).catch(console.error);
