import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Clause } from "../_components/LegalPage";
import { getLegalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Supprimer mon compte — Kaweru",
  description: "Comment supprimer votre compte Kaweru et quelles données sont effacées ou conservées.",
};

/** Page publique demandée par Google Play (« URL de suppression du compte »). */
export default async function SuppressionComptePage() {
  const { entity: E, updatedLabel } = await getLegalConfig();
  return (
    <LegalPage
      title="Supprimer mon compte Kaweru"
      updatedLabel={updatedLabel}
      currentHref="/suppression-compte"
      essentials={[
        "Dans l'application ou sur le site : Profil > Supprimer mon compte.",
        "Vos coordonnées et vos points sont effacés immédiatement et définitivement.",
        "Les billets passés sont gardés sans vos coordonnées, 10 ans, pour la comptabilité.",
        "Si un voyage est à venir, la suppression sera possible juste après.",
      ]}
    >
      <Clause n={1} title="Depuis l'application ou le site">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Connectez-vous à votre compte Kaweru.</li>
          <li>Ouvrez votre profil.</li>
          <li>Touchez « Supprimer mon compte », tapez SUPPRIMER et confirmez.</li>
        </ol>
        <p>
          Pour votre sécurité, la suppression doit être faite dans les 10 minutes qui suivent une connexion.{" "}
          <Link href="/login?redirect=/profile" className="font-bold text-[#FF6500] hover:underline">
            Se connecter et aller au profil
          </Link>
        </p>
      </Clause>

      <Clause n={2} title="Sans accès à votre compte">
        <p>
          Écrivez à <strong>{E.email}</strong> depuis l&apos;adresse e-mail ou en indiquant le numéro rattaché au compte. Nous
          vérifions votre identité puis supprimons le compte dans un délai de 30 jours.
        </p>
      </Clause>

      <Clause n={3} title="Ce qui est effacé, ce qui est conservé">
        <ul className="list-disc pl-5 space-y-1">
          <li>Effacé : nom, prénom, numéro de téléphone, e-mail, ville, points et code de parrainage, compte de connexion.</li>
          <li>
            Conservé sans vos coordonnées : les billets passés (trajet, date, montant, code de réservation), pendant 10 ans,
            durée légale de conservation des pièces comptables.
          </li>
        </ul>
        <p>
          Les comptes du personnel des compagnies (guichet, chef de gare, convoyeur) sont retirés par le responsable de la
          compagnie ou par Kaweru.
        </p>
      </Clause>
    </LegalPage>
  );
}
