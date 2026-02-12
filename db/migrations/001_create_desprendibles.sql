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
