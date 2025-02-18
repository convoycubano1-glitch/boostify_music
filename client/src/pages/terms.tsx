import { Header } from "@/components/layout/header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <div className="prose dark:prose-invert">
            <h2>1. Your Agreement</h2>
            <p>
              By using Boostify Music, you agree to these terms. Please read them carefully before using our services.
            </p>

            <h2>2. Account Creation</h2>
            <p>
              To use our services, you must create an account with accurate information. Keep your login details secure and don't share them with others.
            </p>

            <h2>3. Our Services</h2>
            <p>
              We provide music marketing and promotion tools. Services include:
            </p>
            <ul>
              <li>Social media promotion</li>
              <li>Music distribution</li>
              <li>Analytics and tracking</li>
              <li>Artist branding tools</li>
            </ul>

            <h2>4. Your Content</h2>
            <p>
              When you upload content to our platform, you keep your rights but give us permission to use it to provide our services.
            </p>

            <h2>5. Payments</h2>
            <p>
              All prices are in USD. You agree to pay for services according to our current pricing. We process payments securely through trusted providers.
            </p>

            <h2>6. Rules of Use</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Share harmful content</li>
              <li>Violate others' rights</li>
              <li>Misuse our platform</li>
              <li>Share false information</li>
            </ul>

            <h2>7. Service Changes</h2>
            <p>
              We may update our services and these terms. We'll notify you about important changes via email or our platform.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              If you have questions about these terms, please contact our support team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}