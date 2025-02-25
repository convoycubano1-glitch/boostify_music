import { Helmet } from "react-helmet";

interface HeadProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
  siteName?: string;
  twitterUsername?: string;
}

export function Head({ 
  title, 
  description, 
  image, 
  url,
  type = "website",
  siteName = "Boostify Music",
  twitterUsername = "@boostifymusic"
}: HeadProps) {
  const defaultImage = "/assets/freepik__boostify_music.png";
  const finalImage = image || defaultImage;
  const absoluteImageUrl = finalImage.startsWith('http') ? finalImage : `${window.location.origin}${finalImage}`;

  // Asegurar que la descripción no sea demasiado larga
  const truncatedDescription = description.length > 200 
    ? `${description.slice(0, 197)}...` 
    : description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={truncatedDescription} />
      <link rel="canonical" href={url} />
      <link rel="icon" type="image/png" href={defaultImage} />
      <link rel="apple-touch-icon" href={defaultImage} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterUsername} />
      <meta name="twitter:creator" content={twitterUsername} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={absoluteImageUrl} />

      {/* Additional metadata for better sharing */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Music specific metadata */}
      {type === "profile" && (
        <>
          <meta property="music:creator" content={title} />
          <meta property="og:audio" content={url} />
          <meta property="og:audio:type" content="application/mp3" />
        </>
      )}
    </Helmet>
  );
}