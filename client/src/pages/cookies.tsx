import { Header } from "@/components/layout/header";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          
          <div className="prose dark:prose-invert">
            <h2>1. What are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
              We use cookies for the following purposes:
            </p>
            <ul>
              <li>Authentication and security</li>
              <li>Preferences and functionality</li>
              <li>Analytics and performance</li>
              <li>Advertising and targeting</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>
            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
            </p>

            <h3>Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>

            <h3>Marketing Cookies</h3>
            <p>
              These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.
            </p>

            <h2>4. Managing Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your experience of the website.
            </p>

            <h2>5. Changes to Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
