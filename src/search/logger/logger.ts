const dayjs = require('dayjs');
import { cyan, green, magenta, red, yellow } from './colors';

enum LEVEL {
  TRACE = 0,
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const time = () => dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS');
const level = process.env.SEARCH_LOG_LEVEL || 'DEBUG';
const getFileAndLineNumber = () => {
  let initiator = 'unknown place';
  try {
    throw new Error();
  } catch (e) {
    if (typeof e.stack === 'string') {
      const lines = e.stack.split('\n');
      const matches = lines[3].match(/^\s*at\s+(.*) (\(.+src\/search\/(.+)\))/);
      if (matches) {
        initiator = `${matches[1]} at ${matches[3]}`;
      }
    }
  }
  return initiator;
};

const logger = {
  trace: (...rest) => {
    if (LEVEL[level] <= LEVEL.TRACE) {
      console.log(cyan(`${time()} TRACE ${getFileAndLineNumber()} `), ...rest);
    }
  },
  debug: (...rest) => {
    if (LEVEL[level] <= LEVEL.DEBUG) {
      console.log(
        magenta(`${time()} DEBUG ${getFileAndLineNumber()} `),
        ...rest
      );
    }
  },
  info: (...rest) => {
    if (LEVEL[level] <= LEVEL.INFO) {
      console.log(green(`${time()} INFO ${getFileAndLineNumber()} `), ...rest);
    }
  },
  warn: (...rest) => {
    if (LEVEL[level] <= LEVEL.WARN) {
      console.log(yellow(`${time()} WARN ${getFileAndLineNumber()} `), ...rest);
    }
  },
  error: (...rest) => {
    if (LEVEL[level] <= LEVEL.ERROR) {
      console.log(red(`${time()} ERROR ${getFileAndLineNumber()} `), ...rest);
    }
  },
  all: (...rest) => {
    console.log(cyan(`${time()} ALL ${getFileAndLineNumber()} `), ...rest);
  },
};

export const log = logger.all;

export default logger;
