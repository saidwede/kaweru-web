import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Clause, Fill } from "../_components/LegalPage";
import { getLegalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Kaweru",
  description: "Règles d'utilisation de la plateforme Kaweru (site web et application mobile).",
};

export default async function CguPage() {
  const { entity: E, updatedLabel } = await getLegalConfig();
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      updatedLabel={updatedLabel}
      currentHref="/cgu"
      essentials={[
        "Kaweru vous permet de chercher un trajet en bus et d'acheter un billet auprès des compagnies partenaires.",
        "Kaweru vend les billets ; le transport lui-même est assuré par la compagnie indiquée sur votre billet.",
        "Votre compte est personnel : ne partagez jamais les codes reçus par SMS ou par e-mail.",
        "L'achat d'un billet est régi par nos Conditions générales de vente.",
      ]}
    >
      <Clause n={1} title="Objet">
        <p>
          Les présentes conditions encadrent l&apos;utilisation du site web et de l&apos;application mobile Kaweru
          (ensemble, la « Plateforme »), éditées par <Fill value={E.companyName} label="raison sociale" /> (« Kaweru »,
          « nous »). Elles s&apos;appliquent à tout visiteur et à tout titulaire d&apos;un compte.
        </p>
        <p>
          En créant un compte ou en utilisant la Plateforme, vous acceptez ces conditions. Si vous ne les acceptez pas,
          n&apos;utilisez pas la Plateforme.
        </p>
      </Clause>

      <Clause n={2} title="Le service Kaweru">
        <p>La Plateforme permet notamment :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>de consulter les départs proposés par les compagnies de transport partenaires ;</li>
          <li>d&apos;acheter des billets et de les présenter à l&apos;embarquement (QR code ou code KWR) ;</li>
          <li>de reporter un billet dans les conditions prévues par les Conditions générales de vente ;</li>
          <li>aux compagnies partenaires, de gérer leurs départs, leurs ventes et l&apos;embarquement.</li>
        </ul>
        <p>
          Kaweru agit comme <strong>intermédiaire de vente</strong> pour le compte des compagnies. Le contrat de transport
          est conclu entre vous et la compagnie indiquée sur le billet, qui reste seule responsable de l&apos;exécution du
          trajet (véhicule, conduite, horaires, bagages, sécurité à bord).
        </p>
      </Clause>

      <Clause n={3} title="Compte utilisateur">
        <p>
          Vous pouvez acheter un billet sans compte, dans la limite de 5 places par réservation. Un compte permet de
          retrouver vos billets, de les reporter et de participer au programme de parrainage.
        </p>
        <p>
          La connexion se fait par un code à usage unique envoyé par SMS ou par e-mail, ou avec un compte Google. Vous
          devez fournir des informations exactes et être majeur, ou utiliser la Plateforme avec l&apos;accord d&apos;un
          représentant légal.
        </p>
        <p>
          Votre compte est strictement personnel. Kaweru ne vous demandera jamais votre code de connexion par téléphone,
          SMS ou message. Toute action effectuée depuis votre compte est réputée faite par vous ; prévenez-nous sans délai
          à {E.email} si vous pensez qu&apos;un tiers y a accès.
        </p>
      </Clause>

      <Clause n={4} title="Comptes des compagnies et de leur personnel">
        <p>
          Les comptes professionnels (responsables de compagnie, chefs de gare, guichetiers, convoyeurs) sont créés par
          Kaweru ou par le responsable de la compagnie. La compagnie s&apos;engage à n&apos;y donner accès qu&apos;à son
          personnel, à retirer l&apos;accès des personnes qui la quittent et à n&apos;utiliser les données des voyageurs que
          pour l&apos;exécution du transport (contrôle des billets, liste d&apos;embarquement, sécurité).
        </p>
      </Clause>

      <Clause n={5} title="Règles d'utilisation">
        <p>Il est interdit :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>de réserver des places sans intention de payer, ou avec des informations inventées, pour bloquer des sièges ;</li>
          <li>de revendre des billets Kaweru, de les dupliquer ou de falsifier un QR code ;</li>
          <li>d&apos;utiliser le compte, le numéro de téléphone ou l&apos;adresse e-mail d&apos;une autre personne ;</li>
          <li>de tenter d&apos;accéder aux données d&apos;autres utilisateurs ou de perturber le fonctionnement de la Plateforme ;</li>
          <li>d&apos;utiliser des robots ou des scripts pour interroger ou réserver en masse.</li>
        </ul>
        <p>
          En cas de manquement, Kaweru peut suspendre ou fermer le compte concerné et annuler les réservations frauduleuses,
          sans préjudice d&apos;éventuelles poursuites.
        </p>
      </Clause>

      <Clause n={6} title="Programme de parrainage">
        <p>
          Lorsqu&apos;une personne que vous avez parrainée achète un billet payé, des points peuvent être crédités sur votre
          compte selon le barème affiché dans votre profil. Les points n&apos;ont pas de valeur monétaire, ne sont ni
          échangeables contre de l&apos;argent ni cessibles. Kaweru peut modifier ou arrêter le programme à tout moment ;
          les points obtenus par fraude (faux comptes, auto-parrainage) sont annulés.
        </p>
      </Clause>

      <Clause n={7} title="Disponibilité et responsabilité">
        <p>
          Kaweru fait ses meilleurs efforts pour que la Plateforme soit accessible en permanence, mais ne peut le garantir :
          maintenance, panne du réseau mobile, du fournisseur de paiement ou d&apos;un prestataire technique peuvent
          l&apos;interrompre.
        </p>
        <p>
          Les horaires, prix et places affichés sont fournis par les compagnies. Kaweru n&apos;est pas responsable des
          retards, annulations, accidents, pertes de bagages ou incidents survenus pendant le transport, qui relèvent de la
          compagnie. La responsabilité de Kaweru est limitée aux dommages directs résultant d&apos;un manquement prouvé à ses
          propres obligations, dans la limite du prix du billet concerné.
        </p>
      </Clause>

      <Clause n={8} title="Propriété intellectuelle">
        <p>
          La marque Kaweru, le logo, les textes, le code et le design de la Plateforme appartiennent à Kaweru ou à ses
          partenaires. Toute reproduction sans autorisation écrite est interdite. Les noms et logos des compagnies
          appartiennent à celles-ci.
        </p>
      </Clause>

      <Clause n={9} title="Données personnelles">
        <p>
          Le traitement de vos données est décrit dans notre{" "}
          <Link href="/confidentialite" className="font-bold text-[#FF6500] hover:underline">
            Politique de confidentialité
          </Link>
          .
        </p>
      </Clause>

      <Clause n={10} title="Fermeture du compte">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis votre profil (Profil &gt; Supprimer mon compte) ou en
          écrivant à {E.email}. Si un voyage est à venir, la suppression est possible juste après ce voyage. Les billets
          passés sont conservés sans vos coordonnées le temps imposé par la loi (voir la Politique de confidentialité).
        </p>
      </Clause>

      <Clause n={11} title="Modification des conditions">
        <p>
          Kaweru peut modifier ces conditions, notamment pour suivre l&apos;évolution du service ou de la loi. En cas de
          changement important, vous serez invité à accepter la nouvelle version lors de votre prochaine connexion. Les
          achats déjà effectués restent régis par la version en vigueur au moment de l&apos;achat.
        </p>
      </Clause>

      <Clause n={12} title="Droit applicable et litiges">
        <p>
          Ces conditions sont soumises au droit de la République du Bénin. En cas de désaccord, contactez d&apos;abord notre
          service client ({E.email}) : nous cherchons toujours une solution amiable. À défaut d&apos;accord dans un délai de
          30 jours, le litige peut être porté devant les juridictions compétentes de Cotonou, sans préjudice des droits que
          vous tenez de la législation sur la protection des consommateurs.
        </p>
      </Clause>
    </LegalPage>
  );
}
