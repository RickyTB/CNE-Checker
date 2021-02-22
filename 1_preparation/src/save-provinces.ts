import knex from "./bin/knex";

const provinces = [
  { key: "1", value: "AZUAY" },
  { key: "2", value: "BOLIVAR" },
  { key: "3", value: "CAÑAR" },
  { key: "4", value: "CARCHI" },
  { key: "5", value: "COTOPAXI" },
  { key: "6", value: "CHIMBORAZO" },
  { key: "7", value: "EL ORO" },
  { key: "8", value: "ESMERALDAS" },
  { key: "9", value: "GUAYAS", cir: true },
  { key: "10", value: "IMBABURA" },
  { key: "11", value: "LOJA" },
  { key: "12", value: "LOS RIOS" },
  { key: "13", value: "MANABI", cir: true },
  { key: "14", value: "MORONA SANTIAGO" },
  { key: "15", value: "NAPO" },
  { key: "16", value: "PASTAZA" },
  { key: "17", value: "PICHINCHA", cir: true },
  { key: "18", value: "TUNGURAHUA" },
  { key: "19", value: "ZAMORA CHINCHIPE" },
  { key: "20", value: "GALAPAGOS" },
  { key: "21", value: "SUCUMBIOS" },
  { key: "22", value: "ORELLANA" },
  { key: "23", value: "STO DGO TSACHILAS" },
  { key: "24", value: "SANTA ELENA" },
  { key: "26", value: "EUROPA ASIA Y OCEANIA" },
  { key: "27", value: "EE.UU CANADA" },
  { key: "28", value: "AMERICA LATINA EL CARIBE Y AFRICA" },
];

knex("provincia")
  .insert(
    provinces.map((p) => ({
      id: p.key,
      nombre: p.value,
      circunscripcion: !!p.cir,
    }))
  )
  .then(console.log)
  .catch(console.error);
