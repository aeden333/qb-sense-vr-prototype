// Public Firebase web key, the same one the pages use.
const FIREBASE_API_KEY = 'AIzaSyDuvuM5uTaAY7tV3nazl7hZdCgC3GdxeC0';
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;
// Kept in memory, so the limit is per server instance and resets on restart.
const recent = new Map();

async function verifyUser(request) {
  const header = request.headers?.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const result = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: header.slice(7) })
  });
  if (!result.ok) return null;
  const data = await result.json();
  return data?.users?.[0]?.localId || null;
}

function overLimit(userId) {
  const now = Date.now();
  const times = (recent.get(userId) || []).filter((time) => now - time < WINDOW_MS);
  if (times.length >= LIMIT) return true;
  times.push(now);
  recent.set(userId, times);
  return false;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let userId;
  try {
    userId = await verifyUser(request);
  } catch (error) {
    return response.status(503).json({ error: 'Could not check your sign-in. Try again.' });
  }
  if (!userId) {
    return response.status(401).json({ error: 'Sign in to use AI conversion.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  const { imageData, mimeType } = request.body || {};
  if (!imageData || !mimeType) {
    return response.status(400).json({ error: 'A PDF page image is required.' });
  }
  if (!['image/jpeg', 'image/png'].includes(mimeType) || typeof imageData !== 'string' || imageData.length > 4000000) {
    return response.status(400).json({ error: 'The page image is too large or not supported.' });
  }
  if (overLimit(userId)) {
    return response.status(429).json({ error: 'Too many conversions. Wait a few minutes and try again.' });
  }

  const prompt = `Analyze this American football playbook page. It may contain one play or multiple separate play diagrams.\n\nIdentify each separate play. Do not combine routes, receivers, or concepts from different diagrams.\n\nFor each play, identify every eligible offensive player with a drawn route: wide receivers, slot receivers, tight ends, running backs, and any other skill player. Include short routes, flat routes, checkdowns, and drags.\n\nFor each individual play, return between 2 and 5 receivers, based only on the routes clearly shown in that play. Do not invent routes.\n\nReturn only a JSON object with this exact shape:\n{\n  "plays": [\n    {\n      "name": "play name",\n      "concept": "offensive concept",\n      "receivers": [\n        {\n          "side": "left",\n          "route": "slant"\n        }\n      ]\n    }\n  ]\n}\n\nUse only these route values: slant, out, comeback, curl, flat, drag, dig, post, corner, seam, sit.\nUse only these side values: left, middle, right.\nDo not include markdown, explanations, or any text outside the JSON object.`;

  function isHighDemand(message) {
    const text = String(message || '').toLowerCase();
    return text.includes('high demand') || text.includes('try again later') || text.includes('overloaded') || text.includes('unavailable');
  }

  function delay(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  async function askGemini(model) {
    return fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': '2026-05-20'
      },
      body: JSON.stringify({
        model: model,
        store: false,
        input: [
          { type: 'text', text: prompt },
          { type: 'image', data: imageData, mime_type: mimeType }
        ]
      })
    });
  }

  function extractPlays(data) {
    const steps = data?.steps || [];
    let text = '';

    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step?.type !== 'model_output') continue;
      const contents = step?.content || [];
      for (let j = 0; j < contents.length; j++) {
        if (contents[j]?.type === 'text' && contents[j]?.text) {
          text = contents[j].text;
          break;
        }
      }
      if (text) break;
    }

    if (!text && data?.output_text) text = data.output_text;
    if (!text) return [];

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return [];

    try {
      const result = JSON.parse(text.slice(start, end + 1));
      const plays = Array.isArray(result?.plays) ? result.plays : [];
      return plays.filter(function(play) {
        return play && Array.isArray(play.receivers) && play.receivers.length >= 2;
      }).slice(0, 10).map(function(play) {
        return {
          name: play.name || 'Unnamed play',
          concept: play.concept || '',
          receivers: play.receivers.slice(0, 5).map(function(receiver) {
            const side = String(receiver.side || 'middle').toLowerCase();
            const route = String(receiver.route || 'slant').toLowerCase();
            return {
              side: side.includes('left') ? 'left' : side.includes('right') ? 'right' : 'middle',
              route: route
            };
          })
        };
      });
    } catch (error) {
      return [];
    }
  }

  try {
    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let lastError = '';

    for (let attempt = 0; attempt < models.length; attempt++) {
      const apiResponse = await askGemini(models[attempt]);
      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        lastError = data?.error?.message || data?.message || 'Gemini rejected the request.';

        if (isHighDemand(lastError) && attempt < models.length - 1) {
          await delay(2000);
          continue;
        }

        if (isHighDemand(lastError)) {
          return response.status(503).json({ error: 'Gemini is temporarily busy. Wait 30–60 seconds and try again.' });
        }

        return response.status(apiResponse.status).json({ error: lastError });
      }

      const plays = extractPlays(data);
      if (plays.length) {
        return response.status(200).json({ plays: plays });
      }

      lastError = 'Gemini did not identify at least 2 routes. Try another page or enter the routes manually.';
    }

    return response.status(502).json({ error: lastError });
  } catch (error) {
    return response.status(500).json({ error: 'Could not convert the play.' });
  }
}
