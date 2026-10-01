export async function sendMessage(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    }   
  );

  if (!res.ok) {
    const errorText  = await res.text().catch(() => "Unknown"); 
    throw new Error(`Chat request failed (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<{
    answer: string;
    sources: unknown[];
  }>;
}