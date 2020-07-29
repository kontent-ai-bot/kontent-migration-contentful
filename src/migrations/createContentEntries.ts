const _ = require('lodash');
import fs from 'fs';

import client from './kontentManagmentClient';

export interface Entry {
    entryMeta: EntryMeta;
    localeFields: LocaleEntry[];
}

export interface EntryMeta {
    name: string;
    draft: boolean;
    type: {
        external_id: string;
    };
    external_id: string;
}

export interface LocaleEntry {
    locale: string;
    elements: Element[];
}
interface Element {
    element: {
        external_id: string;
    };
    value: any;
}
interface MigratedVariants {
    [external_id: string]: any;
}

const entryMigration = async () => {
    let entries: Entry[] = require(`../../mappedExports/entries.json`);

    let migratedEntries: Entry[];

    try {
        migratedEntries = require('../../mappedExports/migratedEntries.json');

        if (migratedEntries.length > 0) {
            console.log(`all entries: ${entries.length}`);
            entries = _.differenceWith(entries, migratedEntries, _.isEqual);
            console.log(`all unmigrated entries: ${entries.length}`);
        }
    } catch {
        migratedEntries = [];
    }
    let migratedVariants: MigratedVariants = {};
    try {
        migratedVariants = require('../../mappedExports/migratedVariants.json');

        if (Object.keys(migratedVariants).length > 0) {
            console.log(`all Migrated Variants: ${migratedVariants.length}`);
        }
    } catch {
        migratedVariants = {};
    }

    const entryTotalCount = entries.length;

    const entryChunks = _.chunk(entries, 5);

    console.log('===========================================================');
    console.log('Running Content Entries Migration...');
    console.log('===========================================================');
    let count = 0;
    for (const entryChunk of entryChunks) {
        await Promise.all(
            entryChunk.map(async (contentEntry: Entry) => {
                count++;

                const externalId = contentEntry.entryMeta.external_id;
                const isDraft = contentEntry.entryMeta.draft;

                const entryMeta: any = {
                    ...contentEntry.entryMeta,
                    type: {
                        external_id: contentEntry.entryMeta.type.external_id
                    }
                };

                console.log(externalId);
                console.log(entryMeta);

                if (entryMeta.name && entryMeta.name.length >= 200) {
                    const start = entryMeta.name.length - 200;
                    entryMeta.name = entryMeta.name.substr(
                        start,
                        entryMeta.name.length
                    );

                    console.log(`Resolved filename: ${entryMeta.name}`);
                }

                console.log('');
                console.log(
                    `Uploading Content Entry: ${entryMeta.name} ... Content Entry #${count} / ${entryTotalCount}`
                );

                try {
                    await client
                        .addContentItem()
                        .withData(entryMeta)
                        .toPromise();
                } catch (err) {
                    console.log(err.message);
                    console.log(err.validationErrors);
                }

                const localeEntries: LocaleEntry[] = contentEntry.localeFields;

                const migratedLocaleVariants = [];

                for (const entryLocaleVariant of localeEntries) {
                    try {
                        const codename = entryLocaleVariant.locale;

                        const elements = entryLocaleVariant.elements;

                        const variantResponse = await client
                            .upsertLanguageVariant()
                            .byItemExternalId(externalId)
                            .byLanguageCodename(codename)
                            .withElements(elements)
                            .toPromise();

                        if (variantResponse.data.item.id) {
                            migratedLocaleVariants.push({
                                id: variantResponse.data.item.id,
                                locale: codename,
                                draft: entryMeta.draft,
                                name: entryMeta.name
                            });
                        }
                    } catch (error) {
                        console.log('Variant Failure in: ', entryMeta.name);
                        return Promise.reject(error.message);
                    }
                }
                migratedEntries.push(contentEntry);
                migratedVariants[externalId] = migratedLocaleVariants;
            })
        ).catch(e => {
            console.log(e);
        });

        fs.writeFileSync(
            'mappedExports/migratedVariants.json',
            JSON.stringify(migratedVariants, undefined, 2)
        );
        fs.writeFileSync(
            'mappedExports/migratedEntries.json',
            JSON.stringify(migratedEntries, undefined, 2)
        );
    }
};

entryMigration();

export default entryMigration;
