// Updated run.js with new accessToken input
import { affordanceRegistry } from './affordanceRegistry.js';
import { WorldState } from './worldState.js';
import { Server } from './server.js';
import { Client } from './client.js';

const worldState = new WorldState();
const server = new Server(worldState);

const inputs = {
  newEmail: 'user@example.com',
  recordId: '12345',
  username: 'testuser',
  password: 'hunter2',
  accessToken: 'abc123' // <-- New input for verifyModifyAccess
};

const client = new Client(server, inputs);

client.pursue(affordanceRegistry.updateEmail);

