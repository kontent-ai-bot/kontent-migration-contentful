import fs from 'fs';
const readline = require('readline-sync');

interface KontentConfig {
    [key: string]: {
        projectId: string;
        apiKey: string;
    };
}
interface ContentfulConfig {
    spaceId: string;
    managementToken: string;
    includeDrafts: boolean;
}

const kontentSetup = (): void => {
    console.log('');
    console.log(`Running Kontent setup...`);
    console.log('');

    let kontent_config: KontentConfig = {};
    try {
        const kontent_environments = require('../../.environments.json');
        kontent_config = { ...kontent_environments };
    } catch {}

    if (kontent_config['PROGRAM']) {
        console.log(kontent_config['PROGRAM']);

        const continue_input = readline.question(
            'This will overwrite Kontent config, continue? (y/n): '
        );

        if (continue_input === 'n') {
            console.log('Skipped Kontent Setup...');
            return;
        }
    }

    const projectId = readline.question('Enter Kontent Project ID: ');
    const apiKey = readline.question('Enter Kontent Management token: ');

    kontent_config['PROGRAM'] = {
        projectId,
        apiKey
    };

    fs.writeFileSync(
        '.environments.json',
        JSON.stringify(kontent_config, undefined, 2)
    );

    console.log('Kontent Setup complete');
};
const contentfulSetup = (): void => {
    console.log('');
    console.log(`Running Contentful setup...`);
    console.log('');
    const export_dir = `exports`;

    if (!fs.existsSync(export_dir)) {
        fs.mkdirSync(export_dir);
    }

    try {
        const config_read = require(`../../${export_dir}/config.json`);
        console.log(config_read);

        const continue_input = readline.question(
            'This will overwrite contentful config, continue? (y/n): '
        );

        if (continue_input === 'y') {
            console.log('Overwriting Contentful Setup...');
            console.log('');
            throw Error;
        }
    } catch {
        const spaceId = readline.question('Enter contentful space ID: ');
        const managementToken = readline.question(
            'Enter Contentful Management token: '
        );

        const contentful_config: ContentfulConfig = {
            spaceId,
            managementToken,
            includeDrafts: true
        };

        fs.writeFileSync(
            `exports/config.json`,
            JSON.stringify(contentful_config, undefined, 2)
        );
    }

    console.log('Contentful Setup complete');
};

export { kontentSetup, contentfulSetup };
