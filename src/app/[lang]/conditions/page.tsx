import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";
import { messages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const META = messages({
  fr: {
    title: "Conditions d'utilisation",
    description: "Les règles d'utilisation de Janga Explorer pour les visiteurs et les professionnels.",
  },
  en: {
    title: "Terms of use",
    description: "The rules for using Janga Explorer, for visitors and businesses.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return META[await getLocale()];
}

export default async function ConditionsPage() {
  return (await getLocale()) === "en" ? <English /> : <Francais />;
}

function Francais() {
  return (
    <LegalPage
      title={META.fr.title}
      current="/conditions"
      intro={
        <p>
          <strong>En bref :</strong> Janga Explorer présente des offres publiées par des établissements de Mahajanga.
          Nous ne vendons rien et aucun paiement ne passe par le site : la réservation et le paiement se font
          directement avec l&apos;établissement.
        </p>
      }
    >
      <h2>1. Objet</h2>
      <p>
        Ces conditions encadrent l&apos;utilisation du site Janga Explorer par les visiteurs et par les professionnels
        qui y publient des offres. En utilisant le site, vous les acceptez.
      </p>

      <h2>2. Le service</h2>
      <p>
        Janga Explorer est une vitrine : il permet de découvrir des offres (restaurants, hébergements, activités,
        sorties) et de contacter l&apos;établissement par WhatsApp ou par téléphone. La consultation est gratuite et
        sans inscription.
      </p>
      <p>
        Janga Explorer n&apos;est pas partie au contrat entre le client et l&apos;établissement. Réservation, paiement,
        annulation et réclamation se règlent directement avec ce dernier.
      </p>

      <h2>3. Les offres</h2>
      <ul>
        <li>
          Chaque offre est publiée sous la responsabilité de l&apos;établissement, qui s&apos;engage sur son prix, ses
          conditions et sa date de fin.
        </li>
        <li>
          Le badge <strong>« Offre vérifiée »</strong> signifie que nous avons confirmé ces informations avec
          l&apos;établissement à la date indiquée sur la fiche. Il ne constitue pas une garantie de la prestation.
        </li>
        <li>
          Les places ou quantités peuvent être limitées. Nous vous conseillons de confirmer la disponibilité avec
          l&apos;établissement avant de vous déplacer.
        </li>
        <li>Une offre dont la date de fin est passée est retirée automatiquement du site.</li>
        <li>
          Les titres et descriptions des offres sont rédigés par les établissements, dans leur langue : ils ne sont
          pas traduits.
        </li>
      </ul>

      <h2>4. Comptes professionnels</h2>
      <p>
        Les comptes sont réservés aux hôtels, restaurants, prestataires d&apos;activités et organisateurs
        d&apos;événements de Mahajanga et sa région. Nous vérifions chaque demande avant d&apos;activer le compte et
        pouvons la refuser sans avoir à nous justifier. En publiant sur Janga Explorer, le professionnel s&apos;engage
        à :
      </p>
      <ul>
        <li>fournir des informations exactes sur son établissement et ses offres ;</li>
        <li>honorer les offres publiées, au prix et aux conditions annoncés, jusqu&apos;à leur date de fin ;</li>
        <li>ne publier que des photos et des textes dont il détient les droits ;</li>
        <li>garder son mot de passe confidentiel.</li>
      </ul>
      <p>
        Nous pouvons retirer une offre ou suspendre un compte en cas d&apos;information trompeuse, de plainte
        répétée de clients ou de non-respect de ces conditions.
      </p>
      <p>
        Chaque compte professionnel bénéficie d&apos;un essai gratuit d&apos;un mois à partir de son activation. Pour
        continuer à publier ensuite, le professionnel choisit entre deux formules, sans commission sur les ventes :
      </p>
      <ul>
        <li>
          <strong>l&apos;abonnement mensuel</strong>, qui donne droit à un nombre illimité d&apos;offres pendant la
          période payée ;
        </li>
        <li>
          <strong>le paiement à la durée</strong>, offre par offre : il paie les jours de visibilité de l&apos;offre,
          du jour où il déclare le paiement jusqu&apos;à sa date de fin (90 jours au plus en une fois). Repousser la
          date de fin demande de payer les jours en plus.
        </li>
      </ul>
      <p>
        Les prix sont affichés dans l&apos;espace pro. Les paiements se font par MVola, Orange Money ou Airtel Money.
        Le professionnel déclare son paiement dans son espace avec une preuve (capture d&apos;écran de la
        confirmation) ; la période ou les jours sont ajoutés dès que nous avons vérifié la réception du montant. Rien
        ne se renouvelle tout seul : sans nouveau paiement, l&apos;abonnement prend fin à son échéance. Les offres déjà
        en ligne restent alors visibles jusqu&apos;à leur date de fin. Un changement de prix ne s&apos;applique
        qu&apos;aux paiements suivants.
      </p>
      <p>
        Nous pouvons annuler un abonnement dans les cas prévus plus haut (information trompeuse, plaintes répétées,
        non-respect de ces conditions) ; le professionnel en est informé avec le motif.
      </p>

      <h2>5. Responsabilité</h2>
      <p>
        Nous faisons de notre mieux pour que les informations soient justes et le site disponible, mais nous ne
        pouvons pas garantir l&apos;absence d&apos;erreur ou d&apos;interruption. Nous ne sommes pas responsables de la
        qualité des prestations fournies par les établissements, ni des échanges entre clients et établissements.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        Le nom Janga Explorer, le logo et la présentation du site nous appartiennent. Les photos et descriptions des
        offres restent la propriété des établissements qui les publient et nous autorisent à les afficher.
      </p>

      <h2>7. Données personnelles</h2>
      <p>
        Leur traitement est décrit dans notre <Link href="/confidentialite">politique de confidentialité</Link> et
        notre page <Link href="/cookies">Cookies</Link>.
      </p>

      <h2>8. Modifications et droit applicable</h2>
      <p>
        Nous pouvons faire évoluer ces conditions ; la date de mise à jour figure en haut de la page. Elles sont
        soumises au droit malgache. En cas de désaccord, nous chercherons d&apos;abord une solution à l&apos;amiable :
        écrivez-nous <LegalContact />. La version française de ces conditions fait foi.
      </p>
    </LegalPage>
  );
}

function English() {
  return (
    <LegalPage
      title={META.en.title}
      current="/conditions"
      intro={
        <p>
          <strong>In short:</strong> Janga Explorer shows deals posted by businesses in Mahajanga. We don&apos;t sell
          anything and no payment goes through the site: you book and pay the business directly.
        </p>
      }
    >
      <h2>1. Purpose</h2>
      <p>
        These terms govern the use of the Janga Explorer website by visitors and by the businesses that post deals on
        it. By using the site, you accept them.
      </p>

      <h2>2. The service</h2>
      <p>
        Janga Explorer is a showcase: it lets you discover deals (restaurants, accommodation, activities, nights out)
        and contact the business by WhatsApp or phone. Browsing is free and requires no sign-up.
      </p>
      <p>
        Janga Explorer is not a party to the contract between the customer and the business. Bookings, payments,
        cancellations and complaints are handled directly with the business.
      </p>

      <h2>3. Deals</h2>
      <ul>
        <li>
          Each deal is posted under the responsibility of the business, which commits to its price, conditions and end
          date.
        </li>
        <li>
          The <strong>&quot;Verified deal&quot;</strong> badge means we confirmed this information with the business on
          the date shown on the deal. It is not a guarantee of the service.
        </li>
        <li>
          Places or quantities may be limited. We recommend confirming availability with the business before you go.
        </li>
        <li>A deal whose end date has passed is automatically removed from the site.</li>
        <li>Deal titles and descriptions are written by the businesses, in their own language: they aren&apos;t translated.</li>
      </ul>

      <h2>4. Business accounts</h2>
      <p>
        Accounts are reserved for hotels, restaurants, activity providers and event organisers in Mahajanga and its
        region. We check every request before activating the account and may decline it without giving a reason. By
        posting on Janga Explorer, the business agrees to:
      </p>
      <ul>
        <li>provide accurate information about the business and its deals;</li>
        <li>honour the deals posted, at the advertised price and conditions, until their end date;</li>
        <li>only post photos and texts it holds the rights to;</li>
        <li>keep its password confidential.</li>
      </ul>
      <p>
        We may remove a deal or suspend an account in case of misleading information, repeated customer complaints or
        breach of these terms.
      </p>
      <p>
        Every business account gets a one-month free trial from activation. To keep posting afterwards, the business
        chooses between two plans, with no commission on sales:
      </p>
      <ul>
        <li>
          <strong>the monthly subscription</strong>, which allows unlimited deals during the paid period;
        </li>
        <li>
          <strong>pay per day</strong>, deal by deal: the business pays for the days the deal is visible, from the day
          it declares the payment until the deal&apos;s end date (up to 90 days at a time). Moving the end date later
          means paying for the extra days.
        </li>
      </ul>
      <p>
        Prices are shown in the business space. Payments are made by MVola, Orange Money or Airtel Money. The business
        declares its payment in its space with proof (a screenshot of the confirmation); the period or days are added
        as soon as we have checked that the amount was received. Nothing renews automatically: without a new payment,
        the subscription ends on its due date. Deals already online then stay visible until their end date. A price
        change only applies to later payments.
      </p>
      <p>
        We may cancel a subscription in the cases listed above (misleading information, repeated complaints, breach of
        these terms); the business is told the reason.
      </p>

      <h2>5. Liability</h2>
      <p>
        We do our best to keep the information accurate and the site available, but we cannot guarantee it will be
        free of errors or interruptions. We are not responsible for the quality of the services provided by businesses,
        nor for exchanges between customers and businesses.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The Janga Explorer name, logo and site design belong to us. Deal photos and descriptions remain the property of
        the businesses that post them, which allow us to display them.
      </p>

      <h2>7. Personal data</h2>
      <p>
        How we handle it is described in our <Link href="/confidentialite">privacy policy</Link> and our{" "}
        <Link href="/cookies">Cookies</Link> page.
      </p>

      <h2>8. Changes and governing law</h2>
      <p>
        We may update these terms; the date of the last update is shown at the top of the page. They are governed by
        Malagasy law. In case of disagreement, we will first look for an amicable solution: write to us{" "}
        <LegalContact />. The French version of these terms prevails.
      </p>
    </LegalPage>
  );
}
