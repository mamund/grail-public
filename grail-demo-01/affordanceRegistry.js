// affordanceRegistry.js
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
    preconditions: ['authenticated'],
    inputs: ['recordId'],
    effects: ['recordLoaded']
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

