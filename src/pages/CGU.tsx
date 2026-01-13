import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { FileText, AlertTriangle, Shield, Scale } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CGU = () => {
  return (
    <>
      <Helmet>
        <title>Conditions Générales d'Utilisation - Kolimeet</title>
        <meta name="description" content="Conditions générales d'utilisation de Kolimeet, plateforme de mise en relation pour l'envoi de colis à l'international." />
      </Helmet>

      <div className="min-h-screen bg-secondary pt-20 md:pt-32">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-background rounded-lg shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-xl md:text-3xl font-bold text-foreground">Conditions Générales d'Utilisation</h1>
            </div>

            <div className="prose prose-sm md:prose-base max-w-none">
              <Alert className="mb-8 border-primary/20 bg-primary/5">
                <Shield className="h-4 w-4" />
                <AlertTitle>Plateforme de mise en relation uniquement</AlertTitle>
                <AlertDescription>
                  Kolimeet est un intermédiaire technique. Nous ne transportons pas de colis et 
                  ne sommes pas responsables des échanges entre utilisateurs. Chaque utilisateur 
                  est légalement responsable de ses actes.
                </AlertDescription>
              </Alert>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">Préambule</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet est une plateforme de mise en relation entre voyageurs et expéditeurs souhaitant acheminer des colis à l'international. La plateforme ne transporte pas elle-même de colis et n'est en aucun cas responsable des échanges entre utilisateurs.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptation des conditions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  L'accès ou l'utilisation de Kolimeet implique l'acceptation sans réserve des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Inscription et comptes</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  L'utilisateur s'engage à fournir des informations exactes (nom, numéro de téléphone, pays, ville) et à maintenir son compte à jour.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet se réserve le droit de suspendre tout compte suspect, frauduleux ou inactif sans préavis.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Fonctionnement du service</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Les voyageurs publient des trajets disponibles avec leur capacité de transport</li>
                  <li>Les expéditeurs publient des demandes d'envoi de colis</li>
                  <li>Kolimeet facilite la mise en relation mais n'intervient pas dans la transaction</li>
                  <li>Les utilisateurs communiquent via la messagerie intégrée</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Responsabilités</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Les utilisateurs sont seuls responsables :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Du contenu qu'ils publient sur la plateforme</li>
                  <li>Des colis qu'ils transportent ou confient</li>
                  <li>Du respect des réglementations douanières et légales</li>
                  <li>De la vérification de l'identité et de la fiabilité de leurs interlocuteurs</li>
                  <li>De tout litige pouvant survenir lors de la transaction</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Contenus interdits</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Sont strictement interdits au transport :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Objets dangereux, explosifs ou inflammables</li>
                  <li>Armes, munitions et objets contondants</li>
                  <li>Substances illégales ou prohibées (drogues, stupéfiants)</li>
                  <li>Liquides en quantité importante</li>
                  <li>Denrées périssables sans conditionnement approprié</li>
                  <li>Objets volés ou contrefaits</li>
                  <li>Tout objet dont le transport est interdit par la loi</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Toute infraction entraînera la suppression immédiate du compte et pourra faire l'objet de poursuites.
                  <Link to="/articles-interdits" className="text-primary hover:underline ml-1">
                    Voir la liste complète des articles interdits →
                  </Link>
                </p>
              </section>

              <section className="mb-8 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-destructive" />
                  6. Limitation de responsabilité
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>Kolimeet agit uniquement en tant qu'intermédiaire technique.</strong> La plateforme ne peut être tenue responsable :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Du contenu des colis transportés par les utilisateurs</li>
                  <li>Des dommages, pertes ou vols survenus pendant le transport</li>
                  <li>Des litiges financiers ou personnels entre utilisateurs</li>
                  <li>Des infractions commises par les utilisateurs</li>
                  <li>Des problèmes douaniers ou légaux rencontrés</li>
                  <li>De la véracité des informations fournies par les utilisateurs</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3 font-medium">
                  Chaque utilisateur est pénalement et civilement responsable de ses actes sur la plateforme.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Signalement et modération</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Kolimeet dispose d'un système de signalement accessible sur chaque annonce et profil. 
                  Tout utilisateur peut signaler un comportement suspect ou un contenu inapproprié.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Les signalements sont examinés par notre équipe et peuvent entraîner :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                  <li>Un avertissement</li>
                  <li>La suspension temporaire du compte (7 jours)</li>
                  <li>La suppression définitive du compte</li>
                  <li>Le signalement aux autorités compétentes si nécessaire</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Coopération avec les autorités</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet coopère pleinement avec les autorités judiciaires et administratives (police, 
                  douanes, justice). Sur réquisition légale, nous transmettrons toute information 
                  nécessaire aux enquêtes, y compris les données de connexion, messages et historique 
                  des transactions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Données personnelles</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Kolimeet collecte uniquement les données nécessaires à l'usage du service : informations de profil, messages, annonces et avis.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Ces données ne sont jamais revendues à des tiers. Elles sont utilisées exclusivement pour le fonctionnement de la plateforme et la mise en relation entre utilisateurs.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Suspension et résiliation</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  L'utilisateur peut supprimer son compte à tout moment depuis son profil.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet peut suspendre ou supprimer un compte en cas d'abus, fraude, non-respect des CGU, 
                  ou comportement nuisible à la communauté. Un compte recevant plus de 5 signalements 
                  sera automatiquement suspendu pour examen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Modifications</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications via l'application et/ou par email. L'utilisation continue du service après modification vaut acceptation des nouvelles conditions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant ces conditions, vous pouvez nous contacter via notre{" "}
                  <Link to="/contact" className="text-primary hover:underline">
                    page de contact
                  </Link>{" "}
                  ou à l'adresse : contact@kolimeet.com
                </p>
              </section>

              <div className="mt-8 pt-6 border-t flex flex-wrap gap-4">
                <Link 
                  to="/articles-interdits" 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Liste des articles interdits
                </Link>
                <Link 
                  to="/faq" 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  FAQ
                </Link>
                <Link 
                  to="/contact" 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Nous contacter
                </Link>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CGU;
