"use client"; 
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatBox() {
    const[input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    async function handleSend() {
        if (!input.trim()) return;
        const newMessage: Message = { role: "user", text: input };
        setMessages(function(prevMessages) { 
            return [...prevMessages, newMessage];
        });
        setInput("");
        setIsLoading(true);


        try { 
            // Handling api requests
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });
            const data = await response.json();
            const assistantMessage: Message = { role: "assistant", text: data.reply };
        }
        catch (error) {
            console.error("Error sending message:", error);
        } 
        finally {
            setIsLoading(false);
        }
}

return( 
    <div className="w-full max-w-xl border border-line rounded-md bg-white">
        <div className="p-4 h-40 w- 50 overflow-y-auto overflow-x-auto">
           {messages.length === 0 ? (
            <p className="text-graphite text-center">Your Pilot is ready for a analytics flight with Pandas</p>
           ) : null}

           {messages.map((message, index) => 
           (<p key = {index} className = {`text-sm font-mono ${
              message.role === "user" ? "text-ink" : "text-bamboo"
            }`} >  
            {message.role === "user" ? "In" : "Out"} [{index}]: {message.text}
          </p>))}


          {isLoading && (
            <p className="text-sm font-mono text-graphite">Out [{messages.length}]: Your Pilot is thinking...</p>
          )}
            </div>

      <div className="border-t border-line flex items-center px-4 py-3">
        <span className="text-bamboo font-mono text-sm mr-2">In [ ]:</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Try asking me some pandas stuffs here"
          className="flex-1 bg-transparent outline-none text-ink font-mono text-sm placeholder:text-graphite"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="text-white bg-bamboo text-sm px-3 py-1 rounded hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
} 