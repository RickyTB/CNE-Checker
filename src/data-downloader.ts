import fetch from "node-fetch";
import * as randomUseragent from "random-useragent";
import knex from "./bin/knex";
import {
  Canton,
  Junta,
  Parroquia,
  Provincia,
  Zona,
  CNEResponse,
  Circunscripcion,
} from "./entities";

const headers = {
  "User-Agent": randomUseragent.getRandom(),
  Accept: "*/*",
  "Accept-Language": "es-MX,es;q=0.8,en-US;q=0.5,en;q=0.3",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Requested-With": "XMLHttpRequest",
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
};

async function getCircunscripciones(
  provinciaId: number
): Promise<CNEResponse[]> {
  return fetch(
    `${process.env.RESULTS_PAGE}Resultados/CatalogoCircunscripcionJson`,
    {
      headers,
      body: `intProvincia=${provinciaId}`,
      method: "POST",
    }
  ).then((res) => res.json());
}

async function getCantones(
  provinciaId: number,
  codCir: number = 0
): Promise<CNEResponse[]> {
  return fetch(`${process.env.RESULTS_PAGE}Resultados/CatalogoCantonJson`, {
    headers,
    body: `intProvincia=${provinciaId}&intCircunscripcion=${codCir}`,
    method: "POST",
  }).then((res) => res.json());
}

async function getParroquias(
  codCanton: number,
  codCir: number = 0
): Promise<CNEResponse[]> {
  return fetch(
    `${process.env.RESULTS_PAGE}Resultados/CatalogoParroquiaJson`,
    {
      headers,
      body: `intCanton=${codCanton}&intCircunscripcion=${codCir}`,
      method: "POST",
    }
  ).then((res) => res.json());
}

async function getZonas(
  codParroquia: number,
  codCir: number = 0
): Promise<CNEResponse[]> {
  return fetch(`${process.env.RESULTS_PAGE}Resultados/CatalogoZonaJson`, {
    headers,
    body: `intParroquia=${codParroquia}&intCircunscripcion=${codCir}`,
    method: "POST",
  }).then((res) => res.json());
}

async function getJuntas(
  codZona: number,
  codParroquia: number,
  codCir: number = 0
): Promise<CNEResponse[]> {
  return fetch(`${process.env.RESULTS_PAGE}Resultados/CatalogoJuntaJson`, {
    headers,
    body: `intZona=${codZona}&intParroquia=${codParroquia}&intCircunscripcion=${codCir}`,
    method: "POST",
  }).then((res) => res.json());
}

async function save<T>(tableName: string, body: Omit<T, "id">[]): Promise<T[]> {
  const result = await knex(tableName).insert(body, "id");
  return result.map((r, index) => ({ id: r, ...body[index] })) as any;
}

async function saveCirs(
  circunscripciones: CNEResponse[],
  provinciaId: number
): Promise<Circunscripcion[]> {
  const cirs = circunscripciones.map((c) => ({
    codigo: c.intCodigo,
    nombre: c.strNombre,
    provinciaId,
  }));
  return save("circunscripcion", cirs);
}

async function main() {
  const provincias = await knex
    .select()
    .from<Provincia>("provincia")
    .where("id", ">=", 17);
  for (const provincia of provincias) {
    console.log(`Obteniendo información de juntas de ${provincia.nombre}`);
    const cneCir: CNEResponse[] = provincia.circunscripcion
      ? await getCircunscripciones(provincia.id)
      : [{ intCodigo: 0, intAux: provincia.id, strNombre: "" }];
    const circunscripciones =
      cneCir.length > 1
        ? await saveCirs(cneCir, provincia.id)
        : [{ id: undefined, codigo: 0 }];

    for (const cir of circunscripciones) {
      const cneCantones = await getCantones(provincia.id, cir.codigo);
      const cantones = await save<Canton>(
        "canton",
        cneCantones.map((c) => ({
          codigo: c.intCodigo,
          nombre: c.strNombre,
          provinciaId: provincia.id,
          cirId: cir.id,
        }))
      );
      for (const canton of cantones) {
        const cneParroquias = await getParroquias(canton.codigo, cir.codigo);
        const parroquias = await save<Parroquia>(
          "parroquia",
          cneParroquias.map((p) => ({
            codigo: p.intCodigo,
            nombre: p.strNombre,
            cantonId: canton.id,
          }))
        );
        for (const parr of parroquias) {
          const cneZonas = await getZonas(parr.codigo, cir.codigo);
          const zonas = await save<Zona>(
            "zona",
            cneZonas.map((z) => ({
              codigo: z.intCodigo,
              nombre: z.strNombre,
              parroquiaId: parr.id,
            }))
          );
          for (const zona of zonas) {
            console.log(
              `Obteniendo juntas de zona ${zona.nombre} en la parroquia ${parr.nombre} del cantón ${canton.nombre}`
            );
            const cneJuntas = await getJuntas(
              zona.codigo,
              parr.codigo,
              cir.codigo
            );
            await save<Junta>(
              "junta",
              cneJuntas.map((j) => ({
                codigo: j.intCodigo,
                nombre: j.strNombre,
                zonaId: zona.id,
              }))
            );
          }
        }
      }
    }
  }
}

main().then(console.log).catch(console.log);
