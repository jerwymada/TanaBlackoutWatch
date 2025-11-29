import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await storage.seedData();

  app.get("/api/neighborhoods", async (_req, res) => {
    try {
      const neighborhoods = await storage.getNeighborhoods();
      res.json(neighborhoods);
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
      res.status(500).json({ error: "Failed to fetch neighborhoods" });
    }
  });

  app.get("/api/neighborhoods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid neighborhood ID" });
      }
      const neighborhood = await storage.getNeighborhood(id);
      if (!neighborhood) {
        return res.status(404).json({ error: "Neighborhood not found" });
      }
      res.json(neighborhood);
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      res.status(500).json({ error: "Failed to fetch neighborhood" });
    }
  });

  app.get("/api/outages", async (req, res) => {
    try {
      const date = req.query.date as string | undefined;
      const outages = await storage.getOutages(date);
      res.json(outages);
    } catch (error) {
      console.error("Error fetching outages:", error);
      res.status(500).json({ error: "Failed to fetch outages" });
    }
  });

  app.get("/api/outages/neighborhood/:neighborhoodId", async (req, res) => {
    try {
      const neighborhoodId = parseInt(req.params.neighborhoodId, 10);
      if (isNaN(neighborhoodId)) {
        return res.status(400).json({ error: "Invalid neighborhood ID" });
      }
      const date = req.query.date as string | undefined;
      const outages = await storage.getOutagesByNeighborhood(neighborhoodId, date);
      res.json(outages);
    } catch (error) {
      console.error("Error fetching outages for neighborhood:", error);
      res.status(500).json({ error: "Failed to fetch outages" });
    }
  });

  app.get("/api/schedules", async (req, res) => {
    try {
      const date = req.query.date as string | undefined;
      const schedules = await storage.getSchedules(date);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const stats = await storage.getHistoricalStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/dates", async (_req, res) => {
    try {
      const dates = await storage.getAvailableDates();
      res.json(dates);
    } catch (error) {
      console.error("Error fetching dates:", error);
      res.status(500).json({ error: "Failed to fetch dates" });
    }
  });

  // Admin routes
  app.post("/api/admin/neighborhoods", async (req, res) => {
    try {
      const { name, district } = req.body;
      if (!name || !district) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const neighborhood = await storage.createNeighborhood({ name, district });
      res.json(neighborhood);
    } catch (error) {
      console.error("Error creating neighborhood:", error);
      res.status(500).json({ error: "Failed to create neighborhood" });
    }
  });

  app.patch("/api/admin/neighborhoods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, district } = req.body;
      if (!name || !district) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const neighborhood = await storage.updateNeighborhood(id, { name, district });
      if (!neighborhood) {
        return res.status(404).json({ error: "Neighborhood not found" });
      }
      res.json(neighborhood);
    } catch (error) {
      console.error("Error updating neighborhood:", error);
      res.status(500).json({ error: "Failed to update neighborhood" });
    }
  });

  app.delete("/api/admin/neighborhoods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteNeighborhood(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting neighborhood:", error);
      res.status(500).json({ error: "Failed to delete neighborhood" });
    }
  });

  app.post("/api/admin/outages", async (req, res) => {
    try {
      const { neighborhoodId, date, startHour, endHour } = req.body;
      if (!neighborhoodId || !date || startHour === undefined || endHour === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const outage = await storage.createOutage({ 
        neighborhoodId: parseInt(neighborhoodId, 10),
        date, 
        startHour: parseInt(startHour, 10), 
        endHour: parseInt(endHour, 10) 
      });
      res.json(outage);
    } catch (error) {
      console.error("Error creating outage:", error);
      res.status(500).json({ error: "Failed to create outage" });
    }
  });

  app.delete("/api/admin/outages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteOutage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting outage:", error);
      res.status(500).json({ error: "Failed to delete outage" });
    }
  });

  return httpServer;
}
