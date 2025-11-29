import type { Neighborhood, Outage, OutageSchedule, InsertNeighborhood, InsertOutage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getNeighborhoods(): Promise<Neighborhood[]>;
  getNeighborhood(id: string): Promise<Neighborhood | undefined>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  getOutages(date?: string): Promise<Outage[]>;
  getOutagesByNeighborhood(neighborhoodId: string, date?: string): Promise<Outage[]>;
  createOutage(outage: InsertOutage): Promise<Outage>;
  getSchedules(date?: string): Promise<OutageSchedule[]>;
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

function generateOutageSchedule(neighborhoodId: string, index: number): InsertOutage[] {
  const outages: InsertOutage[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  const patterns = [
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

  const pattern = patterns[index % patterns.length];
  
  for (const slot of pattern) {
    outages.push({
      neighborhoodId,
      date: today,
      startHour: slot.start,
      endHour: slot.end,
    });
  }

  return outages;
}

export class MemStorage implements IStorage {
  private neighborhoods: Map<string, Neighborhood>;
  private outages: Map<string, Outage>;

  constructor() {
    this.neighborhoods = new Map();
    this.outages = new Map();
    this.initializeData();
  }

  private initializeData() {
    ANTANANARIVO_NEIGHBORHOODS.forEach((n, index) => {
      const neighborhood: Neighborhood = {
        id: randomUUID(),
        name: n.name,
        district: n.district,
      };
      this.neighborhoods.set(neighborhood.id, neighborhood);

      const outageSlots = generateOutageSchedule(neighborhood.id, index);
      outageSlots.forEach(slot => {
        const outage: Outage = {
          id: randomUUID(),
          neighborhoodId: slot.neighborhoodId,
          date: slot.date,
          startHour: slot.startHour,
          endHour: slot.endHour,
        };
        this.outages.set(outage.id, outage);
      });
    });
  }

  async getNeighborhoods(): Promise<Neighborhood[]> {
    return Array.from(this.neighborhoods.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async getNeighborhood(id: string): Promise<Neighborhood | undefined> {
    return this.neighborhoods.get(id);
  }

  async createNeighborhood(insertNeighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const id = randomUUID();
    const neighborhood: Neighborhood = { ...insertNeighborhood, id };
    this.neighborhoods.set(id, neighborhood);
    return neighborhood;
  }

  async getOutages(date?: string): Promise<Outage[]> {
    const outages = Array.from(this.outages.values());
    if (date) {
      return outages.filter(o => o.date === date);
    }
    return outages;
  }

  async getOutagesByNeighborhood(neighborhoodId: string, date?: string): Promise<Outage[]> {
    const outages = Array.from(this.outages.values()).filter(
      o => o.neighborhoodId === neighborhoodId
    );
    if (date) {
      return outages.filter(o => o.date === date);
    }
    return outages;
  }

  async createOutage(insertOutage: InsertOutage): Promise<Outage> {
    const id = randomUUID();
    const outage: Outage = { ...insertOutage, id };
    this.outages.set(id, outage);
    return outage;
  }

  async getSchedules(date?: string): Promise<OutageSchedule[]> {
    const neighborhoods = await this.getNeighborhoods();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const schedules: OutageSchedule[] = [];
    
    for (const neighborhood of neighborhoods) {
      const outages = await this.getOutagesByNeighborhood(neighborhood.id, targetDate);
      schedules.push({
        neighborhood,
        outages: outages.sort((a, b) => a.startHour - b.startHour),
      });
    }
    
    return schedules;
  }
}

export const storage = new MemStorage();
