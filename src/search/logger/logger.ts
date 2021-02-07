const dayjs = require('dayjs');
import { cyan, green, magenta, red, yellow } from './colors';

enum LEVEL {
  TRACE = 0,
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const time = () => dayjs().format('YYYY/MM/DDTHH:mm:ss.SSS');
const level = process.env.SEARCH_LOG_LEVEL || 'DEBUG';

const logger = {
  trace: (...rest) => {
    if (LEVEL[level] <= LEVEL.TRACE) {
      console.log(cyan(`${time()} TRACE `), ...rest);
    }
  },
  debug: (...rest) => {
    if (LEVEL[level] <= LEVEL.DEBUG) {
      console.log(magenta(`${time()} DEBUG `), ...rest);
    }
  },
  info: (...rest) => {
    if (LEVEL[level] <= LEVEL.INFO) {
      console.log(green(`${time()} INFO `), ...rest);
    }
  },
  warn: (...rest) => {
    if (LEVEL[level] <= LEVEL.WARN) {
      console.log(yellow(`${time()} WARN `), ...rest);
    }
  },
  error: (...rest) => {
    if (LEVEL[level] <= LEVEL.ERROR) {
      console.log(red(`${time()} ERROR `), ...rest);
    }
  },
  all: (...rest) => {
    console.log(cyan(`${time()} ALL `), ...rest);
  },
};

export const log = logger.all;

export default logger;
