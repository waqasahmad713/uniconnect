import { Header } from "@/components/Header";

export default function MessagesPage() {
  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Messages</h1>
        <p className="mt-4 text-ink-soft">
          Private messaging between connected users is prepared in the database.
          Conversations will appear here after you connect with someone.
        </p>
      </main>
    </div>
  );
}
