import { BRX } from '../../src/BRX.js';
import { ProjectEvent, OutputNode, AwaitResponseNode } from '../../src/Project.js';
import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config({ path: '../../.env' });

// // Get API key from environment variables


// if (!API_KEY) {
//     console.error('Error: BRX_API_KEY environment variable is not set');
//     process.exit(1);
// }

// Create a BRX client
const brx = new BRX(API_KEY, {
    verbose: true,
    send_local: true, // Set to true for local development
});

async function testSSEProject() {
    console.log('Testing SSE Project functionality...');

    try {
        // Create a project request
        const projectRequest = {
            projectId: '2d2b38d1-dd72-4e68-80b6-13a6b215589d', // Replace with your actual project ID
            appId: '1f84a201-bb0e-4d6b-b60e-d818b5710a1b',         // Replace with your actual app ID
            inputs: {
                // Your project inputs here
                prompt: 'Hello, world!',
            },
            options: {
                projectRunMode: 'execute',
                sse: true, // Enable SSE mode
            },
        };

        // Method 1: Using the project method with SSE option
        console.log('\nMethod 1: Using project method with SSE option');
        const session = await brx.project(projectRequest, {
            useSSE: true,
            onEvent: (event: ProjectEvent) => {
                console.log(`Received event: ${event.type}`);
            },
        });

        // Set up event listeners
        session.on('output', (outputNode: OutputNode) => {
            console.log(`Output: ${outputNode.outputName}`, outputNode.data);
        });

        session.on('await_response', (awaitNode: AwaitResponseNode) => {
            console.log('Awaiting response:', awaitNode.data);
            // Respond to the await node if needed
            awaitNode.respond({ response: 'User response' });
        });

        session.on('complete', (data: any) => {
            console.log('Project completed:', data);
        });

        // Wait for the project to complete
        await new Promise<void>((resolve) => {
            session.once('complete', () => {
                resolve();
            });

            // Add a timeout in case the project doesn't complete
            setTimeout(() => {
                console.log('Timeout: Project did not complete in time');
                session.disconnect();
                resolve();
            }, 60000); // 60 second timeout
        });

        // Method 2: Alternative approach - create a BRXProjectSession directly
        console.log('\nMethod 2: Creating a BRXProjectSession directly');

        // This is just to demonstrate the alternative approach
        // In a real application, you would typically use Method 1
        /*
        import { BRXProjectSession } from '../../src/Project.js';
        
        const directSession = new BRXProjectSession(
          'session-id',
          API_KEY,
          projectRequest,
          {
            baseUrl: 'https://api.brx.ai',
            useApiKey: true,
            verbose: true
          }
        );
    
        // Set up event listeners
        directSession.on('event', (event: ProjectEvent) => {
          console.log(`Received event: ${event.type}`);
        });
    
        // Connect to the SSE endpoint
        await directSession.connect();
    
        // Wait for the project to complete
        await new Promise<void>((resolve) => {
          directSession.once('complete', () => {
            directSession.disconnect();
            resolve();
          });
        });
        */

        console.log('SSE Project test completed successfully');
    } catch (error) {
        console.error('Error in SSE Project test:', error);
    }
}

// Run the test
testSSEProject().catch(console.error);
