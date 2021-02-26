import TorrentSearchApi, { Torrent } from 'torrent-search-api';
import log from '../logger/logger';
const Magnet2torrent = require('magnet2torrent-js');

export interface ITorrent {
  torrentTitle: string; // 'name.of.a.movie.year.format.row'
  croppedTorrentTitle: string; // 'name.of.a.movie'
  movieTitle: string; // 'name of a movie'
  year: number; // 2005
  torrent: FullTorrent;
}

export interface FullTorrent extends Torrent {
  seeds?: number;
  peers?: number;
  torrent?: string;
  imdb?: string;
}

const m2t = new Magnet2torrent({ timeout: 60 });

const parseDottedFormat = (torrent: Torrent): ITorrent => {
  const titleRE = /^([\w.-]+)\.(\d{4})\./;
  const match = torrent.title.match(titleRE);
  log.trace(match);
  const name = match ? match[1] : torrent.title;
  const seriesName = name.match(/^([\w.-]+)\.s\d{1,2}\./i);
  const title = seriesName ? seriesName[1] : name;
  return {
    torrentTitle: torrent.title,
    croppedTorrentTitle: title,
    movieTitle: title.replace(/\./g, ' '),
    year: match ? +match[2] : 0,
    torrent,
  };
};

const parseSpacedFormat = (torrent: Torrent): ITorrent => {
  const titleRE = /^([\w\s:-]+) \((\d{4})\)/;
  const match = torrent.title.match(titleRE);
  log.trace(match);
  const name = match ? match[1] : torrent.title;
  const seriesName = name.match(/^([\w\s:-]+) \(?(s\d{1,2})\)?/i);
  const title = seriesName ? seriesName[1] : name;
  return {
    torrentTitle: torrent.title,
    croppedTorrentTitle: title,
    movieTitle: title,
    year: match ? +match[2] : 0,
    torrent,
  };
};

export const parseSize = (size: string) => {
  return size.search('GB') !== -1
    ? Number.parseFloat(size)
    : Number.parseFloat(size) / 1000;
};

export const enableTorrentSearch = () => {
  TorrentSearchApi.enableProvider('Rarbg');
  TorrentSearchApi.enableProvider('ThePirateBay');
  const activeProviders = TorrentSearchApi.getActiveProviders();
  log.trace('activeProviders', activeProviders);
};

export const getMovieInfo = (torrent: Torrent): ITorrent => {
  if (torrent.title.search(' ') !== -1) return parseSpacedFormat(torrent);
  else return parseDottedFormat(torrent);
};

export const downloadTorrent = async (torrent: FullTorrent) => {
  try {
    const torrentFile = await m2t.getTorrent(torrent.magnet);
    const file = torrentFile.toTorrentFile();
    log.trace(file);
    return file;
  } catch (e) {
    log.error(e);
    return null;
  }
};

/**
 * Loops through given serach results and groups movies by title
 * @param torrents FullTorrent[] torrents search result
 * @param options params for filter
 */
export const groupTorrentsByTitle = (
  torrents: FullTorrent[],
  options = {
    maxSize: 3,
    sizeStep: 1,
  }
): ITorrent[] => {
  log.debug('[Torrents] groupTorrentsByTitle start');
  const sortedTorrents = torrents.sort(
    (a, b) => parseSize(a.size) - parseSize(b.size)
  );

  log.debug('[Torrents] sortedTorrents', sortedTorrents);

  const grouppedTorrents = torrents.reduce(
    (acc: ITorrent[], cur: FullTorrent) => {
      log.trace('acc:', acc, '\ncur:', cur);
      try {
        const currentMovie = getMovieInfo(cur);
        const isAdded = acc.find(
          (item: ITorrent) =>
            item.croppedTorrentTitle === currentMovie.croppedTorrentTitle
        );
        if (!isAdded) {
          log.trace('adding: ', currentMovie);
          return [...acc, currentMovie];
        }
        return acc;
      } catch (e) {
        log.error(e);
        return acc;
      }
    },
    []
  );

  log.trace('[Torrents] grouppedTorrents', grouppedTorrents);

  // try to find lightest torrents first
  // if failed - increase limit by 1 GB and try again
  if (grouppedTorrents.length === 0 && torrents.length > 0)
    return groupTorrentsByTitle(torrents, {
      maxSize: options.maxSize + options.sizeStep,
      sizeStep: options.sizeStep,
    });
  log.debug('[Torrents] groupTorrentsByTitle end');
  return grouppedTorrents;
};

export const searchTorrents = async function (
  search: string,
  category: string = 'Movie',
  options = { limit: 20, retries: 3 }
) {
  log.debug('[Torrents] searchTorrents start');
  try {
    let torrents = (await TorrentSearchApi.search(
      search,
      category,
      options.limit
    )) as FullTorrent[];
    log.info(`Got ${torrents.length} torrents`);
    log.debug(torrents);
    if (!torrents.length) throw new Error('Zero torrents found');

    const filetredTorrents = torrents
      .filter((torrent) => !torrent.title.match(/xxx/gi))
      .filter((torrent) =>
        torrent.title.match(/(720p)|(1080p)|(brrip)|(dvdrip)/gi)
      );

    // torrents = await Promise.all(
    //   torrents.map(async (torrent) => {
    //     const file = await downloadTorrent(torrent);
    //     return file ? { ...torrent, torrent: file } : torrent;
    //   })
    // );
    log.debug('[Torrents] searchTorrents end');
    log.debug('Filtered torrents', filetredTorrents);
    return filetredTorrents.length ? filetredTorrents : torrents;
  } catch (e) {
    log.error(e);
    throw new Error(`Error getting torrents`);
  }
};
