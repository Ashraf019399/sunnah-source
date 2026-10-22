"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  MessageCircle,
  Phone,
  RefreshCw,
  Bot,
  User,
  ChevronDown,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: "মধু চেনার সহজ উপায়", emoji: "🍯", query: "খাঁটি মধু চেনার সহজ উপায় কী এবং আপনাদের মধুর দাম কত?" },
  { label: "কম্বো অফার বিবরণ", emoji: "🎁", query: "সুন্নাহ হেলথ বুস্টার কম্বো ও গিফট বক্সে কী কী থাকে?" },
  { label: "ডায়াবেটিসে খেজুর সেবন", emoji: "🌴", query: "ডায়াবেটিস রোগীরা কি আজওয়া খেজুর খেতে পারেন?" },
  { label: "ডেলিভারি চার্জ ও সময়", emoji: "🚚", query: "ঢাকা ও ঢাকার বাইরে ডেলিভারি চার্জ কত এবং কত দিনে পাওয়া যায়?" },
];

export function GeminiConcierge() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Route Protection: Keep admin dashboard views clean
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus input on desktop
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyPayload = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload }),
      });

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await res.json();
      const replyText =
        data?.reply ||
        "আসসালামু আলাইকুম। সাময়িক সমস্যার কারণে সংযোগ পেতে বিলম্ব হচ্ছে। দয়া করে আমাদের হটলাইনে সরাসরি যোগাযোগ করুন: 01914-612007।";

      const botMessage: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("AI Concierge error:", err);
      const fallbackMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content:
          "আসসালামু আলাইকুম। আমাদের সার্ভারে সাময়িক বিঘ্ন ঘটেছে। তাৎক্ষণিক সহায়তা বা খাঁটি পণ্যের অর্ডারের জন্য আমাদের হটলাইন অথবা হোয়াটসঅ্যাপে যোগাযোগ করুন: **01914-612007**।",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Formatter for markdown-like bolding and bullet lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm font-bengali">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process bold tokens (**text**)
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const parsedLine = parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-bold text-charcoal-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          // Check for bullet lines
          if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-emerald-700 font-bold select-none">•</span>
                <span className="flex-1">{parsedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{parsedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* 1. Bespoke Ultra-Luxury Floating Launcher */}
      {!isOpen && (
        <div
          className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-40 flex items-center gap-2.5 pointer-events-auto"
          role="region"
          aria-label="সুন্নাহ সোর্স এআই কনসিয়ার্জ"
        >
          {/* Desktop Hover / Info Pill */}
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-card border border-amber-400/40 text-charcoal-800 text-xs font-bold font-bengali hover:text-emerald-800 hover:border-amber-400 transition-all cursor-pointer group select-none"
            aria-label="সুন্নাহ এআই চালু করুন"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="flex items-center gap-1 text-[11.5px]">
              <span className="text-amber-600 font-sans">✨</span> সুন্নাহ এআই • ২৪/৭ সক্রিয়
            </span>
          </button>

          {/* Luxury Circular AI Trigger Button */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="সুন্নাহ এআই কনসিয়ার্জ চালু করুন"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-[0_10px_35px_-5px_rgba(6,78,59,0.5)] border border-amber-400/50 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative cursor-pointer"
          >
            {/* Subtle Golden Pulsing Aura */}
            <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping pointer-events-none" />

            {/* Sparkles Icon with Golden Sheen */}
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-300 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-pulse" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Bespoke Luxury AI Chat Dialog */}
      {isOpen && (
        <div
          className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[410px] h-[580px] max-h-[88vh] rounded-3xl shadow-2xl bg-white border border-emerald-900/20 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-labelledby="concierge-title"
          aria-modal="true"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-stone-900 p-3.5 sm:p-4 text-white flex items-center justify-between shadow-md relative z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-400/40 p-1 flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo.svg"
                  alt="Sunnah Source"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 id="concierge-title" className="text-xs sm:text-sm font-bold tracking-tight text-white font-bengali truncate">
                    সুন্নাহ এআই কনসিয়ার্জ
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider font-sans">
                    Gemini
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] text-emerald-100/90 font-medium font-bengali">
                    অনলাইন • তাৎক্ষণিক উত্তর
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="নতুন চ্যাট শুরু করুন"
                  className="w-8 h-8 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="চ্যাট হিস্ট্রি ক্লিয়ার করুন"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="বন্ধ করুন"
                className="w-8 h-8 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                aria-label="চ্যাটবক্স বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF8F5]/60">
            {/* Welcome Greeting on Empty Chat */}
            {messages.length === 0 && (
              <div className="space-y-4 pt-2 pb-2">
                <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm font-bengali">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🌿</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-charcoal-700 leading-relaxed font-bengali">
                    আমি <strong>সুন্নাহ সোর্স</strong>-এর পার্সোনাল এআই স্বাস্থ্য পরামর্শক ও কনসিয়ার্জ। খাঁটি মধু, বিলোনা ঘি, মদিনার আজওয়া খেজুর, স্বাস্থ্য পরামর্শ অথবা ডেলিভারি সম্পর্কিত যেকোনো তথ্য জানতে প্রশ্ন করুন।
                  </p>
                </div>

                {/* Quick Action Suggestion Chips */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-charcoal-500 font-bengali px-1">
                    জনপ্রিয় প্রশ্নসমূহ (ক্লিক করুন):
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_PROMPTS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(item.query)}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl bg-white hover:bg-emerald-50/70 border border-surface-border hover:border-emerald-300 text-left transition-all text-xs text-charcoal-800 font-medium font-bengali group shadow-2xs cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>{item.emoji}</span>
                          <span className="group-hover:text-emerald-900 transition-colors">
                            {item.label}
                          </span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-charcoal-400 group-hover:text-emerald-700 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30 shadow-2xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-tr-xs"
                      : "bg-white border border-surface-border text-charcoal-900 rounded-tl-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-xs sm:text-sm font-bengali leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                  <span
                    className={`block text-[9px] mt-1 text-right select-none ${
                      msg.role === "user" ? "text-emerald-200/80" : "text-stone-400"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString("bn-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30 shadow-2xs mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-surface-border text-charcoal-700 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contact Bar */}
          <div className="bg-emerald-950/90 border-t border-emerald-800/40 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-200/90 font-bengali">
            <span className="text-[10.5px]">দ্রুত সহায়তার জন্য:</span>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/8801914612007"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="WhatsApp Chat"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>হোয়াটসঅ্যাপ</span>
              </a>
              <span className="text-emerald-700">•</span>
              <a
                href="tel:01914612007"
                className="flex items-center gap-1 hover:text-white transition-colors font-sans"
                title="Call hotline"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>01914-612007</span>
              </a>
            </div>
          </div>

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-surface-border flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="আপনার প্রশ্নটি এখানে লিখুন..."
              disabled={isLoading}
              className="flex-1 bg-surface-canvas border border-stone-200 focus:border-brand-600 focus:bg-white rounded-full px-4 py-2.5 text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all font-bengali"
              aria-label="এআই কনসিয়ার্জের জন্য প্রশ্ন"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-800 hover:to-emerald-950 transition-all shadow-sm cursor-pointer"
              aria-label="বার্তা পাঠান"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
