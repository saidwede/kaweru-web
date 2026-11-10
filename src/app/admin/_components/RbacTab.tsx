export default function RbacTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Architecture des Rôles & Permissions</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Séparation stricte des accès selon les responsabilités opérationnelles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            role: "SUPER_ADMIN",
            label: "Direction Générale",
            desc: "Vision 360°, conventionnement, gestion des commissions et litiges nationaux.",
            color: "bg-amber-50 text-amber-800 border-amber-200",
          },
          {
            role: "COMPANY_ADMIN",
            label: "Responsable Compagnie",
            desc: "Administration de sa flotte, de ses gares et nomination de son personnel.",
            color: "bg-purple-50 text-purple-800 border-purple-200",
          },
          {
            role: "STATION_MANAGER",
            label: "Chef de Gare",
            desc: "Gestion locale des quais, du manifeste 50 sièges et des correspondances.",
            color: "bg-blue-50 text-blue-800 border-blue-200",
          },
          {
            role: "TICKET_AGENT",
            label: "Guichetier",
            desc: "Encaissement en espèces au comptoir et émission immédiate de reçus.",
            color: "bg-teal-50 text-teal-800 border-teal-200",
          },
          {
            role: "ONBOARD_CONDUCTOR",
            label: "Convoyeur / Chef de Bord",
            desc: "Scan QR code passagers à la montée, validation des descentes et jalons.",
            color: "bg-orange-50 text-orange-800 border-orange-200",
          },
          {
            role: "PASSENGER",
            label: "Voyageur",
            desc: "Achat de billets, gestion de ses trajets, partage de code parrain.",
            color: "bg-slate-100 text-slate-800 border-slate-200",
          },
        ].map((item) => (
          <div
            key={item.role}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5"
          >
            <span className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full border ${item.color}`}>
              {item.label}
            </span>
            <p className="text-xs font-mono font-bold text-slate-400">Rôle technique : {item.role}</p>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
