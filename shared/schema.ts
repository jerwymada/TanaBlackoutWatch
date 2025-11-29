import { z } from "zod";

export interface Neighborhood {
  id: string;
  name: string;
  district: string;
}

export interface Outage {
  id: string;
  neighborhoodId: string;
  date: string;
  startHour: number;
  endHour: number;
}

export interface OutageSchedule {
  neighborhood: Neighborhood;
  outages: Outage[];
}

export const insertNeighborhoodSchema = z.object({
  name: z.string().min(1),
  district: z.string().min(1),
});

export const insertOutageSchema = z.object({
  neighborhoodId: z.string(),
  date: z.string(),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(24),
});

export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type InsertOutage = z.infer<typeof insertOutageSchema>;
