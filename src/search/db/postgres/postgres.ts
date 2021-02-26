import { Pool, QueryResult } from 'pg';
import { DSN } from './config';
import log from '../../logger/logger';
import { IMDBMovie } from '../../server/imdb';
import { FullTorrent, ITorrent, parseSize } from '../../server/torrents';
import { IDBMovie, IMovie } from '../../model/model';

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
    log.debug('Executing query', { text, values });
    const res = await pool.query({ text, values });
    const duration = Date.now() - start;
    log.info('Executed query', { text, duration, rows: res.rowCount });
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

export const getMovieFromDB = async (torrent: ITorrent): Promise<IDBMovie> => {
  try {
    const res = torrent.torrent.imdb
      ? await query(`SELECT * FROM movies WHERE id='${torrent.torrent.imdb}'`)
      : await query(
          `SELECT * FROM movies WHERE title LIKE '%${torrent.movieTitle}%'`
        );
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
values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
    values ($1, $2, $3, $4, $5, $6, $7)`,
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
