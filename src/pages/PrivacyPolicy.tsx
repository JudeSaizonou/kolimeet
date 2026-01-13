import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail, Lock, Database, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="bg-background min-h-screen pt-20 md:pt-32">
      <div className="container mx-auto max-w-4xl py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
          
          <h1 className="text-xl md:text-3xl font-bold mb-2">Politique de confidentialité</h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : 10 janvier 2026</p>
          
          <div className="prose prose-gray max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Introduction
              </h2>
              <p className="text-muted-foreground mb-4">
                KoliMeet ("nous", "notre", "nos") s'engage à protéger votre vie privée. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, 
                stockons et protégeons vos informations personnelles lorsque vous utilisez 
                notre application web accessible à l'adresse <strong>kolimeet.com</strong>.
              </p>
              <p className="text-muted-foreground">
                En utilisant KoliMeet, vous acceptez les pratiques décrites dans cette politique.
              </p>
            </section>
            
            {/* Données collectées */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Données que nous collectons
              </h2>
              
              <h3 className="font-medium mb-2">Données d'inscription</h3>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Adresse email</li>
                <li>Nom complet</li>
                <li>Photo de profil (optionnel)</li>
                <li>Numéro de téléphone (optionnel, pour vérification)</li>
              </ul>
              
              <h3 className="font-medium mb-2">Données d'utilisation</h3>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Annonces publiées (trajets, colis)</li>
                <li>Messages échangés avec d'autres utilisateurs</li>
                <li>Avis et évaluations</li>
                <li>Préférences de notification</li>
              </ul>
              
              <h3 className="font-medium mb-2">Données techniques</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Données de connexion</li>
              </ul>
            </section>
            
            {/* Authentification Google */}
            <section className="mb-8 bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Connexion avec Google
              </h2>
              <p className="text-muted-foreground mb-4">
                Lorsque vous choisissez de vous connecter avec votre compte Google, nous accédons 
                <strong> uniquement</strong> aux informations suivantes :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li><strong>Votre nom</strong> : pour personnaliser votre profil</li>
                <li><strong>Votre adresse email</strong> : pour créer votre compte et vous contacter</li>
                <li><strong>Votre photo de profil</strong> : affichée sur votre profil (optionnel)</li>
              </ul>
              <p className="text-muted-foreground">
                Nous n'accédons à <strong>aucune autre donnée</strong> de votre compte Google 
                (contacts, calendrier, Drive, etc.). Nous ne publions jamais en votre nom.
              </p>
            </section>
            
            {/* Utilisation des données */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Comment nous utilisons vos données
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Fournir le service</strong> : permettre la mise en relation entre 
                  expéditeurs et voyageurs
                </li>
                <li>
                  <strong>Sécurité</strong> : vérifier les comptes, prévenir les fraudes et 
                  les activités malveillantes
                </li>
                <li>
                  <strong>Communication</strong> : vous envoyer des notifications relatives 
                  à vos annonces et messages
                </li>
                <li>
                  <strong>Amélioration</strong> : analyser l'utilisation pour améliorer 
                  nos services
                </li>
                <li>
                  <strong>Support</strong> : répondre à vos questions et demandes d'assistance
                </li>
              </ul>
            </section>
            
            {/* Partage des données */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Partage des données</h2>
              <p className="text-muted-foreground mb-4">
                Nous ne vendons <strong>jamais</strong> vos données personnelles. 
                Nous pouvons partager certaines informations avec :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Autres utilisateurs</strong> : votre nom et photo de profil sont 
                  visibles sur vos annonces et messages
                </li>
                <li>
                  <strong>Prestataires techniques</strong> : hébergement (Supabase, Vercel), 
                  emails (Resend) - uniquement pour fournir le service
                </li>
                <li>
                  <strong>Autorités légales</strong> : si requis par la loi
                </li>
              </ul>
            </section>
            
            {/* Conservation */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Conservation des données</h2>
              <p className="text-muted-foreground">
                Vos données sont conservées tant que votre compte est actif. 
                En cas de suppression de compte, vos données personnelles sont supprimées 
                dans un délai de 30 jours, sauf obligation légale de conservation.
              </p>
            </section>
            
            {/* Vos droits */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                Vos droits (RGPD)
              </h2>
              <p className="text-muted-foreground mb-4">
                Conformément au Règlement Général sur la Protection des Données (RGPD), 
                vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
                <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement</strong> : supprimer vos données</li>
                <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              </ul>
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Exercez ces droits directement depuis votre profil :</strong>
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                  <li>Modifiez vos informations personnelles à tout moment</li>
                  <li>Téléchargez toutes vos données en un clic (export JSON)</li>
                  <li>Supprimez définitivement votre compte et toutes vos données</li>
                </ul>
              </div>
              <p className="text-muted-foreground mt-4">
                Pour toute autre demande, contactez-nous à : <strong>contact@kolimeet.com</strong>
              </p>
            </section>
            
            {/* Sécurité */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Sécurité</h2>
              <p className="text-muted-foreground">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                pour protéger vos données : chiffrement des données en transit (HTTPS), 
                authentification sécurisée, accès restreint aux données, et surveillance 
                continue de nos systèmes.
              </p>
            </section>
            
            {/* Contact */}
            <section className="mb-8 bg-secondary p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact
              </h2>
              <p className="text-muted-foreground mb-4">
                Pour toute question concernant cette politique de confidentialité ou 
                vos données personnelles, contactez-nous :
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>Email : <strong>contact@kolimeet.com</strong></li>
                <li>Site web : <strong>https://kolimeet.com</strong></li>
              </ul>
            </section>
            
            {/* Modifications */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Modifications</h2>
              <p className="text-muted-foreground">
                Nous pouvons mettre à jour cette politique de confidentialité. 
                En cas de modification importante, nous vous en informerons par email 
                ou via une notification dans l'application.
              </p>
            </section>
          </div>
        </div>
      </div>
  );
};

export default PrivacyPolicy;
