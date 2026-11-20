import type { Metadata } from "next";
import LegalPage, { Clause, Fill } from "../_components/LegalPage";
import { fcfa, getLegalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Kaweru",
  description: "Conditions d'achat, de paiement et de report des billets de bus vendus sur Kaweru.",
};

export default async function CgvPage() {
  const { entity: E, rules: R, updatedLabel } = await getLegalConfig();

  const freeReschedule = R.rescheduleFeeFcfa === 0;
  const companyCancellation = {
    CHOICE: "vous choisissez entre un report sans frais sur un autre départ et le remboursement intégral du montant payé, frais de service compris",
    RESCHEDULE_ONLY: "votre billet est reporté sans frais sur un autre départ de votre choix de la même compagnie",
    REFUND_ONLY: "le montant payé vous est intégralement remboursé, frais de service compris",
  }[R.companyCancellationPolicy];
  const companyCancellationShort = {
    CHOICE: "vous choisissez entre un report gratuit et un remboursement intégral",
    RESCHEDULE_ONLY: "votre billet est reporté gratuitement",
    REFUND_ONLY: "vous êtes intégralement remboursé",
  }[R.companyCancellationPolicy];

  return (
    <LegalPage
      title="Conditions générales de vente"
      updatedLabel={updatedLabel}
      currentHref="/cgv"
      essentials={[
        "Le prix total (frais de service compris) est affiché avant le paiement ; il n'y a aucun frais caché.",
        "Vos places sont bloquées 7 minutes pendant le paiement. Sans paiement, elles sont remises en vente.",
        "La vente en ligne s'arrête 2 heures avant le départ.",
        `Un billet n'est pas remboursable, mais il est reportable sur un autre départ de la même compagnie (${
          freeReschedule ? "gratuitement" : fcfa(R.rescheduleFeeFcfa)
        } ; ${fcfa(R.lateRescheduleFeeFcfa)} à moins de 2 h du départ ou après un départ manqué, sous ${R.missedRescheduleWindowHours} h).`,
        `Si la compagnie annule votre départ, ${companyCancellationShort}.`,
      ]}
    >
      <Clause n={1} title="Champ d'application">
        <p>
          Ces conditions s&apos;appliquent à tout achat de billet de transport en bus effectué sur le site ou l&apos;application
          Kaweru, édités par <Fill value={E.companyName} label="raison sociale" />. Elles complètent les Conditions générales
          d&apos;utilisation. Le fait de payer un billet vaut acceptation de ces conditions, dans leur version en vigueur au
          moment de l&apos;achat.
        </p>
        <p>
          Kaweru vend les billets au nom et pour le compte des compagnies de transport partenaires. Le transport est
          exécuté par la compagnie indiquée sur le billet, selon son propre règlement (bagages, objets interdits, animaux,
          comportement à bord), qui vous est opposable.
        </p>
      </Clause>

      <Clause n={2} title="Prix">
        <p>
          Les prix sont indiqués en francs CFA (FCFA). Le montant total à payer, frais de service Kaweru et éventuelle
          réduction compris, est affiché avant la validation du paiement. Le prix applicable est celui affiché au moment de
          la réservation. Les prix sont fixés par les compagnies et peuvent varier d&apos;un départ à l&apos;autre.
        </p>
        <p>
          Un code promotionnel ne peut être utilisé que dans ses conditions de validité (dates, nombre d&apos;utilisations).
          Il n&apos;est ni cumulable, sauf mention contraire, ni échangeable contre de l&apos;argent.
        </p>
      </Clause>

      <Clause n={3} title="Réservation et paiement">
        <p>
          Lorsque vous lancez le paiement, vos places sont réservées à votre nom pendant <strong>7 minutes</strong>. Si le
          paiement n&apos;est pas confirmé dans ce délai, la réservation expire et les places sont remises en vente.
        </p>
        <p>
          Le paiement s&apos;effectue par Mobile Money ou par tout autre moyen proposé à l&apos;écran, via un prestataire de
          paiement agréé. Kaweru n&apos;a jamais accès à votre code secret Mobile Money ni aux données complètes de votre
          carte.
        </p>
        <p>
          Si votre paiement est confirmé après l&apos;expiration de la réservation, nous émettons votre billet si des places
          sont encore disponibles ; sinon, la somme vous est intégralement remboursée.
        </p>
        <p>
          Sans compte, une réservation est limitée à 5 places. Au-delà (réservations de groupe), la connexion à un compte est
          nécessaire.
        </p>
      </Clause>

      <Clause n={4} title="Fin des ventes">
        <p>
          La vente en ligne d&apos;un départ s&apos;arrête <strong>2 heures avant l&apos;heure de départ</strong>, ou plus tôt si
          les places confiées à Kaweru sont épuisées. Des places peuvent rester disponibles au guichet de la compagnie.
        </p>
      </Clause>

      <Clause n={5} title="Le billet">
        <p>
          Après confirmation du paiement, vous recevez un billet comportant un QR code et un code de réservation au format
          KWR-XXXXXX, consultable dans votre compte et, si vous avez indiqué une adresse e-mail, envoyé par e-mail. Le
          billet est nominatif et valable uniquement pour le trajet, la date et l&apos;heure indiqués.
        </p>
        <p>
          Présentez votre billet (sur téléphone ou imprimé) à l&apos;embarquement.
          {R.recommendedArrivalMinutes > 0 && (
            <>
              {" "}
              Nous vous recommandons d&apos;arriver à la gare au moins {R.recommendedArrivalMinutes} minutes avant le départ.
            </>
          )}{" "}
          La compagnie peut vous demander une pièce d&apos;identité. Un billet déjà scanné à l&apos;embarquement ne peut pas
          être réutilisé.
        </p>
        <p>
          Le numéro de siège éventuellement indiqué est donné à titre indicatif ; le placement à bord relève de la compagnie.
          Le bus (numéro de plaque) est affecté par la compagnie le jour du départ.
        </p>
      </Clause>

      <Clause n={6} title="Report de votre billet">
        <p>Vous pouvez reporter votre billet sur un autre départ, aux conditions suivantes :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>même compagnie et même trajet (ville de départ et d&apos;arrivée) ;</li>
          <li>le nouveau départ doit avoir des places disponibles et être encore en vente ;</li>
          <li>son prix ne doit pas dépasser celui payé ; si le nouveau prix est inférieur, la différence n&apos;est pas remboursée ;</li>
          <li>
            plus de 2 heures avant votre départ initial :{" "}
            <strong>{freeReschedule ? "report gratuit" : `frais de ${fcfa(R.rescheduleFeeFcfa)}`}</strong> ;
          </li>
          <li>
            moins de 2 heures avant le départ, ou départ manqué : <strong>{fcfa(R.lateRescheduleFeeFcfa)}</strong>, jusqu&apos;à{" "}
            <strong>{R.missedRescheduleWindowHours} heures</strong> après l&apos;heure du départ initial. Passé ce délai, le
            billet est perdu.
          </li>
        </ul>
        <p>Un billet déjà utilisé à l&apos;embarquement ne peut pas être reporté.</p>
      </Clause>

      <Clause n={7} title="Annulation et remboursement">
        <p>
          <strong>Annulation de votre part :</strong> le billet portant sur une prestation de transport à une date et une
          heure déterminées, il n&apos;est ni annulable ni remboursable et n&apos;ouvre pas de droit de rétractation. La
          possibilité de report (article 6) vous permet de changer de date.
        </p>
        <p>
          <strong>Annulation par la compagnie :</strong> si votre départ est annulé par la compagnie, vous êtes prévenu par
          SMS, e-mail ou téléphone et {companyCancellation}.
        </p>
        {R.companyCancellationPolicy !== "RESCHEDULE_ONLY" && (
          <p>
            Les remboursements sont effectués sur le moyen de paiement utilisé (ou, à défaut, par Mobile Money au numéro du
            billet) dans un délai maximum de {R.refundDelayDays} jours.
          </p>
        )}
        <p>
          <strong>Retard :</strong> un retard du bus n&apos;ouvre pas droit à remboursement de la part de Kaweru ; toute
          réclamation relative à l&apos;exécution du transport est transmise à la compagnie.
        </p>
      </Clause>

      <Clause n={8} title="Bagages et objets">
        <p>
          La franchise de bagages, les éventuels frais de bagages supplémentaires, les objets interdits et la responsabilité
          en cas de perte ou de dommage relèvent de la compagnie de transport et de son règlement.
        </p>
      </Clause>

      <Clause n={9} title="Réclamations">
        <p>
          Pour toute réclamation, contactez le service client à {E.email} ou au {E.phone} en indiquant votre code de
          réservation (KWR-XXXXXX), de préférence dans les {R.claimDelayDays} jours suivant la date du voyage. Nous vous
          répondons dans les meilleurs délais et transmettons à la compagnie ce qui la concerne.
        </p>
      </Clause>

      <Clause n={10} title="Droit applicable">
        <p>
          Ces conditions sont soumises au droit de la République du Bénin. Les litiges sont traités selon l&apos;article 12
          des Conditions générales d&apos;utilisation (règlement amiable d&apos;abord, puis juridictions de Cotonou).
        </p>
      </Clause>
    </LegalPage>
  );
}
