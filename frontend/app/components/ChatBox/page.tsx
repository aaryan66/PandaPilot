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
        
    } 
}