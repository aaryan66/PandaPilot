import ChatBox from "./components/ChatBox/page";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10">
        <h1 className="text-8xl font-semibold text-ink tracking-tight">
          PandaPilot
        </h1>
        <p className="text-graphite mt-3 text-xl">
          Your co-pilot for pandas.
        </p>
      </div>
      <ChatBox />
    </main>
  );
}