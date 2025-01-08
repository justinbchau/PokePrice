import { PoolConfig } from "pg";
import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";

export const pgVectorStoreConfig = {
  postgresConnectionOptions: {
    type: "postgres",
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  } as PoolConfig,
  tableName: "cards_data",
  columns: {
    idColumnName: "document_id",
    vectorColumnName: "embedding",
    contentColumnName: "document_content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine" as DistanceStrategy,
};