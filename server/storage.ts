import { 
  neighborhoods, 
  outages, 
  type Neighborhood, 
  type Outage, 
  type OutageSchedule, 
  type InsertNeighborhood, 
  type InsertOutage,
  type HistoricalStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, SQL } from "drizzle-orm";

export interface IStorage {
  getNeighborhoods(): Promise<Neighborhood[]>;
  getNeighborhood(id: number): Promise<Neighborhood | undefined>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  updateNeighborhood(id: number, neighborhood: InsertNeighborhood): Promise<Neighborhood | undefined>;
  deleteNeighborhood(id: number): Promise<void>;
  getOutages(date?: string): Promise<Outage[]>;
  getOutagesByNeighborhood(neighborhoodId: number, date?: string): Promise<Outage[]>;
  createOutage(outage: InsertOutage): Promise<Outage>;
  deleteOutage(id: number): Promise<void>;
  getSchedules(date?: string): Promise<OutageSchedule[]>;
  getHistoricalStats(startDate?: string, endDate?: string): Promise<HistoricalStats>;
  getAvailableDates(): Promise<string[]>;
  seedData(): Promise<void>;
}

const ANTANANARIVO_NEIGHBORHOODS: InsertNeighborhood[] = [
  { name: "Analakely", district: "1er Arrondissement" },
  { name: "Antaninarenina", district: "1er Arrondissement" },
  { name: "Isoraka", district: "1er Arrondissement" },
  { name: "Ambohijatovo", district: "2ème Arrondissement" },
  { name: "Ankazomanga", district: "2ème Arrondissement" },
  { name: "Besarety", district: "2ème Arrondissement" },
  { name: "Ankorondrano", district: "3ème Arrondissement" },
  { name: "Andraharo", district: "3ème Arrondissement" },
  { name: "Ivandry", district: "3ème Arrondissement" },
  { name: "Ankadifotsy", district: "4ème Arrondissement" },
  { name: "Ambanidia", district: "4ème Arrondissement" },
  { name: "Mahazo", district: "4ème Arrondissement" },
  { name: "Andoharanofotsy", district: "5ème Arrondissement" },
  { name: "Ankazobe", district: "5ème Arrondissement" },
  { name: "Itaosy", district: "5ème Arrondissement" },
  { name: "Ambohimanarina", district: "6ème Arrondissement" },
  { name: "Andranomena", district: "6ème Arrondissement" },
  { name: "67 Ha", district: "6ème Arrondissement" },
];

const OUTAGE_PATTERNS = [
  [{ start: 6, end: 10 }],
  [{ start: 8, end: 12 }],
  [{ start: 10, end: 14 }],
  [{ start: 12, end: 16 }],
  [{ start: 14, end: 18 }],
  [{ start: 16, end: 20 }],
  [{ start: 6, end: 9 }, { start: 18, end: 21 }],
  [{ start: 7, end: 11 }, { start: 15, end: 18 }],
  [{ start: 9, end: 13 }],
  [{ start: 11, end: 15 }],
  [{ start: 5, end: 8 }, { start: 17, end: 20 }],
  [{ start: 6, end: 10 }, { start: 14, end: 17 }],
  [],
  [{ start: 8, end: 11 }],
  [{ start: 13, end: 17 }],
  [{ start: 7, end: 10 }, { start: 16, end: 19 }],
  [{ start: 9, end: 12 }],
  [{ start: 15, end: 19 }],
];

export class DatabaseStorage implements IStorage {
  async getNeighborhoods(): Promise<Neighborhood[]> {
    const results = await db.select().from(neighborhoods).orderBy(asc(neighborhoods.name));
    return results;
  }

  async getNeighborhood(id: number): Promise<Neighborhood | undefined> {
    const [neighborhood] = await db.select().from(neighborhoods).where(eq(neighborhoods.id, id));
    return neighborhood || undefined;
  }

  async createNeighborhood(insertNeighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const [neighborhood] = await db.insert(neighborhoods).values(insertNeighborhood).returning();
    return neighborhood;
  }

  async updateNeighborhood(id: number, insertNeighborhood: InsertNeighborhood): Promise<Neighborhood | undefined> {
    const [neighborhood] = await db.update(neighborhoods).set(insertNeighborhood).where(eq(neighborhoods.id, id)).returning();
    return neighborhood || undefined;
  }

  async deleteNeighborhood(id: number): Promise<void> {
    await db.delete(neighborhoods).where(eq(neighborhoods.id, id));
  }

  async getOutages(date?: string): Promise<Outage[]> {
    if (date) {
      return await db.select().from(outages).where(eq(outages.date, date));
    }
    return await db.select().from(outages);
  }

  async getOutagesByNeighborhood(neighborhoodId: number, date?: string): Promise<Outage[]> {
    if (date) {
      return await db.select().from(outages).where(
        and(eq(outages.neighborhoodId, neighborhoodId), eq(outages.date, date))
      );
    }
    return await db.select().from(outages).where(eq(outages.neighborhoodId, neighborhoodId));
  }

  async createOutage(insertOutage: InsertOutage): Promise<Outage> {
    const [outage] = await db.insert(outages).values(insertOutage).returning();
    return outage;
  }

  async deleteOutage(id: number): Promise<void> {
    await db.delete(outages).where(eq(outages.id, id));
  }

  async getSchedules(date?: string): Promise<OutageSchedule[]> {
    const allNeighborhoods = await this.getNeighborhoods();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const schedules: OutageSchedule[] = [];
    
    for (const neighborhood of allNeighborhoods) {
      const neighborhoodOutages = await this.getOutagesByNeighborhood(neighborhood.id, targetDate);
      schedules.push({
        neighborhood,
        outages: neighborhoodOutages.sort((a, b) => a.startHour - b.startHour),
      });
    }
    
    return schedules;
  }

  async getHistoricalStats(startDate?: string, endDate?: string): Promise<HistoricalStats> {
    const conditions: SQL[] = [];
    
    if (startDate) {
      conditions.push(sql`${outages.date} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${outages.date} <= ${endDate}`);
    }
    
    const filteredOutages = conditions.length > 0
      ? await db.select({
          date: outages.date,
          neighborhoodId: outages.neighborhoodId,
          startHour: outages.startHour,
          endHour: outages.endHour,
        }).from(outages).where(and(...conditions))
      : await db.select({
          date: outages.date,
          neighborhoodId: outages.neighborhoodId,
          startHour: outages.startHour,
          endHour: outages.endHour,
        }).from(outages);

    const totalOutageHours = filteredOutages.reduce((sum, o) => sum + (o.endHour - o.startHour), 0);
    
    const dailyMap = new Map<string, { totalOutages: number; totalHours: number }>();
    for (const o of filteredOutages) {
      const existing = dailyMap.get(o.date) || { totalOutages: 0, totalHours: 0 };
      existing.totalOutages += 1;
      existing.totalHours += o.endHour - o.startHour;
      dailyMap.set(o.date, existing);
    }
    
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const averageDailyOutages = dailyStats.length > 0 
      ? dailyStats.reduce((sum, d) => sum + d.totalOutages, 0) / dailyStats.length 
      : 0;
    
    const neighborhoodMap = new Map<number, number>();
    for (const o of filteredOutages) {
      const existing = neighborhoodMap.get(o.neighborhoodId) || 0;
      neighborhoodMap.set(o.neighborhoodId, existing + (o.endHour - o.startHour));
    }
    
    const allNeighborhoods = await this.getNeighborhoods();
    const neighborhoodRankings = Array.from(neighborhoodMap.entries())
      .map(([neighborhoodId, totalOutageHours]) => ({
        neighborhoodId,
        neighborhoodName: allNeighborhoods.find(n => n.id === neighborhoodId)?.name || 'Unknown',
        totalOutageHours,
      }))
      .sort((a, b) => b.totalOutageHours - a.totalOutageHours);

    return {
      totalOutageHours,
      averageDailyOutages,
      neighborhoodRankings,
      dailyStats,
    };
  }

  async getAvailableDates(): Promise<string[]> {
    const results = await db
      .selectDistinct({ date: outages.date })
      .from(outages)
      .orderBy(desc(outages.date));
    return results.map(r => r.date);
  }

  async seedData(): Promise<void> {
    const existingNeighborhoods = await this.getNeighborhoods();
    if (existingNeighborhoods.length > 0) {
      console.log("Data already seeded, skipping...");
      return;
    }

    console.log("Seeding database with initial data...");
    
    const createdNeighborhoods: Neighborhood[] = [];
    for (const n of ANTANANARIVO_NEIGHBORHOODS) {
      const neighborhood = await this.createNeighborhood(n);
      createdNeighborhoods.push(neighborhood);
    }

    const today = new Date();
    const dates: string[] = [];
    for (let i = -14; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    for (const dateStr of dates) {
      for (let i = 0; i < createdNeighborhoods.length; i++) {
        const neighborhood = createdNeighborhoods[i];
        const patternIndex = (i + dates.indexOf(dateStr)) % OUTAGE_PATTERNS.length;
        const pattern = OUTAGE_PATTERNS[patternIndex];
        
        for (const slot of pattern) {
          await this.createOutage({
            neighborhoodId: neighborhood.id,
            date: dateStr,
            startHour: slot.start,
            endHour: slot.end,
          });
        }
      }
    }

    console.log(`Seeded ${createdNeighborhoods.length} neighborhoods with outages for ${dates.length} days`);
  }
}

export const storage = new DatabaseStorage();
