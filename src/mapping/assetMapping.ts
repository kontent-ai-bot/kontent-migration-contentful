import fs from 'fs';
import path from 'path';

import walkDirectory from '../helpers/walkDirectory';
import directoryToJson from '../helpers/directoryToJson';

const exportData = require(`../../exports/contentful_export.json`);

const directoryPath = path.join(`exports/assets`);

const localeCodeList = require(`../../mappedExports/localeCodeList.json`);

interface BinaryAsset {
    filepath: string;
    contentLength: number;
    contentType: string | false;
    filename: string;
}

interface DirectoryAssets {
    [key: string]: DirectoryAssets | BinaryAsset;
}

walkDirectory(directoryPath, function(err: any, results: any) {
    console.log('===============================================');
    console.log('Scanning assets...');
    console.log('===============================================');
    console.log('\n');
    if (err) {
        throw err;
    }
    const assetDirectory: DirectoryAssets = directoryToJson(results);

    fs.writeFileSync(
        `mappedExports/assetDirectory.json`,
        JSON.stringify(assetDirectory, undefined, 2)
    );

    console.log(`Exported to  mappedExports/assetDirectory.json`);

    console.log('===============================================');
    console.log('\n');
});

const migration = () => {
    console.log('\n');
    console.log('===============================================');
    console.log('Asset Mapping Complete...');

    const input: any = exportData;

    console.log('===========================================================');
    console.log('Asset entries mapping ...');

    const assets = input.assets.map((asset: any) => {
        if (Object.keys(asset.fields).length === 0) {
            return {};
        }

        const externalId = asset.sys.id;

        let title = '';

        if (asset.fields.title) {
            title = asset.fields.title[localeCodeList[0]];
        }

        console.log('');
        console.log('Mapping asset: ' + title);

        const descriptions = localeCodeList
            .map((locale: string) => {
                let description = '';
                if (asset.fields.title) {
                    description = asset.fields.title[locale];
                }
                if (asset.fields.description) {
                    description = asset.fields.description[locale];
                }

                if (description) {
                    return {
                        language: {
                            codename: locale
                        },
                        description
                    };
                }
                return null;
            })
            .filter(Boolean);

        return {
            title,
            externalId,
            descriptions
        };
    });

    console.log('Asset entries mapping complete');
    console.log('===========================================================');

    fs.writeFileSync(
        `mappedExports/assets.json`,
        JSON.stringify(assets, undefined, 2)
    );

    return assets;
};

migration();

export default migration;
