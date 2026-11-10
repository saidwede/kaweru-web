"use client";

import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import AdminHeader from "./_components/AdminHeader";
import FeedbackBanners from "./_components/FeedbackBanners";
import OverviewTab from "./_components/OverviewTab";
import LiveActivityFeed from "./_components/LiveActivityFeed";
import CompaniesTab from "./_components/CompaniesTab";
import OperationsTab from "./_components/OperationsTab";
import FinancesTab from "./_components/FinancesTab";
import RbacTab from "./_components/RbacTab";
import ReferralTab from "./_components/ReferralTab";
import AddCompanyModal from "./_components/AddCompanyModal";
import { filterActivity, filterTrips } from "./_components/utils";
import type {
  ActivityDateFilter,
  ActivityTypeFilter,
  AdminOverviewData,
  CompanyItem,
  CompanyStatusFilter,
  TabType,
  TimeSlotFilter,
  TripDateFilter,
} from "./_components/types";

export default function MasterSuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Omnibar Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

  // Filtres Activité Réseau en Direct (Tab OVERVIEW)
  const [activityDateFilter, setActivityDateFilter] = useState<ActivityDateFilter>("ALL");
  const [activityCustomDate, setActivityCustomDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activityTimeFilter, setActivityTimeFilter] = useState<TimeSlotFilter>("ALL");
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityTypeFilter>("ALL");
  const [activitySearch, setActivitySearch] = useState("");

  // Filtres Départs & Flotte (Tab OPERATIONS)
  const [tripDateFilter, setTripDateFilter] = useState<TripDateFilter>("ALL");
  const [tripCustomDate, setTripCustomDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripTimeFilter, setTripTimeFilter] = useState<TimeSlotFilter>("ALL");
  const [tripCompanyFilter, setTripCompanyFilter] = useState<string>("ALL");
  const [tripStatusFilter, setTripStatusFilter] = useState<string>("ALL");
  const [tripSearch, setTripSearch] = useState("");

  // Filtres Compagnies (Tab COMPANIES)
  const [companyStatusFilter, setCompanyStatusFilter] = useState<CompanyStatusFilter>("ALL");

  // Formulaire d'ajout de compagnie
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [momoHolder, setMomoHolder] = useState("");
  const [momoOperator, setMomoOperator] = useState("MTN");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Referral Points Config
  const [pointsPerPurchase, setPointsPerPurchase] = useState<number>(100);
  const [savingReferral, setSavingReferral] = useState(false);
  const [referralSaved, setReferralSaved] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resOverview, resCompanies, resReferral] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/companies"),
        fetch("/api/referrals"),
      ]);

      const dataOverview = await resOverview.json();
      const dataCompanies = await resCompanies.json();
      const dataReferral = await resReferral.json();

      if (dataOverview.success) {
        setOverview(dataOverview.data);
      }
      if (dataCompanies.success) {
        setCompanies(dataCompanies.data || []);
      }
      if (dataReferral.success && dataReferral.config) {
        setPointsPerPurchase(dataReferral.config.pointsPerFilleulPurchase ?? 100);
      }
    } catch {
      setError("Impossible de charger les données du réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          code: companyCode,
          settlementMomoNumber: momoNumber,
          settlementMomoHolder: momoHolder,
          settlementMomoOperator: momoOperator,
          adminFullName,
          adminPhone: adminPhone.trim() || undefined,
          adminEmail: adminEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Compagnie conventionnée et compte Responsable activé avec succès.");
        setShowAddModal(false);
        setCompanyName("");
        setCompanyCode("");
        setMomoNumber("");
        setMomoHolder("");
        setAdminFullName("");
        setAdminPhone("");
        setAdminEmail("");
        loadData();
      } else {
        setError(data.error || "Échec de création de la compagnie.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveReferral = async (e: FormEvent) => {
    e.preventDefault();
    setSavingReferral(true);
    setReferralSaved(false);
    try {
      const res = await fetch("/api/referrals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsPerFilleulPurchase: pointsPerPurchase }),
      });
      const data = await res.json();
      if (data.success) {
        setReferralSaved(true);
        setTimeout(() => setReferralSaved(false), 3000);
      }
    } finally {
      setSavingReferral(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (companyStatusFilter === "ACTIVE" && !c.isActive) return false;
      if (companyStatusFilter === "INACTIVE" && c.isActive) return false;

      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.adminUser?.fullName?.toLowerCase().includes(q) ||
        (c.adminUser?.phone && c.adminUser.phone.includes(q))
      );
    });
  }, [companies, searchQuery, companyStatusFilter]);

  const filteredTrips = useMemo(() => {
    if (!overview?.trips) return [];
    return filterTrips(overview.trips, {
      tripDateFilter,
      tripCustomDate,
      tripTimeFilter,
      tripCompanyFilter,
      tripStatusFilter,
      tripSearch,
    });
  }, [
    overview?.trips,
    tripDateFilter,
    tripCustomDate,
    tripTimeFilter,
    tripCompanyFilter,
    tripStatusFilter,
    tripSearch,
  ]);

  const filteredActivity = useMemo(() => {
    if (!overview?.recentActivity) return [];
    return filterActivity(overview.recentActivity, {
      activityDateFilter,
      activityCustomDate,
      activityTimeFilter,
      activityTypeFilter,
      activitySearch,
    });
  }, [
    overview?.recentActivity,
    activityDateFilter,
    activityCustomDate,
    activityTimeFilter,
    activityTypeFilter,
    activitySearch,
  ]);

  const maxVolume = useMemo(() => {
    if (!overview?.trendData?.length) return 100000;
    return Math.max(...overview.trendData.map((d) => d.volumeFcfa), 50000);
  }, [overview]);


  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex font-sans antialiased selection:bg-[#FF6500]/20 selection:text-[#FF6500]">
      {/* 1. SIDEBAR DE NAVIGATION PROFESSIONNELLE (Image 1 Style) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companies={companies}
        handleLogout={handleLogout}
      />

      {/* 2. CONTENU PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header avec Omnibar de recherche et contrôles (Image 1 Style) + Navigation Tabs Mobile */}
        <AdminHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showAlertsDrawer={showAlertsDrawer}
          setShowAlertsDrawer={setShowAlertsDrawer}
          overview={overview}
          setShowAddModal={setShowAddModal}
          loadData={loadData}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* FEEDBACK MESSAGES */}
        <FeedbackBanners
          error={error}
          setError={setError}
          successMessage={successMessage}
          setSuccessMessage={setSuccessMessage}
        />

        {/* MAIN BODY PER TAB */}
        <main className="p-4 sm:p-8 space-y-7 flex-1">
          {/* TAB 1 : VUE D'ENSEMBLE (EXACTEMENT COMME LA RÉFÉRENCE IMAGE 1) */}
          {activeTab === "OVERVIEW" && (
            <>
              <OverviewTab
                overview={overview}
                companies={companies}
                maxVolume={maxVolume}
                setActiveTab={setActiveTab}
              />

              {/* FLUX D'ACTIVITÉ EN DIRECT (RÉSERVATIONS & EMBARQUEMENTS EN TEMPS RÉEL) */}
              <LiveActivityFeed
                filteredActivity={filteredActivity}
                activityDateFilter={activityDateFilter}
                setActivityDateFilter={setActivityDateFilter}
                activityCustomDate={activityCustomDate}
                setActivityCustomDate={setActivityCustomDate}
                activityTimeFilter={activityTimeFilter}
                setActivityTimeFilter={setActivityTimeFilter}
                activityTypeFilter={activityTypeFilter}
                setActivityTypeFilter={setActivityTypeFilter}
                activitySearch={activitySearch}
                setActivitySearch={setActivitySearch}
              />
            </>
          )}

          {/* TAB 2 : GESTION DES COMPAGNIES PARTENAIRES */}
          {activeTab === "COMPANIES" && (
            <CompaniesTab
              companies={companies}
              filteredCompanies={filteredCompanies}
              companyStatusFilter={companyStatusFilter}
              setCompanyStatusFilter={setCompanyStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setShowAddModal={setShowAddModal}
            />
          )}

          {/* TAB 3 : DÉPARTS & LIGNES INTERURBAINES */}
          {activeTab === "OPERATIONS" && (
            <OperationsTab
              overview={overview}
              filteredTrips={filteredTrips}
              tripDateFilter={tripDateFilter}
              setTripDateFilter={setTripDateFilter}
              tripCustomDate={tripCustomDate}
              setTripCustomDate={setTripCustomDate}
              tripTimeFilter={tripTimeFilter}
              setTripTimeFilter={setTripTimeFilter}
              tripCompanyFilter={tripCompanyFilter}
              setTripCompanyFilter={setTripCompanyFilter}
              tripStatusFilter={tripStatusFilter}
              setTripStatusFilter={setTripStatusFilter}
              tripSearch={tripSearch}
              setTripSearch={setTripSearch}
            />
          )}

          {/* TAB 4 : REVERSEMENTS MOBILE MONEY & FINANCES */}
          {activeTab === "FINANCES" && <FinancesTab overview={overview} />}

          {/* TAB 5 : GOUVERNANCE & RBAC */}
          {activeTab === "RBAC" && <RbacTab />}

          {/* TAB 6 : MOTEUR DE PARRAINAGE */}
          {activeTab === "REFERRAL" && (
            <ReferralTab
              pointsPerPurchase={pointsPerPurchase}
              setPointsPerPurchase={setPointsPerPurchase}
              savingReferral={savingReferral}
              referralSaved={referralSaved}
              handleSaveReferral={handleSaveReferral}
            />
          )}
        </main>
      </div>

      {/* MODAL DE CONVENTIONNEMENT DE COMPAGNIE (Tactile Soft-UI Style) */}
      {showAddModal && (
        <AddCompanyModal
          setShowAddModal={setShowAddModal}
          handleCreateCompany={handleCreateCompany}
          creating={creating}
          companyName={companyName}
          setCompanyName={setCompanyName}
          companyCode={companyCode}
          setCompanyCode={setCompanyCode}
          momoOperator={momoOperator}
          setMomoOperator={setMomoOperator}
          momoNumber={momoNumber}
          setMomoNumber={setMomoNumber}
          momoHolder={momoHolder}
          setMomoHolder={setMomoHolder}
          adminFullName={adminFullName}
          setAdminFullName={setAdminFullName}
          adminPhone={adminPhone}
          setAdminPhone={setAdminPhone}
          adminEmail={adminEmail}
          setAdminEmail={setAdminEmail}
        />
      )}
    </div>
  );
}
