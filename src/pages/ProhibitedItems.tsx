import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { AlertTriangle, Ban, ShieldAlert, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProhibitedItems = () => {
  return (
    <>
      <Helmet>
        <title>Articles Interdits - Kolimeet</title>
        <meta name="description" content="Liste des articles qu'il est strictement interdit de transporter via Kolimeet." />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/cgu" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux CGU
            </Link>
          </Button>

          <div className="bg-background rounded-lg shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Ban className="h-8 w-8 text-destructive" />
              <h1 className="text-3xl font-bold text-foreground">Articles Interdits</h1>
            </div>

            <p className="text-muted-foreground mb-6">
              Liste des articles qu'il est strictement interdit de transporter via Kolimeet. 
              Tout utilisateur ne respectant pas ces règles verra son compte suspendu et 
              pourra faire l'objet de poursuites judiciaires.
            </p>

            <Alert variant="destructive" className="mb-8">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Avertissement légal</AlertTitle>
              <AlertDescription>
                Le transport d'articles interdits est passible de poursuites pénales. 
                Kolimeet coopère avec les autorités et signalera tout comportement suspect. 
                Vous êtes pénalement responsable du contenu que vous transportez ou confiez.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Ban className="h-5 w-5" />
                    Stupéfiants & Drogues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li>• Cannabis et tous ses dérivés</li>
                    <li>• Cocaïne, héroïne, crack</li>
                    <li>• Drogues de synthèse (MDMA, LSD, etc.)</li>
                    <li>• Substances psychoactives</li>
                    <li>• Champignons hallucinogènes</li>
                    <li>• Toute substance classée stupéfiant</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Ban className="h-5 w-5" />
                    Armes & Explosifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li>• Armes à feu (réelles ou factices)</li>
                    <li>• Armes blanches (couteaux, sabres, etc.)</li>
                    <li>• Munitions</li>
                    <li>• Explosifs, pétards, feux d'artifice</li>
                    <li>• Bombes lacrymogènes</li>
                    <li>• Tasers et matraques</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    Produits réglementés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li>• Médicaments sans ordonnance valide</li>
                    <li>• Tabac en grande quantité (plus d'1 cartouche)</li>
                    <li>• Alcool au-delà des limites légales</li>
                    <li>• Produits alimentaires périssables</li>
                    <li>• Produits chimiques dangereux</li>
                    <li>• Batteries lithium non conformes</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    Contrefaçons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li>• Faux vêtements de marque</li>
                    <li>• Faux parfums et cosmétiques</li>
                    <li>• Électronique contrefaite</li>
                    <li>• Faux documents (papiers d'identité, diplômes)</li>
                    <li>• Fausse monnaie</li>
                    <li>• Tout article violant la propriété intellectuelle</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    Espèces protégées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li>• Ivoire et produits dérivés</li>
                    <li>• Animaux exotiques ou protégés</li>
                    <li>• Peaux, fourrures d'animaux protégés</li>
                    <li>• Plantes protégées (CITES)</li>
                    <li>• Coraux et coquillages protégés</li>
                    <li>• Insectes et espèces invasives</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    Objets de valeur & Argent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li>• Grosses sommes d'argent liquide (+ 10 000€)</li>
                    <li>• Bijoux de grande valeur non assurés</li>
                    <li>• Œuvres d'art et antiquités</li>
                    <li>• Documents confidentiels sensibles</li>
                    <li>• Lingots, pièces d'or/argent</li>
                    <li>• Objets volés ou d'origine frauduleuse</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">En cas de doute</h3>
              <p className="text-sm text-muted-foreground">
                Si vous avez un doute sur la légalité d'un article, ne le transportez pas. 
                Consultez les réglementations douanières de votre pays de départ et d'arrivée. 
                En cas de question, contactez-nous via notre{" "}
                <Link to="/contact" className="text-primary hover:underline">page de contact</Link>.
              </p>
            </div>

            <div className="mt-6 flex gap-4">
              <Button asChild>
                <Link to="/cgu">Voir les CGU complètes</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8 pt-6 border-t">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProhibitedItems;
