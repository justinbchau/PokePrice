import { PoolConfig } from "pg";
import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";

export const pgVectorStoreConfig = {
  postgresConnectionOptions: {
    type: "postgres",
    host: process.env.PG_HOST,
    port: 5432,
    user: "postgres",
    password: process.env.PG_PASSWORD,
    database: "postgres",
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