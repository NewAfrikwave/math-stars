export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 leading-7">
      <h1 className="font-display text-4xl font-bold">Family privacy</h1>
      <p className="mt-5">Math Stars is a private family learning space. It stores learner profile names, lesson progress, achievements, activity history, preferences, and optional math-tutor conversations so the app can work across visits.</p>
      <h2 className="mt-8 font-display text-2xl font-bold">How data is used</h2>
      <p className="mt-3">Data is used only to provide learning activities and parent progress reports. Children should never enter an address, phone number, email, school name, password, or other identifying information into the tutor.</p>
      <h2 className="mt-8 font-display text-2xl font-bold">Parent controls</h2>
      <p className="mt-3">A parent can clear tutor history, export family data, reset progress, delete profiles, or delete all family learning records.</p>
      <p className="mt-8 rounded-xl bg-muted p-4 text-sm">This project is intended for private family use. Obtain appropriate privacy and legal guidance before offering it to other families or schools.</p>
      <a href="/" className="mt-8 inline-block font-semibold text-primary underline">Return to Math Stars</a>
    </main>
  );
}
