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
    const apiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': '2026-05-20'
      },
      body: JSON.stringify({
        model: 'gemini-3.8-flash',
        store: false,
        input: [
          { type: 'text', text: prompt },
          { type: 'image', data: imageData, mime_type: mimeType }
        ]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const message = data?.error?.message || data?.message || 'Gemini rejected the request.';
      return response.status(apiResponse.status).json({ error: message });
    }

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
