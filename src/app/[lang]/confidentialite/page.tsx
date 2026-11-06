import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const META = messages({
  fr: {
    title: "Politique de confidentialité",
    description: "Quelles données Janga Explorer collecte, pourquoi, combien de temps, et comment exercer vos droits.",
  },
  en: {
    title: "Privacy policy",
    description: "What data Janga Explorer collects, why, for how long, and how to exercise your rights.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return META[await getLocale()];
}

export default async function ConfidentialitePage() {
  return (await getLocale()) === "en" ? <English /> : <Francais />;
}

function Francais() {
  return (
    <LegalPage
      title={META.fr.title}
      current="/confidentialite"
      intro={
        <p>
          <strong>En bref :</strong> vous pouvez consulter toutes les offres sans compte et sans donner la moindre
          information personnelle. Nous ne collectons des données que pour les comptes professionnels, nous ne les
          vendons jamais et nous n&apos;utilisons aucun outil de publicité ni de pistage.
        </p>
      }
    >
      <h2>1. Qui sommes-nous ?</h2>
      <p>
        Janga Explorer (« nous ») est un site qui recense les bons plans de Mahajanga : restaurants, hôtels, activités et
        sorties. Nous sommes responsables des données décrites ci-dessous. Pour toute question, contactez-nous{" "}
        <LegalContact />.
      </p>

      <h2>2. Visiteurs : ce que nous ne collectons pas</h2>
      <p>Pour consulter le site, aucun compte n&apos;est nécessaire. Nous ne vous demandons ni nom, ni e-mail, ni numéro.</p>
      <ul>
        <li>
          <strong>Vos favoris</strong> sont enregistrés uniquement dans votre navigateur, sur votre appareil. Ils ne nous
          sont pas envoyés tant que vous n&apos;êtes pas connecté à un compte.
        </li>
        <li>
          <strong>Vos recherches et filtres</strong> (catégorie, budget, mots-clés) servent seulement à afficher les
          résultats ; nous ne les enregistrons pas à votre nom.
        </li>
        <li>
          <strong>Les statistiques des offres</strong> : quand vous ouvrez une offre ou touchez ses boutons WhatsApp,
          Appeler ou Voir la localisation, nous ajoutons 1 à un compteur de cette offre pour la journée. Ces compteurs
          sont anonymes : ils ne contiennent ni votre adresse IP, ni un identifiant, ni rien qui permette de vous
          reconnaître. Ils servent à montrer à l&apos;établissement combien de personnes s&apos;intéressent à son offre.
        </li>
        <li>
          <strong>Quand vous contactez un établissement</strong> par WhatsApp ou par téléphone, vous quittez Janga
          Explorer : la conversation se passe directement entre vous et l&apos;établissement, et nous n&apos;y avons pas
          accès. La politique de confidentialité de WhatsApp (Meta) s&apos;applique alors.
        </li>
      </ul>

      <h2>3. Professionnels : les données que nous collectons</h2>
      <p>Lorsque vous demandez un compte professionnel, nous recueillons :</p>
      <ul>
        <li>votre nom complet et votre adresse e-mail professionnelle ;</li>
        <li>le nom de votre établissement, son type d&apos;activité, sa localité et sa capacité d&apos;accueil ;</li>
        <li>le justificatif que vous fournissez (numéro NIF/STAT, page Facebook, lien Google Maps…) ;</li>
        <li>
          un mot de passe, qui est chiffré par notre prestataire d&apos;authentification : nous ne le voyons jamais en
          clair.
        </li>
      </ul>
      <p>Une fois votre compte activé, nous conservons également :</p>
      <ul>
        <li>
          les informations de votre fiche établissement et de vos offres (photos, prix, conditions, dates, lieu et
          localisation Google Maps) ainsi que le numéro WhatsApp et le téléphone de l&apos;établissement.{" "}
          <strong>Ces informations sont publiques</strong> : c&apos;est leur raison d&apos;être ;
        </li>
        <li>vos favoris et vos alertes (catégorie, budget, mots-clés), pour les retrouver sur tous vos appareils ;</li>
        <li>
          pour l&apos;abonnement ou le paiement à la durée d&apos;une offre : les paiements que vous déclarez (moyen de
          paiement, numéro qui a payé, référence de la transaction, montant) et la capture d&apos;écran envoyée comme
          preuve. Ces éléments ne sont <strong>jamais publics</strong> : seuls vous et notre équipe
          d&apos;administration y avez accès.
        </li>
      </ul>

      <h2>4. Pourquoi nous utilisons ces données</h2>
      <ul>
        <li>vérifier que votre établissement existe avant d&apos;activer votre compte ;</li>
        <li>gérer votre compte et vous permettre de publier et modifier vos offres ;</li>
        <li>confirmer avec vous le prix et les conditions d&apos;une offre (badge « Offre vérifiée ») ;</li>
        <li>vérifier vos paiements et en garder la trace ;</li>
        <li>prévenir notre équipe par e-mail lorsqu&apos;une nouvelle demande de compte arrive ;</li>
        <li>assurer la sécurité du site et empêcher les abus.</li>
      </ul>
      <p>
        Ces traitements reposent sur votre demande de compte (l&apos;exécution du service que vous sollicitez) et sur
        notre intérêt légitime à proposer des offres fiables.
      </p>

      <h2>5. Qui a accès à vos données</h2>
      <p>
        Seule l&apos;équipe Janga Explorer a accès aux demandes de compte. Nous ne vendons ni ne louons aucune donnée.
        Pour faire fonctionner le site, nous faisons appel à des prestataires techniques qui ne les utilisent que pour
        notre compte :
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> : base de données, authentification et stockage des photos des offres ;
        </li>
        <li>
          <strong>Vercel</strong> : hébergement du site ;
        </li>
        <li>
          <strong>Resend</strong> : envoi des e-mails de notification à notre équipe.
        </li>
      </ul>
      <p>
        Ces prestataires peuvent stocker les données hors de Madagascar. Ils appliquent des mesures de sécurité
        reconnues (chiffrement des échanges, accès restreints).
      </p>

      <h2>6. Combien de temps nous les gardons</h2>
      <ul>
        <li>
          <strong>Compte professionnel</strong> : tant que le compte existe, puis suppression à votre demande ou après
          sa fermeture.
        </li>
        <li>
          <strong>Demande de compte refusée</strong> : conservée le temps de traiter un éventuel recours, puis supprimée
          sur simple demande.
        </li>
        <li>
          <strong>Offres</strong> : retirées du site à leur date de fin ; elles restent visibles dans votre espace pro
          jusqu&apos;à ce que vous les supprimiez. Leurs statistiques sont supprimées avec elles.
        </li>
        <li>
          <strong>Paiements et preuves</strong> : tant que le compte existe, pour justifier les périodes payées, puis
          supprimés après sa fermeture.
        </li>
        <li>
          <strong>Favoris enregistrés sur votre appareil</strong> : jusqu&apos;à ce que vous les retiriez ou effaciez
          les données de votre navigateur.
        </li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Conformément à la loi malgache n° 2014-038 sur la protection des données à caractère personnel, vous pouvez
        demander à accéder à vos données, les corriger, les supprimer ou vous opposer à leur utilisation. Écrivez-nous{" "}
        <LegalContact /> en précisant l&apos;adresse e-mail de votre compte ; nous répondons dans un délai d&apos;un
        mois. Vous pouvez aussi saisir la Commission Malagasy sur l&apos;Informatique et des Libertés (CMIL).
      </p>

      <h2>8. Cookies</h2>
      <p>
        Nous n&apos;utilisons que des cookies indispensables : la langue du site et la connexion des comptes
        professionnels. Le détail est sur la page <Link href="/cookies">Cookies</Link>.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Nous pouvons mettre à jour cette politique, par exemple si nous ajoutons un service. La date de dernière mise à
        jour figure en haut de la page.
      </p>
    </LegalPage>
  );
}

function English() {
  return (
    <LegalPage
      title={META.en.title}
      current="/confidentialite"
      intro={
        <p>
          <strong>In short:</strong> you can browse every deal without an account and without giving us any personal
          information. We only collect data for business accounts, we never sell it, and we use no advertising or
          tracking tools.
        </p>
      }
    >
      <h2>1. Who we are</h2>
      <p>
        Janga Explorer (&quot;we&quot;) is a website listing the best deals in Mahajanga: restaurants, hotels,
        activities and nights out. We are responsible for the data described below. For any question, contact us{" "}
        <LegalContact />.
      </p>

      <h2>2. Visitors: what we don&apos;t collect</h2>
      <p>You don&apos;t need an account to use the site. We don&apos;t ask for your name, email or phone number.</p>
      <ul>
        <li>
          <strong>Your saved deals</strong> are stored only in your browser, on your device. They are not sent to us
          unless you sign in to an account.
        </li>
        <li>
          <strong>Your searches and filters</strong> (category, budget, keywords) are only used to show results; we
          don&apos;t record them under your name.
        </li>
        <li>
          <strong>Deal statistics</strong>: when you open a deal or tap its WhatsApp, Call or See the location buttons,
          we add 1 to a counter for that deal and that day. These counters are anonymous: they contain no IP address,
          no identifier, nothing that could identify you. They show the business how many people are interested in its
          deal.
        </li>
        <li>
          <strong>When you contact a business</strong> by WhatsApp or phone, you leave Janga Explorer: the conversation
          happens directly between you and the business, and we have no access to it. WhatsApp&apos;s (Meta) privacy
          policy then applies.
        </li>
      </ul>

      <h2>3. Businesses: the data we collect</h2>
      <p>When you request a business account, we collect:</p>
      <ul>
        <li>your full name and business email address;</li>
        <li>the name of your business, its type, its location and its capacity;</li>
        <li>the proof you provide (NIF/STAT number, Facebook page, Google Maps link…);</li>
        <li>a password, which is encrypted by our authentication provider: we never see it in plain text.</li>
      </ul>
      <p>Once your account is active, we also keep:</p>
      <ul>
        <li>
          the details of your business profile and your deals (photos, prices, conditions, dates, place and Google Maps
          location) as well as the business&apos;s WhatsApp number and phone. <strong>This information is public</strong>
          : that is its purpose;
        </li>
        <li>your saved deals and alerts (category, budget, keywords), so you find them on all your devices;</li>
        <li>
          for the subscription or pay-per-day deals: the payments you declare (payment method, paying number,
          transaction reference, amount) and the screenshot sent as proof. These are <strong>never public</strong>:
          only you and our administration team can see them.
        </li>
      </ul>

      <h2>4. Why we use this data</h2>
      <ul>
        <li>to check that your business exists before activating your account;</li>
        <li>to manage your account and let you post and edit your deals;</li>
        <li>to confirm a deal&apos;s price and conditions with you (&quot;Verified deal&quot; badge);</li>
        <li>to check your payments and keep a record of them;</li>
        <li>to notify our team by email when a new account request arrives;</li>
        <li>to keep the site secure and prevent abuse.</li>
      </ul>
      <p>
        This processing is based on your account request (providing the service you ask for) and on our legitimate
        interest in offering reliable deals.
      </p>

      <h2>5. Who can access your data</h2>
      <p>
        Only the Janga Explorer team can access account requests. We never sell or rent any data. To run the site, we
        use technical providers who only process it on our behalf:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong>: database, authentication and storage of deal photos;
        </li>
        <li>
          <strong>Vercel</strong>: website hosting;
        </li>
        <li>
          <strong>Resend</strong>: notification emails to our team.
        </li>
      </ul>
      <p>
        These providers may store data outside Madagascar. They apply recognised security measures (encrypted
        connections, restricted access).
      </p>

      <h2>6. How long we keep it</h2>
      <ul>
        <li>
          <strong>Business account</strong>: as long as the account exists, then deleted at your request or after it
          is closed.
        </li>
        <li>
          <strong>Declined account request</strong>: kept while any appeal is handled, then deleted on request.
        </li>
        <li>
          <strong>Deals</strong>: removed from the site on their end date; they stay in your business space until you
          delete them. Their statistics are deleted with them.
        </li>
        <li>
          <strong>Payments and proofs</strong>: as long as the account exists, to justify the paid periods, then deleted
          after it is closed.
        </li>
        <li>
          <strong>Saved deals on your device</strong>: until you remove them or clear your browser data.
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>
        Under Malagasy law no. 2014-038 on the protection of personal data, you can ask to access, correct or delete
        your data, or object to its use. Write to us <LegalContact /> and give the email address of your account; we
        reply within one month. You can also contact the Commission Malagasy sur l&apos;Informatique et des Libertés
        (CMIL).
      </p>

      <h2>8. Cookies</h2>
      <p>
        We only use essential cookies: the site language and business account sign-in. Details are on the{" "}
        <Link href="/cookies">Cookies</Link> page.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy, for example if we add a service. The date of the last update is shown at the top of
        the page.
      </p>
    </LegalPage>
  );
}
