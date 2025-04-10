import { Header } from "../components/layout/header";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose dark:prose-invert">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide when you:
            </p>
            <ul>
              <li>Create an account</li>
              <li>Upload content</li>
              <li>Use our services</li>
              <li>Contact support</li>
            </ul>

            <h2>2. How We Use Your Data</h2>
            <p>
              Your data helps us:
            </p>
            <ul>
              <li>Provide our services to you</li>
              <li>Improve our platform</li>
              <li>Send important updates</li>
              <li>Protect your account</li>
              <li>Analyze usage patterns</li>
            </ul>

            <h2>3. Data Protection</h2>
            <p>
              We protect your data using industry-standard security measures. This includes encryption and secure servers.
            </p>

            <h2>4. Your Rights</h2>
            <p>
              You can:
            </p>
            <ul>
              <li>See your data</li>
              <li>Change your information</li>
              <li>Delete your account</li>
              <li>Control your privacy settings</li>
              <li>Opt out of marketing</li>
            </ul>

            <h2>5. Questions?</h2>
            <p>
              Contact our privacy team if you have questions about your data or this policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}