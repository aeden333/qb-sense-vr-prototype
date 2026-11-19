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

  const prompt = `Analyze this American football play diagram. Return ONLY valid JSON with this exact structure:
{
  "name": "play name",
  "concept": "offensive concept",
  "receivers": [
    {
      "side": "left|middle|right",
      "route": "slant|out|comeback|curl|flat|drag|dig|post|corner|seam|sit"
    }
  ]
}
Use 3 to 5 receivers. Do not include explanations, markdown, or extra text.`;

  try {
    const apiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageData } }
            ]
          }]
        })
      }
    );

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonText = text.replace(/^```json\\s*/i, '').replace(/\\s*```$/i, '');
    let play;
    try {
      play = JSON.parse(jsonText);
    } catch (error) {
      return response.status(502).json({ error: 'Gemini did not return valid play data.' });
    }

    if (!play || !Array.isArray(play.receivers) || !play.receivers.length) {
      return response.status(502).json({ error: 'Could not identify a playable route concept.' });
    }

    return response.status(200).json({ play });
  } catch (error) {
    return response.status(500).json({ error: 'Could not convert the play.' });
  }
}
