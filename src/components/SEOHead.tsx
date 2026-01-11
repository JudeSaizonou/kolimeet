import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEOHead = ({
  title = 'Kolimeet - Transport collaboratif de colis entre villes',
  description = 'Envoyez ou transportez des colis entre villes en toute sécurité. Kolimeet connecte voyageurs et expéditeurs pour un transport collaboratif économique et écologique.',
  keywords = 'transport colis, covoiturage colis, envoi colis, livraison collaborative, transport entre villes, économie collaborative',
  image = 'https://kolimeet.fr/og-image.jpg',
  url,
  type = 'website',
}: SEOHeadProps) => {
  const fullUrl = url || typeof window !== 'undefined' ? window.location.href : 'https://kolimeet.fr';
  const siteName = 'Kolimeet';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <link rel="canonical" href={fullUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="French" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Kolimeet" />
    </Helmet>
  );
};
