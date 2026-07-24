import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware to parse JSON
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/analyze-trades", async (req, res) => {
    try {
      const { trades, isReport, riskSettings } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "A chave da API do Gemini não está configurada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const parts: any[] = [];
      let formattedTrades = '';

      trades.forEach((t: any, index: number) => {
        formattedTrades += `Operação ${index + 1}:\nData: ${t.date}, Ativo: ${t.asset}, Entrada: ${t.entryPrice}, Saída: ${t.exitPrice}, Resultado: $${t.resultValue}, Sentimento: ${t.sentiment}, Tendência: ${t.trend || 'N/A'}, Descrição: ${t.description}, Stop Financeiro Planejado: $${t.initialStopFinancial || 'N/A'}, Alvo Financeiro Planejado: $${t.targetFinancial || 'N/A'}\n\n`;
        
        if (t.imageUrl && t.imageUrl.startsWith('data:image')) {
          const mimeType = t.imageUrl.substring(5, t.imageUrl.indexOf(';'));
          const base64Data = t.imageUrl.split(',')[1];
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      });

      const riskInfo = `
      Configurações de Risco do Usuário:
      - Limite de Risco Diário: ${riskSettings?.dailyRiskLimit ? `$${riskSettings.dailyRiskLimit}` : 'Não definido'}
      - Risco Máximo por Operação: ${riskSettings?.riskPerTradeLimit ? `$${riskSettings.riskPerTradeLimit}` : 'Não definido'}
      - Máximo de Operações por Dia: ${riskSettings?.maxTradesPerDay ? riskSettings.maxTradesPerDay : 'Não definido'}
      `;

      let textPrompt = '';
      if (isReport) {
        textPrompt = `Analise minhas operações de trading e me dê insights valiosos para um relatório formal.
        ${riskInfo}
        Aqui estão as operações:
        ${formattedTrades}
        
        Por favor, forneça em HTML básico (div, p, ul, li, strong, h3, h4, sem as tags html, body, head ou marcações de bloco de código):
        1. Resumo Executivo do período analisado.
        2. Breve análise e feedback individual para cada Operação enviada (ex: "Operação 1: ...", "Operação 2: ..."), relacionando as imagens se disponíveis.
        3. Conclusão e Plano de Ação (Com foco especial em gerenciamento de risco e disciplina).`;
      } else {
        textPrompt = `Analise minhas operações de trading e me dê insights valiosos e pontos de melhoria.
        ${riskInfo}
        Aqui estão as operações:
        ${formattedTrades}
        
        Forneça:
        1. Visão Geral do Desempenho
        2. Análise de Gerenciamento de Risco (Compare os resultados com os limites configurados e os stops financeiros planejados).
        3. Pontos Fortes e Fraquezas (Foco em disciplina).
        4. Recomendações Acionáveis
        
        Se possível, identifique padrões onde eu ganho ou perco mais (ex: horários, ativos). Analise também as imagens das operações enviadas, relacionando os gráficos com o que eu descrevi nas operações. Use linguagem amigável, clara e objetiva, formatada em HTML básico (div, p, ul, li, strong, h3, h4) para que eu possa exibir diretamente no React com dangerouslySetInnerHTML (nao use tags html/body/head/markdown ou \`\`\`html).`;
      }

      parts.push({ text: textPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: parts,
        config: {
            systemInstruction: "Você é um analista de trading experiente focado em melhorar a performance de traders de varejo."
        }
      });

      let responseText = response.text || "";
      // Remove any markdown code block formatting like ```html and ```
      responseText = responseText.replace(/^```html\n?/gm, '').replace(/^```\n?/gm, '').trim();

      res.json({ analysis: responseText });
    } catch (error: any) {
      console.error("Error analyzing trades:", error);
      const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
      res.status(isQuotaError ? 429 : 500).json({ 
        error: isQuotaError 
          ? "A cota da API do Gemini foi excedida. Por favor, verifique os limites de uso da sua chave ou tente novamente mais tarde."
          : "Falha ao analisar as operações com a Inteligência Artificial.", 
        details: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
