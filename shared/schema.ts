import { pgTable, text, integer, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull(),
});

export const outages = pgTable("outages", {
  id: serial("id").primaryKey(),
  neighborhoodId: integer("neighborhood_id").notNull().references(() => neighborhoods.id),
  date: text("date").notNull(),
  startHour: integer("start_hour").notNull(),
  endHour: integer("end_hour").notNull(),
  reason: text("reason"),
}, (table) => [
  index("outages_date_idx").on(table.date),
  index("outages_neighborhood_idx").on(table.neighborhoodId),
  index("outages_date_neighborhood_idx").on(table.date, table.neighborhoodId),
]);

export const neighborhoodRelations = relations(neighborhoods, ({ many }) => ({
  outages: many(outages),
}));

export const outageRelations = relations(outages, ({ one }) => ({
  neighborhood: one(neighborhoods, {
    fields: [outages.neighborhoodId],
    references: [neighborhoods.id],
  }),
}));

export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({ id: true });
export const insertOutageSchema = createInsertSchema(outages).omit({ id: true });

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type Outage = typeof outages.$inferSelect;
export type InsertOutage = z.infer<typeof insertOutageSchema>;

export interface OutageSchedule {
  neighborhood: Neighborhood;
  outages: Outage[];
}

export interface HistoricalStats {
  totalOutageHours: number;
  averageDailyOutages: number;
  neighborhoodRankings: {
    neighborhoodId: number;
    neighborhoodName: string;
    totalOutageHours: number;
  }[];
  dailyStats: {
    date: string;
    totalOutages: number;
    totalHours: number;
  }[];
}
