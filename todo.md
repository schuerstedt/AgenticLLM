A POC first:

Step 1

write a node.js terminal llm browser which allows to connect to a localhost openai compatible llm (which does not exist so test will fail). Simple text based chat via terminal. 

Step 2

write a open ai llm echo proxy which echoes all input and listens on localhost (which would make Step 1 work)

Step 3

use the local gemini in headless mode instead of the echo functionality https://geminicli.com/docs/cli/headless/