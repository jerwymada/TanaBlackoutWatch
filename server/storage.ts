import { 
  type Neighborhood, 
  type Outage, 
  type OutageSchedule, 
  type InsertNeighborhood, 
  type InsertOutage,
  type HistoricalStats
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from env.production if not already set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  const envPath = join(process.cwd(), 'env.production');
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  } catch (error) {
    console.error('⚠️  Could not read env.production file');
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set in env.production");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export interface IStorage {
  getNeighborhoods(): Promise<Neighborhood[]>;
  getNeighborhood(id: number): Promise<Neighborhood | undefined>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  updateNeighborhood(id: number, neighborhood: InsertNeighborhood): Promise<Neighborhood | undefined>;
  deleteNeighborhood(id: number): Promise<void>;
  getOutages(date?: string): Promise<Outage[]>;
  getOutagesByNeighborhood(neighborhoodId: number, date?: string): Promise<Outage[]>;
  createOutage(outage: InsertOutage): Promise<Outage>;
  updateOutage(id: number, outage: Partial<InsertOutage>): Promise<Outage | undefined>;
  updateOutagesBulk(ids: number[], outage: Partial<InsertOutage>): Promise<Outage[]>;
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

// Fonction utilitaire pour détecter si deux plages horaires se chevauchent
function doTimeSlotsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && end1 > start2;
}

// Fonction utilitaire pour fusionner les plages horaires qui se chevauchent
function mergeOverlappingOutages(outages: Outage[]): Outage[] {
  if (outages.length === 0) return [];
  
  // Trier les plages par startHour
  const sorted = [...outages].sort((a, b) => a.startHour - b.startHour);
  const merged: Outage[] = [];
  
  for (const current of sorted) {
    if (merged.length === 0) {
      merged.push({ ...current });
      continue;
    }
    
    const last = merged[merged.length - 1];
    
    // Vérifier si la plage actuelle chevauche avec la dernière plage fusionnée
    if (doTimeSlotsOverlap(last.startHour, last.endHour, current.startHour, current.endHour)) {
      // Fusionner : prendre le min des starts et le max des ends
      last.startHour = Math.min(last.startHour, current.startHour);
      last.endHour = Math.max(last.endHour, current.endHour);
      
      // Gérer la raison : concaténer si différentes, sinon garder la première
      if (current.reason && current.reason !== last.reason) {
        if (last.reason) {
          last.reason = `${last.reason}; ${current.reason}`;
        } else {
          last.reason = current.reason;
        }
      }
    } else {
      // Pas de chevauchement, ajouter comme nouvelle plage
      merged.push({ ...current });
    }
  }
  
  return merged;
}

export class DatabaseStorage implements IStorage {
  async getNeighborhoods(): Promise<Neighborhood[]> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getNeighborhood(id: number): Promise<Neighborhood | undefined> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data || undefined;
  }

  async createNeighborhood(insertNeighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .insert(insertNeighborhood)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create neighborhood');
    return data;
  }

  async updateNeighborhood(id: number, insertNeighborhood: InsertNeighborhood): Promise<Neighborhood | undefined> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .update(insertNeighborhood)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data || undefined;
  }

  async deleteNeighborhood(id: number): Promise<void> {
    const { error } = await supabase
      .from('neighborhoods')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getOutages(date?: string): Promise<Outage[]> {
    let query = supabase.from('outages').select('*');
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Convertir les noms de colonnes de snake_case vers camelCase
    const converted = (data || []).map(o => ({
      id: o.id,
      neighborhoodId: o.neighborhood_id,
      date: o.date,
      startHour: Number(o.start_hour),
      endHour: Number(o.end_hour),
      reason: o.reason,
    }));
    
    return converted;
  }

  async getOutagesByNeighborhood(neighborhoodId: number, date?: string): Promise<Outage[]> {
    let query = supabase
      .from('outages')
      .select('*')
      .eq('neighborhood_id', neighborhoodId);
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Convertir les noms de colonnes de snake_case vers camelCase
    const converted = (data || []).map(o => ({
      id: o.id,
      neighborhoodId: o.neighborhood_id,
      date: o.date,
      startHour: Number(o.start_hour),
      endHour: Number(o.end_hour),
      reason: o.reason,
    }));
    
    return converted;
  }

  async createOutage(insertOutage: InsertOutage): Promise<Outage> {
    // Récupérer toutes les plages existantes pour ce quartier et cette date
    const existingOutages = await this.getOutagesByNeighborhood(insertOutage.neighborhoodId, insertOutage.date);
    
    // Créer une plage temporaire pour la nouvelle plage (sans ID)
    const newOutage: Outage = {
      id: -1, // ID temporaire
      neighborhoodId: insertOutage.neighborhoodId,
      date: insertOutage.date,
      startHour: insertOutage.startHour,
      endHour: insertOutage.endHour,
      reason: insertOutage.reason || null,
    };
    
    // Ajouter la nouvelle plage à la liste existante
    const allOutages = [...existingOutages, newOutage];
    
    // Fusionner les plages qui se chevauchent
    const mergedOutages = mergeOverlappingOutages(allOutages);
    
    // Trouver la plage fusionnée qui contient la nouvelle plage
    const mergedOutage = mergedOutages.find(merged => 
      merged.startHour <= insertOutage.startHour && merged.endHour >= insertOutage.endHour
    ) || mergedOutages[mergedOutages.length - 1];
    
    // Si des plages ont été fusionnées (le nombre de plages a diminué), supprimer les anciennes et créer la nouvelle fusionnée
    if (mergedOutages.length < allOutages.length) {
      // Identifier les plages à supprimer (celles qui ont été fusionnées)
      const idsToDelete: number[] = [];
      for (const existing of existingOutages) {
        // Vérifier si cette plage a été fusionnée dans mergedOutage
        if (doTimeSlotsOverlap(existing.startHour, existing.endHour, mergedOutage.startHour, mergedOutage.endHour)) {
          idsToDelete.push(existing.id);
        }
      }
      
      // Supprimer les plages fusionnées
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('outages')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // Créer la nouvelle plage fusionnée
      const { data, error } = await supabase
        .from('outages')
        .insert({
          neighborhood_id: mergedOutage.neighborhoodId,
          date: mergedOutage.date,
          start_hour: mergedOutage.startHour,
          end_hour: mergedOutage.endHour,
          reason: mergedOutage.reason || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create merged outage');
      
      // Convertir les noms de colonnes
      return {
        id: data.id,
        neighborhoodId: data.neighborhood_id,
        date: data.date,
        startHour: data.start_hour,
        endHour: data.end_hour,
        reason: data.reason,
      };
    } else {
      // Pas de fusion nécessaire, créer normalement
      const { data, error } = await supabase
        .from('outages')
        .insert({
          neighborhood_id: insertOutage.neighborhoodId,
          date: insertOutage.date,
          start_hour: insertOutage.startHour,
          end_hour: insertOutage.endHour,
          reason: insertOutage.reason || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create outage');
      
      // Convertir les noms de colonnes
      return {
        id: data.id,
        neighborhoodId: data.neighborhood_id,
        date: data.date,
        startHour: data.start_hour,
        endHour: data.end_hour,
        reason: data.reason,
      };
    }
  }

  async updateOutage(id: number, updateOutage: Partial<InsertOutage>): Promise<Outage | undefined> {
    // Récupérer la plage actuelle
    const { data: currentData, error: fetchError } = await supabase
      .from('outages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') return undefined;
      throw fetchError;
    }
    
    if (!currentData) return undefined;
    
    // Déterminer les valeurs finales (mises à jour ou existantes)
    const finalNeighborhoodId = updateOutage.neighborhoodId !== undefined 
      ? updateOutage.neighborhoodId 
      : currentData.neighborhood_id;
    const finalDate = updateOutage.date !== undefined 
      ? updateOutage.date 
      : currentData.date;
    const finalStartHour = updateOutage.startHour !== undefined 
      ? updateOutage.startHour 
      : currentData.start_hour;
    const finalEndHour = updateOutage.endHour !== undefined 
      ? updateOutage.endHour 
      : currentData.end_hour;
    const finalReason = updateOutage.reason !== undefined 
      ? (updateOutage.reason || null)
      : currentData.reason;
    
    // Récupérer toutes les plages existantes pour ce quartier et cette date (sauf celle en cours de modification)
    const existingOutages = await this.getOutagesByNeighborhood(finalNeighborhoodId, finalDate);
    const otherOutages = existingOutages.filter(o => o.id !== id);
    
    // Créer la plage modifiée
    const updatedOutage: Outage = {
      id: id,
      neighborhoodId: finalNeighborhoodId,
      date: finalDate,
      startHour: finalStartHour,
      endHour: finalEndHour,
      reason: finalReason,
    };
    
    // Ajouter la plage modifiée à la liste des autres plages
    const allOutages = [...otherOutages, updatedOutage];
    
    // Fusionner les plages qui se chevauchent
    const mergedOutages = mergeOverlappingOutages(allOutages);
    
    // Trouver la plage fusionnée qui contient la plage modifiée
    const mergedOutage = mergedOutages.find(merged => 
      merged.id === id || (merged.startHour <= finalStartHour && merged.endHour >= finalEndHour)
    ) || mergedOutages[mergedOutages.length - 1];
    
    // Si des plages ont été fusionnées, supprimer les anciennes et mettre à jour/créer la fusionnée
    if (mergedOutages.length < allOutages.length || mergedOutage.id !== id) {
      // Identifier les plages à supprimer (celles qui ont été fusionnées, sauf celle en cours de modification)
      const idsToDelete: number[] = [];
      for (const existing of otherOutages) {
        // Vérifier si cette plage a été fusionnée dans mergedOutage
        if (doTimeSlotsOverlap(existing.startHour, existing.endHour, mergedOutage.startHour, mergedOutage.endHour)) {
          idsToDelete.push(existing.id);
        }
      }
      
      // Supprimer les plages fusionnées
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('outages')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // Si la plage fusionnée est différente de celle en cours de modification, supprimer l'ancienne et créer la nouvelle
      if (mergedOutage.id !== id) {
        // Supprimer l'ancienne plage
        const { error: deleteError } = await supabase
          .from('outages')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        
        // Créer la nouvelle plage fusionnée
        const { data, error } = await supabase
          .from('outages')
          .insert({
            neighborhood_id: mergedOutage.neighborhoodId,
            date: mergedOutage.date,
            start_hour: mergedOutage.startHour,
            end_hour: mergedOutage.endHour,
            reason: mergedOutage.reason || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Failed to create merged outage');
        
        // Convertir les noms de colonnes
        return {
          id: data.id,
          neighborhoodId: data.neighborhood_id,
          date: data.date,
          startHour: data.start_hour,
          endHour: data.end_hour,
          reason: data.reason,
        };
      } else {
        // Mettre à jour la plage existante avec les valeurs fusionnées
        const { data, error } = await supabase
          .from('outages')
          .update({
            neighborhood_id: mergedOutage.neighborhoodId,
            date: mergedOutage.date,
            start_hour: mergedOutage.startHour,
            end_hour: mergedOutage.endHour,
            reason: mergedOutage.reason || null,
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        if (!data) return undefined;
        
        // Convertir les noms de colonnes
        return {
          id: data.id,
          neighborhoodId: data.neighborhood_id,
          date: data.date,
          startHour: data.start_hour,
          endHour: data.end_hour,
          reason: data.reason,
        };
      }
    } else {
      // Pas de fusion nécessaire, mettre à jour normalement
      const updateData: any = {};
      
      if (updateOutage.neighborhoodId !== undefined) {
        updateData.neighborhood_id = updateOutage.neighborhoodId;
      }
      if (updateOutage.date !== undefined) {
        updateData.date = updateOutage.date;
      }
      if (updateOutage.startHour !== undefined) {
        updateData.start_hour = updateOutage.startHour;
      }
      if (updateOutage.endHour !== undefined) {
        updateData.end_hour = updateOutage.endHour;
      }
      if (updateOutage.reason !== undefined) {
        updateData.reason = updateOutage.reason || null;
      }
      
      const { data, error } = await supabase
        .from('outages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return undefined;
        throw error;
      }
      
      if (!data) return undefined;
      
      // Convertir les noms de colonnes
      return {
        id: data.id,
        neighborhoodId: data.neighborhood_id,
        date: data.date,
        startHour: data.start_hour,
        endHour: data.end_hour,
        reason: data.reason,
      };
    }
  }

  async updateOutagesBulk(ids: number[], updateOutage: Partial<InsertOutage>): Promise<Outage[]> {
    if (ids.length === 0) {
      return [];
    }

    // Pour la modification en masse, on applique la fusion en traitant chaque plage individuellement
    // via updateOutage qui gère déjà la fusion automatiquement
    const updatedOutages: Outage[] = [];
    
    for (const id of ids) {
      const updated = await this.updateOutage(id, updateOutage);
      if (updated) {
        updatedOutages.push(updated);
      }
    }
    
    return updatedOutages;
  }

  async deleteOutage(id: number): Promise<void> {
    const { error } = await supabase
      .from('outages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getSchedules(date?: string): Promise<OutageSchedule[]> {
    const allNeighborhoods = await this.getNeighborhoods();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Grouper les quartiers par (name, district) pour éviter les doublons
    // Normaliser la clé pour gérer les différences de casse et d'espaces
    const neighborhoodGroups = new Map<string, Neighborhood[]>();
    
    for (const neighborhood of allNeighborhoods) {
      // Normaliser : trim, lowercase, et remplacer les espaces multiples par un seul espace
      const normalizedName = neighborhood.name.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedDistrict = neighborhood.district.trim().toLowerCase().replace(/\s+/g, ' ');
      const key = `${normalizedName}_${normalizedDistrict}`;
      
      if (!neighborhoodGroups.has(key)) {
        neighborhoodGroups.set(key, []);
      }
      neighborhoodGroups.get(key)!.push(neighborhood);
    }
    
    const schedules: OutageSchedule[] = [];
    
    // Pour chaque groupe de quartiers (même nom + même arrondissement)
    for (const [key, neighborhoods] of neighborhoodGroups.entries()) {
      // Prendre le premier quartier comme représentant (pour maintenir la cohérence avec les favoris)
      const representativeNeighborhood = neighborhoods[0];
      
      // Récupérer toutes les plages horaires de tous les quartiers du groupe
      const allOutages: Outage[] = [];
      for (const neighborhood of neighborhoods) {
      const neighborhoodOutages = await this.getOutagesByNeighborhood(neighborhood.id, targetDate);
        allOutages.push(...neighborhoodOutages);
      }
      
      // Fusionner les plages qui se chevauchent
      const mergedOutages = mergeOverlappingOutages(allOutages);
      
      // Trier par startHour
      mergedOutages.sort((a, b) => a.startHour - b.startHour);
      
      // Créer un seul schedule pour ce groupe
      schedules.push({
        neighborhood: representativeNeighborhood,
        outages: mergedOutages,
      });
    }
    
    return schedules;
  }

  async getHistoricalStats(startDate?: string, endDate?: string): Promise<HistoricalStats> {
    let query = supabase.from('outages').select('date, neighborhood_id, start_hour, end_hour');
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const filteredOutages = (data || []).map(o => ({
      date: o.date,
      neighborhoodId: o.neighborhood_id,
      startHour: o.start_hour,
      endHour: o.end_hour,
    }));

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
    const { data, error } = await supabase
      .from('outages')
      .select('date')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Extraire les dates uniques
    const uniqueDates = Array.from(new Set((data || []).map(o => o.date)));
    return uniqueDates;
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
