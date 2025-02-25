import { Helmet } from "react-helmet";

interface HeadProps {
  title: string;
  description: string;
  image?: string;
  url: string;
}

export function Head({ title, description, image, url }: HeadProps) {
  const defaultImage = "/logo.png"; // Asegúrate de tener una imagen por defecto en public/

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
}
