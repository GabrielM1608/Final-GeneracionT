CREATE TABLE IF NOT EXISTS informes (
  id INTEGER PRIMARY KEY,
  titulo TEXT,
  contenido TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS turnos (
  id INTEGER PRIMARY KEY,
  nombre TEXT,
  fecha TEXT,
  hora TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY,
  nombre TEXT,
  email TEXT,
  mensaje TEXT,
  timestamp TEXT
);
