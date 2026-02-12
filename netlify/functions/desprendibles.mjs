import { neon } from "@netlify/neon";

const sql = neon();

export const config = {
  path: "/api/desprendibles"
};

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS desprendibles (
    id BIGSERIAL PRIMARY KEY,
    cedula TEXT NOT NULL,
    nombre TEXT NOT NULL,
    periodo TEXT NOT NULL,
    periodo_texto TEXT NOT NULL,
    fecha_carga TEXT NOT NULL,
    archivo TEXT NOT NULL,
    archivo_size INTEGER NOT NULL,
    estado TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cedula, periodo)
  );
`;

async function ensureSchema() {
  await sql(CREATE_TABLE_SQL);
}

function parseJsonBody(event) {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch (error) {
    return null;
  }
}

export async function handler(event) {
  try {
    await ensureSchema();

    if (event.httpMethod === "GET") {
      const limit = Number(event.queryStringParameters?.limit || 50);
      const rows = await sql(
        "SELECT cedula, nombre, periodo, periodo_texto, fecha_carga, archivo, archivo_size, estado, created_at FROM desprendibles ORDER BY created_at DESC LIMIT $1",
        [Number.isFinite(limit) ? limit : 50]
      );

      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: rows })
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const payload = parseJsonBody(event);
    if (!payload) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "JSON inválido" })
      };
    }

    const {
      cedula,
      nombre,
      periodo,
      periodoTexto,
      fechaCarga,
      archivo,
      archivoSize,
      estado
    } = payload;

    if (!cedula || !nombre || !periodo || !periodoTexto || !fechaCarga || !archivo || !archivoSize || !estado) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Faltan campos requeridos" })
      };
    }

    const result = await sql(
      "INSERT INTO desprendibles (cedula, nombre, periodo, periodo_texto, fecha_carga, archivo, archivo_size, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (cedula, periodo) DO NOTHING RETURNING id",
      [cedula, nombre, periodo, periodoTexto, fechaCarga, archivo, archivoSize, estado]
    );

    return {
      statusCode: 201,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inserted: result.length > 0 })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Error al guardar en la base de datos" })
    };
  }
}
