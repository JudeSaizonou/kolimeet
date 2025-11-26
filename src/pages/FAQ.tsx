import { Helmet } from "react-helmet";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Comment fonctionne Kolimeet ?",
      answer: "Kolimeet met en relation des voyageurs ayant de la place dans leurs bagages et des personnes souhaitant envoyer un colis entre la France et le Bénin. Vous pouvez publier ou consulter une annonce en quelques clics, puis contacter directement l'autre partie via notre messagerie intégrée."
    },
    {
      question: "Kolimeet transporte-t-il les colis ?",
      answer: "Non. Kolimeet n'est qu'un intermédiaire, une plateforme de mise en relation. Le transport est effectué directement entre particuliers. Nous ne sommes pas responsables du contenu des colis ni de leur acheminement."
    },
    {
      question: "Comment publier une annonce ?",
      answer: "Connectez-vous à votre compte, cliquez sur 'Publier un trajet' si vous êtes voyageur, ou 'Publier un colis' si vous êtes expéditeur. Remplissez les informations demandées (villes, dates, poids, etc.) et validez. Votre annonce sera visible immédiatement."
    },
    {
      question: "Puis-je modifier mon annonce après publication ?",
      answer: "Oui, à tout moment ! Rendez-vous dans la section 'Mes annonces' de votre profil, sélectionnez l'annonce à modifier, puis cliquez sur 'Modifier'. Vous pouvez également la supprimer si elle n'est plus d'actualité."
    },
    {
      question: "Quels objets sont interdits ?",
      answer: "Sont strictement interdits : objets dangereux, explosifs, armes, munitions, substances illégales, liquides en grande quantité, denrées périssables non conditionnées, objets volés ou contrefaits. Le non-respect de ces règles peut entraîner la suspension de votre compte."
    },
    {
      question: "Comment contacter un utilisateur ?",
      answer: "Depuis une annonce de trajet ou de colis, cliquez sur le bouton 'Contacter'. Une conversation privée s'ouvrira dans la messagerie. Vous pourrez échanger directement avec l'autre utilisateur pour convenir des détails."
    },
    {
      question: "Les paiements passent-ils par Kolimeet ?",
      answer: "Non, dans cette version actuelle. Le paiement et les modalités d'échange se font directement entre le voyageur et l'expéditeur. Kolimeet ne prend aucune commission et n'intervient pas dans la transaction financière."
    },
    {
      question: "Comment signaler un abus ou un comportement suspect ?",
      answer: "Un bouton 'Signaler' est disponible sur chaque profil utilisateur et dans les conversations. Vous pouvez également nous contacter via la page Contact. Tous les signalements sont examinés par notre équipe de modération."
    },
    {
      question: "Que se passe-t-il si mon colis est perdu ou endommagé ?",
      answer: "Kolimeet n'est pas responsable du contenu, de la livraison ou de l'état des colis. Il est fortement recommandé de vérifier la fiabilité du voyageur (notes, avis, profil vérifié) avant de confier un colis. Vous pouvez également souscrire une assurance personnelle."
    },
    {
      question: "Kolimeet est-il gratuit ?",
      answer: "Oui, l'utilisation de Kolimeet est entièrement gratuite dans sa version actuelle (MVP). Vous pouvez publier des annonces et contacter des utilisateurs sans frais. Des options premium pourront être proposées dans le futur."
    },
    {
      question: "Comment vérifier la fiabilité d'un utilisateur ?",
      answer: "Consultez le profil de l'utilisateur pour voir ses avis et notes laissés par d'autres membres. Vérifiez également si son téléphone est validé et si son profil est complet. N'hésitez pas à échanger par message avant de finaliser."
    },
    {
      question: "Puis-je annuler une transaction ?",
      answer: "Oui, tant que le colis n'a pas été remis. Communiquez avec l'autre partie via la messagerie pour l'informer de votre annulation. Soyez toujours courtois et prévenez le plus tôt possible."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Foire Aux Questions - Kolimeet</title>
        <meta name="description" content="Retrouvez les réponses aux questions fréquentes sur l'utilisation de Kolimeet, la plateforme de mise en relation pour l'envoi de colis." />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-background rounded-lg shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Foire Aux Questions</h1>
                <p className="text-muted-foreground mt-1">Trouvez rapidement les réponses à vos questions</p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Vous ne trouvez pas la réponse à votre question ?{" "}
                <a href="/contact" className="text-primary hover:underline font-medium">
                  Contactez-nous
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
