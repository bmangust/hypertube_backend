import express from 'express';
import addHandlers from './handlers';
import cors from 'cors';
import { enableTorrentSearch } from './torrents';
import { initDatabase } from '../db/postgres/postgres';
import log from '../logger/logger';
const bodyParser = require('body-parser').json();

export default function startServer() {
  const port = '2222';
  enableTorrentSearch();
  initDatabase();

  const app = express();

  addHandlers(app);

  const http = require('http').createServer(app);

  app.use(bodyParser);
  app.use(cors());

  http.listen(parseInt(port), () => {
    log.info(`listening on *:${port}`);
  });
}
