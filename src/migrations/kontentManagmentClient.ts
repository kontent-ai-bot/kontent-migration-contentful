import { ManagementClient } from '@kentico/kontent-management';

import { kontentSetup } from '../helpers/setupConfig';

interface Environment {
    PROGRAM?: {
        projectId: string;
        apiKey: string;
    };
}
let environment: Environment = {};

try {
    environment = require('../../.environments.json');
} catch {
    console.log('Set up Kontent Config before continuing');
    kontentSetup();
}

let client = new ManagementClient({
    projectId: 'Not Set',
    apiKey: 'Not Set'
});

if (environment.PROGRAM) {
    client = new ManagementClient({
        projectId: environment.PROGRAM.projectId,
        apiKey: environment.PROGRAM.apiKey
    });
}

export default client;
