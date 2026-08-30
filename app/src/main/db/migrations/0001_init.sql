-- Schéma initial — canal-stock-desktop
-- Toute évolution de schéma passe par un nouveau fichier numéroté dans ce dossier,
-- jamais par une modification de ce fichier une fois livré (voir CLAUDE.md).

CREATE TABLE IF NOT EXISTS cartons (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,           -- ex: O3, U5, U21
  date_reception TEXT,                            -- ISO 8601 (YYYY-MM-DD)
  notes          TEXT DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- RG-01 : numeroSerie obligatoire et UNIQUE — contrainte posée au niveau base,
-- pas seulement en validation applicative.
CREATE TABLE IF NOT EXISTS decodeurs (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_serie        TEXT NOT NULL UNIQUE,
  carton_id           INTEGER REFERENCES cartons(id),
  carton_code         TEXT DEFAULT '',            -- dénormalisé pour affichage rapide
  date_livraison      TEXT,

  -- RG-05 : progression stricte en_stock -> vendu -> active
  statut              TEXT NOT NULL DEFAULT 'en_stock'
                       CHECK (statut IN ('en_stock', 'vendu', 'active')),

  date_vente          TEXT,
  type_vente          TEXT CHECK (type_vente IN ('equipe', 'apporteur') OR type_vente IS NULL),
  apporteur           TEXT DEFAULT '',
  commission_due      INTEGER NOT NULL DEFAULT 0,  -- RG-03, en FCFA
  commission_payee    INTEGER NOT NULL DEFAULT 0,  -- 0/1

  date_activation     TEXT,
  source_activation   TEXT DEFAULT '',             -- 'manuel' ou nom du fichier importé

  destinataire        TEXT DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_decodeurs_statut ON decodeurs(statut);
CREATE INDEX IF NOT EXISTS idx_decodeurs_carton_code ON decodeurs(carton_code);
CREATE INDEX IF NOT EXISTS idx_decodeurs_apporteur ON decodeurs(apporteur);

CREATE TABLE IF NOT EXISTS apporteurs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nom        TEXT NOT NULL UNIQUE,
  telephone  TEXT DEFAULT '',
  notes      TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- RG-06 : un seul objectif actif par (mois, annee) — contrainte UNIQUE composite,
-- l'upsert applicatif s'appuie dessus (ON CONFLICT).
CREATE TABLE IF NOT EXISTS objectifs (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  mois    INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee   INTEGER NOT NULL,
  cible   INTEGER NOT NULL,
  UNIQUE (mois, annee)
);

CREATE TABLE IF NOT EXISTS imports (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nom_fichier         TEXT NOT NULL,
  nb_lignes_fichier   INTEGER DEFAULT 0,
  nb_trouves          INTEGER DEFAULT 0,
  nb_non_trouves      INTEGER DEFAULT 0,
  numeros_non_trouves TEXT DEFAULT '[]',           -- JSON array sérialisé
  numeros_actives     TEXT DEFAULT '[]',           -- JSON array sérialisé
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
