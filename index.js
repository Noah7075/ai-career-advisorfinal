const { GoogleGenAI } = require('@google/genai');

exports.aiProxyApi = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    if (req.method !== 'POST' || !req.body) {
        return res.status(400).send({ success: false, message: 'Expected POST request with body.' });
    }
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        return res.status(500).send({ success: false, message: 'Server-side API Key not configured.' });
    }
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    const { context, text, additionalData } = req.body;
    
    let model = 'gemini-2.5-flash';
    let prompt;

    switch (context) {
        case 'recommendations':
        case 'interview_questions':
            prompt = `SECURE PROMPT: Generate JSON career advice for: ${JSON.stringify(additionalData)}`;
            break;
        case 'tts':
            model = 'gemini-2.5-flash-preview-tts';
            return res.status(400).send({ success: false, message: 'TTS logic is too complex for this simplified proxy. Requires dedicated endpoint or complex orchestration.' });
        case 'summary':
        case 'experience':
        case 'project':
        case 'interest':
        case 'cover_letter':
        case 'learning_plan':
            prompt = text;
            break;
        default:
            return res.status(400).send({ success: false, message: `Invalid context: ${context}` });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: prompt }] }]
        });

        const aiResponseText = response.text;
        
        res.status(200).json({ success: true, response: aiResponseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).send({ success: false, message: `AI Service Error: ${error.message}` });
    }
};
