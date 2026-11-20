import type { Metadata } from "next";
import LegalPage, { Clause, Fill } from "../_components/LegalPage";
import { getLegalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales — Kaweru",
  description: "Éditeur, hébergeur et contact de la plateforme Kaweru.",
};

export default async function MentionsLegalesPage() {
  const { entity: E, updatedLabel } = await getLegalConfig();
  return (
    <LegalPage
      title="Mentions légales"
      updatedLabel={updatedLabel}
      currentHref="/mentions-legales"
      essentials={[`Kaweru est une plateforme de billetterie de bus au Bénin. Contact : ${E.email}.`]}
    >
      <Clause n={1} title="Éditeur">
        <ul className="space-y-1">
          <li>
            Raison sociale : <Fill value={E.companyName} label="raison sociale" />
          </li>
          <li>
            Forme juridique et capital : <Fill value={E.legalForm} label="forme et capital" />
          </li>
          <li>
            RCCM : <Fill value={E.rccm} label="numéro RCCM" />
          </li>
          <li>
            IFU : <Fill value={E.ifu} label="numéro IFU" />
          </li>
          <li>
            Siège : <Fill value={E.address} label="adresse du siège" />
          </li>
          <li>
            Directeur de la publication : <Fill value={E.publicationDirector} label="nom" />
          </li>
          <li>
            Contact : {E.email} — {E.phone}
          </li>
        </ul>
      </Clause>

      <Clause n={2} title="Hébergement">
        <p>
          Le site et l&apos;application sont hébergés par Google Cloud (Firebase), Google Ireland Limited, Gordon House,
          Barrow Street, Dublin 4, Irlande.
        </p>
      </Clause>

      <Clause n={3} title="Propriété intellectuelle">
        <p>
          Les contenus de la plateforme (marque, logo, textes, design, code) sont protégés. Toute reproduction sans
          autorisation est interdite. Voir les Conditions générales d&apos;utilisation.
        </p>
      </Clause>
    </LegalPage>
  );
}
