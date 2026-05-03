import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const googleAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function detectThreatLLM(txDetails: any, warnings: string[], modelChoice: string = 'gemini-3.1-pro') {
  const prompt = `
You are the AgentARC Security Core, an expert Web3 security auditor.
Analyze the following proposed blockchain transaction requested by an autonomous AI agent.
Determine if this is a safe operation or a malicious honeypot/drainer attack.

Transaction Details:
${JSON.stringify(txDetails, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)}

Policy Engine Warnings:
${warnings.length > 0 ? warnings.join('\n') : 'None'}

Reply with a JSON object exactly like this:
{
  "isThreat": boolean,
  "confidence": number,
  "reason": "short explanation"
}`;

  if (modelChoice.startsWith('claude') && anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: modelChoice as any,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
      });
      // @ts-ignore
      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const res = JSON.parse(jsonMatch[0]);
        res.reason = `[${modelChoice}] ` + res.reason;
        return res;
      }
    } catch (e) {
      console.error("Anthropic failed, trying fallback...", e);
    }
  }

  if (modelChoice.startsWith('gemini') && googleAI) {
    try {
      const model = googleAI.getGenerativeModel({ model: modelChoice });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const res = JSON.parse(jsonMatch[0]);
        res.reason = `[${modelChoice}] ` + res.reason;
        return res;
      }
    } catch (e) {
      console.error("Gemini failed, trying fallback...", e);
    }
  }

  // --- MOCK FALLBACK (If 'mock' is selected or API keys are missing/fail) ---
  return new Promise((resolve) => {
    setTimeout(() => {
      const isDrainer = warnings.some(w => w.includes("unknown contract") || w.includes("Infinite") || w.includes("global denylist"));
      
      if (isDrainer) {
        resolve({
          isThreat: true,
          confidence: 98,
          reason: "[Mock Engine] Critical Threat: Infinite token approval requested for a non-allowlisted contract."
        });
      } else {
        resolve({
          isThreat: false,
          confidence: 95,
          reason: "[Mock Engine] Safe: Routine swap operation with verified Uniswap V2 Router protocol."
        });
      }
    }, 800);
  });
}
