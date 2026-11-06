import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Janga Explorer n'utilise que les cookies indispensables à la connexion : ni publicité, ni pistage.",
};

const STORAGE = [
  {
    name: "sb-…-auth-token",
    kind: "Cookie",
    purpose: "Garder un professionnel connecté à son compte et sécuriser ses actions.",
    when: "Uniquement si vous vous connectez",
    duration: "Durée de la session ; supprimé à la déconnexion",
  },
  {
    name: "janga:favoris",
    kind: "Stockage local du navigateur",
    purpose: "Retenir les offres que vous avez ajoutées à vos favoris.",
    when: "Quand vous ajoutez un favori",
    duration: "Jusqu'à ce que vous le retiriez ou effaciez les données du navigateur",
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies"
      current="/cookies"
      intro={
        <p>
          <strong>En bref :</strong> Janga Explorer n&apos;utilise aucun cookie de publicité, de mesure d&apos;audience ni
          de réseau social. Les seuls éléments enregistrés sur votre appareil servent à faire fonctionner le site.
          C&apos;est pourquoi nous ne vous demandons pas votre consentement par une bannière.
        </p>
      }
    >
      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier déposé par un site sur votre appareil. Le « stockage local » fonctionne de façon
        proche : le site y range des informations qui restent dans votre navigateur.
      </p>

      <h2>Ce que nous enregistrons sur votre appareil</h2>
      {/* Tableau sur ordinateur ; sur téléphone, une carte par élément pour éviter le défilement horizontal. */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-ink">
            <tr>
              <th className="p-3 font-bold">Nom</th>
              <th className="p-3 font-bold">Rôle</th>
              <th className="p-3 font-bold">Déposé</th>
              <th className="p-3 font-bold">Durée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {STORAGE.map((s) => (
              <tr key={s.name} className="align-top">
                <td className="p-3">
                  <code className="font-semibold text-ink">{s.name}</code>
                  <span className="block text-xs text-muted">{s.kind}</span>
                </td>
                <td className="p-3">{s.purpose}</td>
                <td className="p-3">{s.when}</td>
                <td className="p-3">{s.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 list-none! space-y-3 pl-0! md:hidden">
        {STORAGE.map((s) => (
          <li key={s.name} className="rounded-2xl border border-line p-4 text-sm">
            <code className="font-semibold text-ink">{s.name}</code>
            <span className="ml-2 text-xs text-muted">{s.kind}</span>
            <p className="mt-2!">{s.purpose}</p>
            <p className="mt-1! text-muted">
              {s.when} · {s.duration}
            </p>
          </li>
        ))}
      </ul>

      <h2>Ce que nous n&apos;utilisons pas</h2>
      <ul>
        <li>aucun outil de mesure d&apos;audience (Google Analytics ou équivalent) ;</li>
        <li>aucune publicité ni aucun cookie publicitaire ;</li>
        <li>aucun bouton de réseau social qui suivrait votre navigation.</li>
      </ul>
      <p>
        Les photos et les polices de caractères sont servies depuis notre propre site : votre navigation ne déclenche
        pas de cookie tiers.
      </p>

      <h2>Les supprimer</h2>
      <p>
        Vous pouvez effacer cookies et stockage local à tout moment dans les réglages de votre navigateur (rubrique «
        Confidentialité » ou « Données de navigation »). Si vous êtes professionnel, vous serez simplement déconnecté ;
        si vous êtes visiteur, vos favoris enregistrés sur l&apos;appareil seront perdus.
      </p>

      <h2>Une question ?</h2>
      <p>
        Écrivez-nous <LegalContact />. Pour savoir comment nous traitons vos données, consultez notre{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
