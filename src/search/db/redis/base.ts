import * as redis from 'redis';

export class BaseRedis {
  constructor() {
    this.initConnection();
  }

  private _client: redis.RedisClient | undefined;

  get client(): redis.RedisClient | undefined {
    return this._client;
  }

  set client(val: redis.RedisClient | undefined) {
    this._client = val;
  }

  get isConnected(): boolean {
    return !!this.client && this.client.connected;
  }

  private initConnection() {
    const host =
      process.env.REDIS_HOST && process.env.REDIS_HOST.length > 0
        ? process.env.REDIS_HOST
        : 'redis';
    const port =
      process.env.REDIS_PORT && process.env.REDIS_PORT.length > 0
        ? process.env.REDIS_PORT
        : '6379';
    const user =
      process.env.REDIS_USER && process.env.REDIS_USER.length > 0
        ? process.env.REDIS_USER
        : 'chat_user';
    const password =
      process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0
        ? process.env.REDIS_PASSWORD
        : 'ffa9203c493aa99';

    const url = `redis://${user}:${password}@${host}:${port}`;
    console.log('Redis url: ', url);

    this.client = redis.createClient({
      url: url,
    });

    console.log('Connected to redis: ', this.isConnected);

    this.client.on('error', function (error) {
      console.error('Create client error: ', error);
    });
  }
}
