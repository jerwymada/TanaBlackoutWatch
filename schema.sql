-- Table neighborhoods
CREATE TABLE IF NOT EXISTS neighborhoods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL
);

-- Table outages
CREATE TABLE IF NOT EXISTS outages (
  id SERIAL PRIMARY KEY,
  neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id),
  date TEXT NOT NULL,
  start_hour REAL NOT NULL,
  end_hour REAL NOT NULL,
  reason TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS outages_date_idx ON outages(date);
CREATE INDEX IF NOT EXISTS outages_neighborhood_idx ON outages(neighborhood_id);
CREATE INDEX IF NOT EXISTS outages_date_neighborhood_idx ON outages(date, neighborhood_id);


