import express from 'express';
import addHandlers from './handlers';
import cors from 'cors';
import { enableTorrentSearch } from './torrents';
import log from '../logger/logger';
const bodyParser = require('body-parser').json();

export default function startServer() {
  const port = process.env.MOVIES_API_PORT || '2222';
  enableTorrentSearch();

  const app = express();

  app.use(bodyParser);
  app.use(cors());

  addHandlers(app);

  const http = require('http').createServer(app);

  http.listen(parseInt(port), () => {
    log.info(`listening on *:${port}`);
  });
}
