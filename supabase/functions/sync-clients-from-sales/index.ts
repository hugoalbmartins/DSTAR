import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("client_name, client_nif, client_email, client_phone, client_type, portfolio_status, created_at")
      .not("client_nif", "is", null)
      .neq("client_nif", "")
      .not("client_name", "is", null)
      .neq("client_name", "")
      .order("created_at", { ascending: false });

    if (salesError) {
      throw new Error(`Error fetching sales: ${salesError.message}`);
    }

    const uniqueClients = new Map();
    for (const sale of sales || []) {
      if (!uniqueClients.has(sale.client_nif)) {
        uniqueClients.set(sale.client_nif, {
          nif: sale.client_nif,
          name: sale.client_name.trim(),
          email: sale.client_email?.trim() || null,
          phone: sale.client_phone?.trim() || null,
          client_type: sale.client_type || "residencial",
          portfolio_status: sale.client_type === "empresarial" ? (sale.portfolio_status || "novo") : null,
        });
      }
    }

    const { data: existingClients, error: clientsError } = await supabase
      .from("clients")
      .select("nif")
      .in("nif", Array.from(uniqueClients.keys()));

    if (clientsError) {
      throw new Error(`Error fetching existing clients: ${clientsError.message}`);
    }

    const existingNifs = new Set(existingClients?.map(c => c.nif) || []);

    const clientsToCreate = Array.from(uniqueClients.values()).filter(
      client => !existingNifs.has(client.nif)
    );

    let created = 0;
    let errors = [];

    if (clientsToCreate.length > 0) {
      for (const client of clientsToCreate) {
        const { error } = await supabase
          .from("clients")
          .insert(client);

        if (error) {
          errors.push({ nif: client.nif, error: error.message });
        } else {
          created++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronization complete`,
        stats: {
          total_sales: sales?.length || 0,
          unique_clients: uniqueClients.size,
          existing_clients: existingNifs.size,
          clients_created: created,
          errors: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
