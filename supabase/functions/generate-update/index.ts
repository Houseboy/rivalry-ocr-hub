import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's auth to verify identity
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's session
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Create service role client to check admin status (bypasses RLS)
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData) {
      console.log("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin user verified:", user.id);

    const { title, update_type, raw_notes } = await req.json();
    
    // Input validation
    if (!title || typeof title !== 'string' || title.length > 200) {
      return new Response(
        JSON.stringify({ error: "Title is required and must be less than 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validUpdateTypes = ['feature', 'improvement', 'fix', 'optimization'];
    if (!update_type || !validUpdateTypes.includes(update_type)) {
      return new Response(
        JSON.stringify({ error: `Update type must be one of: ${validUpdateTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (raw_notes && (typeof raw_notes !== 'string' || raw_notes.length > 2000)) {
      return new Response(
        JSON.stringify({ error: "Raw notes must be less than 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating update for:", title, update_type);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate detailed description using AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a system update writer for a competitive FIFA/FC gaming platform called FRT (FIFA Rivalry Tracker). 
            Your job is to write engaging, detailed update announcements that explain changes clearly.
            Always be enthusiastic but professional. Focus on how updates benefit the players.
            Respond in JSON format with these exact fields:
            - summary: A brief 1-2 sentence summary (max 150 chars)
            - detailed_description: A comprehensive description (2-3 paragraphs)
            - what_was_done: Specific technical changes made (bullet points as text)
            - why_it_was_done: The reasoning and user problems solved
            - how_it_improves: Concrete benefits and improvements for users`
          },
          {
            role: "user",
            content: `Generate a system update announcement for:
            Title: ${title}
            Update Type: ${update_type}
            Raw Notes/Context: ${raw_notes || 'General system improvement'}
            
            Make it engaging and informative for the gaming community.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_update_content",
              description: "Create structured update content",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief 1-2 sentence summary" },
                  detailed_description: { type: "string", description: "Comprehensive description" },
                  what_was_done: { type: "string", description: "Specific changes made" },
                  why_it_was_done: { type: "string", description: "Reasoning behind changes" },
                  how_it_improves: { type: "string", description: "Benefits for users" }
                },
                required: ["summary", "detailed_description", "what_was_done", "why_it_was_done", "how_it_improves"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_update_content" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData, null, 2));
    
    // Extract the function call arguments
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }
    
    const content = JSON.parse(toolCall.function.arguments);
    
    // Insert into database using service role client (to bypass RLS on system_updates)
    const { data: updateData, error: insertError } = await adminSupabase
      .from('system_updates')
      .insert({
        title,
        update_type,
        summary: content.summary,
        detailed_description: content.detailed_description,
        what_was_done: content.what_was_done,
        why_it_was_done: content.why_it_was_done,
        how_it_improves: content.how_it_improves,
        is_published: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    console.log("Update created successfully by admin:", user.id, "Update ID:", updateData.id);

    return new Response(JSON.stringify({ success: true, update: updateData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-update:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
