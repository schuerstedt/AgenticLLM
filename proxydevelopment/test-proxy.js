const axios = require('axios');
const { spawn } = require('child_process');
const assert = require('assert');

async function runTest() {
    // 1. Start the proxy as a child process
    const proxy = spawn('node', ['echo-proxy.js']);
    let proxyOutput = '';

    proxy.stdout.on('data', (data) => {
        proxyOutput += data.toString();
        // Check for the "listening" message to know when the server is ready
        if (proxyOutput.includes('Gemini proxy listening at http://localhost:3000')) {
            // 2. Run the test after the proxy is ready
            testProxy();
        }
    });

    proxy.stderr.on('data', (data) => {
        console.error(`Proxy stderr: ${data}`);
    });

    async function testProxy() {
        console.log('Proxy is ready. Running test...');
        try {
            // 3. Send a request to the proxy
            const response = await axios.post('http://localhost:3000/v1/chat/completions', {
                model: 'gemini-cli',
                messages: [{ role: 'user', content: 'hello' }]
            });

            // 4. Check the response
            console.log('Received response:', JSON.stringify(response.data, null, 2));

            assert(response.data.id, 'Response should have an id');
            assert.strictEqual(response.data.object, 'chat.completion', 'Object should be chat.completion');
            assert(response.data.created, 'Response should have a created timestamp');
            assert.strictEqual(response.data.model, 'gemini-cli', 'Model should be gemini-cli');
            assert.strictEqual(response.data.choices.length, 1, 'Should have one choice');
            assert.strictEqual(response.data.choices[0].message.role, 'assistant', 'Message role should be assistant');
            assert(response.data.choices[0].message.content.length > 0, 'Message content should not be empty');

            console.log('Test passed!');
        } catch (error) {
            console.error('Test failed:', error.message);
            if(error.response) {
                console.error('Response data:', error.response.data);
            }
        } finally {
            // 5. Kill the child process
            proxy.kill();
        }
    }
}

runTest();
