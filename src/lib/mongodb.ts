import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return uri;
}

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const globalCache = globalThis.mongooseCache ?? {
  connection: null,
  promise: null,
};

globalThis.mongooseCache = globalCache;

export async function connectToDatabase() {
  if (globalCache.connection) {
    return globalCache.connection;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(getMongoUri(), {
      dbName: process.env.MONGODB_DB ?? "gee-project",
    });
  }

  globalCache.connection = await globalCache.promise;
  return globalCache.connection;
}
