import Image from "next/image";

export default function OfflineFallbackPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#fff8e8] px-5 text-center text-[#2e251b]">
      <section className="max-w-lg rounded-[32px] border border-amber-200 bg-white p-8 shadow-xl">
        <Image src="/brand/math-stars-icon-192.png" alt="Math Stars" width={96} height={96} className="mx-auto rounded-full" />
        <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-emerald-700">Math Stars Anywhere</p>
        <h1 className="mt-2 text-3xl font-black">You are offline, and that is okay.</h1>
        <p className="mt-3 leading-7 text-stone-600">Open Math Stars from your installed app to continue a downloaded grade pack. Your work stays on this device and will sync safely when a connection returns.</p>
        <a href="/" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 font-black text-white">Open my learning space</a>
      </section>
    </main>
  );
}
