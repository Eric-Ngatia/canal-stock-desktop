-- Ajoute le nombre de décodeurs réellement passés à "active" par CET import.
-- `nb_trouves` (0001_init.sql) compte les numéros retrouvés en base, y compris ceux déjà
-- activés par un import précédent (RG-04 idempotence) — ce n'est pas la même donnée que
-- "combien ce fichier a-t-il activé", que l'historique doit pourtant pouvoir afficher.
ALTER TABLE imports ADD COLUMN nb_actives INTEGER NOT NULL DEFAULT 0;
