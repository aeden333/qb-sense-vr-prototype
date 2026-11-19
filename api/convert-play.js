export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  const { imageData, mimeType } = request.body || {};
  if (!imageData || !mimeType) {
    return response.status(400).json({ error: 'A PDF page image is required.' });
  }

  const prompt = `Analyze this American football play diagram. Identify the play name, offensive concept, and the routes run by 3 to 5 eligible receivers.\n\nReturn only a JSON object with this exact shape:\n{\n  "name": "play name",\n  "concept": "offensive concept",\n  "receivers": [\n    {\n      "side": "left",\n      "route": "slant"\n    }\n  ]\n}\n\nUse only these route values: slant, out, comeback, curl, flat, drag, dig, post, corner, seam, sit.\nUse only these side values: left, middle, right.\nDo not include markdown, explanations, or any text outside the JSON object.`;

  try {
    const apiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageData } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const message = data?.error?.message || 'Gemini rejected the request.';
      return response.status(apiResponse.status).json({ error: message });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(function(part) { return part.text || ''; }).join('\n').trim();

    if (!text) {
      return response.status(502).json({ error: 'Gemini did not return any play data.' });
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      return response.status(502).json({ error: 'Gemini did not return valid play data.' });
    }

    let play;
    try {
      play = JSON.parse(text.slice(start, end + 1));
    } catch (error) {
      return response.status(502).json({ error: 'Gemini did not return valid play data.' });
    }

    if (!play || !Array.isArray(play.receivers) || !play.receivers.length) {
      return response.status(502).json({ error: 'Could not identify a playable route concept.' });
    }

    play.receivers = play.receivers.slice(0, 5).map(function(receiver) {
      const side = String(receiver.side || 'middle').toLowerCase();
      const route = String(receiver.route || 'slant').toLowerCase();
      return {
        side: side.includes('left') ? 'left' : side.includes('right') ? 'right' : 'middle',
        route: route
      };
    });

    return response.status(200).json({ play });
  } catch (error) {
    return response.status(500).json({ error: 'Could not convert the play.' });
  }
}
