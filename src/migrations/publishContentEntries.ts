const _ = require('lodash');
import fs from 'fs';

import client from './kontentManagmentClient';

export interface Workflow {
    [id: string]: LocaleFields[];
}
export interface Entry {
    entryMeta: EntryMeta;
    localeFields: LocaleFields[];
}

export interface EntryMeta {
    variantName: string;
    draft: boolean;
    type: {
        external_id: string;
    };
    external_id: string;
}

export interface LocaleFields {
    locale: string;
    elements: Element[];
}
interface Element {
    element: {
        external_id: string;
    };
    value: any;
}
interface PublishFailures {
    failures: string[];
}

const publishEntries = async () => {
    const publishFailures: PublishFailures = { failures: [] };

    const variants: Workflow = require(`../../mappedExports/migratedVariants.json`);

    let variantIds: any = Object.keys(variants);

    let migratedEntries: Workflow;

    try {
        migratedEntries = require('../../mappedExports/workflowCompleteEntries.json');

        if (Object.keys(migratedEntries).length > 0) {
            console.log(`all variants: ${Object.keys(variants).length}`);
            variantIds = _.differenceWith(
                Object.keys(variants),
                Object.keys(migratedEntries),
                _.isEqual
            );
            console.log(
                `all variants not gone through workflow: ${variants.length}`
            );
        }
    } catch {
        migratedEntries = {};
    }

    const entryTotalCount = Object.keys(variants).length;

    console.log('===========================================================');
    console.log('Running Content Publish Migration...');
    console.log('===========================================================');
    let count = 0;
    for (const externalId of variantIds) {
        count++;

        const localeEntries = variants[externalId];

        await Promise.all(
            localeEntries.map(async (localeEntry: any) => {
                const {
                    id,
                    locale,
                    draft: isDraft,
                    name: variantName
                } = localeEntry;

                if (!isDraft) {
                    console.log(
                        `Publishing Entry - ${variantName} : ${count}/${entryTotalCount}`
                    );
                    try {
                        await client
                            .publishOrScheduleLanguageVariant()
                            .byItemId(id)
                            .byLanguageCodename(locale)
                            .withoutData()
                            .toPromise();

                        migratedEntries[externalId] = localeEntries;

                        console.log(`Published Entry`);
                    } catch (error) {
                        console.log(`Publish Failure in: ${variantName} `);
                        console.log(error.message);
                    }
                } else {
                    console.log(`Draft Content: ${variantName}`);
                    migratedEntries[externalId] = localeEntries;
                }
            })
        );
        fs.writeFileSync(
            'mappedExports/workflowCompleteEntries.json',
            JSON.stringify(migratedEntries, undefined, 2)
        );
    }

    console.log(
        `Failed to publish ${publishFailures.failures.length} content variants`
    );

    fs.writeFileSync(
        `mappedExports/publishFailures.json`,
        JSON.stringify(publishFailures, undefined, 2)
    );
};

publishEntries();

export default publishEntries;
