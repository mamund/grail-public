// client.js (unchanged)
export class Client {
  constructor(server, inputs) {
    this.server = server;
    this.inputs = inputs;
    this.stack = [];
  }

  pursue(goalAffordance) {
    console.log(`\n[CLIENT] Starting pursuit: ${goalAffordance.action}`);
    this.stack.push(goalAffordance);

    while (this.stack.length > 0) {
      const current = this.stack[this.stack.length - 1];
      const response = this.server.attempt(current, this.inputs);

      if (response.success) {
        console.log(`[CLIENT] Affordance succeeded: ${current.action}`);
        this.stack.pop();
      } else if (response.offeredAffordances.length > 0) {
        const next = response.offeredAffordances[0];
        console.log(`[CLIENT] Pushing next affordance: ${next.action}`);
        this.stack.push(next);
      } else {
        console.log(`[CLIENT] Cannot proceed: no offered affordances`);
        break;
      }
    }
  }
}

