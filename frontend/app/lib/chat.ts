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
    throw new Error("Chat request failed");
  }

  return res.json() as Promise<{
    answer: string;
    sources: unknown[];
  }>;
}