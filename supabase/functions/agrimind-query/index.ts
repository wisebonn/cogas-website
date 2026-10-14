import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const { question } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "question required" }), { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          ok: true,
          answer: "AgriMind's full AI backend is being set up. Once OPENAI_API_KEY is configured, this will return cited answers retrieved from the knowledge base.",
          citations: [],
          skipped: true,
        }),
        { status: 200 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Embed the question
    const embRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: [question],
      }),
    });

    if (!embRes.ok) {
      return new Response(JSON.stringify({ error: "Embedding failed" }), { status: 500 });
    }

    const { data: embData } = await embRes.json();
    const queryEmbedding = embData[0].embedding;

    // Vector search
    const { data: matches } = await supabase.rpc("agrimind_search", {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          answer: "No relevant documents found in the knowledge base for that question. Try rephrasing, or add more sources in the AgriMind admin.",
          citations: [],
        }),
        { status: 200 }
      );
    }

    // Build context
    const context = matches
      .map((m: any, i: number) => `[${i + 1}] ${m.doc_title}:\n${m.content}`)
      .join("\n\n");

    // Ask GPT to answer with citations
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are AgriMind, an AI assistant for a Kenyan agri-consultancy. Answer questions using ONLY the provided context. Cite sources like [1], [2] when you use them. If the context doesn't contain the answer, say so plainly. Be concise and practical.",
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!chatRes.ok) {
      return new Response(JSON.stringify({ error: "Chat completion failed" }), { status: 500 });
    }

    const { choices } = await chatRes.json();
    const answer = choices[0].message.content;

    const citations = matches.map((m: any, i: number) => ({
      index: i + 1,
      title: m.doc_title,
      source: m.doc_source,
      similarity: m.similarity,
    }));

    return new Response(
      JSON.stringify({ ok: true, answer, citations }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});