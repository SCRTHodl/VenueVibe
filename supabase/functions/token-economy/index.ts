import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TokenEconomyRequest {
  action: 'mint' | 'award' | 'balance';
  userId: string;
  amount?: number;
  reason?: string;
  eventId?: string;
}

interface TokenEconomyResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const createResponse = (
  success: boolean,
  message?: string,
  data?: Record<string, unknown>,
  status: number = 200
) => {
  return new Response(
    JSON.stringify({ success, message, data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as TokenEconomyRequest;

    switch (body.action) {
      case 'mint': {
        if (!body.amount || !body.reason || !body.eventId) {
          return createResponse(
            false,
            'Missing required parameters for mint action'
          );
        }

        const { data: mintResult, error: mintError } = await supabase
          .from("event_nfts")
          .insert([{
            event_id: body.eventId,
            owner_id: body.userId,
            amount: body.amount,
            reason: body.reason,
            created_at: new Date().toISOString()
          }])
          .select();

        if (mintError) throw mintError;

        return createResponse(
          true,
          'NFT minted successfully',
          mintResult
        );
      }

      case 'award': {
        if (!body.reason) {
          return createResponse(
            false,
            'Missing required parameters for award action'
          );
        }

        const { data: awardResult, error: awardError } = await supabase
          .from("event_badges")
          .insert([{
            event_id: body.eventId,
            user_id: body.userId,
            reason: body.reason,
            created_at: new Date().toISOString()
          }])
          .select();

        if (awardError) throw awardError;

        return createResponse(
          true,
          'Badge awarded successfully',
          awardResult
        );
      }

      case 'balance': {
        const { data: balanceResult, error: balanceError } = await supabase
          .from("user_tokens")
          .select("sum(amount) as total")
          .eq("user_id", body.userId)
          .single();

        if (balanceError) throw balanceError;

        return createResponse(
          true,
          'Balance retrieved successfully',
          {
            total: balanceResult?.total || 0
          }
        );
      }

      default:
        return createResponse(
          false,
          'Invalid action'
        );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return createResponse(
      false,
      'Internal server error',
      undefined,
      500
    );
  }
});
