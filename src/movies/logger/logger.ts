const dayjs = require('dayjs');
import { cyan, green, magenta, red, yellow } from './colors';

const MODULE = 'movies';
enum LEVEL {
  TRACE = 0,
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const time = () => dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS');
const level = process.env.LOG_LEVEL || 'DEBUG';
const getFileAndLineNumber = () => {
  let initiator = 'unknown place';
  try {
    throw new Error();
  } catch (e) {
    if (typeof e.stack === 'string') {
      const lines = e.stack.split('\n');
      const regex = new RegExp(`^\\s*at\\s+.*(/src/${MODULE}/.+)\/([\\w:.]+)`);
      const matches = lines[3].match(regex);
      if (matches) {
        initiator = `${matches[1]} at ${matches[2]}`;
      }
    }
  }
  return initiator;
};
const getFullStackTrace = () => {
  let initiator = 'unknown place';
  try {
    throw new Error();
  } catch (e) {
    initiator = e.stack;
  }
  return initiator;
};

const logger = {
  trace: (...rest) => {
    if (LEVEL[level] <= LEVEL.TRACE) {
      console.log(cyan(`${time()} : T : ${getFileAndLineNumber()} `), ...rest);
    }
  },
  debug: (...rest) => {
    if (LEVEL[level] <= LEVEL.DEBUG) {
      console.log(
        magenta(`${time()} : D : ${getFileAndLineNumber()} `),
        ...rest
      );
    }
  },
  info: (...rest) => {
    if (LEVEL[level] <= LEVEL.INFO) {
      console.log(green(`${time()} : I : ${getFileAndLineNumber()} `), ...rest);
    }
  },
  warn: (...rest) => {
    if (LEVEL[level] <= LEVEL.WARN) {
      console.log(
        yellow(`${time()} : W : ${getFileAndLineNumber()} `),
        ...rest
      );
    }
  },
  error: (...rest) => {
    if (LEVEL[level] <= LEVEL.ERROR) {
      console.log(red(`${time()} : E : \n${getFullStackTrace()} `), ...rest);
    }
  },
  all: (...rest) => {
    console.log(cyan(`${time()} : A : ${getFileAndLineNumber()} `), ...rest);
  },
};

// export const log = logger.all;

export default logger;
