import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données Janga Explorer collecte, pourquoi, combien de temps, et comment exercer vos droits.",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
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
          les informations de votre fiche établissement et de vos offres (photos, prix, conditions, dates, lieu et localisation Google Maps) ainsi
          que le numéro WhatsApp et le téléphone de l&apos;établissement. <strong>Ces informations sont publiques</strong>{" "}
          : c&apos;est leur raison d&apos;être ;
        </li>
        <li>vos favoris et vos alertes (catégorie, budget, mots-clés), pour les retrouver sur tous vos appareils.</li>
      </ul>

      <h2>4. Pourquoi nous utilisons ces données</h2>
      <ul>
        <li>vérifier que votre établissement existe avant d&apos;activer votre compte ;</li>
        <li>gérer votre compte et vous permettre de publier et modifier vos offres ;</li>
        <li>confirmer avec vous le prix et les conditions d&apos;une offre (badge « Offre vérifiée ») ;</li>
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
          jusqu&apos;à ce que vous les supprimiez.
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
        Nous n&apos;utilisons que les cookies indispensables à la connexion des comptes professionnels. Le détail est
        sur la page <Link href="/cookies">Cookies</Link>.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Nous pouvons mettre à jour cette politique, par exemple si nous ajoutons un service. La date de dernière mise à
        jour figure en haut de la page.
      </p>
    </LegalPage>
  );
}
