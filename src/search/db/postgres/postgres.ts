import { Pool, QueryConfig, QueryResult } from 'pg';
import { DSN } from './config';
import log from '../../logger/logger';
import { dbToIMovie, IMDBMovie } from '../../server/imdb';
import { ITorrent } from '../../server/torrents';
import { isMovie } from 'imdb-api/lib/interfaces';

log.debug('creating pool');
const pool = new Pool({
  max: 20,
  connectionString: DSN,
  idleTimeoutMillis: 30000,
});
log.debug('pool created', pool);
log.debug('testing connection');
pool.connect().then((client) => {
  return client
    .query('SELECT NOW()', [])
    .then((res) => {
      client.release();
      log.debug('SELECT NOW() response: ', res);
    })
    .catch((err) => log.error('SELECT NOW() error', err));
});

export const query = async (
  text: string,
  values: (string | number)[] = []
): Promise<QueryResult<any>> => {
  try {
    const start = Date.now();
    log.info('Executing query', { text, values });
    const res = await pool.query({ text, values });
    const duration = Date.now() - start;
    log.info('Executed query', { text, duration, rows: res.rowCount });
    log.debug('Result:', res.rows);
    return res;
  } catch (e) {
    log.error(e);
    return {
      rows: [],
      command: text.split(' ')[0],
      rowCount: 0,
      oid: 0,
      fields: [],
    };
  }
};

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
      id VARCHAR(16) PRIMARY KEY,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      rating VARCHAR(10) DEFAULT '0',
      views VARCHAR(10) DEFAULT '0',
      year VARCHAR(9) NOT NULL,
      runtimeMins VARCHAR(10) DEFAULT '0',
      plot TEXT DEFAULT '',
      genres TEXT NOT NULL DEFAULT '',
      countries TEXT,
      contentRating TEXT,
      imDbRating VARCHAR(10) NOT NULL,
      directors TEXT DEFAULT '',
      directorList TEXT,
      stars TEXT DEFAULT '',
      actorList TEXT,
      keywordList TEXT,
      images TEXT
   );`;
  log.debug('init database');
  // const dropTableQuery = `DROP TABLE IF EXISTS movies`;
  // await query(dropTableQuery);
  const res = await query(createMoviesTable);
  log.debug('Create movies table', res);
};

export const getMovieFromDB = async (torrent: ITorrent) => {
  const res = torrent.torrent.imdb
    ? await query(`SELECT * FROM movies WHERE id='${torrent.torrent.imdb}'`)
    : await query(
        `SELECT * FROM movies WHERE title LIKE '%${torrent.movieTitle}%'`
      );
  log.debug('getMovieFromDB', res);
  return res.rowCount ? dbToIMovie(res.rows[0], torrent) : null;
};

export const saveMovieToDB = (movie: IMDBMovie) => {
  log.debug('saveMovieToDB', movie);
  try {
    query(
      `INSERT INTO movies(id, title, image, year, genres, rating, views,
runtimeMins, contentRating, countries, plot, directors, directorList, stars, actorList, keywordList, images, imDbRating)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        movie.id,
        movie.title,
        movie.image,
        movie.year,
        movie.genres,
        0,
        0,
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
    updateMovieInDB(movie);
    log.debug(movie);
    log.error(e);
  }
};

export const updateMovieInDB = async (movie: IMDBMovie) => {
  log.debug('updateMovieInDB', movie);
  try {
    const res = await query(`SELECT * FROM movies WHERE id=${movie.id}`);
    const prevValue = res.rows[0];
    query(
      `UPDATE movies set (title, image, year, genres,
runtimeMins, contentRating, countries, plot, directors, directorList, stars, actorList, keywordList, images, imDbRating)
= ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
where id = $1`,
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
