import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les règles d'utilisation de Janga Explorer pour les visiteurs et les professionnels.",
};

export default function ConditionsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
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
        continuer à publier ensuite, un abonnement est nécessaire : son prix mensuel est affiché dans l&apos;espace pro,
        il donne droit à un nombre illimité d&apos;offres pendant la période payée et aucune commission n&apos;est prise
        sur les ventes.
      </p>
      <p>
        L&apos;abonnement se règle par MVola, Orange Money ou Airtel Money. Le professionnel déclare son paiement dans son
        espace avec une preuve (capture d&apos;écran de la confirmation) ; la période est ajoutée dès que nous avons
        vérifié la réception du montant. L&apos;abonnement ne se renouvelle pas tout seul : sans nouveau paiement, il prend
        fin à son échéance. Les offres déjà en ligne restent alors visibles jusqu&apos;à leur date de fin, mais aucune
        nouvelle offre ne peut être publiée. Un changement de prix ne s&apos;applique qu&apos;aux paiements suivants.
      </p>
      <p>
        Nous pouvons annuler un abonnement dans les cas prévus au paragraphe précédent (information trompeuse, plaintes
        répétées, non-respect de ces conditions) ; le professionnel en est informé avec le motif.
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
        écrivez-nous <LegalContact />.
      </p>
    </LegalPage>
  );
}
