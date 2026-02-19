// app/privacy/page.tsx

export const metadata = {
  title: "Privacy Policy | RentKA",
  description:
    "Learn how RentKA collects, uses, and protects your personal information across our app and website.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        <strong>RentKA</strong> (“we”, “our”, or “us”) values your privacy. This
        Privacy Policy explains how we collect, use, store, and protect your
        information when you use the RentKA mobile application and website.
      </p>

      <p className="mb-4">
        By using our Services, you agree to the collection and use of information
        in accordance with this Privacy Policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Information We Collect
      </h2>
      <ul className="list-disc pl-6 mb-4 space-y-1">
      RentKA may collect the following information:
        <li>Full name</li>
        <li>Phone number</li>
        <li>Email address (if provided)</li>
        <li>CNIC photo (for identity verification)</li>
        <li>City and location preferences</li>
        <li>Car rental and service preferences</li>
        <li>Booking and request-related information</li>
        <li>Basic device and usage data required for app functionality</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        How We Use Your Information
      </h2>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Create and manage your user account</li>
        <li>Contact you regarding bookings, requests, or support</li>
        <li>Connect you with car rental partners to fulfill your request</li>
        <li>Improve app performance and user experience</li>
        <li>Ensure legal, operational, and security compliance</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data Sharing</h2>
      <p className="mb-4">
        We do not sell your personal data. Your information may be shared with
        trusted third-party car rental partners strictly for booking and service
        fulfillment, or when required by law or security obligations.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Third-Party Services
      </h2>
      <p className="mb-4">
        RentKA uses third-party services such as Google Firebase for
        authentication, database management, cloud storage, and analytics. These
        services operate under their own privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data Security</h2>
      <p className="mb-4">
        We take reasonable technical and organizational measures to protect your
        data. However, no online system is completely secure, and absolute
        security cannot be guaranteed.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Cookies and Tracking
      </h2>
      <p className="mb-4">
        Our website may use basic cookies to ensure proper functionality and
        improve user experience. The RentKA mobile app does not use cookies.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Your Rights</h2>
      <p className="mb-4">
        You may request access to, correction of, or deletion of your personal
        data by contacting us through our support channels.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Children’s Privacy
      </h2>
      <p className="mb-4">
        RentKA does not knowingly collect personal data from children under the
        age of 13.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Changes to This Policy
      </h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. Continued use of our
        Services indicates acceptance of the updated policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at{" "}
        <a
          href="mailto:support@rentka.co"
          className="text-blue-600 underline"
        >
          support@rentka.co
        </a>
        .
      </p>
    </main>
  );
}
