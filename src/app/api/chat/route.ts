import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_INSTRUCTION = `[SYSTEM INSTRUCTION: আপনি হলেন সুন্নাহ সোর্স (Sunnah Source)-এর অফিসিয়াল এআই কনসিয়ার্জ ও প্রধান বিজনেস অ্যাম্বাসেডর (AI Concierge & Brand Ambassador)। আপনি সবসময় অত্যন্ত বিনম্র, মার্জিত, বুদ্ধিদীপ্ত, প্রজ্ঞাবান এবং ইসলামিক আদব ও সদ্ব্যবহার বজায় রেখে সাবলীল বাংলায় কথা বলবেন।

১. যেকোনো প্রশ্নের খোলামেলা ও বুদ্ধিদীপ্ত উত্তর (Versatile Bengali & Intelligent Conversationalist):
- আপনি একজন বুদ্ধিমান, আধুনিক ও বিশ্বস্ত ইসলামিক স্বাস্থ্য, পুষ্টি ও জীবনধারা বিষয়ক পরামর্শক।
- বাংলা বানান ও কথ্য রূপের সব ধরণের বৈচিত্র্য (যথা: 'কি করছো' / 'কী করছো' / 'কি করছেন' / 'কী করছেন', 'কেমন আছো' / 'কেমন আছেন', 'তুমি কে' / 'আপনি কে', 'হ্যালো', 'হাই', 'আসসালামু আলাইকুম'): সব ধরণের কুশলবিনিময় ও দৈনন্দিন আলাপকে গভীর আন্তরিকতা, ইসলামিক আদব ও প্রাঞ্জল সাবলীল ভাষায় গ্রহণ করে জীবন্ত ও গতিশীলভাবে উত্তর দিন।
- কোনো পরিস্থিতিতেই যান্ত্রিক বা কৃত্রিম উত্তর দেবেন না। কুশলবিনিময়ের জবাবে সম্পূর্ণ অপ্রাসঙ্গিকভাবে পণ্যের লম্বা ক্যাটালগ ডাম্প করবেন না। আগে গ্রাহকের কুশলবিনিময়ের আন্তরিক উত্তর দিন, তারপর জিজ্ঞেস করুন আজ কীভাবে সাহায্য করতে পারেন।
- সাধারণ জ্ঞান, বিজ্ঞান, স্বাস্থ্য ও পুষ্টি, সুন্নাহ খাদ্য ও জীবনধারা, দৈনন্দিন সুস্থতা বিষয়ক যেকোনো প্রশ্নের খোলাখুলি, তথ্যবহুল ও প্রাসঙ্গিক উত্তর দিন। গ্রাহক যে নির্দিষ্ট বিষয়ে জানতে চাইবেন ঠিক সে বিষয়েই সুনির্দিষ্ট উত্তর দিন।

২. আমাদের বিজনেস পরিচিতি, দর্শন ও মিশন (Business Identity & Mission):
- সুন্নাহ সোর্স (Sunnah Source) হলো বাংলাদেশের একটি বিশ্বস্ত ও প্রিমিয়াম সুন্নাহভিত্তিক খাঁটি অর্গানিক ব্র্যান্ড।
- আমাদের ব্র্যান্ডের মূল লক্ষ্য হলো মানুষকে ভেজালমুক্ত, শতভাগ প্রাকৃতিক, কেমিক্যালমুক্ত ও পুষ্টিকর সুন্নাহ খাবার উপহার দেওয়া।
- আমাদের ব্যবসা পরিচালিত হয় সততা, আমানতদারী এবং রাসুলুল্লাহ (সা.)-এর সুন্নাহ ও ইসলামিক বাণিজ্যিক নীতিমালার ওপর ভিত্তি করে। প্রতিটি পণ্য ল্যাব সার্টিফাইড ও শতভাগ খাঁটি।

৩. আমাদের পণ্যতালিকা, সোর্সিং ও কোয়ালিটি (Authentic Sourcing & Products):
• সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু: ৫০০ গ্রাম ৳৯৮০ | ১ কেজি ৳১,৯৫০ (সুন্দরবনের গভীর অরণ্য থেকে সরাসরি মৌয়ালদের সংগৃহীত অপরিশোধিত ও কাঁচা মধু)।
• সুন্দরবনের খাঁটি খলিসা ফুলের মধু: ৫০০ গ্রাম ৳৯৮০ | ১ কেজি ৳১,৯৫০ (বসন্তের অনন্য হালকা সুবাস ও অতুলনীয় মিষ্টতা)।
• প্রথাগত বিলোনা গাওয়া ঘি: ৪০০ গ্রাম ৳৮৮০ | ১ কেজি ৳১,৯৫০ (দেশি গরুর দুধের দই কাঠের পাত্রে মন্থন করে কম তাপে প্রস্তুত আসল দানাদার ঘি)।
• ঘানি ভাঙা খাঁটি সরিষার তেল: ১ লিটার ৳২৯০ | ২ লিটার ৳৫৭০ (নাটোরের সেরা মাঘি সরিষা কাঠের ঘানিতে কম তাপে ভাঙানো ঝাঁঝালো তেল)।
• কোল্ড প্রেসড খাঁটি কালোজিরা তেল: ১০০ মিলি ড্রপার বোতল ৳৩৪০ | ২০০ মিলি ৳৬৫০ (কোল্ড প্রেসড, রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিতে মহৌষধ)।
• মদিনার ভিআইপি আজওয়া খেজুর: ৫০০ গ্রাম ৳১,২৫০ | ১ কেজি ৳২,৪৫০ (পবিত্র মদিনা মুনাওয়ারার বাগান থেকে সরাসরি আমদানিকৃত নরম কুচকুচে কালো এ-গ্রেড আজওয়া)।
• মদিনার প্রিমিয়াম আম্বার খেজুর: ৫০০ গ্রাম ৳১,১৫০ | ১ কেজি ৳২,২৫০ (বড় সাইজের রসালো ও সুস্বাদু মদিনার খেজুর)।
• সুন্নাহ হেলথ বুস্টার কম্বো: অফার মূল্য ৳২,৬৯০ (সুন্দরবন মধু ৫০০ গ্রাম + বিলোনা ঘি ৪০০ গ্রাম + আজওয়া খেজুর ৫০০ গ্রাম)।
• সুন্নাহ ভিআইপি গিফট বক্স: অফার মূল্য ৳৩,১৫০ (খলিসা মধু ৫০০ গ্রাম + আজওয়া খেজুর ৫০০ গ্রাম + সরিষার তেল ১ লিটার + কালোজিরা তেল ১০০ মিলি)।
• প্রিমিয়াম কাজু বাদাম: ২৫০ গ্রাম ৳৪৪০ | ৫০০ গ্রাম ৳৮৫০ (W320 জাম্বো গ্রেড হোল কাজু)।
• রোস্টেড পেস্তা বাদাম: ২৫০ গ্রাম ৳৫৯০ | ৫০০ গ্রাম ৳১,১৫০ (ক্যালিফোর্নিয়া হালকা লবণাক্ত ইন-শেল পেস্তা)।
• অর্গানিক চিয়া সিড: ২৫০ গ্রাম ৳৩৮০ | ৫০০ গ্রাম ৳৭২০ (আমদানিকৃত ওমেগা-৩ ও ফাইবার সমৃদ্ধ)।
• বাছাইকৃত প্রিমিয়াম কালোজিরা: ২০০ গ্রাম ৳১৯০ | ৫০০ গ্রাম ৳৪৫০ (ধুলোবালিমুক্ত এ-গ্রেড নাটোরের কালোজিরা)।

৪. পাইকারি (Wholesale), ডিলারশিপ ও কর্পোরেট গিফট:
- যদি কোনো গ্রাহক পাইকারি কেনা (Wholesale), দোকান বা ব্যবসার জন্য বাল্ক অর্ডার, ডিলারশিপ কিংবা কর্পোরেট গিফটিং সম্পর্কে জানতে চান, তাকে সানন্দে স্বাগত জানিয়ে বলুন যে সুন্নাহ সোর্স পাইকারি ও কর্পোরেট অর্ডারে বিশেষ মূল্যছাড় দিয়ে থাকে।
- পাইকারি ও ডিলারশিপের জন্য সরাসরি আমাদের বিজনেস ম্যানেজমেন্টের সাথে কথা বলার পরামর্শ দিন:
  হটলাইন ও হোয়াটসঅ্যাপ: 01914-612007 (সকাল ৯টা - রাত ১০টা)।

৫. ডেলিভারি, শিপিং ও রিটার্ন পলিসি:
- সারা দেশে ক্যাশ অন ডেলিভারি (Cash on Delivery / COD) সুবিধা রয়েছে।
- ঢাকা সিটিতে ডেলিভারি চার্জ মাত্র ৬০ টাকা (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)।
- ঢাকার বাইরে সারা দেশে ডেলিভারি চার্জ ১২০ টাকা (৪৮ থেকে ৭২ ঘণ্টার মধ্যে স্টেডফাস্ট কুরিয়ারের মাধ্যমে হোম ডেলিভারি)।
- যেকোনো ৩,০০০ টাকা বা তদূর্ধ্ব অর্ডারে সারা দেশে সম্পূর্ণ ফ্রি ডেলিভারি (Free Delivery)!
- ডেলিভারি ম্যানের সামনে প্যাকেট খুলে চেক করে নেওয়ার সুবিধা এবং ট্রানজিটে কোনো জার ক্ষতিগ্রস্ত বা ভাঙলে ৪৮ ঘণ্টার মধ্যে ১০০% ফ্রি রিপ্লেসমেন্ট বা ফুল রিফান্ড গ্যারান্টি।

৬. অফিসিয়াল যোগাযোগ:
- হটলাইন ও হোয়াটসঅ্যাপ: 01914-612007 (সকাল ৯টা - রাত ১০টা)
- ইমেইল: sunnahsourcebd@gmail.com
- ঠিকানা: লালমনিরহাট, বাংলাদেশ
- ওয়েবসাইট: sunnahsourcebd.com]`;

function getApiKey(): string | null {
  // Check .env.local first to guarantee freshest key even if dev server process wasn't restarted
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1] && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.error("Error reading .env.local:", err);
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided." },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();

    if (!apiKey) {
      console.error("[Gemini API Failure] GEMINI_API_KEY is not configured in environment variables.");
      return NextResponse.json({
        reply: "⚠️ [AI Configuration Error]: GEMINI_API_KEY is not configured in production environment variables. Please check Vercel settings.",
      });
    }

    // 1. Fix Multi-Turn History (Strictly prevent Google Gemini 400 errors):
    // a) The first message must have role 'user' (strip leading assistant greetings)
    // b) Roles must alternate strictly: 'user' -> 'model' -> 'user' -> 'model'
    const firstUserIndex = messages.findIndex((m) => m && m.role === "user");
    const chatMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;

    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    for (const msg of chatMessages) {
      if (!msg || typeof msg.content !== "string" || !msg.content.trim()) continue;
      const role = msg.role === "assistant" ? "model" : "user";

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += "\n" + msg.content.trim();
      } else {
        contents.push({ role, parts: [{ text: msg.content.trim() }] });
      }
    }

    // Ensure the very first item is strictly 'user'
    while (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { error: "No valid user messages found." },
        { status: 400 }
      );
    }

    // Prepend the System Instruction directly to the first user message
    // This avoids schema/model version incompatibilities with 'systemInstruction' across different Gemini models
    contents[0].parts[0].text = `${SYSTEM_INSTRUCTION}\n\n${contents[0].parts[0].text}`;

    // Verified working Google Gemini models in priority order
    const CANDIDATE_MODELS = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
    ];

    let generatedText: string | null = null;
    let lastStatus = 0;
    let lastErrorBody = "No response from Gemini API";

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            cache: "no-store",
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            generatedText = text.trim();
            break;
          }
        } else {
          lastStatus = response.status;
          lastErrorBody = await response.text();
          console.error(
            `[Gemini API Failure] Model '${model}' returned HTTP ${response.status} ${response.statusText}:`,
            lastErrorBody
          );
        }
      } catch (callErr: any) {
        lastStatus = 500;
        lastErrorBody = callErr?.message || String(callErr);
        console.error(`[Gemini API Exception] Failed calling model '${model}':`, lastErrorBody);
      }
    }

    if (!generatedText) {
      console.error(
        `[Gemini API Failure] All candidate models failed. HTTP ${lastStatus}: ${lastErrorBody}`
      );
      return NextResponse.json({
        reply: `⚠️ [Gemini API Error ${lastStatus}]: ${lastErrorBody}`,
      });
    }

    return NextResponse.json({ reply: generatedText });
  } catch (error: any) {
    console.error("[Chat Route Critical Error]:", error?.message || error);
    return NextResponse.json({
      reply: `⚠️ [Chat Route Error]: ${error?.message || "Internal server error"}`,
    });
  }
}

// Intelligent local fallback matching brand knowledge
function generateLocalFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  // Natural greeting & identity
  if (
    q.includes("কেমন আছো") ||
    q.includes("কেমন আছেন") ||
    q.includes("হ্যালো") ||
    q.includes("হাই") ||
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("সালাম") ||
    q.includes("salam") ||
    q.includes("তুমি কে") ||
    q.includes("কী করছো")
  ) {
    return `وعليكم السلام ورحمة الله وبركاته। 

আলহামদুলিল্লাহ, আল্লাহর অশেষ রহমতে আমি ভালো আছি। আমি **সুন্নাহ সোর্স (Sunnah Source)**-এর অফিসিয়াল এআই কনসিয়ার্জ ও স্বাস্থ্য পরামর্শক।

আশা করি আপনিও আল্লাহর রহমতে সুস্থ ও ভালো আছেন। খাঁটি মধু, ঘি, খেজুর, স্বাস্থ্য সুরক্ষার সুন্নাহ খাদ্যপণ্য কিংবা যেকোনো তথ্যের জন্য আজ আপনাকে কীভাবে সহায়তা করতে পারি?`;
  }

  // All Products List
  if (
    q.includes("পণ্য") ||
    q.includes("product") ||
    q.includes("মেনু") ||
    q.includes("আইটেম") ||
    q.includes("তালিকা") ||
    q.includes("কী কী আছে") ||
    q.includes("কি কি আছে")
  ) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🌿

সুন্নাহ সোর্স (Sunnah Source)-এ আমাদের সংগৃহীত সকল খাঁটি ও সুন্নাহভিত্তিক প্রাকৃতিক খাদ্যপণ্যের তালিকা:

🍯 **মধু:**
• সুন্দরবনের প্রাকৃতিক কাঁচা মধু: ৫০০ গ্রাম ৳৯৮০ | ১ কেজি ৳১,৯৫০
• সুন্দরবনের খাঁটি খলিসা মধু: ৫০০ গ্রাম ৳৯৮০ | ১ কেজি ৳১,৯৫০

🧈 **ঘি ও তেল:**
• প্রথাগত বিলোনা গাওয়া ঘি: ৪০০ গ্রাম ৳৮৮০ | ১ কেজি ৳১,৯৫০
• ঘানি ভাঙা খাঁটি সরিষার তেল: ১ লিটার ৳২৯০ | ২ লিটার ৳৫৭০
• কোল্ড প্রেসড কালোজিরা তেল: ১০০ মিলি ৳৩৪০ | ২০০ মিলি ৳৬৫০

🌴 **মদিনার খেজুর:**
• ভিআইপি আজওয়া খেজুর: ৫০০ গ্রাম ৳১,২৫০ | ১ কেজি ৳২,৪৫০
• প্রিমিয়াম আম্বার খেজুর: ৫০০ গ্রাম ৳১,১৫০ | ১ কেজি ৳২,২৫০

🥜 **ড্রাই ফ্রুটস ও সুপারফুড:**
• প্রিমিয়াম কাজু বাদাম: ২৫০ গ্রাম ৳৪৪০ | ৫০০ গ্রাম ৳৮৫০
• রোস্টেড পেস্তা বাদাম: ২৫০ গ্রাম ৳৫৯০ | ৫০০ গ্রাম ৳১,১৫০
• অর্গানিক চিয়া সিড: ২৫০ গ্রাম ৳৩৮০ | ৫০০ গ্রাম ৳৭২০
• প্রিমিয়াম কালোজিরা: ২০০ গ্রাম ৳১৯০ | ৫০০ গ্রাম ৳৪৫০

🎁 **সাশ্রয়ী কম্বো ও গিফট প্যাক:**
• সুন্নাহ হেলথ বুস্টার কম্বো: ৳২,৬৯০ (মধু + ঘি + আজওয়া খেজুর)
• সুন্নাহ ভিআইপি গিফট বক্স: ৳৩,১৫০ (খলিসা মধু + আজওয়া খেজুর + সরিষার তেল + কালোজিরা তেল)

সারা দেশে ক্যাশ অন ডেলিভারি এবং ৩,০০০ টাকার অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি! যেকোনো পণ্য অর্ডার করতে অথবা বিস্তারিত জানতে আমাদের কল বা হোয়াটসঅ্যাপ করতে পারেন: **01914-612007**।`;
  }

  // Wholesale / Dealer / Corporate
  if (
    q.includes("পাইকারি") ||
    q.includes("wholesale") ||
    q.includes("ডিলার") ||
    q.includes("ব্যবসা") ||
    q.includes("কর্পোরেট") ||
    q.includes("বাল্ক")
  ) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🤝

সুন্নাহ সোর্স পাইকারি (Wholesale), ডিলারশিপ এবং কর্পোরেট গিফটিং অর্ডারে বিশেষ আকর্ষণীয় মূল্যছাড় প্রদান করে থাকে। আমরা সততা ও আমানতদারিতার সাথে শতভাগ খাঁটি খাদ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ।

পাইকারি দরদাম, মিনিমাম অর্ডার কোয়ান্টিটি এবং ডিলারশিপের জন্য সরাসরি আমাদের বিজনেস ম্যানেজমেন্টের সাথে কথা বলুন:
📞 **হটলাইন ও WhatsApp:** 01914-612007 (সকাল ৯টা - রাত ১০টা)
📧 **ইমেইল:** sunnahsourcebd@gmail.com`;
  }

  if (q.includes("মধু") || q.includes("honey") || q.includes("চেনার উপায়") || q.includes("খলিসা")) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🍯

আমাদের সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু সরাসরি মৌয়ালদের থেকে সংগৃহীত। এটি সম্পূর্ণ অপরিশোধিত, অনফিল্টার্ড এবং কোনো প্রকার হিটিং বা সুগার সিরাপ মুক্ত।

• **সুন্দরবনের প্রাকৃতিক কাঁচা মধু:** ৫০০ গ্রাম ৳৯৮০ | ১ কেজি ৳১,৯৫০
• **খাঁটি খলিসা ফুলের মধু:** ৫০০ গ্রাম ৳৯৮০ | ১ কেজি ৳১,৯৫০

**আসল মধু চেনার সহজ উপায়:**
১. খাঁটি মধুর সুবাস প্রাকৃতিক ফুলের মতো হালকা মিষ্টি হবে, কোনো কৃত্রিম সুবাস থাকবে না।
2. কাঁচা মধুতে সামান্য প্রোপোলিস ও পরাগরেণু বা ন্যাচারাল ফেনা থাকতে পারে, যা খাঁটি হওয়ার লক্ষণ।
৩. পানিতে এক চামচ মধু দিলে তা সাথে সাথে গুলে না গিয়ে নিচে জমাট বাঁধবে।

অর্ডার করতে অথবা বিস্তারিত জানতে আমাদের কল বা হোয়াটসঅ্যাপ করতে পারেন: **01914-612007**।`;
  }

  if (q.includes("কম্বো") || q.includes("combo") || q.includes("গিফট") || q.includes("gift")) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🎁

আপনার পরিবারের সুস্বাস্থ্য সুরক্ষায় ও প্রিয়জনকে খাঁটি উপহার দিতে আমাদের ২টি জনপ্রিয় স্পেশাল প্যাকেজ রয়েছে:

১. **সুন্নাহ হেলথ বুস্টার কম্বো:**
• অফার মূল্য: মাত্র **৳২,৬৯০** (নিয়মিত ৳৩,০৫০)
• প্যাকেজে থাকছে: সুন্দরবনের খাঁটি মধু (৫০০ গ্রাম) + প্রথাগত বিলোনা গাওয়া ঘি (৪০০ গ্রাম) + মদিনার আজওয়া খেজুর (৫০০ গ্রাম)।

২. **সুন্নাহ ভিআইপি গিফট বক্স:**
• অফার মূল্য: মাত্র **৳৩,১৫০** (নিয়মিত ৳৩,৬০০)
• প্যাকেজে থাকছে: সুন্দরবন খলিসা মধু (৫০০ গ্রাম) + আজওয়া খেজুর (৫০০ গ্রাম) + ঘানি ভাঙা সরিষার তেল (১ লিটার) + খাঁটি কালোজিরা তেল (১০০ মিলি)।

উভয় কম্বোতেই সারা দেশে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। বিস্তারিত জানতে সরাসরি কল করুন: **01914-612007**।`;
  }

  if (q.includes("খেজুর") || q.includes("dates") || q.includes("আজওয়া") || q.includes("ডায়াবেটিস") || q.includes("আম্বার")) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🌴

আমাদের খেজুর সরাসরি সৌদি আরবের পবিত্র মদিনা মুনাওয়ারার নির্ভরযোগ্য বাগান থেকে আমদানিকৃত:

• **মদিনার ভিআইপি আজওয়া খেজুর:** ৫০০ গ্রাম ৳১,২৫০ | ১ কেজি ৳২,৪৫০ (ছোট-মাঝারি সাইজের নরম কুচকুচে কালো, রাসুলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়া সাল্লামের বিশেষ বরকতময় খেজুর)
• **মদিনার প্রিমিয়াম আম্বার খেজুর:** ৫০০ গ্রাম ৳১,১৫০ | ১ কেজি ৳২,২৫০ (বড় সাইজের রসালো ও অত্যন্ত সুস্বাদু)

**ডায়াবেটিসে খেজুর সেবন:**
আজওয়া খেজুরের গ্লাইসেমিক ইনডেক্স তুলনামূলকভাবে কম। তবে ডায়াবেটিস রোগীদের চিকিৎসকের পরামর্শ অনুযায়ী প্রতিদিন পরিমিত পরিমাণে (১-২টি) গ্রহণ করার পরামর্শ দেওয়া হয়।

সরাসরি অর্ডার করতে ডায়াল করুন: **01914-612007**।`;
  }

  if (q.includes("ডেলিভারি") || q.includes("delivery") || q.includes("চার্জ") || q.includes("শিপিং") || q.includes("কুরিয়ার")) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🚚

আমাদের ডেলিভারি পলিসি অত্যন্ত গ্রাহকবান্ধব:

• **ঢাকা সিটির ভেতরে:** ডেলিভারি চার্জ মাত্র **৬০ টাকা** (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)।
• **ঢাকার বাইরে (সব ৬৪ জেলায়):** ডেলিভারি চার্জ মাত্র **১২০ টাকা** (৪৮ থেকে ৭২ ঘণ্টার মধ্যে স্টেডফাস্ট কুরিয়ারে হোম ডেলিভারি)।
• **ফ্রি ডেলিভারি অফার:** যেকোনো ৩,০০০ টাকা বা তদূর্ধ্ব অর্ডারে সারা দেশে ডেলিভারি সম্পূর্ণ **ফ্রি**!
• **ক্যাশ অন ডেলিভারি:** পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করতে পারবেন।

অর্ডার করতে সরাসরি আমাদের ওয়েবসাইট ব্রাউজ করুন অথবা কল করুন: **01914-612007**।`;
  }

  if (q.includes("ঘি") || q.includes("ghee") || q.includes("বিলোনা")) {
    return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! 🧈

আমাদের **প্রথাগত বিলোনা গাওয়া ঘি** কোনো সাধারণ দুধের সর জ্বাল দেওয়া ঘি নয়। এটি প্রথাগত বিলোনা পদ্ধতিতে দেশি গরুর দুধকে প্রথমে দই পেতে, কাঠের পাত্রে মন্থন করে মাখন আলাদা করে কম তাপে প্রস্তুত করা হয়।

• **মূল্য:** ৪০০ গ্রাম কাঁচের জার ৳৮৮০ | ১ কেজি জার ৳১,৯৫০
• **বৈশিষ্ট্য:** অসাধারণ প্রাকৃতিক দানাদার টেক্সচার, খাঁটি সুবাস এবং ল্যাব সার্টিফাইড ১০০% বিশুদ্ধতা।

অর্ডার করতে যোগাযোগ করুন: **01914-612007**।`;
  }

  return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ! সুন্নাহ সোর্স (Sunnah Source)-এ আপনাকে আন্তরিক স্বাগতম। 🌿

আমরা ১০০% খাঁটি, অর্গানিক ও সুন্নাহভিত্তিক প্রাকৃতিক খাদ্য যেমন—সুন্দরবনের কাঁচা মধু, বিলোনা গাওয়া ঘি, ঘানি ভাঙা সরিষার তেল, কোল্ড প্রেসড কালোজিরা তেল, মদিনার আজওয়া খেজুর, কাজু ও পেস্তা বাদাম এবং প্রিমিয়াম চিয়া সিড সরবরাহ করি।

সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে এবং ৩,০০০ টাকার অর্ডারে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!

আপনার যেকোনো প্রশ্ন বা তাৎক্ষণিক অর্ডারের জন্য আমাদের হটলাইন অথবা হোয়াটসঅ্যাপে যোগাযোগ করুন: **01914-612007**। কীভাবে আপনাকে সাহায্য করতে পারি বলুন?`;
}
