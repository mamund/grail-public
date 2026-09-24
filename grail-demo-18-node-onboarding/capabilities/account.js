// capabilities/account.js

export async function lookupAccount(inputs) {
  return {
    id: inputs.accountId,
    status: "active"
  };
}
