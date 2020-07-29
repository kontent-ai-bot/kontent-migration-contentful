import fs from 'fs';

interface Locale {
    name: string;
    code: string;
    default: string;
    optional: boolean;
}

const exportData = require(`../../exports/contentful_export.json`);

const migration = async () => {
    const input: any = exportData;

    const localeCodeList: string[] = [];

    console.log('===========================================================');
    console.log('Locale mapping ...');
    const locales = input.locales.map((locale: Locale) => {
        console.log('Mapping language: ' + locale.name);

        localeCodeList.push(locale.code);

        return {
            name: locale.name,
            code: locale.code,
            is_active: true
        };
    });

    console.log(JSON.stringify(locales, undefined, 2));

    fs.writeFileSync(
        `mappedExports/locales.json`,
        JSON.stringify(locales, undefined, 2)
    );

    fs.writeFileSync(
        `mappedExports/localeCodeList.json`,
        JSON.stringify(localeCodeList, undefined, 2)
    );

    console.log('');
    console.log('===========================================================');
    console.log('Locale mapping complete');
    console.log('===========================================================');

    return locales;
};

migration();

export default migration;
