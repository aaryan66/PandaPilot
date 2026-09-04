"use client"; 
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatBox() {
    const[input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);

}