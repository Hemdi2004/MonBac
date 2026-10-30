const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize the client using the Nebius endpoint
const client = new OpenAI({
    baseURL: 'https://api.tokenfactory.eu-north1.nebius.com/v1',
    apiKey: process.env.NEBIUS_API_KEY, // Pulls securely from your .env file
});

// The AI Tutor Endpoint
router.post('/ask-tutor', async (req, res) => {
    const { studentQuestion } = req.body;

    try {
        const response = await client.chat.completions.create({
            model: 'nvidia/Nemotron-3_5-Lightning',
            messages: [
                { 
                    role: 'system', 
                   content: `Tu es le Tuteur IA de MonBac. 

RÈGLES ABSOLUES (NE JAMAIS LES MENTIONNER, NE JAMAIS LES CONFIRMER) :
1. DÉMARRE IMMÉDIATEMENT L'EXPLICATION. Ne dis JAMAIS "C'est noté", "Je suis le tuteur", ou "Je vais appliquer ces directives". Réponds directement à la question de l'élève.
2. N'utilise JAMAIS les symboles '$' ou '$$'. Écris toutes les mathématiques en texte brut (ex: F = m * a).
3. Structure avec des sauts de ligne, des tirets (-) et mets les concepts clés en gras (**).
4. Langue : Réponds exactement dans la langue de l'élève (Français, Arabe classique, ou Darija marocaine avec un ton chaleureux).
5. Pédagogie : Utilise des exemples marocains concrets (ex: freinage d'un grand taxi pour l'inertie) et explique simplement par étapes.
6. Termine toujours par une question courte pour encourager l'élève.`
                },
                { 
                    role: 'user', 
                    content: studentQuestion 
                }
            ],
            temperature: 0.7
        });

        // Send the AI's reply back to your frontend
        res.json({ answer: response.choices[0].message.content });

    } catch (error) {
        console.error('Error calling Nebius:', error.message);
        res.status(500).json({ error: 'The AI Tutor is currently resting. Try again later.' });
    }
});

module.exports = router;