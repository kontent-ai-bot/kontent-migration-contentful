const _ = require('lodash');
import client from './kontentManagmentClient';
import fs from 'fs';

export interface Locale {
    name: string;
    code: string;
    is_active: boolean;
}
const localeMigration = async () => {
    const locales: Locale[] = require(`../../mappedExports/locales.json`);

    console.log(locales);

    console.log('===============================================');
    console.log('Running Locale Migration...');
    console.log('===============================================');
    console.log('\n');

    for (const language of locales) {
        console.log(`Adding Language: ${language.name} ...`);
        console.log('===============================================');
        console.log('\n');

        const languageData = {
            codename: language.code,
            name: language.name,
            is_active: language.is_active
        };

        try {
            await client
                .addLanguage()
                .withData(languageData)
                .toPromise();
        } catch (error) {
            console.log(languageData);
            console.log(error.message);
            console.log(error.validationErrors);
        }
    }

    console.log('===============================================');
    console.log('Upload Languages to Kontent Complete...');
    console.log('===============================================');
    console.log('\n');
};

localeMigration();

export default localeMigration;
