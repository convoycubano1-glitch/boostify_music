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
  const defaultImage = "/assets/freepik__boostify-music___orange.png";
  const finalImage = image || defaultImage;
  const absoluteImageUrl = finalImage.startsWith('http') ? finalImage : `${window.location.origin}${finalImage}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterUsername} />
      <meta name="twitter:creator" content={twitterUsername} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />

      {/* Additional metadata */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
    </Helmet>
  );
}