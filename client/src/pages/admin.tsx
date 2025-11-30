import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, Search, Filter, ArrowUpDown, Calendar, MapPin, Clock, Edit, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StatusSummary } from "@/components/status-summary";
import type { Neighborhood, OutageSchedule } from "@shared/schema";

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
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Outage form state
  const [outageDate, setOutageDate] = useState(new Date().toISOString().split("T")[0]);
  const [startHour, setStartHour] = useState("6");
  const [startMinute, setStartMinute] = useState("0");
  const [endHour, setEndHour] = useState("9");
  const [endMinute, setEndMinute] = useState("0");
  const [reason, setReason] = useState("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<number[]>([]);
  
  // Edit state
  const [editingOutageId, setEditingOutageId] = useState<number | null>(null);
  const [editOutageDate, setEditOutageDate] = useState("");
  const [editStartHour, setEditStartHour] = useState("");
  const [editStartMinute, setEditStartMinute] = useState("0");
  const [editEndHour, setEditEndHour] = useState("");
  const [editEndMinute, setEditEndMinute] = useState("0");
  const [editReason, setEditReason] = useState("");
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>("all");
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "time" | "neighborhood">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<"timeSlot" | "date" | "neighborhood" | "none">("timeSlot");
  const [showPastOutages, setShowPastOutages] = useState(false);
  
  // Bulk edit state
  const [selectedOutageIds, setSelectedOutageIds] = useState<Set<number>>(new Set());
  const [bulkEditDate, setBulkEditDate] = useState("");
  const [bulkEditStartHour, setBulkEditStartHour] = useState("");
  const [bulkEditStartMinute, setBulkEditStartMinute] = useState("0");
  const [bulkEditEndHour, setBulkEditEndHour] = useState("");
  const [bulkEditEndMinute, setBulkEditEndMinute] = useState("0");
  const [bulkEditReason, setBulkEditReason] = useState("");

  // Neighborhood form state
  const [neighborhoodName, setNeighborhoodName] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  
  // Dialog state
  const [isAddOutageDialogOpen, setIsAddOutageDialogOpen] = useState(false);
  
  // Dialog filter state for neighborhoods
  const [dialogNeighborhoodSearch, setDialogNeighborhoodSearch] = useState("");
  const [dialogFilterDistrict, setDialogFilterDistrict] = useState<string>("all");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: neighborhoods = [], isLoading: isLoadingNeighborhoods, isError: isErrorNeighborhoods } = useQuery<Neighborhood[]>({
    queryKey: ["/api/neighborhoods"],
  });

  const { data: schedules = [], isLoading: isLoadingSchedules, isError: isErrorSchedules } = useQuery<OutageSchedule[]>({
    queryKey: ["/api/schedules"],
  });

  useEffect(() => {
    if (isErrorNeighborhoods || isErrorSchedules) {
      toast({ 
        title: "Erreur de connexion", 
        description: "Impossible de charger les données depuis la base de données. Vérifiez la connexion au serveur.", 
        variant: "destructive" 
      });
    }
  }, [isErrorNeighborhoods, isErrorSchedules, toast]);

  const createOutageMutation = useMutation({
    mutationFn: async (neighborhoodId: number) => {
      // Convert hour and minute to decimal (e.g., 6:30 -> 6.5, 9:00 -> 9.0)
      const startTime = parseFloat(startHour) + (parseInt(startMinute) / 60);
      const endTime = parseFloat(endHour) + (parseInt(endMinute) / 60);
      const res = await apiRequest("POST", "/api/admin/outages", {
        neighborhoodId,
        date: outageDate,
        startHour: startTime,
        endHour: endTime,
        reason: reason || undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Coupure créée", description: "Les coupures ont été ajoutées avec succès" });
      setSelectedNeighborhoods([]);
      setReason("");
      setDialogNeighborhoodSearch("");
      setDialogFilterDistrict("all");
      setIsAddOutageDialogOpen(false);
    },
    onError: (error: any) => {
      const message = error?.message || "Impossible de créer la coupure";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    },
  });

  const updateOutageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { date: string; startHour: number; endHour: number; reason?: string } }) => {
      const res = await apiRequest("PATCH", `/api/admin/outages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setEditingOutageId(null);
      toast({ title: "Coupure modifiée", description: "La coupure a été mise à jour avec succès" });
    },
    onError: (error: any) => {
      const message = error?.message || "Impossible de modifier la coupure";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    },
  });

  const deleteOutageMutation = useMutation({
    mutationFn: async (outageId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/outages/${outageId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Coupure supprimée" });
    },
    onError: (error: any) => {
      const message = error?.message || "Impossible de supprimer la coupure";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    },
  });

  const handleStartEdit = (outage: any) => {
    setEditingOutageId(outage.id);
    setEditOutageDate(outage.date);
    setEditStartHour(Math.floor(outage.startHour).toString());
    setEditStartMinute(outage.startHour % 1 !== 0 ? '30' : '0');
    setEditEndHour(Math.floor(outage.endHour).toString());
    setEditEndMinute(outage.endHour % 1 !== 0 ? '30' : '0');
    setEditReason(outage.reason || "");
  };

  const handleCancelEdit = () => {
    setEditingOutageId(null);
    setEditOutageDate("");
    setEditStartHour("");
    setEditStartMinute("0");
    setEditEndHour("");
    setEditEndMinute("0");
    setEditReason("");
  };

  const handleSaveEdit = (outageId: number) => {
    const startTime = parseFloat(editStartHour) + (parseInt(editStartMinute) / 60);
    const endTime = parseFloat(editEndHour) + (parseInt(editEndMinute) / 60);
    
    updateOutageMutation.mutate({
      id: outageId,
      data: {
        date: editOutageDate,
        startHour: startTime,
        endHour: endTime,
        reason: editReason || undefined,
      },
    });
  };

  // Bulk edit functions
  const handleToggleSelect = (id: number) => {
    setSelectedOutageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (items: Array<{ outage: any }>) => {
    setSelectedOutageIds(prev => {
      const newSet = new Set(prev);
      items.forEach(({ outage }) => newSet.add(outage.id));
      return newSet;
    });
  };

  const handleDeselectAll = () => {
    setSelectedOutageIds(new Set());
  };

  const handleSelectAllVisible = () => {
    // Sélectionner toutes les coupures visibles (après filtres)
    const allVisibleOutages: Array<{ outage: any }> = [];
    schedules.forEach((schedule) => {
      schedule.outages.forEach((outage) => {
        allVisibleOutages.push({ outage, neighborhood: schedule.neighborhood });
      });
    });
    handleSelectAll(allVisibleOutages);
  };

  const bulkUpdateOutageMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: number[]; data: { date?: string; startHour?: number; endHour?: number; reason?: string } }) => {
      const res = await apiRequest("PATCH", "/api/admin/outages/bulk", { ids, data });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      handleDeselectAll();
      setBulkEditDate("");
      setBulkEditStartHour("");
      setBulkEditStartMinute("0");
      setBulkEditEndHour("");
      setBulkEditEndMinute("0");
      setBulkEditReason("");
      toast({ title: "Modifications appliquées", description: `${selectedOutageIds.size} coupure(s) modifiée(s) avec succès` });
    },
    onError: (error: any) => {
      const message = error?.message || "Impossible de modifier les coupures";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    },
  });

  const handleBulkEdit = () => {
    if (selectedOutageIds.size === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins une coupure", variant: "destructive" });
      return;
    }

    if (selectedOutageIds.size > 10) {
      if (!confirm(`Vous êtes sur le point de modifier ${selectedOutageIds.size} coupures. Continuer ?`)) {
        return;
      }
    }

    const updateData: any = {};
    if (bulkEditDate) updateData.date = bulkEditDate;
    if (bulkEditStartHour) {
      const startTime = parseFloat(bulkEditStartHour) + (parseInt(bulkEditStartMinute) / 60);
      updateData.startHour = startTime;
    }
    if (bulkEditEndHour) {
      const endTime = parseFloat(bulkEditEndHour) + (parseInt(bulkEditEndMinute) / 60);
      updateData.endHour = endTime;
    }
    if (bulkEditReason !== undefined) {
      updateData.reason = bulkEditReason || undefined;
    }

    if (Object.keys(updateData).length === 0) {
      toast({ title: "Erreur", description: "Remplissez au moins un champ à modifier", variant: "destructive" });
      return;
    }

    bulkUpdateOutageMutation.mutate({
      ids: Array.from(selectedOutageIds),
      data: updateData,
    });
  };

  const createNeighborhoodMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/neighborhoods", {
        name: neighborhoodName,
        district,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Quartier créé", description: "Le quartier a été ajouté avec succès" });
      setNeighborhoodName("");
      setDistrict(DISTRICTS[0]);
    },
    onError: (error: any) => {
      const message = error?.message || "Impossible de créer le quartier";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    },
  });

  const deleteNeighborhoodMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/neighborhoods/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Quartier supprimé" });
    },
    onError: (error: any) => {
      const message = error?.message || "Impossible de supprimer le quartier";
      toast({ title: "Erreur", description: message, variant: "destructive" });
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
        {(isLoadingNeighborhoods || isLoadingSchedules) && (
          <div className="mb-4 p-8 bg-muted/50 rounded-lg border border-muted flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">Chargement des données...</p>
              <p className="text-xs text-muted-foreground">Veuillez patienter</p>
            </div>
          </div>
        )}
        
        {(isErrorNeighborhoods || isErrorSchedules) && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              Erreur de connexion à la base de données. Vérifiez que le serveur est démarré et accessible.
            </p>
          </div>
        )}

        {!isLoadingNeighborhoods && !isLoadingSchedules && (
          <div className="mb-6">
            <StatusSummary schedules={schedules} currentHour={currentHour} />
          </div>
        )}

        {!isLoadingNeighborhoods && !isLoadingSchedules && (
          <>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Liste des Coupures</CardTitle>
                  <Dialog open={isAddOutageDialogOpen} onOpenChange={setIsAddOutageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une Coupure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Ajouter une Coupure</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
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
                            <Label>Raison (optionnel)</Label>
                            <Input
                              id="reason"
                              placeholder="Ex: Maintenance, Réparation réseau..."
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              data-testid="input-reason"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
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
                            <Label htmlFor="startMinute">Minute de début</Label>
                            <Select value={startMinute} onValueChange={setStartMinute}>
                              <SelectTrigger id="startMinute" data-testid="select-start-minute">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">00</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                              </SelectContent>
                            </Select>
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
                          <div>
                            <Label htmlFor="endMinute">Minute de fin</Label>
                            <Select value={endMinute} onValueChange={setEndMinute}>
                              <SelectTrigger id="endMinute" data-testid="select-end-minute">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">00</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Quartiers concernés</Label>
                            <div className="text-xs text-muted-foreground">
                              {selectedNeighborhoods.length} sélectionné{selectedNeighborhoods.length > 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {/* Filtres pour les quartiers */}
                          <div className="space-y-3 mb-3 p-3 bg-muted/30 rounded-lg border">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                  type="search"
                                  placeholder="Rechercher par nom de quartier..."
                                  value={dialogNeighborhoodSearch}
                                  onChange={(e) => setDialogNeighborhoodSearch(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                              <Select value={dialogFilterDistrict} onValueChange={setDialogFilterDistrict}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <SelectValue placeholder="Tous les arrondissements" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Tous les arrondissements</SelectItem>
                                  {DISTRICTS.map(dist => (
                                    <SelectItem key={dist} value={dist}>
                                      {dist}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {(() => {
                              const filteredNeighborhoods = neighborhoods.filter(n => {
                                if (dialogNeighborhoodSearch.trim()) {
                                  const query = dialogNeighborhoodSearch.toLowerCase();
                                  if (!n.name.toLowerCase().includes(query)) return false;
                                }
                                if (dialogFilterDistrict !== "all" && n.district !== dialogFilterDistrict) {
                                  return false;
                                }
                                return true;
                              });
                              
                              const filteredSelected = filteredNeighborhoods.filter(n => selectedNeighborhoods.includes(n.id));
                              const allFilteredSelected = filteredNeighborhoods.length > 0 && filteredSelected.length === filteredNeighborhoods.length;
                              
                              return (
                                <div className="flex items-center gap-2 pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (allFilteredSelected) {
                                        // Désélectionner tous les quartiers filtrés
                                        setSelectedNeighborhoods(prev => 
                                          prev.filter(id => !filteredNeighborhoods.some(n => n.id === id))
                                        );
                                      } else {
                                        // Sélectionner tous les quartiers filtrés
                                        setSelectedNeighborhoods(prev => {
                                          const newSet = new Set(prev);
                                          filteredNeighborhoods.forEach(n => newSet.add(n.id));
                                          return Array.from(newSet);
                                        });
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    {allFilteredSelected ? "Désélectionner tout" : "Sélectionner tout"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedNeighborhoods([]);
                                    }}
                                    className="text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Tout effacer
                                  </Button>
                                  <div className="text-xs text-muted-foreground ml-auto">
                                    {filteredNeighborhoods.length} quartier{filteredNeighborhoods.length > 1 ? 's' : ''} trouvé{filteredNeighborhoods.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Liste des quartiers filtrés */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                            {(() => {
                              const filteredNeighborhoods = neighborhoods.filter(n => {
                                if (dialogNeighborhoodSearch.trim()) {
                                  const query = dialogNeighborhoodSearch.toLowerCase();
                                  if (!n.name.toLowerCase().includes(query)) return false;
                                }
                                if (dialogFilterDistrict !== "all" && n.district !== dialogFilterDistrict) {
                                  return false;
                                }
                                return true;
                              });
                              
                              if (filteredNeighborhoods.length === 0) {
                                return (
                                  <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                                    Aucun quartier ne correspond aux filtres
                                  </div>
                                );
                              }
                              
                              return filteredNeighborhoods.map((neighborhood) => (
                                <label
                                  key={neighborhood.id}
                                  className="flex items-center gap-2 p-2 rounded border hover:bg-secondary cursor-pointer transition-colors"
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
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate">{neighborhood.name}</span>
                                    <span className="text-xs text-muted-foreground truncate">{neighborhood.district}</span>
                                  </div>
                                </label>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddOutageDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleAddOutages}
                          disabled={createOutageMutation.isPending}
                          data-testid="button-add-outages"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter les Coupures
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtres et recherche */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="search"
                        placeholder="Rechercher par quartier, arrondissement ou raison..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterDate || "all"} onValueChange={(v) => setFilterDate(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Toutes les dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les dates</SelectItem>
                        {Array.from(new Set(schedules.flatMap(s => s.outages.map(o => o.date))))
                          .sort()
                          .reverse()
                          .slice(0, 30)
                          .map(date => (
                            <SelectItem key={date} value={date}>
                              {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <MapPin className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Tous les quartiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les quartiers</SelectItem>
                        {neighborhoods.map(n => (
                          <SelectItem key={n.id} value={n.id.toString()}>
                            {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={sortBy} onValueChange={(v: "date" | "time" | "neighborhood") => setSortBy(v)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Trier par date</SelectItem>
                        <SelectItem value="time">Trier par heure</SelectItem>
                        <SelectItem value="neighborhood">Trier par quartier</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="w-full sm:w-auto"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"} {sortOrder === "asc" ? "Croissant" : "Décroissant"}
                    </Button>
                    <Select value={groupBy} onValueChange={(v: "timeSlot" | "date" | "neighborhood" | "none") => setGroupBy(v)}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timeSlot">Grouper par plage horaire</SelectItem>
                        <SelectItem value="date">Grouper par date</SelectItem>
                        <SelectItem value="neighborhood">Grouper par quartier</SelectItem>
                        <SelectItem value="none">Aucun regroupement</SelectItem>
                      </SelectContent>
                    </Select>
                    {(searchQuery || filterDate || filterNeighborhood !== "all" || filterTimeSlot !== "all" || showPastOutages) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterDate("");
                          setFilterNeighborhood("all");
                          setFilterTimeSlot("all");
                          setShowPastOutages(false);
                        }}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Switch
                      checked={showPastOutages}
                      onCheckedChange={setShowPastOutages}
                      id="show-past-outages"
                    />
                    <Label htmlFor="show-past-outages" className="text-sm cursor-pointer">
                      Afficher les coupures passées
                    </Label>
                  </div>
                  
                  {(() => {
                    const allOutagesCount = schedules.reduce((sum, s) => sum + s.outages.length, 0);
                    const filteredCount = schedules.reduce((sum, schedule) => {
                      return sum + schedule.outages.filter(outage => {
                        const neighborhood = schedule.neighborhood;
                        if (searchQuery.trim()) {
                          const query = searchQuery.toLowerCase();
                          const matchesName = neighborhood.name.toLowerCase().includes(query);
                          const matchesDistrict = neighborhood.district.toLowerCase().includes(query);
                          const matchesReason = outage.reason?.toLowerCase().includes(query);
                          if (!matchesName && !matchesDistrict && !matchesReason) return false;
                        }
                        if (filterDate && outage.date !== filterDate) return false;
                        if (filterNeighborhood !== "all" && neighborhood.id.toString() !== filterNeighborhood) return false;
                        if (filterTimeSlot !== "all") {
                          const [date, startH, endH] = filterTimeSlot.split("_");
                          if (outage.date !== date || outage.startHour.toString() !== startH || outage.endHour.toString() !== endH) return false;
                        }
                        return true;
                      }).length;
                    }, 0);
                    
                    return filteredCount !== allOutagesCount ? (
                      <div className="text-sm text-muted-foreground">
                        {filteredCount} coupure{filteredCount > 1 ? 's' : ''} sur {allOutagesCount}
                      </div>
                    ) : null;
                  })()}
                </div>
                
                {/* Liste des coupures */}
                {schedules.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Aucune coupure programmée
                  </div>
                ) : (() => {
                  // Étape 1: Extraire toutes les coupures avec leurs quartiers
                  const allOutages: Array<{ outage: any; neighborhood: any }> = [];
                  schedules.forEach((schedule) => {
                    schedule.outages.forEach((outage) => {
                      allOutages.push({
                        outage,
                        neighborhood: schedule.neighborhood,
                      });
                    });
                  });

                  // Étape 2: Appliquer les filtres
                  const today = new Date().toISOString().split('T')[0];
                  const now = new Date();
                  const currentHour = now.getHours() + (now.getMinutes() / 60);
                  
                  let filteredOutages = allOutages.filter(({ outage, neighborhood }) => {
                    // Filtre par recherche (nom de quartier ou raison)
                    if (searchQuery.trim()) {
                      const query = searchQuery.toLowerCase();
                      const matchesName = neighborhood.name.toLowerCase().includes(query);
                      const matchesDistrict = neighborhood.district.toLowerCase().includes(query);
                      const matchesReason = outage.reason?.toLowerCase().includes(query);
                      if (!matchesName && !matchesDistrict && !matchesReason) {
                        return false;
                      }
                    }
                    
                    // Filtre par date
                    if (filterDate && outage.date !== filterDate) {
                      return false;
                    }
                    
                    // Filtre par quartier
                    if (filterNeighborhood !== "all" && neighborhood.id.toString() !== filterNeighborhood) {
                      return false;
                    }
                    
                    // Filtre par plage horaire
                    if (filterTimeSlot !== "all") {
                      const [date, startH, endH] = filterTimeSlot.split("_");
                      if (outage.date !== date || 
                          outage.startHour.toString() !== startH || 
                          outage.endHour.toString() !== endH) {
                        return false;
                      }
                    }
                    
                    // Filtre par coupures passées
                    if (!showPastOutages) {
                      const outageDate = outage.date;
                      const isToday = outageDate === today;
                      const isPastDate = outageDate < today;
                      
                      if (isPastDate) {
                        // Date passée : masquer
                        return false;
                      } else if (isToday) {
                        // Date d'aujourd'hui : vérifier si on est encore dans la plage horaire
                        const isCurrentlyInTimeSlot = currentHour >= outage.startHour && currentHour < outage.endHour;
                        if (!isCurrentlyInTimeSlot && currentHour >= outage.endHour) {
                          // La plage horaire est passée : masquer
                          return false;
                        }
                        // Si on est encore dans la plage horaire, afficher même si showPastOutages est false
                      }
                      // Date future : toujours afficher
                    }
                    
                    return true;
                  });

                  // Étape 3: Trier
                  filteredOutages.sort((a, b) => {
                    let comparison = 0;
                    
                    if (sortBy === "date") {
                      comparison = a.outage.date.localeCompare(b.outage.date);
                      if (comparison === 0) {
                        comparison = a.outage.startHour - b.outage.startHour;
                      }
                    } else if (sortBy === "time") {
                      comparison = a.outage.startHour - b.outage.startHour;
                      if (comparison === 0) {
                        comparison = a.outage.date.localeCompare(b.outage.date);
                      }
                    } else if (sortBy === "neighborhood") {
                      comparison = a.neighborhood.name.localeCompare(b.neighborhood.name);
                      if (comparison === 0) {
                        comparison = a.outage.date.localeCompare(b.outage.date);
                      }
                    }
                    
                    return sortOrder === "asc" ? comparison : -comparison;
                  });

                  // Étape 4: Regrouper selon le mode sélectionné
                  let groupedOutages: Array<[string, Array<{ outage: any; neighborhood: any }>]>;
                  
                  if (groupBy === "none") {
                    // Pas de regroupement, chaque coupure est un groupe
                    groupedOutages = filteredOutages.map((item, index) => [
                      `single_${item.outage.id}_${index}`,
                      [item]
                    ]);
                  } else {
                    const groupMap = new Map<string, Array<{ outage: any; neighborhood: any }>>();
                    
                    filteredOutages.forEach((item) => {
                      let groupKey: string;
                      
                      if (groupBy === "timeSlot") {
                        groupKey = `${item.outage.date}_${item.outage.startHour}_${item.outage.endHour}`;
                      } else if (groupBy === "date") {
                        groupKey = item.outage.date;
                      } else if (groupBy === "neighborhood") {
                        groupKey = `${item.neighborhood.id}_${item.neighborhood.name}`;
                      } else {
                        groupKey = `single_${item.outage.id}`;
                      }
                      
                      if (!groupMap.has(groupKey)) {
                        groupMap.set(groupKey, []);
                      }
                      groupMap.get(groupKey)!.push(item);
                    });
                    
                    groupedOutages = Array.from(groupMap.entries());
                    
                    // Trier les groupes
                    groupedOutages.sort(([keyA, itemsA], [keyB, itemsB]) => {
                      if (groupBy === "date") {
                        return sortOrder === "asc" 
                          ? keyA.localeCompare(keyB)
                          : keyB.localeCompare(keyA);
                      } else if (groupBy === "neighborhood") {
                        const nameA = itemsA[0].neighborhood.name;
                        const nameB = itemsB[0].neighborhood.name;
                        return sortOrder === "asc"
                          ? nameA.localeCompare(nameB)
                          : nameB.localeCompare(nameA);
                      } else {
                        return sortOrder === "asc"
                          ? keyA.localeCompare(keyB)
                          : keyB.localeCompare(keyA);
                      }
                    });
                  }

                  if (filteredOutages.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        Aucune coupure ne correspond aux filtres
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {groupedOutages.map(([groupKey, items]) => {
                        const firstOutage = items[0].outage;
                        const firstNeighborhood = items[0].neighborhood;
                        const startH = Math.floor(firstOutage.startHour);
                        const startM = firstOutage.startHour % 1 !== 0 ? '30' : '00';
                        const endH = Math.floor(firstOutage.endHour);
                        const endM = firstOutage.endHour % 1 !== 0 ? '30' : '00';
                        const duration = (firstOutage.endHour - firstOutage.startHour).toFixed(1);
                        const allOutageIds = items.map(item => item.outage.id);

                        // Titre du groupe selon le mode de regroupement
                        let groupTitle = "";
                        if (groupBy === "timeSlot") {
                          groupTitle = `${firstOutage.date} - ${startH.toString().padStart(2, '0')}:${startM} à ${endH.toString().padStart(2, '0')}:${endM}`;
                        } else if (groupBy === "date") {
                          groupTitle = firstOutage.date;
                        } else if (groupBy === "neighborhood") {
                          groupTitle = `${firstNeighborhood.name} - ${firstNeighborhood.district}`;
                        } else {
                          groupTitle = `${firstNeighborhood.name} - ${firstOutage.date}`;
                        }

                        return (
                          <div
                            key={groupKey}
                            className="p-4 rounded-lg border bg-muted/30"
                            data-testid={`group-outage-${groupKey}`}
                          >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b">
                              <div className="flex items-center gap-4 flex-wrap">
                                {groupBy !== "none" && items.length > 1 && (
                                  <Checkbox
                                    checked={items.every(({ outage }) => selectedOutageIds.has(outage.id))}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleSelectAll(items);
                                      } else {
                                        setSelectedOutageIds(prev => {
                                          const newSet = new Set(prev);
                                          items.forEach(({ outage }) => newSet.delete(outage.id));
                                          return newSet;
                                        });
                                      }
                                    }}
                                    disabled={editingOutageId !== null}
                                    data-testid={`checkbox-select-all-group-${groupKey}`}
                                  />
                                )}
                                <div className="font-semibold text-base">
                                  {groupTitle}
                                </div>
                                {groupBy === "timeSlot" && (
                                  <>
                                    <div className="text-sm text-muted-foreground">
                                      ({duration}h)
                                    </div>
                                    {firstOutage.reason && (
                                      <div className="text-sm text-muted-foreground italic">
                                        {firstOutage.reason}
                                      </div>
                                    )}
                                  </>
                                )}
                                {groupBy !== "none" && (
                                  <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                    {items.length} coupure{items.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                              {groupBy !== "none" && items.length > 1 && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSelectAll(items)}
                                    disabled={editingOutageId !== null}
                                    data-testid={`button-edit-group-${groupKey}`}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier tout
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Supprimer toutes les coupures de ce groupe (${items.length} coupure${items.length > 1 ? 's' : ''}) ?`)) {
                                        allOutageIds.forEach(id => deleteOutageMutation.mutate(id));
                                      }
                                    }}
                                    disabled={deleteOutageMutation.isPending || editingOutageId !== null}
                                    data-testid={`button-delete-group-${groupKey}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer tout
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              {items.map(({ outage, neighborhood }) => {
                                const isEditing = editingOutageId === outage.id;
                                
                                return (
                                  <div
                                    key={outage.id}
                                    className={`p-2 rounded transition-colors ${
                                      isEditing 
                                        ? "bg-primary/10 border border-primary/20" 
                                        : selectedOutageIds.has(outage.id)
                                        ? "bg-primary/5 border border-primary/20"
                                        : "bg-background/50 hover:bg-background/80"
                                    }`}
                                    data-testid={`item-outage-${outage.id}`}
                                  >
                                    {isEditing ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-muted-foreground">
                                            {neighborhood.name} - {neighborhood.district}
                                          </span>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                              onClick={() => handleSaveEdit(outage.id)}
                                              disabled={updateOutageMutation.isPending}
                                              data-testid={`button-save-outage-${outage.id}`}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                              onClick={handleCancelEdit}
                                              disabled={updateOutageMutation.isPending}
                                              data-testid={`button-cancel-outage-${outage.id}`}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <Label htmlFor={`edit-date-${outage.id}`} className="text-xs">Date</Label>
                                            <Input
                                              id={`edit-date-${outage.id}`}
                                              type="date"
                                              value={editOutageDate}
                                              onChange={(e) => setEditOutageDate(e.target.value)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor={`edit-reason-${outage.id}`} className="text-xs">Raison</Label>
                                            <Input
                                              id={`edit-reason-${outage.id}`}
                                              placeholder="Optionnel"
                                              value={editReason}
                                              onChange={(e) => setEditReason(e.target.value)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                          <div>
                                            <Label htmlFor={`edit-start-hour-${outage.id}`} className="text-xs">H. début</Label>
                                            <Input
                                              id={`edit-start-hour-${outage.id}`}
                                              type="number"
                                              min="0"
                                              max="23"
                                              value={editStartHour}
                                              onChange={(e) => setEditStartHour(e.target.value)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor={`edit-start-minute-${outage.id}`} className="text-xs">Min. début</Label>
                                            <Select value={editStartMinute} onValueChange={setEditStartMinute}>
                                              <SelectTrigger id={`edit-start-minute-${outage.id}`} className="h-8 text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="0">00</SelectItem>
                                                <SelectItem value="30">30</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div>
                                            <Label htmlFor={`edit-end-hour-${outage.id}`} className="text-xs">H. fin</Label>
                                            <Input
                                              id={`edit-end-hour-${outage.id}`}
                                              type="number"
                                              min="0"
                                              max="24"
                                              value={editEndHour}
                                              onChange={(e) => setEditEndHour(e.target.value)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor={`edit-end-minute-${outage.id}`} className="text-xs">Min. fin</Label>
                                            <Select value={editEndMinute} onValueChange={setEditEndMinute}>
                                              <SelectTrigger id={`edit-end-minute-${outage.id}`} className="h-8 text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="0">00</SelectItem>
                                                <SelectItem value="30">30</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                          <Checkbox
                                            checked={selectedOutageIds.has(outage.id)}
                                            onCheckedChange={() => handleToggleSelect(outage.id)}
                                            disabled={editingOutageId !== null}
                                            data-testid={`checkbox-outage-${outage.id}`}
                                          />
                                          <div className="flex flex-col gap-1 flex-1">
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="font-medium">{neighborhood.name}</span>
                                              <span className="text-muted-foreground">-</span>
                                              <span className="text-muted-foreground">{neighborhood.district}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(outage.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {Math.floor(outage.startHour).toString().padStart(2, '0')}:{(outage.startHour % 1 !== 0 ? '30' : '00')} - {Math.floor(outage.endHour).toString().padStart(2, '0')}:{(outage.endHour % 1 !== 0 ? '30' : '00')}
                                              </span>
                                              {(outage.endHour - outage.startHour) > 0 && (
                                                <span className="text-xs">
                                                  ({(outage.endHour - outage.startHour).toFixed(1)}h)
                                                </span>
                                              )}
                                              {outage.reason && (
                                                <span className="italic text-xs">
                                                  - {outage.reason}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleStartEdit(outage)}
                                            disabled={editingOutageId !== null || selectedOutageIds.size > 0}
                                            data-testid={`button-edit-outage-${outage.id}`}
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteOutageMutation.mutate(outage.id)}
                                            disabled={deleteOutageMutation.isPending || editingOutageId !== null || selectedOutageIds.size > 0}
                                            data-testid={`button-delete-outage-${outage.id}`}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Panneau de modification en masse */}
            {selectedOutageIds.size > 0 && (
              <Card className="sticky bottom-4 border-2 border-primary shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Modifier {selectedOutageIds.size} coupure{selectedOutageIds.size > 1 ? 's' : ''}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllVisible}
                        disabled={bulkUpdateOutageMutation.isPending}
                      >
                        Sélectionner tout
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
                        disabled={bulkUpdateOutageMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Désélectionner tout
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bulk-edit-date">Date</Label>
                      <Input
                        id="bulk-edit-date"
                        type="date"
                        value={bulkEditDate}
                        onChange={(e) => setBulkEditDate(e.target.value)}
                        placeholder="Laisser vide pour ne pas modifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-edit-reason">Raison</Label>
                      <Input
                        id="bulk-edit-reason"
                        placeholder="Laisser vide pour ne pas modifier"
                        value={bulkEditReason}
                        onChange={(e) => setBulkEditReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="bulk-edit-start-hour">Heure de début</Label>
                      <Input
                        id="bulk-edit-start-hour"
                        type="number"
                        min="0"
                        max="23"
                        value={bulkEditStartHour}
                        onChange={(e) => setBulkEditStartHour(e.target.value)}
                        placeholder="Laisser vide pour ne pas modifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-edit-start-minute">Minute de début</Label>
                      <Select value={bulkEditStartMinute} onValueChange={setBulkEditStartMinute}>
                        <SelectTrigger id="bulk-edit-start-minute">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">00</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bulk-edit-end-hour">Heure de fin</Label>
                      <Input
                        id="bulk-edit-end-hour"
                        type="number"
                        min="0"
                        max="24"
                        value={bulkEditEndHour}
                        onChange={(e) => setBulkEditEndHour(e.target.value)}
                        placeholder="Laisser vide pour ne pas modifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-edit-end-minute">Minute de fin</Label>
                      <Select value={bulkEditEndMinute} onValueChange={setBulkEditEndMinute}>
                        <SelectTrigger id="bulk-edit-end-minute">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">00</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDeselectAll}
                      disabled={bulkUpdateOutageMutation.isPending}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleBulkEdit}
                      disabled={bulkUpdateOutageMutation.isPending}
                    >
                      {bulkUpdateOutageMutation.isPending ? "Application..." : "Appliquer les modifications"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
          </>
        )}
      </main>
    </div>
  );
}
