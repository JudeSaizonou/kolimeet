import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const CGU = () => {
  return (
    <>
      <Helmet>
        <title>Conditions Générales d'Utilisation - Kolimeet</title>
        <meta name="description" content="Conditions générales d'utilisation de Kolimeet, plateforme de mise en relation pour l'envoi de colis entre la France et le Bénin." />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-background rounded-lg shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Conditions Générales d'Utilisation</h1>
            </div>

            <div className="prose prose-sm md:prose-base max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">Préambule</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet est une plateforme de mise en relation entre voyageurs et expéditeurs souhaitant acheminer des colis entre la France et le Bénin. La plateforme ne transporte pas elle-même de colis et n'est en aucun cas responsable des échanges entre utilisateurs.
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
                  <li>Substances illégales ou prohibées</li>
                  <li>Liquides en quantité importante</li>
                  <li>Denrées périssables sans conditionnement approprié</li>
                  <li>Objets volés ou contrefaits</li>
                  <li>Tout objet dont le transport est interdit par la loi</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Toute infraction entraînera la suppression immédiate du compte et pourra faire l'objet de poursuites.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Données personnelles</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Kolimeet collecte uniquement les données nécessaires à l'usage du service : informations de profil, messages, annonces et avis.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Ces données ne sont jamais revendues à des tiers. Elles sont utilisées exclusivement pour le fonctionnement de la plateforme et la mise en relation entre utilisateurs.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Suspension et résiliation</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  L'utilisateur peut supprimer son compte à tout moment depuis son profil.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet peut suspendre ou supprimer un compte en cas d'abus, fraude, non-respect des CGU, ou comportement nuisible à la communauté.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Modifications</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kolimeet se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications via l'application et/ou par email. L'utilisation continue du service après modification vaut acceptation des nouvelles conditions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant ces conditions, vous pouvez nous contacter via notre{" "}
                  <Link to="/contact" className="text-primary hover:underline">
                    page de contact
                  </Link>{" "}
                  ou à l'adresse : contact@Kolimeet.com
                </p>
              </section>

              <p className="text-sm text-muted-foreground mt-8 pt-6 border-t">
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
