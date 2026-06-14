// app/api/contact/route.js
// Updated to use RAG microservice API + PostgreSQL

import { query } from "@/lib/db";

// 🔹 NEW: Call RAG Microservice API
async function askRAGService(name, email, queryText) {
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
        query: queryText
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
function validateInput(name, email, queryText) {
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }
  
  if (!queryText || queryText.trim().length < 3) {
    errors.push("Query must be at least 3 characters long");
  }
  
  return errors;
}

// 🔹 Main API Route handler
export async function POST(req) {
  try {
    const { name, email, query: userQuery } = await req.json();

    // Validate input
    const validationErrors = validateInput(name, email, userQuery);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validationErrors 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanQuery = userQuery.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    // Call RAG microservice
    const ragResult = await askRAGService(cleanName, cleanEmail, cleanQuery);

    if (ragResult.success && ragResult.matched) {
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

    // RAG service didn't find a match OR failed — save query for manual follow-up
    console.log("💾 Saving query to database for manual follow-up...");

    await query(
      'INSERT INTO help_tickets (name, email, query) VALUES ($1, $2, $3)',
      [cleanName, cleanEmail, cleanQuery]
    );

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