import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      const neighborhood = await storage.getNeighborhood(req.params.id);
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
      const date = req.query.date as string | undefined;
      const outages = await storage.getOutagesByNeighborhood(
        req.params.neighborhoodId,
        date
      );
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

  return httpServer;
}
