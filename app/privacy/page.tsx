// app/privacy/page.tsx

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy explaining how RentKA collects and uses user data.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        At <strong>RentKA</strong>, your privacy is important to us. This policy
        explains how we collect, use, and protect your information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Information We Collect
      </h2>
      <p className="mb-4">
        When you use our website or submit a request, we may collect the
        following information:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Name</li>
        <li>Phone number</li>
        <li>Email address (if provided)</li>
        <li>Car, city, and service preferences</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        How We Use Your Information
      </h2>
      <p className="mb-4">
        We use your information to:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Contact you regarding your request</li>
        <li>Share details with rental partners to fulfill your request</li>
        <li>Improve our services and operations</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Data Sharing
      </h2>
      <p className="mb-4">
        Your information may be shared with trusted third-party car rental
        partners strictly for booking and service fulfillment purposes. We do
        not sell your personal data.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Data Security
      </h2>
      <p className="mb-4">
        We take reasonable steps to protect your information. However, no
        internet-based system is completely secure, and we cannot guarantee
        absolute security.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Cookies
      </h2>
      <p className="mb-4">
        RentKA may use basic cookies to ensure proper website functionality and
        improve user experience.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Your Rights
      </h2>
      <p className="mb-4">
        You may request access to, correction of, or deletion of your personal
        data by contacting us through our support channels.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Policy Updates
      </h2>
      <p>
        We may update this Privacy Policy from time to time. Continued use of
        our website means you accept any updates.
      </p>
    </main>
  );
}
