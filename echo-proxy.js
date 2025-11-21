const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

app.post('/v1/chat/completions', (req, res) => {
    console.log('Received request for /v1/chat/completions');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Extract the user's message from the request body
    const messages = req.body.messages;
    const userMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : 'No message provided';

    // Construct an OpenAI-like response object
    const echoResponse = {
        id: `chatcmpl-echo-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: req.body.model || "echo-gpt-3.5-turbo",
        choices: [
            {
                index: 0,
                message: {
                    role: "assistant",
                    content: `Echo: ${userMessage}` // Echo back the user's message
                },
                logprobs: null,
                finish_reason: "stop"
            }
        ],
        usage: {
            prompt_tokens: userMessage.split(' ').length, // Simple token count
            completion_tokens: `Echo: ${userMessage}`.split(' ').length,
            total_tokens: userMessage.split(' ').length + `Echo: ${userMessage}`.split(' ').length
        }
    };

    res.json(echoResponse);
});

app.listen(port, () => {
    console.log(`Echo proxy listening at http://localhost:${port}`);
});

console.log('OpenAI LLM Echo Proxy Server (localhost:3000)');
