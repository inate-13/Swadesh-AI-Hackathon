import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const transcripts = pgTable("transcripts", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename"),
  content: jsonb("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chunks = pgTable("chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id"),
  chunkIndex: text("chunk_index"),
  filePath: text("file_path"),
  uploaded: text("uploaded"),
  createdAt: timestamp("created_at").defaultNow(),
});