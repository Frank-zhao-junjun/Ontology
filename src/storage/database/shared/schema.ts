import { sql } from "drizzle-orm"
import { pgTable, serial, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Ontology 项目表
export const ontologyProjects = pgTable(
  "ontology_projects",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    domain_id: varchar("domain_id", { length: 100 }).notNull(),
    domain_name: varchar("domain_name", { length: 255 }).notNull(),
    // 完整的项目数据以 JSONB 格式存储
    project_data: jsonb("project_data").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ontology_projects_domain_id_idx").on(table.domain_id),
    index("ontology_projects_created_at_idx").on(table.created_at),
  ]
);
