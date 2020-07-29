const _ = require('lodash');

import {
    ContentTypeElementsBuilder,
    ContentTypeModels
} from '@kentico/kontent-management';

import client from './kontentManagmentClient';

export interface ContentType {
    external_id: string;
    name: string;
    elements: Element[];
}

export interface Element {
    name: string;
    external_id: string;
    type: Type;
    is_required: boolean;
    guidelines?: string;
}

// CHECK TO SEE WHAT THIS DOES
export enum Type {
    Asset = 'asset',
    ModularContent = 'modular_content',
    Number = 'number',
    Text = 'text'
}

const contentTypeMigration = async () => {
    const contentTypes: ContentType[] = require(`../../mappedExports/contentTypes.json`);
    const contentTypesTotalCount = contentTypes.length;

    const contentTypeChunks = _.chunk(contentTypes, 5);

    console.log('===========================================================');
    console.log('Running Content Type Migration...');
    console.log('===========================================================');
    let count = 0;
    for (const contentTypeChunk of contentTypeChunks) {
        await Promise.all(
            contentTypeChunk.map(async (contentType: ContentType) => {
                count += 1;

                if (contentType.name.length >= 100) {
                    const start = contentType.name.length - 100;
                    contentType.name = contentType.name.substr(
                        start,
                        contentType.name.length
                    );

                    console.log(`Resolved filename: ${contentType.name}`);
                }
                const contentBuild = (
                    builder: ContentTypeElementsBuilder
                ): ContentTypeModels.IAddContentTypeData => {
                    return {
                        ...contentType
                    };
                };

                try {
                    console.log(
                        `Uploading Content Type: ${contentType.name} ... Content Type #${count} /${contentTypesTotalCount}`
                    );

                    await client
                        .addContentType()
                        .withData(contentBuild)
                        .toPromise();
                } catch (err) {
                    console.log(JSON.stringify(contentType, undefined, 2));
                    console.warn(err.message);
                    console.log(err.validationErrors);
                }
            })
        );
    }
};

contentTypeMigration();

export default contentTypeMigration;
