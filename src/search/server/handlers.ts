import { Express } from 'express';
import * as utils from './utils';
import log from '../logger/logger';
import { groupTorrentsByTitle, searchTorrents } from './torrents';
import { loadMoviesInfo, removeDuplicates } from './imdb';

export default function addHandlers(app: Express) {
  app.get('/find', async (req, res) => {
    log.trace(req);
    const category = req.query['category'].toString();
    const search = req.query['search'].toString();

    try {
      const torrents = await searchTorrents(search, category);
      const grouppedTorrents = groupTorrentsByTitle(torrents);

      log.info('loading movies');
      const movies = await loadMoviesInfo(grouppedTorrents);
      log.trace('loaded movies: ', movies);
      if (movies && movies.length) {
        const unduplicated = removeDuplicates(movies);
        log.debug('Removed duplicates: ', unduplicated);
        res.json(utils.createSuccessResponse(unduplicated)).status(200);
      } else
        res
          .json(utils.createErrorResponse('Could not load IMDB info'))
          .status(404);
    } catch (e) {
      log.error(`Error getting torrents: ${e}`);
      res.json(utils.createErrorResponse(e)).status(500);
    }
  });
}
