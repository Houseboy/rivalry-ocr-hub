import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== VALIDATION RULES ====================
interface ValidationRule {
  min?: number;
  max?: number;
  type: 'integer' | 'percentage' | 'string';
  required?: boolean;
}

const VALIDATION_RULES: Record<string, ValidationRule> = {
  user_score: { type: 'integer', min: 0, max: 20, required: true },
  rival_score: { type: 'integer', min: 0, max: 20, required: true },
  possession: { type: 'percentage', min: 0, max: 100 },
  totalShots: { type: 'integer', min: 0, max: 50 },
  shotsOnTarget: { type: 'integer', min: 0, max: 30 },
  fouls: { type: 'integer', min: 0, max: 30 },
  offsides: { type: 'integer', min: 0, max: 20 },
  cornerKicks: { type: 'integer', min: 0, max: 20 },
  freeKicks: { type: 'integer', min: 0, max: 30 },
  passes: { type: 'integer', min: 0, max: 1000 },
  successfulPasses: { type: 'integer', min: 0, max: 1000 },
  crosses: { type: 'integer', min: 0, max: 50 },
  interceptions: { type: 'integer', min: 0, max: 50 },
  tackles: { type: 'integer', min: 0, max: 50 },
  saves: { type: 'integer', min: 0, max: 20 },
  rivalPossession: { type: 'percentage', min: 0, max: 100 },
  rivalTotalShots: { type: 'integer', min: 0, max: 50 },
  rivalShotsOnTarget: { type: 'integer', min: 0, max: 30 },
  rivalFouls: { type: 'integer', min: 0, max: 30 },
  rivalOffsides: { type: 'integer', min: 0, max: 20 },
  rivalCornerKicks: { type: 'integer', min: 0, max: 20 },
  rivalFreeKicks: { type: 'integer', min: 0, max: 30 },
  rivalPasses: { type: 'integer', min: 0, max: 1000 },
  rivalSuccessfulPasses: { type: 'integer', min: 0, max: 1000 },
  rivalCrosses: { type: 'integer', min: 0, max: 50 },
  rivalInterceptions: { type: 'integer', min: 0, max: 50 },
  rivalTackles: { type: 'integer', min: 0, max: 50 },
  rivalSaves: { type: 'integer', min: 0, max: 20 },
};

// ==================== VALIDATION FUNCTIONS ====================
function validateStat(key: string, value: any): { valid: boolean; cleanedValue: any; error?: string } {
  const rule = VALIDATION_RULES[key];
  if (!rule) {
    return { valid: true, cleanedValue: value };
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    if (rule.required) {
      return { valid: false, cleanedValue: null, error: `${key} is required` };
    }
    return { valid: true, cleanedValue: null };
  }

  // Parse the value
  let numericValue: number;
  if (typeof value === 'string') {
    // Handle percentage strings like "45%"
    const cleanStr = value.replace('%', '').trim();
    numericValue = parseFloat(cleanStr);
  } else {
    numericValue = Number(value);
  }

  // Check if it's a valid number
  if (isNaN(numericValue)) {
    return { valid: false, cleanedValue: null, error: `${key} is not a valid number` };
  }

  // For integers, round the value
  if (rule.type === 'integer') {
    numericValue = Math.round(numericValue);
  }

  // Check range
  if (rule.min !== undefined && numericValue < rule.min) {
    return { valid: false, cleanedValue: null, error: `${key} is below minimum (${rule.min})` };
  }
  if (rule.max !== undefined && numericValue > rule.max) {
    return { valid: false, cleanedValue: null, error: `${key} is above maximum (${rule.max})` };
  }

  return { valid: true, cleanedValue: numericValue };
}

function validateAndCleanData(data: Record<string, any>): { 
  cleanedData: Record<string, any>; 
  errors: string[];
  confidence: number;
} {
  const cleanedData: Record<string, any> = {};
  const errors: string[] = [];
  let validCount = 0;
  let totalChecked = 0;

  for (const [key, value] of Object.entries(data)) {
    totalChecked++;
    const result = validateStat(key, value);
    
    if (result.valid) {
      cleanedData[key] = result.cleanedValue;
      if (result.cleanedValue !== null) {
        validCount++;
      }
    } else {
      cleanedData[key] = null;
      if (result.error) {
        errors.push(result.error);
      }
    }
  }

  // Additional cross-validation
  if (cleanedData.possession !== null && cleanedData.rivalPossession !== null) {
    const totalPossession = cleanedData.possession + cleanedData.rivalPossession;
    if (totalPossession < 98 || totalPossession > 102) {
      // Possessions should add up to ~100%
      console.log(`Possession mismatch: ${cleanedData.possession} + ${cleanedData.rivalPossession} = ${totalPossession}`);
      // Adjust if close enough
      if (totalPossession > 0 && totalPossession < 200) {
        const ratio = 100 / totalPossession;
        cleanedData.possession = Math.round(cleanedData.possession * ratio);
        cleanedData.rivalPossession = 100 - cleanedData.possession;
      }
    }
  }

  // Shots on target should not exceed total shots
  if (cleanedData.shotsOnTarget !== null && cleanedData.totalShots !== null) {
    if (cleanedData.shotsOnTarget > cleanedData.totalShots) {
      errors.push('Shots on target exceeds total shots');
      cleanedData.shotsOnTarget = cleanedData.totalShots;
    }
  }
  if (cleanedData.rivalShotsOnTarget !== null && cleanedData.rivalTotalShots !== null) {
    if (cleanedData.rivalShotsOnTarget > cleanedData.rivalTotalShots) {
      errors.push('Rival shots on target exceeds rival total shots');
      cleanedData.rivalShotsOnTarget = cleanedData.rivalTotalShots;
    }
  }

  // Successful passes should not exceed total passes
  if (cleanedData.successfulPasses !== null && cleanedData.passes !== null) {
    if (cleanedData.successfulPasses > cleanedData.passes) {
      cleanedData.successfulPasses = cleanedData.passes;
    }
  }
  if (cleanedData.rivalSuccessfulPasses !== null && cleanedData.rivalPasses !== null) {
    if (cleanedData.rivalSuccessfulPasses > cleanedData.rivalPasses) {
      cleanedData.rivalSuccessfulPasses = cleanedData.rivalPasses;
    }
  }

  const confidence = totalChecked > 0 ? (validCount / totalChecked) * 100 : 0;

  return { cleanedData, errors, confidence };
}

// ==================== AI EXTRACTION ====================
async function extractWithLovableAI(
  imageBase64: string, 
  apiKey: string, 
  attemptNumber: number = 1
): Promise<Record<string, any>> {
  const systemPrompt = attemptNumber === 1 
    ? `You are an expert football/soccer match statistics analyzer with computer vision capabilities. Your task is to extract ALL visible match statistics from game screenshots (FIFA, EA FC, eFootball, PES, FC Mobile, etc.).

CRITICAL EXTRACTION RULES:
1. Read EVERY number and statistic visible on the screen
2. The USER/PLAYER is typically on the LEFT side or marked as HOME
3. The OPPONENT/RIVAL is typically on the RIGHT side or marked as AWAY
4. Numbers must be extracted EXACTLY as shown - do not estimate
5. If possession is shown as percentages, extract both values
6. For stats like "Shots (On Target)", extract both total and on-target values

COMMON STAT LABELS TO LOOK FOR:
- Score (goals for each team)
- Possession % 
- Shots / Total Shots
- Shots on Target / On Target
- Passes / Total Passes
- Pass Accuracy % / Successful Passes
- Fouls / Fouls Committed
- Corners / Corner Kicks
- Offsides
- Free Kicks
- Tackles
- Interceptions
- Crosses
- Saves

RETURN FORMAT (strict JSON):
{
  "user_score": <integer>,
  "rival_score": <integer>,
  "rival_name": "<opponent team/player name if visible, otherwise 'Opponent'>",
  "platform": "<game name: FIFA 24, EA FC 25, eFootball, FC Mobile, etc.>",
  "possession": <integer 0-100>,
  "totalShots": <integer>,
  "shotsOnTarget": <integer>,
  "fouls": <integer>,
  "offsides": <integer>,
  "cornerKicks": <integer>,
  "freeKicks": <integer>,
  "passes": <integer>,
  "successfulPasses": <integer>,
  "crosses": <integer>,
  "interceptions": <integer>,
  "tackles": <integer>,
  "saves": <integer>,
  "rivalPossession": <integer 0-100>,
  "rivalTotalShots": <integer>,
  "rivalShotsOnTarget": <integer>,
  "rivalFouls": <integer>,
  "rivalOffsides": <integer>,
  "rivalCornerKicks": <integer>,
  "rivalFreeKicks": <integer>,
  "rivalPasses": <integer>,
  "rivalSuccessfulPasses": <integer>,
  "rivalCrosses": <integer>,
  "rivalInterceptions": <integer>,
  "rivalTackles": <integer>,
  "rivalSaves": <integer>,
  "extraction_confidence": "<high/medium/low based on image clarity>"
}

Use null for any stat that is NOT clearly visible. Do NOT guess or estimate values.`
    : `You are a secondary OCR verification system. Re-analyze this football match screenshot with EXTRA ATTENTION to:
1. Reading numbers character by character
2. Distinguishing between similar digits (0 vs O, 1 vs l, 5 vs S, 8 vs B)
3. Identifying the correct team sides (left=user, right=rival)
4. Extracting the scoreline very carefully

Focus on extracting these CRITICAL stats:
- Final score (user_score, rival_score)
- Possession percentages
- Shots and shots on target
- Passes (total and successful if available)

Return the same JSON structure. Be extremely precise with numbers.`;

  console.log(`[OCR] Lovable AI extraction attempt ${attemptNumber}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: attemptNumber === 1 
                ? "Analyze this match statistics screenshot and extract all visible data. Return only valid JSON."
                : "Re-analyze this screenshot carefully. Focus on reading each number precisely. Return only valid JSON.",
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OCR] AI Gateway error:`, response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 402) {
      throw new Error("CREDITS_EXHAUSTED");
    }
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("Empty AI response");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("[OCR] Failed to parse AI response:", content);
    throw new Error("Invalid JSON response from AI");
  }
}

// ==================== RESULT MAPPING ====================
function mapToSchema(aiResponse: Record<string, any>): Record<string, any> {
  // Map various possible field names to our schema
  const mappings: Record<string, string[]> = {
    user_score: ['user_score', 'userScore', 'home_score', 'homeScore', 'player_score', 'playerScore'],
    rival_score: ['rival_score', 'rivalScore', 'away_score', 'awayScore', 'opponent_score', 'opponentScore'],
    rival_name: ['rival_name', 'rivalName', 'away_team', 'awayTeam', 'opponent', 'opponent_name'],
    platform: ['platform', 'game', 'game_name', 'gameName'],
    possession: ['possession', 'user_possession', 'userPossession', 'home_possession', 'homePossession'],
    totalShots: ['totalShots', 'total_shots', 'shots', 'user_shots', 'userShots'],
    shotsOnTarget: ['shotsOnTarget', 'shots_on_target', 'on_target', 'user_shots_on_target'],
    fouls: ['fouls', 'user_fouls', 'userFouls', 'home_fouls'],
    offsides: ['offsides', 'user_offsides', 'userOffsides', 'home_offsides'],
    cornerKicks: ['cornerKicks', 'corner_kicks', 'corners', 'user_corners'],
    freeKicks: ['freeKicks', 'free_kicks', 'user_free_kicks'],
    passes: ['passes', 'total_passes', 'user_passes', 'userPasses'],
    successfulPasses: ['successfulPasses', 'successful_passes', 'accurate_passes', 'user_successful_passes'],
    crosses: ['crosses', 'user_crosses', 'userCrosses'],
    interceptions: ['interceptions', 'user_interceptions', 'userInterceptions'],
    tackles: ['tackles', 'user_tackles', 'userTackles'],
    saves: ['saves', 'user_saves', 'userSaves', 'goalkeeper_saves'],
    rivalPossession: ['rivalPossession', 'rival_possession', 'away_possession', 'opponent_possession'],
    rivalTotalShots: ['rivalTotalShots', 'rival_total_shots', 'rival_shots', 'away_shots'],
    rivalShotsOnTarget: ['rivalShotsOnTarget', 'rival_shots_on_target', 'away_shots_on_target'],
    rivalFouls: ['rivalFouls', 'rival_fouls', 'away_fouls'],
    rivalOffsides: ['rivalOffsides', 'rival_offsides', 'away_offsides'],
    rivalCornerKicks: ['rivalCornerKicks', 'rival_corner_kicks', 'rival_corners', 'away_corners'],
    rivalFreeKicks: ['rivalFreeKicks', 'rival_free_kicks', 'away_free_kicks'],
    rivalPasses: ['rivalPasses', 'rival_passes', 'away_passes'],
    rivalSuccessfulPasses: ['rivalSuccessfulPasses', 'rival_successful_passes', 'away_successful_passes'],
    rivalCrosses: ['rivalCrosses', 'rival_crosses', 'away_crosses'],
    rivalInterceptions: ['rivalInterceptions', 'rival_interceptions', 'away_interceptions'],
    rivalTackles: ['rivalTackles', 'rival_tackles', 'away_tackles'],
    rivalSaves: ['rivalSaves', 'rival_saves', 'away_saves'],
  };

  const result: Record<string, any> = {};

  for (const [targetField, possibleNames] of Object.entries(mappings)) {
    for (const name of possibleNames) {
      if (aiResponse[name] !== undefined) {
        result[targetField] = aiResponse[name];
        break;
      }
    }
    if (result[targetField] === undefined) {
      result[targetField] = null;
    }
  }

  return result;
}

// ==================== MAIN HANDLER ====================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[OCR] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[OCR] Processing screenshot for user: ${user.id}`);

    const { imageBase64 } = await req.json();
    
    // Input validation
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: "No valid image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Size check (~10MB limit)
    const MAX_BASE64_LENGTH = 13 * 1024 * 1024;
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ==================== PRIMARY OCR (Lovable AI Vision) ====================
    let primaryResult: Record<string, any> | null = null;
    let primaryValidation: { cleanedData: Record<string, any>; errors: string[]; confidence: number } | null = null;

    try {
      console.log("[OCR] Starting primary extraction with Lovable AI Vision...");
      const rawResult = await extractWithLovableAI(imageBase64, LOVABLE_API_KEY, 1);
      const mappedResult = mapToSchema(rawResult);
      primaryValidation = validateAndCleanData(mappedResult);
      primaryResult = primaryValidation.cleanedData;
      
      console.log(`[OCR] Primary extraction confidence: ${primaryValidation.confidence.toFixed(1)}%`);
      if (primaryValidation.errors.length > 0) {
        console.log(`[OCR] Primary validation errors:`, primaryValidation.errors);
      }
    } catch (error) {
      console.error("[OCR] Primary extraction failed:", error);
      if (error instanceof Error) {
        if (error.message === "RATE_LIMIT") {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (error.message === "CREDITS_EXHAUSTED") {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ==================== SECONDARY OCR (Retry with different prompt) ====================
    // If primary extraction has low confidence or missing critical data, try again
    const needsRetry = !primaryResult || 
      primaryResult.user_score === null || 
      primaryResult.rival_score === null ||
      (primaryValidation && primaryValidation.confidence < 50);

    if (needsRetry) {
      console.log("[OCR] Starting secondary extraction attempt...");
      try {
        const secondaryRaw = await extractWithLovableAI(imageBase64, LOVABLE_API_KEY, 2);
        const secondaryMapped = mapToSchema(secondaryRaw);
        const secondaryValidation = validateAndCleanData(secondaryMapped);
        
        console.log(`[OCR] Secondary extraction confidence: ${secondaryValidation.confidence.toFixed(1)}%`);

        // Merge results - prefer secondary for fields that failed validation in primary
        if (primaryResult) {
          for (const [key, value] of Object.entries(secondaryValidation.cleanedData)) {
            if (primaryResult[key] === null && value !== null) {
              primaryResult[key] = value;
            }
          }
          // Recalculate confidence after merge
          const mergedValidation = validateAndCleanData(primaryResult);
          primaryValidation = mergedValidation;
        } else {
          primaryResult = secondaryValidation.cleanedData;
          primaryValidation = secondaryValidation;
        }
      } catch (error) {
        console.error("[OCR] Secondary extraction failed:", error);
      }
    }

    // ==================== FINAL VALIDATION ====================
    if (!primaryResult || primaryResult.user_score === null || primaryResult.rival_score === null) {
      console.error("[OCR] Failed to extract critical match data");
      return new Response(
        JSON.stringify({ 
          error: "Could not extract match data from the image. Please ensure the screenshot clearly shows the match statistics.",
          details: primaryValidation?.errors || []
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build final output
    const extractedData = {
      user_score: primaryResult.user_score,
      rival_score: primaryResult.rival_score,
      rival_name: primaryResult.rival_name || "Opponent",
      platform: primaryResult.platform || "FIFA 24",
      
      // User stats (map to database column names)
      possession: primaryResult.possession,
      totalShots: primaryResult.totalShots,
      shotsOnTarget: primaryResult.shotsOnTarget,
      fouls: primaryResult.fouls,
      offsides: primaryResult.offsides,
      cornerKicks: primaryResult.cornerKicks,
      freeKicks: primaryResult.freeKicks,
      passes: primaryResult.passes,
      successfulPasses: primaryResult.successfulPasses,
      crosses: primaryResult.crosses,
      interceptions: primaryResult.interceptions,
      tackles: primaryResult.tackles,
      saves: primaryResult.saves,
      
      // Rival stats
      rivalPossession: primaryResult.rivalPossession,
      rivalTotalShots: primaryResult.rivalTotalShots,
      rivalShotsOnTarget: primaryResult.rivalShotsOnTarget,
      rivalFouls: primaryResult.rivalFouls,
      rivalOffsides: primaryResult.rivalOffsides,
      rivalCornerKicks: primaryResult.rivalCornerKicks,
      rivalFreeKicks: primaryResult.rivalFreeKicks,
      rivalPasses: primaryResult.rivalPasses,
      rivalSuccessfulPasses: primaryResult.rivalSuccessfulPasses,
      rivalCrosses: primaryResult.rivalCrosses,
      rivalInterceptions: primaryResult.rivalInterceptions,
      rivalTackles: primaryResult.rivalTackles,
      rivalSaves: primaryResult.rivalSaves,
      
      // Metadata
      extraction_confidence: primaryValidation?.confidence || 0,
      validation_errors: primaryValidation?.errors || [],
    };

    console.log(`[OCR] Successfully extracted match data. Score: ${extractedData.user_score}-${extractedData.rival_score}, Confidence: ${extractedData.extraction_confidence.toFixed(1)}%`);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[OCR] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
