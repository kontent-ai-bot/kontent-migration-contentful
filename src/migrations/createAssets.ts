const _ = require('lodash');
import client from './kontentManagmentClient';
import fs from 'fs';

export interface AssetDirectory {
    filepath: string;
    contentLength: number;
    contentType: string;
    filename: string;
}

export interface Asset {
    title: string;
    externalId: string;
    descriptions: Description[];
}

export interface Description {
    language: Language;
    description: string;
}

export interface Language {
    codename: string;
}
export interface BadFiles {
    tooLarge: Asset[];
    badTitle: Asset[];
    nonExists: Asset[];
    error: Asset[];
}

let assets: Asset[] = require(`../../mappedExports/assets.json`);
const assetDirectory: AssetDirectory[] = require(`../../mappedExports/assetDirectory.json`);

const assetMigration = async () => {
    console.log('===============================================');
    console.log('Running Asset Migration...');
    console.log('===============================================');
    console.log('\n');

    const badFiles: BadFiles = {
        tooLarge: [],
        badTitle: [],
        nonExists: [],
        error: []
    };

    const MaxFilenameLength = 50;

    let migratedAssets: Asset[];

    try {
        migratedAssets = require('../../mappedExports/migratedAssets.json');

        if (migratedAssets.length > 0) {
            console.log(`all assets: ${assets.length}`);
            assets = _.differenceWith(assets, migratedAssets, _.isEqual);
            console.log(`Assets not gone through workflow: ${assets.length}`);
        }
    } catch {
        migratedAssets = [];
    }

    let assetIds: any = {};

    try {
        assetIds = require('../../mappedExports/assetIds.json');
        console.log(`Asset ids already found: ${assetIds.length}`);
    } catch {
        assetIds = {};
    }

    const assetChunks = _.chunk(assets, 5);

    const assetTotalCount = assets.length;

    let count = 0;

    for (const assetChunk of assetChunks) {
        await Promise.all(
            assetChunk.map(async (asset: Asset) => {
                const externalId: any = asset.externalId;
                const title: any = asset.title;
                const assetMeta: AssetDirectory = assetDirectory[externalId];

                count += 1;

                if (!assetMeta) {
                    console.log(
                        title,
                        ' does not exist. Try download manually...'
                    );
                    console.log(asset);
                    badFiles.nonExists.push(asset);
                    return;
                }

                if (assetMeta.contentLength > 104857600) {
                    console.log(
                        title,
                        ': File is larger than allowed 100MB... Try compress and try again..'
                    );
                    badFiles.tooLarge.push(asset);
                    return;
                }
                if (assetMeta.filename.length >= MaxFilenameLength) {
                    console.log(
                        assetMeta.filename,
                        ': File name is larger than 50 characters.'
                    );
                    badFiles.badTitle.push(asset);

                    let filename = assetMeta.filename;
                    const start = filename.length - MaxFilenameLength;
                    filename = filename.substr(start, filename.length);

                    assetMeta.filename = filename;

                    console.log(`Resolved filename: ${filename}`);
                }

                if (asset.title.length >= MaxFilenameLength) {
                    console.log(
                        asset.title,
                        ': Title is larger than 50 characters.'
                    );
                    let title = asset.title;
                    title = title.substr(0, MaxFilenameLength - 4) + '...';

                    asset.title = title;
                    console.log(`Resolved title: ${title}`);
                }

                console.log(
                    `Uploading ${assetMeta.filename} ... Asset #${count} / ${assetTotalCount}`
                );
                console.log('===============================================');
                console.log('\n');

                const binaryData = {
                    binaryData: fs.readFileSync(assetMeta.filepath),
                    contentLength: assetMeta.contentLength,
                    contentType: assetMeta.contentType,
                    filename: assetMeta.filename,
                    externalId: externalId
                };

                try {
                    const assetUploadResponse = await client
                        .uploadBinaryFile()
                        .withData(binaryData)
                        .toPromise();

                    const assetData: any = {
                        file_reference: {
                            ...assetUploadResponse.data
                        },
                        ...asset
                    };

                    const result = await client
                        .upsertAsset()
                        .byAssetExternalId(externalId)
                        .withData(assetData)
                        .toPromise();

                    migratedAssets.push(asset);

                    assetIds[externalId] = result.data.url;
                } catch (err) {
                    console.log(err.message);
                    badFiles.error.push(asset);
                }
            })
        );

        fs.writeFileSync(
            'mappedExports/migratedAssets.json',
            JSON.stringify(migratedAssets, undefined, 2)
        );

        fs.writeFileSync(
            `mappedExports/assetIds.json`,
            JSON.stringify(assetIds, undefined, 2)
        );
    }

    fs.writeFileSync(
        `mappedExports/badFiles.json`,
        JSON.stringify(badFiles, undefined, 2)
    );
};

assetMigration();

export default assetMigration;
