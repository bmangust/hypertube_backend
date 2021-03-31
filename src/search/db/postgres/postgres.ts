import { Pool, QueryResult } from 'pg';
import { DSN } from './config';
import log from '../../logger/logger';
import { IMDBMovie } from '../../server/imdb';
import { ITorrent, parseSize } from '../../server/torrents';
import { IDBMovie, IKinopoiskMovie, IMovie } from '../../model/model';
import { utf8ToHex, atob } from '../../server/utils';
import { IKinopoiskFilmResponse } from '../../server/kinopoisk';

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
  values: (string | number | Date | Buffer)[] = []
): Promise<QueryResult<any>> {
  try {
    const start = Date.now();
    log.debug('Executing query', { text, values });
    const res = await pool.query({ text, values });
    const duration = Date.now() - start;
    log.info('Executed query', { text, duration, rows: res.rowCount, values });
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

export const getMovieFromDB = async (
  title: string,
  ibdbid?: string,
  year?: number
): Promise<IDBMovie> => {
  try {
    let res;
    if (ibdbid) res = await query(`SELECT * FROM movies WHERE id=$1`, [ibdbid]);
    else if (year > 0)
      res = await query(
        `SELECT * FROM movies WHERE title LIKE '%${title}%' AND year=$1`,
        [year]
      );
    else
      res = await query(`SELECT * FROM movies WHERE title LIKE '%${title}%'`);
    log.debug('[getMovieFromDB]', res.rows);
    return res.rows[0];
  } catch (e) {
    log.error(e);
    return null;
  }
};

export const saveMovieToDB = async (movie: IMDBMovie) => {
  log.debug('[saveMovieToDB]', movie);
  try {
    query(
      `INSERT INTO movies (id, title, image, year, genres, rating, views,
runtimeMins, contentRating, countries, plot, directors, directorList, stars, actorList, keywordList, images, imDbRating)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
ON CONFLICT (id) DO UPDATE SET (title, image, year, genres,
runtimeMins, contentRating, countries, plot, directors, directorList, stars, actorList, keywordList, images, imDbRating)
= ($2, $3, $4, $5, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) WHERE movies.id = $1`,
      [
        movie.id,
        movie.title,
        movie.image,
        movie.year,
        movie.genres,
        '0',
        '0',
        movie.runtimeMins || '0',
        movie.contentRating || null,
        movie.countries || null,
        movie.plot,
        movie.directors,
        movie.directorList ? JSON.stringify(movie.directorList) : null,
        movie.stars,
        movie.actorList ? JSON.stringify(movie.actorList) : null,
        movie.keywordList?.join(', '),
        movie.images ? JSON.stringify(movie.images) : null,
        movie.imDbRating,
      ]
    );
  } catch (e) {
    log.debug(movie);
    log.error(e);
  }
};

export const saveKinopoiskMovieToDB = async (movie: IKinopoiskFilmResponse) => {
  log.debug('[saveKinopoiskMovieToDB]', movie);
  try {
    query(
      `INSERT INTO kinopoisk (
        id,
        imdbId,
        nameRu,
        nameEn,
        description,
        posterUrl,
        posterUrlPreview)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING`,
      [
        movie.data.filmId,
        movie.externalId.imdbId,
        movie.data.nameRu,
        movie.data.nameEn,
        movie.data.description,
        movie.data.posterUrl,
        movie.data.posterUrlPreview,
      ]
    );
  } catch (e) {
    log.debug(movie);
    log.error(e);
  }
};

export const getKinopoiskMovieFromDB = async (
  id: string
): Promise<IKinopoiskMovie | null> => {
  try {
    const res = await query(
      'SELECT id as kinoid, * FROM kinopoisk WHERE imdbid=$1',
      [id]
    );
    if (res.rowCount) return res.rows[0] as IKinopoiskMovie;
  } catch (e) {
    log.error(e);
  }
  return null;
};

export const updateMovieInDB = async (movie: IMDBMovie) => {
  log.debug('[updateMovieInDB]', movie);
  try {
    const res = await query(`SELECT * FROM movies WHERE id=${movie.id}`);
    const prevValue = res.rows[0];
    query(
      `UPDATE movies SET (title, image, year, genres,
runtimeMins, contentRating, countries, plot, directors, directorList, stars, actorList, keywordList, images, imDbRating)
= ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
WHERE movies.id = $1`,
      [
        movie.id,
        movie.title,
        movie.image,
        movie.year,
        movie.genres,
        movie.runtimeMins || prevValue.runtimeMins,
        movie.contentRating || prevValue.contentRating,
        movie.countries || prevValue.countries,
        movie.plot,
        movie.directors,
        movie.directorList
          ? JSON.stringify(movie.directorList)
          : prevValue.directorList,
        movie.stars,
        movie.actorList ? JSON.stringify(movie.actorList) : prevValue.actorList,
        movie.keywordList
          ? movie.keywordList.join(', ')
          : prevValue.keywordList,
        movie.images ? JSON.stringify(movie.images) : prevValue.images,
        movie.imDbRating,
      ]
    );
  } catch (e) {
    log.debug(movie);
    log.error(e);
  }
};

export const saveTorrentInDB = (torrent: ITorrent, movie: IMovie) => {
  try {
    const trnt = torrent.torrent;
    query(
      `INSERT INTO torrents
    (movieid, torrentname, magnet, torrent, seeds, peers, size)
    values ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (movieid) DO UPDATE SET
    (torrentname, magnet, torrent, seeds, peers, size)
    = ($2, $3, $4, $5, $6, $7) WHERE torrents.movieid=$1`,
      [
        movie.id,
        torrent.torrentTitle,
        trnt.magnet,
        trnt.torrent,
        trnt.seeds,
        trnt.peers,
        parseSize(trnt.size),
      ]
    );
  } catch (e) {
    log.error(e);
  }
};

export const insertTorrentIntoLoadedFiles = (torrent: ITorrent) => {
  try {
    const trnt = torrent.torrent;
    query(
      `INSERT INTO loaded_files
    (file_id, torrent_file, file_name, magnet_link)
    values ($1, $2, $3, $4)`,
      [
        torrent.torrent.imdb || utf8ToHex(torrent.movieTitle).slice(0, 16),
        trnt.torrent,
        torrent.torrentTitle,
        trnt.magnet,
      ]
    );
  } catch (e) {
    log.error(e);
  }
};

export const initDatabase = () => {
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
  const createKinopoiskMoviesTable = `CREATE TABLE IF NOT EXISTS kinopoisk (
    id              VARCHAR(16) PRIMARY KEY,
    imdbId          VARCHAR(16) REFERENCES movies(id),
    nameRu          TEXT NOT NULL,
    nameEn          TEXT NOT NULL,
    description     TEXT DEFAULT '',
    posterUrl       TEXT,
    posterUrlPreview TEXT
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
    movieid   VARCHAR(16) NOT NULL UNIQUE REFERENCES movies(id),
    torrentname TEXT NOT NULL,
    magnet    TEXT,
    torrent   BYTEA,
    seeds     INTEGER DEFAULT 0,
    peers     INTEGER DEFAULT 0,
    size      NUMERIC,
    CHECK (magnet IS NOT NULL OR torrent IS NOT NULL)
  );`;

  const createRatingTable = `CREATE TABLE IF NOT EXISTS user_ratings (
    id        SERIAL PRIMARY KEY,
    userid    INTEGER NOT NULL,
    movieid   VARCHAR(16) NOT NULL REFERENCES movies(id),
    vote    integer NOT NULL,
    UNIQUE (userid, movieid)
  );`;
  log.debug('[initDatabase]');
  // const dropTableQuery = `DROP TABLE IF EXISTS movies`;
  // await query(dropTableQuery);
  query(createMoviesTable);
  query(createCommentsTable);
  query(createRatingTable);
  query(createTorrentsTable);
  query(createKinopoiskMoviesTable);
};
