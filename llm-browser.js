const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_ENDPOINT = 'http://localhost:3000/v1/chat/completions'; // Placeholder for the local proxy

console.log('LLM Terminal Browser (Type "exit" to quit)');

async function chat() {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        try {
            const response = await axios.post(API_ENDPOINT, {
                model: "gpt-3.5-turbo", // Placeholder model
                messages: [{ role: "user", content: input }],
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    // No API key needed for local proxy, but keeping structure similar to OpenAI API
                }
            });

            const assistantMessage = response.data.choices[0].message.content;
            console.log(`Assistant: ${assistantMessage}`);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.error('Error: Connection refused. Is the local LLM proxy running on http://localhost:3000?');
            } else {
                console.error('Error:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                }
            }
        }

        chat(); // Continue the chat
    });
}

chat();
