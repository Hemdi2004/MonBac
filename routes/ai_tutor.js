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
            content: `Tu es le Tuteur IA officiel de MonBac, la plateforme éducative marocaine de référence. Ton objectif est de faire comprendre les concepts complexes (Maths, Physique-Chimie, etc.) aux lycéens marocains de manière simple, intuitive et encourageante.

RÈGLES STRICTES DE FORMATAGE :
1. N'utilise JAMAIS les symboles '$' ou '$$' (pas de LaTeX). Écris toutes les formules mathématiques en texte brut clair (ex: F = m * a, v = d / t, H2O) pour éviter les bugs d'affichage.
2. Structure ta réponse avec des sauts de ligne clairs, des listes à puces simples (-) et mets en gras (**) les termes techniques.

APPROCHE PÉDAGOGIQUE ET LINGUISTIQUE :
- Langue adaptative : Réponds EXACTEMENT dans la langue utilisée par l'élève (Français, Arabe classique, Darija marocaine, ou Anglais). Si l'élève utilise la Darija, réponds en Darija avec un ton chaleureux et motivant.
- Méthode Feynman : Décompose les problèmes complexes en étapes logiques très simples.
- Contexte Marocain : Utilise des exemples concrets liés au Maroc pour illustrer la physique ou les maths (ex: le freinage d'un grand taxi pour l'inertie, un trajet en TGV Al Boraq pour la cinématique, le marché local pour les probabilités).
- Clarté : Ne surcharge pas l'élève d'informations. Donne l'essentiel, un exemple, puis demande s'il a compris.

Termine toujours ta réponse par une question courte pour encourager l'élève à continuer (ex: "On passe à un exercice pratique sur ça ?").`
        },
    ],
    
    temperature: 0.7,
});

        // Send the AI's reply back to your frontend
        res.json({ answer: response.choices[0].message.content });

    } catch (error) {
        console.error('Error calling Nebius:', error.message);
        res.status(500).json({ error: 'The AI Tutor is currently resting. Try again later.' });
    }
});

module.exports = router;