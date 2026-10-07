import { defineConfig } from "drizzle-kit";

// Generates SQL migrations from src/db/schema.ts (D1/SQLite dialect):
//   npx drizzle-kit generate   (or: just db-generate)
// Apply them with: just db-apply local|remote
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
