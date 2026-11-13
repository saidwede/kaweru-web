"use client";

import { signOutEverywhere } from "@/lib/firebaseClient";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile, TripSummary, AgentItem, BookingItem, CompanyItem, TabType, ValidationMode } from "./_components/types";
import { filterTrips, filterBookings } from "./_components/utils";
import PortalSidebar from "./_components/PortalSidebar";
import PortalHeader from "./_components/PortalHeader";
import NotificationBanner from "./_components/NotificationBanner";
import KpiBanner from "./_components/KpiBanner";
import ValidatorTab from "./_components/ValidatorTab";
import TripsTab from "./_components/TripsTab";
import TicketsTab from "./_components/TicketsTab";
import AgentsTab from "./_components/AgentsTab";
import AddTripModal from "./_components/AddTripModal";
import AddAgentModal from "./_components/AddAgentModal";

export default function MasterExploitationPortal() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("VALIDATOR");
  const [validationMode, setValidationMode] = useState<ValidationMode>("CODE");

  // Données du portail
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Recherche & Filtres
  const [tripSearch, setTripSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"TODAY" | "TOMORROW" | "ALL" | "CUSTOM">("TODAY");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripTimeFilter, setTripTimeFilter] = useState<"ALL" | "MORNING" | "AFTERNOON" | "EVENING">("ALL");

  // Filtres avancés du Registre des Billets
  const [ticketDateFilter, setTicketDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "TOMORROW" | "CUSTOM">("ALL");
  const [ticketCustomDate, setTicketCustomDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [ticketTimeFilter, setTicketTimeFilter] = useState<"ALL" | "MORNING" | "AFTERNOON" | "EVENING">("ALL");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<"ALL" | "NOT_BOARDED" | "BOARDED" | "DISEMBARKED">("ALL");

  // Validation de billets (Caméra / Code / Téléphone)
  const [validateQuery, setValidateQuery] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<BookingItem | null>(null);
  const [searchResults, setSearchResults] = useState<BookingItem[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<any>(null);

  // Modale Nouveau Trajet (Pour Compagnie et Super Admin)
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [newOrigin, setNewOrigin] = useState("Cotonou");
  const [newDestination, setNewDestination] = useState("Parakou");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("07:00");
  const [newPrice, setNewPrice] = useState(8500);
  const [newPlate, setNewPlate] = useState("");
  const [newTripCompanyId, setNewTripCompanyId] = useState("");

  // Modale Nouvel Agent
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPhone, setNewAgentPhone] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("STATION_MANAGER");

  const notify = (type: "success" | "error" | "info", text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleLogout = async () => {
    await signOutEverywhere();
    router.push("/login");
    router.refresh();
  };

  // 1. Charger le profil de l'utilisateur connecté
  const loadProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setUserProfile(data.user);
        if (data.user.companyId) {
          setSelectedCompanyId(data.user.companyId);
        }
      }
    } catch {
      // Ignorer
    }
  };

  // 2. Charger les départs
  const fetchTrips = async (compFilter?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = compFilter ? `/api/trips?companyId=${compFilter}` : "/api/trips";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTrips(data.data);
      }
    } catch {
      setError("Impossible de charger les départs.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Charger les agents de la compagnie
  const fetchAgents = async (compFilter?: string) => {
    try {
      const url = compFilter ? `/api/company/agents?companyId=${compFilter}` : "/api/company/agents";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAgents(data.data);
      }
    } catch {
      // Ignorer
    }
  };

  // 4. Charger les réservations & billets
  const fetchBookings = async (compFilter?: string, q?: string) => {
    try {
      const params = new URLSearchParams();
      if (compFilter) params.set("companyId", compFilter);
      if (q) params.set("q", q);
      const res = await fetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBookings(data.data);
      }
    } catch {
      // Ignorer
    }
  };

  // 5. Charger la liste des compagnies (pour Super Admin)
  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCompanies(data.data);
      }
    } catch {
      // Ignorer
    }
  };

  useEffect(() => {
    loadProfile();
    fetchTrips();
    fetchAgents();
    fetchBookings();
    fetchCompanies();
  }, []);

  const handleCompanyChange = (compId: string) => {
    setSelectedCompanyId(compId);
    fetchTrips(compId);
    fetchAgents(compId);
    fetchBookings(compId);
  };

  // 6. GESTION DU SCANNER CAMÉRA QR CODE
  const startCameraScanner = async () => {
    try {
      setIsCameraActive(true);
      setValidationResult(null);
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignorer
        }
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          handleValidateTicket(decodedText, "CONFIRM_BOARDING");
          try {
            await html5QrCode.stop();
            setIsCameraActive(false);
          } catch {
            // Ignorer
          }
        },
        () => {}
      );
    } catch (err: unknown) {
      setIsCameraActive(false);
      const msg = err instanceof Error ? err.message : "Impossible d'accéder à la caméra.";
      notify("error", `Erreur caméra : ${msg}. Assurez-vous d'avoir accordé les permissions.`);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignorer
      }
    }
    setIsCameraActive(false);
  };

  // 7. VÉRIFICATION OU VALIDATION DU BILLET
  const handleValidateTicket = async (queryInput?: string, action: "VERIFY" | "CONFIRM_BOARDING" = "VERIFY") => {
    const q = (queryInput || validateQuery).trim();
    if (!q) {
      notify("error", "Veuillez entrer un code court (ex: KWR-9X2) ou un numéro de téléphone.");
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setSearchResults([]);

    try {
      const res = await fetch("/api/bookings/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQuery: q,
          action,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (action === "CONFIRM_BOARDING") {
          setValidationResult(json.data);
          notify("success", json.message || "Embarquement validé avec succès !");
          fetchTrips(selectedCompanyId);
          fetchBookings(selectedCompanyId);
        } else {
          if (Array.isArray(json.data)) {
            setSearchResults(json.data);
            if (json.data.length === 1) {
              setValidationResult(json.data[0]);
            }
          }
        }
      } else {
        notify("error", json.error || "Billet introuvable pour cette recherche.");
      }
    } catch {
      notify("error", "Erreur réseau lors de la validation du billet.");
    } finally {
      setValidating(false);
    }
  };

  // 8. CRÉER UN DÉPART (TRAJET)
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTrip(true);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCity: newOrigin,
          destinationCity: newDestination,
          departureDate: newDate,
          departureTime: newTime,
          priceFcfa: Number(newPrice),
          busPlateNumber: newPlate.trim() || undefined,
          targetCompanyId: userProfile?.role === "SUPER_ADMIN" ? (newTripCompanyId || selectedCompanyId) : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        notify("success", json.message || "Départ programmé avec succès !");
        setShowAddTripModal(false);
        setNewPlate("");
        fetchTrips(selectedCompanyId);
      } else {
        notify("error", json.error || "Échec de programmation du trajet.");
      }
    } catch {
      notify("error", "Erreur réseau.");
    } finally {
      setCreatingTrip(false);
    }
  };

  // 9. CRÉER UN AGENT DE GARE
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAgent(true);

    try {
      const res = await fetch("/api/company/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newAgentName,
          phone: newAgentPhone.trim() || undefined,
          email: newAgentEmail.trim() || undefined,
          role: newAgentRole,
          targetCompanyId: userProfile?.role === "SUPER_ADMIN" ? selectedCompanyId : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        notify("success", json.message || "Agent créé avec succès !");
        setShowAddAgentModal(false);
        setNewAgentName("");
        setNewAgentPhone("");
        setNewAgentEmail("");
        fetchAgents(selectedCompanyId);
      } else {
        notify("error", json.error || "Impossible d'enregistrer l'agent.");
      }
    } catch {
      notify("error", "Erreur réseau.");
    } finally {
      setCreatingAgent(false);
    }
  };

  const filteredTrips = useMemo(
    () => filterTrips(trips, tripSearch, dateFilter, customDate, tripTimeFilter),
    [trips, tripSearch, dateFilter, customDate, tripTimeFilter]
  );

  const filteredBookings = useMemo(
    () => filterBookings(bookings, ticketSearch, ticketDateFilter, ticketCustomDate, ticketTimeFilter, ticketStatusFilter),
    [bookings, ticketSearch, ticketDateFilter, ticketCustomDate, ticketTimeFilter, ticketStatusFilter]
  );

  const totalSeatsSold = trips.reduce((acc, t) => acc + (t.soldSeats || 0), 0);
  const totalCapacity = trips.reduce((acc, t) => acc + (t.totalQuota || 50), 0);
  const globalOccupancy = totalCapacity > 0 ? Math.round((totalSeatsSold / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex font-sans antialiased selection:bg-[#FF6500]/20 selection:text-[#FF6500]">
      {/* 1. MENU LATÉRAL GAUCHE PROFESSIONNEL */}
      <PortalSidebar
        userProfile={userProfile} activeTab={activeTab} setActiveTab={setActiveTab}
        stopCameraScanner={stopCameraScanner} trips={trips} bookings={bookings} agents={agents}
        setShowAddTripModal={setShowAddTripModal} handleLogout={handleLogout}
      />

      {/* 2. ZONE PRINCIPALE À DROITE */}
      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader
          validateQuery={validateQuery} setValidateQuery={setValidateQuery} handleValidateTicket={handleValidateTicket}
          userProfile={userProfile} companies={companies} selectedCompanyId={selectedCompanyId}
          handleCompanyChange={handleCompanyChange} setShowAddTripModal={setShowAddTripModal}
          fetchTrips={fetchTrips} fetchAgents={fetchAgents} fetchBookings={fetchBookings} loading={loading}
          activeTab={activeTab} setActiveTab={setActiveTab} stopCameraScanner={stopCameraScanner}
        />

        {/* FEEDBACK TOAST / BANNER */}
        {notificationMsg && (
          <NotificationBanner notificationMsg={notificationMsg} setNotificationMsg={setNotificationMsg} />
        )}

        {/* MAIN BODY PER TAB */}
        <main className="p-4 sm:p-8 space-y-7 flex-1">
          {/* BANDEAU KPIS D'EXPLOITATION */}
          <KpiBanner
            trips={trips} totalSeatsSold={totalSeatsSold} totalCapacity={totalCapacity}
            globalOccupancy={globalOccupancy} bookings={bookings} agents={agents}
          />

          {/* ONGLET 1 : CENTRE DE CONTRÔLE & VALIDATION MULTI-MODALE */}
          {activeTab === "VALIDATOR" && (
            <ValidatorTab
              validationMode={validationMode} setValidationMode={setValidationMode}
              startCameraScanner={startCameraScanner} stopCameraScanner={stopCameraScanner}
              isCameraActive={isCameraActive} validateQuery={validateQuery} setValidateQuery={setValidateQuery}
              handleValidateTicket={handleValidateTicket} validating={validating}
              validationResult={validationResult} searchResults={searchResults}
            />
          )}

          {/* ONGLET 2 : DÉPARTS & FICHES DE CHARGEMENT */}
          {activeTab === "TRIPS" && (
            <TripsTab
              dateFilter={dateFilter} setDateFilter={setDateFilter} customDate={customDate} setCustomDate={setCustomDate}
              tripTimeFilter={tripTimeFilter} setTripTimeFilter={setTripTimeFilter}
              tripSearch={tripSearch} setTripSearch={setTripSearch} loading={loading} filteredTrips={filteredTrips}
              userProfile={userProfile} setShowAddTripModal={setShowAddTripModal}
            />
          )}

          {/* ONGLET 3 : SUPERVISION & REGISTRE DES BILLETS */}
          {activeTab === "TICKETS" && (
            <TicketsTab
              ticketSearch={ticketSearch} setTicketSearch={setTicketSearch}
              ticketDateFilter={ticketDateFilter} setTicketDateFilter={setTicketDateFilter}
              ticketCustomDate={ticketCustomDate} setTicketCustomDate={setTicketCustomDate}
              ticketTimeFilter={ticketTimeFilter} setTicketTimeFilter={setTicketTimeFilter}
              ticketStatusFilter={ticketStatusFilter} setTicketStatusFilter={setTicketStatusFilter}
              bookings={bookings} filteredBookings={filteredBookings} handleValidateTicket={handleValidateTicket}
            />
          )}

          {/* ONGLET 4 : PERSONNEL & ÉQUIPE DE GARE */}
          {activeTab === "AGENTS" && (userProfile?.role === "COMPANY_ADMIN" || userProfile?.role === "SUPER_ADMIN") && (
            <AgentsTab setShowAddAgentModal={setShowAddAgentModal} agents={agents} />
          )}
        </main>
      </div>

      {/* MODALE PROGRAMMER UN DÉPART (TRAJET) */}
      {showAddTripModal && (
        <AddTripModal
          setShowAddTripModal={setShowAddTripModal} handleCreateTrip={handleCreateTrip}
          userProfile={userProfile} companies={companies} selectedCompanyId={selectedCompanyId}
          newTripCompanyId={newTripCompanyId} setNewTripCompanyId={setNewTripCompanyId}
          newOrigin={newOrigin} setNewOrigin={setNewOrigin} newDestination={newDestination} setNewDestination={setNewDestination}
          newDate={newDate} setNewDate={setNewDate} newTime={newTime} setNewTime={setNewTime}
          newPrice={newPrice} setNewPrice={setNewPrice} newPlate={newPlate} setNewPlate={setNewPlate}
          creatingTrip={creatingTrip}
        />
      )}

      {/* MODALE CRÉER UN AGENT */}
      {showAddAgentModal && (
        <AddAgentModal
          setShowAddAgentModal={setShowAddAgentModal} handleCreateAgent={handleCreateAgent}
          newAgentName={newAgentName} setNewAgentName={setNewAgentName} newAgentRole={newAgentRole}
          setNewAgentRole={setNewAgentRole} newAgentPhone={newAgentPhone} setNewAgentPhone={setNewAgentPhone}
          newAgentEmail={newAgentEmail} setNewAgentEmail={setNewAgentEmail} creatingAgent={creatingAgent}
        />
      )}
    </div>
  );
}
