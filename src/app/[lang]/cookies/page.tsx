import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

type Storage = { name: string; kind: string; purpose: string; when: string; duration: string };

const T = messages<{
  title: string;
  description: string;
  storage: Storage[];
  headers: { name: string; purpose: string; when: string; duration: string };
}>({
  fr: {
    title: "Cookies",
    description: "Janga Explorer n'utilise que les cookies indispensables au site : ni publicité, ni pistage.",
    storage: [
      {
        name: "lang",
        kind: "Cookie",
        purpose: "Retenir la langue choisie (français ou anglais).",
        when: "Dès la première visite",
        duration: "1 an",
      },
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
      {
        name: "vue:…",
        kind: "Stockage de session du navigateur",
        purpose: "Ne compter qu'une fois votre visite d'une offre dans ses statistiques anonymes.",
        when: "Quand vous ouvrez une offre",
        duration: "Jusqu'à la fermeture de l'onglet",
      },
    ],
    headers: { name: "Nom", purpose: "Rôle", when: "Déposé", duration: "Durée" },
  },
  en: {
    title: "Cookies",
    description: "Janga Explorer only uses cookies the site needs to work: no advertising, no tracking.",
    storage: [
      {
        name: "lang",
        kind: "Cookie",
        purpose: "Remember the language you chose (French or English).",
        when: "From your first visit",
        duration: "1 year",
      },
      {
        name: "sb-…-auth-token",
        kind: "Cookie",
        purpose: "Keep a business signed in to its account and secure its actions.",
        when: "Only if you sign in",
        duration: "Length of the session; deleted when you sign out",
      },
      {
        name: "janga:favoris",
        kind: "Browser local storage",
        purpose: "Remember the deals you saved.",
        when: "When you save a deal",
        duration: "Until you remove it or clear your browser data",
      },
      {
        name: "vue:…",
        kind: "Browser session storage",
        purpose: "Count your visit to a deal only once in its anonymous statistics.",
        when: "When you open a deal",
        duration: "Until you close the tab",
      },
    ],
    headers: { name: "Name", purpose: "Purpose", when: "Set", duration: "Duration" },
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLocale()];
  return { title: t.title, description: t.description };
}

export default async function CookiesPage() {
  const locale = await getLocale();
  const t = T[locale];
  const en = locale === "en";

  return (
    <LegalPage
      title={t.title}
      current="/cookies"
      intro={
        en ? (
          <p>
            <strong>In short:</strong> Janga Explorer uses no advertising, audience measurement or social network
            cookies. The only things stored on your device are there to make the site work. That&apos;s why we
            don&apos;t ask for your consent with a banner.
          </p>
        ) : (
          <p>
            <strong>En bref :</strong> Janga Explorer n&apos;utilise aucun cookie de publicité, de mesure d&apos;audience
            ni de réseau social. Les seuls éléments enregistrés sur votre appareil servent à faire fonctionner le site.
            C&apos;est pourquoi nous ne vous demandons pas votre consentement par une bannière.
          </p>
        )
      }
    >
      {en ? (
        <>
          <h2>What is a cookie?</h2>
          <p>
            A cookie is a small file a website stores on your device. &quot;Local storage&quot; and &quot;session
            storage&quot; work in a similar way: the site keeps information that stays in your browser.
          </p>
          <h2>What we store on your device</h2>
        </>
      ) : (
        <>
          <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p>
            Un cookie est un petit fichier déposé par un site sur votre appareil. Le « stockage local » et le «
            stockage de session » fonctionnent de façon proche : le site y range des informations qui restent dans
            votre navigateur.
          </p>
          <h2>Ce que nous enregistrons sur votre appareil</h2>
        </>
      )}

      {/* Tableau sur ordinateur ; sur téléphone, une carte par élément pour éviter le défilement horizontal. */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-ink">
            <tr>
              <th className="p-3 font-bold">{t.headers.name}</th>
              <th className="p-3 font-bold">{t.headers.purpose}</th>
              <th className="p-3 font-bold">{t.headers.when}</th>
              <th className="p-3 font-bold">{t.headers.duration}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {t.storage.map((s) => (
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
        {t.storage.map((s) => (
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

      {en ? (
        <>
          <h2>What we don&apos;t use</h2>
          <ul>
            <li>no audience measurement tool (Google Analytics or similar);</li>
            <li>no advertising and no advertising cookies;</li>
            <li>no social network buttons that would follow your browsing.</li>
          </ul>
          <p>Photos and fonts are served from our own site: browsing it doesn&apos;t set any third-party cookie.</p>

          <h2>Deleting them</h2>
          <p>
            You can clear cookies and local storage at any time in your browser settings (&quot;Privacy&quot; or
            &quot;Browsing data&quot;). If you run a business, you will simply be signed out; if you are a visitor, the
            deals saved on the device will be lost and the site will go back to its default language.
          </p>

          <h2>A question?</h2>
          <p>
            Write to us <LegalContact />. To learn how we handle your data, read our{" "}
            <Link href="/confidentialite">privacy policy</Link>.
          </p>
        </>
      ) : (
        <>
          <h2>Ce que nous n&apos;utilisons pas</h2>
          <ul>
            <li>aucun outil de mesure d&apos;audience (Google Analytics ou équivalent) ;</li>
            <li>aucune publicité ni aucun cookie publicitaire ;</li>
            <li>aucun bouton de réseau social qui suivrait votre navigation.</li>
          </ul>
          <p>
            Les photos et les polices de caractères sont servies depuis notre propre site : votre navigation ne
            déclenche pas de cookie tiers.
          </p>

          <h2>Les supprimer</h2>
          <p>
            Vous pouvez effacer cookies et stockage local à tout moment dans les réglages de votre navigateur (rubrique
            « Confidentialité » ou « Données de navigation »). Si vous êtes professionnel, vous serez simplement
            déconnecté ; si vous êtes visiteur, vos favoris enregistrés sur l&apos;appareil seront perdus et le site
            reviendra à sa langue par défaut.
          </p>

          <h2>Une question ?</h2>
          <p>
            Écrivez-nous <LegalContact />. Pour savoir comment nous traitons vos données, consultez notre{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        </>
      )}
    </LegalPage>
  );
}
