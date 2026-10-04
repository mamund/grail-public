// client.js
export class Client {
  constructor(server, inputs) {
    this.server = server;
    this.inputs = inputs;
    this.stack = [];
  }

  async pursue(goal) {
    console.log(`\n[CLIENT] Starting pursuit: ${goal}`);

    while (true) {

      // If there is no current work, resolve the goal.
      if (this.stack.length === 0) {
        const response = this.server.resolveGoal(goal);

        if (response.result === "SUCCESS") {
          console.log(`[CLIENT] Goal reached: ${goal}`);
          break;
        }

        if (response.offeredAffordances.length > 0) {
          const next = response.offeredAffordances[0];

          console.log(
            `[CLIENT] Pushing goal affordance: ${next.action}`
          );

          this.stack.push(next);
          continue;
        }

        console.log(
          `[CLIENT] Cannot proceed: goal is unresolvable - ${goal}`
        );
        break;
      }

      const current = this.stack[this.stack.length - 1];
      const response = await this.server.attempt(current, this.inputs);

      if (response.result === "SUCCESS") {
        console.log(`[CLIENT] Affordance succeeded: ${current.action}`);
        this.stack.pop();

      } else if (
        response.result === "BLOCKED" &&
        response.offeredAffordances.length > 0
      ) {
        const next = response.offeredAffordances[0];

        console.log(`[CLIENT] Pushing next affordance: ${next.action}`);
        this.stack.push(next);

      } else if (response.result === "FAIL") {
        console.log(`[CLIENT] Affordance failed: ${current.action}`);
        this.stack.pop();

      } else if (
        response.result === "BLOCKED" &&
        response.condition
      ) {
        console.log(
          `[CLIENT] Cannot proceed: condition is unresolvable - ${response.condition}`
        );
        break;

      } else {
        console.log(`[CLIENT] Cannot proceed: ${response.result}`);
        break;
      }
    }
  }
}
