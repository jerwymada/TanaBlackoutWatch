import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Neighborhood } from "@shared/schema";

const DISTRICTS = [
  "1er Arrondissement",
  "2ème Arrondissement",
  "3ème Arrondissement",
  "4ème Arrondissement",
  "5ème Arrondissement",
  "6ème Arrondissement",
];

export default function Admin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"outages" | "neighborhoods">("outages");

  // Outage form state
  const [outageDate, setOutageDate] = useState(new Date().toISOString().split("T")[0]);
  const [startHour, setStartHour] = useState("6");
  const [endHour, setEndHour] = useState("9");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<number[]>([]);

  // Neighborhood form state
  const [neighborhoodName, setNeighborhoodName] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);

  const { data: neighborhoods = [] } = useQuery<Neighborhood[]>({
    queryKey: ["/api/neighborhoods"],
  });

  const createOutageMutation = useMutation({
    mutationFn: async (neighborhoodId: number) => {
      return apiRequest("POST", "/api/admin/outages", {
        neighborhoodId,
        date: outageDate,
        startHour: parseInt(startHour),
        endHour: parseInt(endHour),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Coupure créée", description: "Les coupures ont été ajoutées avec succès" });
      setSelectedNeighborhoods([]);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la coupure", variant: "destructive" });
    },
  });

  const deleteOutageMutation = useMutation({
    mutationFn: async (outageId: number) => {
      return apiRequest("DELETE", `/api/admin/outages/${outageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Coupure supprimée" });
    },
  });

  const createNeighborhoodMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/neighborhoods", {
        name: neighborhoodName,
        district,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      toast({ title: "Quartier créé", description: "Le quartier a été ajouté avec succès" });
      setNeighborhoodName("");
      setDistrict(DISTRICTS[0]);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le quartier", variant: "destructive" });
    },
  });

  const deleteNeighborhoodMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/neighborhoods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      toast({ title: "Quartier supprimé" });
    },
  });

  const handleAddOutages = () => {
    if (selectedNeighborhoods.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins un quartier", variant: "destructive" });
      return;
    }
    for (const neighborhoodId of selectedNeighborhoods) {
      createOutageMutation.mutate(neighborhoodId);
    }
  };

  const neighborhoodsByDistrict = neighborhoods.reduce((acc, neighborhood) => {
    if (!acc[neighborhood.district]) {
      acc[neighborhood.district] = [];
    }
    acc[neighborhood.district].push(neighborhood);
    return acc;
  }, {} as Record<string, Neighborhood[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Espace Administrateur</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "outages" ? "default" : "outline"}
            onClick={() => setTab("outages")}
            data-testid="button-tab-outages"
          >
            Gérer les Coupures
          </Button>
          <Button
            variant={tab === "neighborhoods" ? "default" : "outline"}
            onClick={() => setTab("neighborhoods")}
            data-testid="button-tab-neighborhoods"
          >
            Gérer les Quartiers
          </Button>
        </div>

        {tab === "outages" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une Coupure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={outageDate}
                      onChange={(e) => setOutageDate(e.target.value)}
                      data-testid="input-outage-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startHour">Heure de début</Label>
                    <Input
                      id="startHour"
                      type="number"
                      min="0"
                      max="23"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      data-testid="input-start-hour"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endHour">Heure de fin</Label>
                    <Input
                      id="endHour"
                      type="number"
                      min="0"
                      max="24"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      data-testid="input-end-hour"
                    />
                  </div>
                </div>

                <div>
                  <Label>Quartiers concernés</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {neighborhoods.map((neighborhood) => (
                      <label
                        key={neighborhood.id}
                        className="flex items-center gap-2 p-2 rounded border hover:bg-secondary cursor-pointer"
                        data-testid={`label-neighborhood-${neighborhood.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedNeighborhoods.includes(neighborhood.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNeighborhoods([...selectedNeighborhoods, neighborhood.id]);
                            } else {
                              setSelectedNeighborhoods(selectedNeighborhoods.filter((id) => id !== neighborhood.id));
                            }
                          }}
                          data-testid={`checkbox-neighborhood-${neighborhood.id}`}
                        />
                        <span className="text-sm">{neighborhood.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleAddOutages}
                  disabled={createOutageMutation.isPending}
                  data-testid="button-add-outages"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter les Coupures
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "neighborhoods" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un Quartier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom du quartier</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Analakely"
                      value={neighborhoodName}
                      onChange={(e) => setNeighborhoodName(e.target.value)}
                      data-testid="input-neighborhood-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">Arrondissement</Label>
                    <Select value={district} onValueChange={setDistrict}>
                      <SelectTrigger id="district" data-testid="select-district">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => createNeighborhoodMutation.mutate()}
                  disabled={!neighborhoodName || createNeighborhoodMutation.isPending}
                  data-testid="button-add-neighborhood"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le Quartier
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {DISTRICTS.map((dist) => {
                const districtNeighborhoods = neighborhoodsByDistrict[dist] || [];
                if (districtNeighborhoods.length === 0) return null;

                return (
                  <Card key={dist}>
                    <CardHeader>
                      <CardTitle className="text-lg">{dist}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {districtNeighborhoods.map((neighborhood) => (
                          <div
                            key={neighborhood.id}
                            className="flex items-center justify-between p-3 rounded border"
                            data-testid={`item-neighborhood-${neighborhood.id}`}
                          >
                            <span>{neighborhood.name}</span>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteNeighborhoodMutation.mutate(neighborhood.id)}
                              disabled={deleteNeighborhoodMutation.isPending}
                              data-testid={`button-delete-neighborhood-${neighborhood.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
