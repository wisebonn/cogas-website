import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "OPENAI_API_KEY not set" }),
        { status: 200 }
      );
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId required" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch the document
    const { data: doc, error: docErr } = await supabase
      .from("agrimind_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), { status: 404 });
    }

    // Chunk the content (~1000 chars per chunk, 200 overlap)
    const CHUNK_SIZE = 1000;
    const OVERLAP = 200;
    const chunks: string[] = [];
    const text = doc.content;
    for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
      if (i + CHUNK_SIZE >= text.length) break;
    }

    // Get embeddings from OpenAI
    const embRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: chunks,
      }),
    });

    if (!embRes.ok) {
      const err = await embRes.text();
      return new Response(JSON.stringify({ error: "OpenAI error: " + err }), { status: 500 });
    }

    const { data: embData } = await embRes.json();

    // Delete existing chunks for this doc
    await supabase.from("agrimind_chunks").delete().eq("document_id", documentId);

    // Insert new chunks with embeddings
    const rows = chunks.map((content, i) => ({
      document_id: documentId,
      chunk_index: i,
      content,
      tokens: Math.round(content.length / 4),
      embedding: embData[i].embedding,
    }));

    const { error: insErr } = await supabase.from("agrimind_chunks").insert(rows);
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ ok: true, chunksCreated: rows.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});