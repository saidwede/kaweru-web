import type { Metadata } from "next";
import LegalPage, { Clause, Fill } from "../_components/LegalPage";
import { getLegalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Kaweru",
  description: "Quelles données Kaweru collecte, pourquoi, avec qui elles sont partagées et comment exercer vos droits.",
};

const th = "text-left font-black text-slate-900 p-2.5 border-b border-slate-200 align-top";
const td = "p-2.5 border-b border-slate-100 align-top";

export default async function ConfidentialitePage() {
  const { entity: E, updatedLabel } = await getLegalConfig();
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedLabel={updatedLabel}
      currentHref="/confidentialite"
      essentials={[
        "Nous collectons uniquement ce qui sert à vendre votre billet et à vous faire embarquer : nom, téléphone, e-mail facultatif, trajet et paiement.",
        "La compagnie de votre trajet reçoit votre nom et votre numéro pour la liste d'embarquement.",
        "Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité.",
        "Aucun cookie publicitaire ni de mesure d'audience : seul le cookie de connexion est utilisé.",
        `Vous pouvez consulter, corriger ou faire supprimer vos données en écrivant à ${E.email}.`,
      ]}
    >
      <Clause n={1} title="Qui est responsable de vos données ?">
        <p>
          Le responsable du traitement est <Fill value={E.companyName} label="raison sociale" />, dont le siège est situé{" "}
          <Fill value={E.address} label="adresse du siège" />. Pour toute question relative à vos données :{" "}
          <strong>{E.email}</strong>.
        </p>
        <p>
          Cette politique est établie conformément au Code du numérique de la République du Bénin (loi n° 2017-20 du 20 avril
          2018), dont le livre V est consacré à la protection des données à caractère personnel.
        </p>
      </Clause>

      <Clause n={2} title="Quelles données et pourquoi ?">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Données</th>
                <th className={th}>Utilisation</th>
                <th className={th}>Base légale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Numéro de téléphone, e-mail, nom, prénom, ville de résidence</td>
                <td className={td}>Créer et sécuriser votre compte, vous connecter par code à usage unique</td>
                <td className={td}>Exécution du contrat</td>
              </tr>
              <tr>
                <td className={td}>Nom du passager, téléphone, e-mail facultatif, trajet, date, nombre de places, siège</td>
                <td className={td}>Émettre le billet, l&apos;envoyer, établir la liste d&apos;embarquement, gérer les reports</td>
                <td className={td}>Exécution du contrat</td>
              </tr>
              <tr>
                <td className={td}>Montant, référence et statut du paiement</td>
                <td className={td}>Confirmer le paiement, rembourser si nécessaire, tenir la comptabilité</td>
                <td className={td}>Contrat et obligation légale</td>
              </tr>
              <tr>
                <td className={td}>Contrôle du billet à l&apos;embarquement et à la descente</td>
                <td className={td}>Empêcher la réutilisation d&apos;un billet, sécurité des passagers</td>
                <td className={td}>Exécution du contrat, intérêt légitime</td>
              </tr>
              <tr>
                <td className={td}>Code de parrainage, points</td>
                <td className={td}>Gérer le programme de parrainage</td>
                <td className={td}>Exécution du contrat</td>
              </tr>
              <tr>
                <td className={td}>Données techniques (date de connexion, compteurs anti-abus)</td>
                <td className={td}>Prévenir la fraude, les blocages de places et les attaques</td>
                <td className={td}>Intérêt légitime</td>
              </tr>
              <tr>
                <td className={td}>Version des conditions acceptée et date</td>
                <td className={td}>Prouver votre acceptation des conditions</td>
                <td className={td}>Obligation légale, intérêt légitime</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Nous ne collectons ni données de localisation, ni contacts de votre téléphone, ni données sensibles (santé,
          religion, opinions). Nous ne prenons aucune décision automatisée produisant des effets juridiques à votre égard.
        </p>
      </Clause>

      <Clause n={3} title="Qui reçoit vos données ?">
        <p>
          <strong>La compagnie de transport</strong> de votre trajet reçoit le nom, le numéro de téléphone, le nombre de
          places et le statut d&apos;embarquement de chaque passager, uniquement pour exécuter le transport. Elle ne peut pas
          s&apos;en servir pour de la prospection commerciale via Kaweru.
        </p>
        <p>
          <strong>Nos prestataires techniques</strong>, qui agissent sur nos instructions et ne peuvent pas utiliser vos
          données pour leur propre compte :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>hébergement, base de données, authentification et envoi des SMS de connexion : Google Cloud / Firebase (serveurs situés dans l&apos;Union européenne) ;</li>
          <li>paiement Mobile Money et carte : FedaPay ;</li>
          <li>envoi des e-mails (codes de connexion, billets) : prestataire d&apos;e-mails transactionnels (Resend) ;</li>
          <li>connexion avec un compte Google, si vous choisissez cette option : Google.</li>
        </ul>
        <p>
          Nous communiquons des données aux autorités uniquement lorsque la loi l&apos;exige. Nous ne vendons ni ne louons
          vos données, et ne les utilisons pas à des fins publicitaires.
        </p>
      </Clause>

      <Clause n={4} title="Transferts hors du Bénin">
        <p>
          Certains de nos prestataires hébergent des données en dehors du Bénin (Union européenne et, pour l&apos;envoi
          d&apos;e-mails, États-Unis). Ces transferts sont encadrés par des engagements contractuels de protection et
          effectués dans le respect des conditions prévues par le Code du numérique et des formalités auprès de
          l&apos;Autorité de Protection des Données à caractère Personnel (APDP).
        </p>
      </Clause>

      <Clause n={5} title="Combien de temps ?">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Compte : tant qu&apos;il est actif. Vous pouvez le supprimer vous-même depuis votre profil (effacement immédiat) ou
            nous le demander par e-mail (sous 30 jours).
          </li>
          <li>Billets et paiements : 10 ans, durée de conservation des pièces comptables.</li>
          <li>Codes de connexion : 10 minutes au maximum ; ils sont stockés sous forme chiffrée irréversible.</li>
          <li>Compteurs anti-abus : quelques minutes à quelques heures.</li>
        </ul>
      </Clause>

      <Clause n={6} title="Sécurité">
        <p>
          Les échanges sont chiffrés (HTTPS). L&apos;accès aux données est limité aux personnes qui en ont besoin : un agent
          de compagnie ne voit que les passagers de sa compagnie. Les codes de connexion sont stockés sous forme
          d&apos;empreinte, les QR codes des billets sont signés pour empêcher leur falsification, et nous n&apos;avons jamais
          accès à votre code Mobile Money.
        </p>
      </Clause>

      <Clause n={7} title="Cookies">
        <p>
          Le site utilise un seul cookie, strictement nécessaire : le cookie de session qui vous garde connecté (7 jours au
          maximum). Lors d&apos;une connexion par SMS, un contrôle anti-robot (reCAPTCHA de Google) peut s&apos;afficher. Nous
          n&apos;utilisons aucun cookie publicitaire ni outil de mesure d&apos;audience.
        </p>
      </Clause>

      <Clause n={8} title="Vos droits">
        <p>
          Vous pouvez demander l&apos;accès à vos données, leur rectification, leur suppression, ou vous opposer à un
          traitement fondé sur notre intérêt légitime. Écrivez à <strong>{E.email}</strong> depuis l&apos;adresse ou le
          numéro rattaché à votre compte ; nous pouvons vous demander de confirmer votre identité. Nous répondons dans un
          délai d&apos;un mois.
        </p>
        <p>
          Les données liées aux billets payés peuvent être conservées malgré une demande de suppression lorsque la loi
          l&apos;impose (comptabilité). Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir
          l&apos;APDP (apdp.bj).
        </p>
      </Clause>

      <Clause n={9} title="Mineurs">
        <p>
          La Plateforme s&apos;adresse aux personnes majeures. Un mineur peut voyager avec un billet acheté par un adulte,
          qui renseigne alors le nom du passager.
        </p>
      </Clause>

      <Clause n={10} title="Modifications">
        <p>
          Nous pouvons mettre à jour cette politique. En cas de changement important, vous en serez informé et invité à
          accepter la nouvelle version lors de votre prochaine connexion.
        </p>
      </Clause>
    </LegalPage>
  );
}
