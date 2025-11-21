const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

app.post('/v1/chat/completions', (req, res) => {
    console.log('Received request for /v1/chat/completions');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Extract the user's message from the request body
    const messages = req.body.messages;
    const userMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : 'No message provided';

    if (userMessage === 'No message provided') {
        return res.status(400).json({ error: 'No message provided' });
    }

    // Escape the user message to prevent command injection
    const escapedMessage = JSON.stringify(userMessage);

    exec(`gemini -p ${escapedMessage}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to execute Gemini CLI' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }

        // Construct an OpenAI-like response object
        const geminiResponse = {
            id: `chatcmpl-gemini-${Date.now()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: req.body.model || "gemini-cli",
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: stdout.trim()
                    },
                    logprobs: null,
                    finish_reason: "stop"
                }
            ],
            usage: {
                prompt_tokens: userMessage.split(' ').length,
                completion_tokens: stdout.trim().split(' ').length,
                total_tokens: userMessage.split(' ').length + stdout.trim().split(' ').length
            }
        };

        res.json(geminiResponse);
    });
});

app.listen(port, () => {
    console.log(`Gemini proxy listening at http://localhost:${port}`);
});

console.log('OpenAI LLM Gemini Proxy Server (localhost:3000)');
