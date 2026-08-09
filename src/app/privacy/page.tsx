export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 leading-7">
      <h1 className="font-display text-4xl font-bold">Family privacy</h1>
      <p className="mt-5">Math Stars is a parent-managed family learning space. It stores the parent or guardian’s name, email address, securely hashed password, learner profile names, lesson progress, achievements, activity history, preferences, and optional math-tutor conversations so the app can work across visits.</p>
      <h2 className="mt-8 font-display text-2xl font-bold">How data is used</h2>
      <p className="mt-3">Data is used only to provide learning activities and parent progress reports. Children should never enter an address, phone number, email, school name, password, or other identifying information into the tutor.</p>
      <h2 className="mt-8 font-display text-2xl font-bold">Parent feedback</h2>
      <p className="mt-3">Parents can submit bug reports, suggestions, and general feedback from the PIN-protected grown-up area. Math Stars stores the message, its category, the part of the app it concerns, optional grade or Arcade context, its review status, and whether the parent invited an email follow-up. Feedback is included in family data exports and removed when the family deletes its data or account.</p>
      <h2 className="mt-8 font-display text-2xl font-bold">Usage and device information</h2>
      <p className="mt-3">To operate and improve the service, Math Stars records broad device categories such as phone, tablet, computer, or TV; operating-system and browser names; whether the app is opened in a browser or as an installed app; first-seen and last-active times; and visit counts. A random identifier is stored in that browser’s local storage and sent with activity updates so repeat visits from the same browser can be counted. It is not an advertising identifier and is removed from Math Stars when the family account is deleted. Math Stars does not store precise location, IP addresses, advertising identifiers, or the device’s full user-agent string for this monitoring.</p>
      <h2 className="mt-8 font-display text-2xl font-bold">Parent controls</h2>
      <p className="mt-3">A parent can clear tutor history, export family data, reset progress, delete profiles, delete all family learning records, or permanently delete the family account and its associated device records.</p>
      <p className="mt-8 rounded-xl bg-muted p-4 text-sm">Math Stars is designed for parent or guardian accounts, not child accounts. Independent privacy and legal review is still recommended before a broad public or school launch.</p>
      <a href="/" className="mt-8 inline-block font-semibold text-primary underline">Return to Math Stars</a>
    </main>
  );
}
