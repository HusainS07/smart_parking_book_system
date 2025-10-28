// app/api/contact/route.js
// Updated to use RAG microservice API

import dbConnect from "@/lib/dbConnect";
import Help from "@/models/help";

// 🔹 NEW: Call RAG Microservice API
async function askRAGService(name, email, query) {
  try {
    console.log("🔄 Calling RAG microservice...");
    
    const response = await fetch("https://rag-s-park-api.onrender.com/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        query: query
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ RAG API error:", response.status, errorText);
      throw new Error(`RAG API returned ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ RAG API response:", data);

    return {
      success: true,
      answer: data.answer,
      matched: data.matched
    };

  } catch (error) {
    console.error("❌ RAG service error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 🔹 Input validation
function validateInput(name, email, query) {
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }
  
  if (!query || query.trim().length < 3) {
    errors.push("Query must be at least 3 characters long");
  }
  
  return errors;
}

// 🔹 Main API Route handler
export async function POST(req) {
  try {
    const { name, email, query } = await req.json();

    // Validate input
    const validationErrors = validateInput(name, email, query);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validationErrors 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanQuery = query.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    // 🚀 NEW: Call RAG microservice instead of local FAQ matching
    const ragResult = await askRAGService(cleanName, cleanEmail, cleanQuery);

    if (ragResult.success && ragResult.matched) {
      // ✅ RAG service found an answer
      return new Response(
        JSON.stringify({ 
          answer: ragResult.answer,
          matched: true,
          source: "RAG microservice"
        }), 
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ⚠️ RAG service didn't find a match OR failed — save query for manual follow-up
    console.log("💾 Saving query to database for manual follow-up...");
    
    await dbConnect();
    await new Help({ 
      name: cleanName, 
      email: cleanEmail, 
      query: cleanQuery,
      timestamp: new Date(),
      status: 'pending'
    }).save();

    return new Response(
      JSON.stringify({
        answer: "Thank you for your question! We couldn't find an exact answer in our knowledge base right now, but we've registered your query and our support team will get back to you via email within 24 hours.",
        matched: false,
        registered: true
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("API error:", error.message);
    
    let errorMessage = "We're experiencing technical difficulties. Please try again in a few minutes.";
    
    if (error.message.includes("database") || error.message.includes("DB")) {
      errorMessage = "Database connection issue. Your query couldn't be saved. Please try again.";
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: "SERVER_ERROR"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


/* ==========================================
   🔻 OLD CODE - COMMENTED OUT FOR REFERENCE
   ========================================== */

/*
const faqs = [
  {
    id: 1,
    question: "What is the Smart Parking System?",
    answer: "Our Smart Parking System helps manage and optimize parking spaces efficiently using real-time tracking and automation.",
    keywords: ["smart parking", "system", "management", "optimization", "what is", "about"]
  },
  {
    id: 2,
    question: "How do I reserve a parking spot?",
    answer: "You can reserve a spot through our website or mobile app. Simply sign in, select a location, and choose an available slot.",
    keywords: ["reserve", "booking", "book", "app", "website", "slot", "how to", "steps"]
  },
  {
    id: 3,
    question: "Is online payment available?",
    answer: "Yes! We offer secure online payment gateways so you can pay easily using UPI, cards, or wallets.",
    keywords: ["payment", "online", "pay", "UPI", "cards", "wallets", "gateway", "money"]
  },
  {
    id: 4,
    question: "Can I cancel a booking?",
    answer: "Absolutely. Go to your bookings section and click cancel. Refund policies apply based on time of cancellation.",
    keywords: ["cancel", "booking", "refund", "policy", "delete", "remove"]
  },
  {
    id: 5,
    question: "Is the system available in multiple cities?",
    answer: "Currently, we operate in selected cities. We're expanding rapidly and will be in your city soon!",
    keywords: ["cities", "locations", "availability", "expansion", "where", "available"]
  },
];

// 🔹 Simple keyword-based matching as primary method
function findBestMatch(query) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  let bestMatch = { score: 0, faq: null };
  
  faqs.forEach(faq => {
    let score = 0;
    const totalKeywords = faq.keywords.length;
    
    // Check keyword matches
    faq.keywords.forEach(keyword => {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 2; // Exact keyword match gets high score
      }
    });
    
    // Check individual word matches
    queryWords.forEach(word => {
      faq.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())) {
          score += 1; // Partial match gets lower score
        }
      });
      
      // Also check against question and answer
      if (faq.question.toLowerCase().includes(word) || faq.answer.toLowerCase().includes(word)) {
        score += 0.5;
      }
    });
    
    // Normalize score
    const normalizedScore = score / (totalKeywords + queryWords.length);
    
    if (normalizedScore > bestMatch.score) {
      bestMatch = { score: normalizedScore, faq };
    }
  });
  
  return bestMatch;
}

//  OpenRouter Chat Completion API
async function getChatCompletion(prompt) {
  try {
    // Validate environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set in environment variables");
    }

    console.log("Sending request to OpenRouter with prompt:", prompt);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.YOUR_SITE_URL || "https://yourwebsite.com",
        "X-Title": process.env.YOUR_SITE_NAME || "Smart Parking System",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tngtech/deepseek-r1t2-chimera:free",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful customer service assistant for a Smart Parking System. Your goal is to provide a clear, concise, and natural response to the user's question, rephrasing the provided FAQ answer to match the user's query style and intent. Do not mention that the response is based on an FAQ. Keep the tone friendly and professional. Only 2-3 lines are needed for the response.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 350,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenRouter API error:", res.status, errorText);
      throw new Error(`OpenRouter API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log("OpenRouter API response:", JSON.stringify(data, null, 2));

    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No valid response content from OpenRouter API");
    }

    // Clean up the response
    const cleanedText = generatedText.trim();
    if (!cleanedText) {
      throw new Error("Empty response from OpenRouter API");
    }

    return cleanedText;
  } catch (error) {
    console.error("Chat completion error:", error.message);
    return null; // Fallback to FAQ answer
  }
}
*/