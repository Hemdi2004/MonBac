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
                    content: 'You are a helpful and concise AI tutor for a learning management system.' 
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