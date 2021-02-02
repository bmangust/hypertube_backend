import mongo from 'mongodb';
import {DSN} from "./config";

export class MongoUser {
    constructor() {
        this.initConnection().catch(console.warn)
    }

    private _connection: mongo.MongoClient | undefined

    get connection(): mongo.MongoClient | undefined {
        return this._connection
    }

    set connection(val: mongo.MongoClient | undefined) {
        this._connection = val
    }

    async initConnection() {
        try {
            const mongoClient = new mongo.MongoClient(DSN, {useUnifiedTopology: true});
            this._connection = await mongoClient.connect();
            console.log("Mongo connection succeded!");
        } catch (e) {
            console.log("Failed to connect to mongo: ", e);
            throw "Connection error!"
        }
    }
}

// export const MongoManager = new MongoUser()
