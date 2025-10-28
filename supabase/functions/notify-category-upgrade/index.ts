import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CategoryUpgradeNotification {
  athleteName: string;
  athleteEmail: string;
  oldCategory: string;
  newCategory: string;
  points: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { athleteName, athleteEmail, oldCategory, newCategory, points }: CategoryUpgradeNotification = await req.json();

    console.log("Sending category upgrade notification to:", athleteEmail);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Categoria Certa <onboarding@resend.dev>",
        to: [athleteEmail],
        subject: `🎉 Parabéns! Você subiu para a categoria ${newCategory}!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                }
                .content {
                  background: white;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                  border-radius: 0 0 10px 10px;
                }
                .trophy {
                  font-size: 48px;
                  margin-bottom: 10px;
                }
                .category-badge {
                  display: inline-block;
                  padding: 8px 16px;
                  background: #fbbf24;
                  color: #78350f;
                  border-radius: 20px;
                  font-weight: bold;
                  margin: 10px 5px;
                }
                .points {
                  font-size: 32px;
                  color: #0ea5e9;
                  font-weight: bold;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="trophy">🏆</div>
                <h1>Parabéns, ${athleteName}!</h1>
                <p>Você conquistou uma nova categoria!</p>
              </div>
              <div class="content">
                <h2>Você subiu de categoria!</h2>
                <p>Seu desempenho nas quadras foi reconhecido:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <span class="category-badge">${oldCategory}</span>
                  <span style="font-size: 24px;">→</span>
                  <span class="category-badge">${newCategory}</span>
                </div>
                
                <p class="points">${points} pontos</p>
                
                <p>Continue treinando e participando dos torneios para alcançar ainda mais conquistas!</p>
                
                <p><strong>Próximos passos:</strong></p>
                <ul>
                  <li>Confira os próximos torneios da sua nova categoria</li>
                  <li>Atualize suas redes sociais com sua conquista</li>
                  <li>Continue acumulando pontos para subir ainda mais</li>
                </ul>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${Deno.env.get('SUPABASE_URL')}" 
                     style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Ver Ranking
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Categoria Certa - Acompanhe sua evolução no Beach Tennis</p>
                <p>Esta é uma mensagem automática do sistema</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-category-upgrade function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
