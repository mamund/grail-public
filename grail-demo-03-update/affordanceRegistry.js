// Updated affordanceRegistry.js with verifyModifyAccess added
import { Affordance } from './affordanceModel.js';

export const affordanceRegistry = {
  updateEmail: new Affordance({
    id: 'aff-1',
    action: 'updateEmail',
    type: 'update',
    preconditions: ['recordLoaded'],
    inputs: ['newEmail'],
    effects: ['emailUpdated']
  }),
  readRecord: new Affordance({
    id: 'aff-2',
    action: 'readRecord',
    type: 'read',
    preconditions: ['accessVerified'],
    inputs: ['recordId'],
    effects: ['recordLoaded']
  }),
  verifyModifyAccess: new Affordance({
    id: 'aff-4',
    action: 'verifyModifyAccess',
    type: 'authorize',
    preconditions: ['authenticated'],
    inputs: ['accessToken'],
    effects: ['accessVerified']
  }),
  login: new Affordance({
    id: 'aff-3',
    action: 'login',
    type: 'authenticate',
    preconditions: [],
    inputs: ['username', 'password'],
    effects: ['authenticated']
  })
};

