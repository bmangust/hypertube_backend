import { query } from './postgres';
import log from '../../logger/logger';
import {
  GenresKeys,
  IMDBMovie,
  IDBMovie,
  IFrontComment,
  IMovie,
} from '../../model/model';
import { selectCommentsByMovieID } from './comments';

export type IRating = 1 | 2 | 3 | 4 | 5;

const selectMovieFromDB = async (
  id: string,
  title: string = ''
): Promise<IDBMovie | null> => {
  try {
    if (!id && !title)
      throw new Error('[selectMovieFromDB] Both movieID and title are missing');
    const res = id
      ? await query(`SELECT id as imdbid, * FROM movies WHERE id='${id}'`)
      : await query(
          `SELECT id as imdbid, * FROM movies WHERE title LIKE '%${title}%'`
        );
    log.debug('[selectMovieFromDB]', res.rows);
    return res.rowCount ? res.rows[0] : null;
  } catch (e) {
    log.error(e);
    return null;
  }
};

const dbToIMovie = (row: IDBMovie, comments?: IFrontComment[]): IMovie => {
  log.trace('[dbToIMovie]', row);
  const defaultNumberOfCommentsToLoad = 5;
  return {
    id: row.imdbid,
    title: row.title,
    img: row.image,
    src: '',
    info: {
      avalibility: 0,
      year: +row.year,
      genres: (row.genres.split(', ') as unknown) as GenresKeys[],
      rating: +row.rating,
      views: +row.views,
      length: +row.runtimemins,
      pgRating: row.contentrating || 'N/A',
      countries: row.countries?.split(', ') || [],
      description: row.plot || '',
      directors: row.directors,
      directorList: JSON.parse(row.directorlist),
      stars: row.stars,
      cast: JSON.parse(row.actorlist),
      keywords: row.keywordlist?.split(','),
      photos: row.images ? JSON.parse(row.images) : undefined,
      comments: comments?.slice(0, defaultNumberOfCommentsToLoad),
      maxComments: comments ? comments.length : +row.maxcomments,
    },
  };
};

// ========== exported =============

export const updateMovieRating = async (
  movieId: string,
  vote: IRating
): Promise<string> => {
  try {
    const movie = await selectMovieFromDB(movieId);
    if (!movie) throw new Error(`MovieID ${movieId} not found`);
    const newRating = (
      (+movie.rating * +movie.votes + vote) /
      (+movie.votes + 1)
    ).toFixed(8);
    query(
      `UPDATE movies SET (rating, votes) = ($2, $3) WHERE id = $1 RETURNING *`,
      [movieId, newRating, +movie.votes + 1]
    );
    return newRating;
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

export const getMovieInfo = async (movieid: string): Promise<IMovie> => {
  log.debug('[selectMovies]', movieid);
  if (!movieid) throw new Error('comment id is missing');
  try {
    const movie = await selectMovieFromDB(movieid);
    if (!movie) throw new Error('Movie not found');
    const comments = await selectCommentsByMovieID(movieid);
    return dbToIMovie(movie, comments);
  } catch (e) {
    log.error(e);
    return null;
  }
};

export const getMovies = async (limit: number = 5, offset: number = 0) => {
  try {
    const res = await query(
      `select
        m.id as imdbid, m.*, count(c.*) maxComments
      from
        movies m
      join torrents t on
        t.movieid = m.id
      left join comments c on
        m.id = c.movieid 
      where
        t.magnet is not null
        or t.torrent is not null
      group by m.id
      order by
        m.rating
      limit $1 offset $2;`,
      [limit, offset]
    );
    if (!res.rowCount) throw new Error('No movies with saved torrents found');
    return res.rows.map((row) => dbToIMovie(row));
  } catch (e) {
    log.error(e);
    return null;
  }
};
