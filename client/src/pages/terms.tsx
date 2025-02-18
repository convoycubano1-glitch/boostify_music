import { Header } from "@/components/layout/header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose dark:prose-invert">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Boostify's website for personal, non-commercial transitory viewing only.
            </p>

            <h2>3. User Account</h2>
            <p>
              To access certain features of the platform, you must register for an account. You agree to provide accurate information and keep it updated.
            </p>

            <h2>4. Service Description</h2>
            <p>
              Boostify provides a platform for music marketing and promotion services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.
            </p>

            <h2>5. Payment Terms</h2>
            <p>
              All fees are in USD unless otherwise stated. You agree to pay all applicable fees according to the pricing terms in effect when the fee becomes payable.
            </p>

            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Boostify and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall Boostify be liable for any indirect, incidental, special, consequential or punitive damages arising out of or relating to your use of the service.
            </p>

            <h2>8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
