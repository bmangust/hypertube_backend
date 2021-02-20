import axios from 'axios';
import { json } from 'express';
import { QueryResultRow } from 'pg';
import { getMovieFromDB, saveMovieToDB } from '../db/postgres/postgres';
import log from '../logger/logger';
import { GenresKeys, IMovie } from '../model/model';
import { FullTorrent, ITorrent } from './torrents';
const nameToImdb = require('name-to-imdb');

interface IMDBPerson {
  id: string;
  name: string;
  image?: string;
  asCharacter?: string;
}

interface nameToImdbSearch {
  match: 'imdbFind';
  meta: {
    id: string;
    name: string;
    year: number;
    type: 'feature';
    yearRange: string | number | undefined;
    image: {
      src: string;
      width: number;
      height: number;
    };
    starring: string;
    similarity: number;
  };
}

export interface IMDBMovie {
  id: string;
  title: string;
  type?: string;
  year: string;
  image: string;
  runtimeMins?: string;
  plot: string;
  genres: string;
  countries?: string;
  contentRating?: string;
  imDbRating: string;
  directors: string;
  directorList?: IMDBPerson[];
  stars: string;
  actorList?: IMDBPerson[];
  keywordList?: string[];
  images?: string[];
  similars?: IMDBMovie[];
  errorMessage?: string;
}

export const removeDuplicates = (movies: IMovie[]) => {
  return movies.reduce((acc: IMovie[], cur) => {
    return !cur || acc.find((movie) => movie.id === cur.id)
      ? acc
      : [...acc, cur];
  }, []);
};

export const getIMDBInfo = async (
  torrent: ITorrent
): Promise<IMDBMovie | null> => {
  try {
    const movie = await searchMovieInIMDB(torrent);
    if (movie) {
      if (movie.similars?.length) {
        movie.similars.forEach((item) => saveMovieToDB(item));
      }
      return movie;
    }
    return await getNameToIMDBInfo(torrent.movieTitle);
  } catch (e) {
    log.error(e);
    throw new Error('Error getting IMDB info');
  }
};

const searchMovieInIMDB = async (torrent: ITorrent) => {
  let id = torrent.torrent.imdb || '';
  if (id === '') {
    const search = await axios(
      `https://imdb-api.com/en/API/Search/${process.env.IMDB_API_KEY}/${torrent.movieTitle} ${torrent.year}`,
      { validateStatus: (status) => status >= 200 && status < 500 }
    );
    log.debug('[searchMovieInIMDB] SEARCH result', search.data);
    if (search.data.results && search.data.results.length) {
      id = search.data.results[0]?.id;
    }
    if (id) return search.data as IMDBMovie;
  }
  const movie = await axios(
    `https://imdb-api.com/en/API/Title/${process.env.IMDB_API_KEY}/${id}`,
    { validateStatus: (status) => status >= 200 && status < 500 }
  );
  log.debug('[searchMovieInIMDB] TITLE result', movie?.data);
  if (movie.data?.id) {
    log.debug('[searchMovieInIMDB] results', movie.data);
    return movie.data as IMDBMovie;
  } else {
    return null;
  }
};

const getNameToIMDBInfo = async (title: string): Promise<IMDBMovie | null> => {
  try {
    const res = await nameToImdbPromise(title);
    log.debug('[getIMDBInfo] IMDBMovie', res);
    return {
      id: res.meta.id,
      title: res.meta.name,
      year: `${res.meta.year}`,
      image: res.meta.image.src,
      plot: '',
      genres: '',
      imDbRating: '',
      directors: '',
      stars: '',
    } as IMDBMovie;
  } catch (e) {
    return null;
  }
};

const nameToImdbPromise = (title: string): Promise<nameToImdbSearch> => {
  return new Promise(function (resolve, reject) {
    nameToImdb(title, (err, res, inf) => {
      if (!res) reject(err);
      resolve(inf);
    });
  });
};

export const imdbToIMovie = (
  movie: IMDBMovie | null,
  torrent: ITorrent
): IMovie => {
  log.trace('[imdbToIMovie]', movie);
  if (!movie) return null;
  return {
    id: movie.id,
    title: movie.title,
    img: movie.image,
    src: '',
    info: {
      avalibility: torrent?.torrent.seeds || 0,
      year: +movie.year,
      genres: movie.genres?.split(', ') as GenresKeys[],
      rating: 0,
      views: 0,
      length: +movie.runtimeMins || 0,
      pgRating: movie.contentRating || 'N/A',
      countries: movie.countries?.split(', '),
      description: movie.plot || '',
      directors: movie.directors,
      directorList: movie.directorList,
      stars: movie.stars,
      cast: movie.actorList,
      keywords: movie.keywordList,
      photos: movie.images || undefined,
    },
  };
};

export const dbToIMovie = (row: QueryResultRow, torrent: ITorrent): IMovie => {
  log.trace('[dbToIMovie]', row);
  return {
    id: row.id,
    title: row.title,
    img: row.image,
    src: '',
    info: {
      avalibility: torrent?.torrent.seeds || 0,
      year: +row.year,
      genres: row.genres.split(', '),
      rating: +row.rating,
      views: row.views,
      length: +row.runtimemins,
      pgRating: row.contentrating || 'N/A',
      countries: row.countries?.split(', ') || '',
      description: row.plot || '',
      directors: row.directors,
      directorList: JSON.parse(row.directorlist),
      stars: row.stars,
      cast: JSON.parse(row.actorlist),
      keywords: row.keywordlist?.split(','),
      photos: row.images ? JSON.parse(row.images) : undefined,
    },
  };
};

export const loadMoviesInfo = (torrents: ITorrent[]) => {
  return Promise.all(
    torrents.map(async (torrent) => {
      const dbInfo = await getMovieFromDB(torrent);
      if (dbInfo) {
        log.debug('movie found in DB: ', dbInfo);
        return dbInfo;
      }
      log.info(
        `${torrent.movieTitle} was not found in database, now search in IMDB`
      );

      const movie = await getIMDBInfo(torrent);
      saveMovieToDB(movie);
      return imdbToIMovie(movie, torrent);
    })
  );
};
