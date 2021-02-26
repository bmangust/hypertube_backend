import { Pool, QueryResult } from 'pg';
import { DSN } from './config';
import log from '../../logger/logger';

log.debug('creating pool');
const pool = new Pool({
  max: 20,
  connectionString: DSN,
  idleTimeoutMillis: 30000,
});
log.debug('pool created', pool);
log.debug('testing connection');

export async function query(
  text: string,
  values: (string | number | Date)[] = []
): Promise<QueryResult<any>> {
  try {
    const start = Date.now();
    log.trace('Executing query', { text, values });
    const res = await pool.query({ text, values });
    const duration = Date.now() - start;
    log.info('Executed query', { text, values, duration, rows: res.rowCount });
    log.trace('Result:', res.rows);
    return res;
  } catch (e) {
    log.error(e, text, values);
    return {
      rows: [],
      command: text.split(' ')[0],
      rowCount: 0,
      oid: 0,
      fields: [],
    };
  }
}

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  let lastQuery = null;
  // set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    log.error('A client has been checked out for more than 5 seconds!');
    log.error(`The last executed query on this client was: ${lastQuery}`);
  }, 5000);
  // monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    lastQuery = args;
    return query.apply(client, args);
  };
  client.release = () => {
    // clear our timeout
    clearTimeout(timeout);
    // set the methods back to their old un-monkey-patched version
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  return client;
};

export const initDatabase = async () => {
  const createMoviesTable = `CREATE TABLE IF NOT EXISTS movies (
    id              VARCHAR(16) PRIMARY KEY,
    title           TEXT NOT NULL,
    image           TEXT NOT NULL,
    rating          VARCHAR(10) DEFAULT '0',
    votes           VARCHAR(10) DEFAULT '0',
    views           VARCHAR(10) DEFAULT '0',
    year            VARCHAR(9) NOT NULL,
    runtimeMins     VARCHAR(10) DEFAULT '0',
    plot            TEXT DEFAULT '',
    genres          TEXT NOT NULL DEFAULT '',
    countries       TEXT,
    contentRating   TEXT,
    imDbRating      VARCHAR(10) NOT NULL,
    directors       TEXT DEFAULT '',
    directorList    TEXT,
    stars           TEXT DEFAULT '',
    actorList       TEXT,
    keywordList     TEXT,
    images          TEXT
  );`;

  const createCommentsTable = `CREATE TABLE IF NOT EXISTS comments (
    id        SERIAL PRIMARY KEY,
    userid    INT4 NOT NULL,
    movieid   VARCHAR(16) NOT NULL REFERENCES movies(id),
    text      TEXT NOT NULL,
    time      TIMESTAMP DEFAULT current_timestamp
  );`;

  // size in GB
  const createTorrentsTable = `CREATE TABLE IF NOT EXISTS torrents (
    id        SERIAL PRIMARY KEY,
    movieid   VARCHAR(16) NOT NULL REFERENCES movies(id),
    torrentname TEXT NOT NULL,
    magnet    TEXT UNIQUE,
    torrent   BYTEA UNIQUE,
    seeds     INTEGER DEFAULT 0,
    peers     INTEGER DEFAULT 0,
    size      NUMERIC,
    CHECK (magnet IS NOT NULL OR torrent IS NOT NULL)
  );`;
  log.debug('[initDatabase]');
  // const dropTableQuery = `DROP TABLE IF EXISTS movies`;
  // await query(dropTableQuery);
  let res = await query(createMoviesTable);
  log.trace('Create movies table', res);
  res = await query(createCommentsTable);
  log.trace('Create comments table', res);
  res = await query(createTorrentsTable);
  log.trace('Create torrents table', res);
};
