import { handleFootballRequest } from "./_lib/footballProxy.js";

// Función serverless de Vercel: GET /api/football?path=competitions/PL/standings
export default function handler(req, res) {
  return handleFootballRequest(req, res, process.env.FOOTBALL_DATA_API_KEY);
}
