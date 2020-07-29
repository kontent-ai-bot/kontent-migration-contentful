import fs from 'fs';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { MARKS } from '@contentful/rich-text-types';

interface DisplayFields {
    [key: string]: string;
}

const exportData = require(`../../exports/contentful_export.json`);

const localeCodeList = require(`../../mappedExports/localeCodeList.json`);

const assetIds = require(`../../mappedExports/assetIds.json`);

const migration = (): string => {
    const input: any = exportData;

    const getContentTypeFieldType = (
        external_id: string,
        fieldName: string
    ) => {
        const matchedContentType = contentTypes.find(
            (contentType: any) => contentType.external_id === external_id
        );

        const matchedContentTypeElement = matchedContentType.elements.find(
            (element: any) => element.external_id === fieldName
        );

        return matchedContentTypeElement.type;
    };

    console.log('===========================================================');
    console.log('Content Types mapping ...');

    const displayFields: DisplayFields = {};

    const contentTypes = input.contentTypes.map((contentType: any) => {
        const displayField: string = contentType.displayField;

        const contentTypeMeta = {
            external_id: contentType.sys.id,
            name: contentType.name
        };

        displayFields[contentTypeMeta.external_id] = displayField;

        const elements = contentType.fields.map((field: any) => {
            let fieldType = 'text';
            let additionalFields: any = {};

            if (field.items) {
                if (field.items.validations.length > 0) {
                    additionalFields = {
                        items: field.items.validations[0].in,
                        mode: 'multiple'
                    };
                }
            }

            if (field.validations.length > 0) {
                if (field.validations[0].in) {
                    additionalFields = {
                        items: field.validations[0].in,
                        mode: 'single'
                    };
                }
                additionalFields = {
                    ...additionalFields,
                    guidelines: `${JSON.stringify(
                        field.validations,
                        undefined,
                        2
                    )}`
                };
            }

            switch (field.type) {
                case 'Symbol':
                    fieldType = 'text';
                    break;
                case 'Text':
                    fieldType = 'text';
                    break;
                case 'RichText':
                    fieldType = 'rich_text';
                    break;
                case 'Integer':
                    fieldType = 'number';
                    break;
                case 'Number':
                    fieldType = 'number';
                    break;
                case 'Date':
                    fieldType = 'date_time';
                    break;
                case 'Location':
                    fieldType = 'text';
                    break;
                case 'Boolean':
                    fieldType = 'multiple_choice';
                    additionalFields = {
                        mode: 'single',
                        options: [
                            {
                                name: 'yes',
                                codename: 'true'
                            },
                            {
                                name: 'no',
                                codename: 'false'
                            }
                        ],
                        is_required: false
                    };
                    // Quick fix to required false
                    break;
                case 'Array':
                    switch (field.items.linkType) {
                        case 'Asset':
                            fieldType = 'asset';
                            break;
                        case 'Entry':
                            fieldType = 'modular_content';
                            break;
                        default:
                            fieldType = 'text';
                    }
                    break;
                case 'Link':
                    switch (field.linkType) {
                        case 'Asset':
                            fieldType = 'asset';
                            break;
                        default:
                            fieldType = 'modular_content';
                    }
                    break;
            }

            if (additionalFields.items) {
                fieldType = 'multiple_choice';

                const options = additionalFields.items.map((option: any) => {
                    let codename = '';

                    if (isNaN(option)) {
                        codename = option
                            .toString()
                            .toLowerCase()
                            .replace(/ /g, '_')
                            .replace(/[^a-zA-Z0-9_]/g, '');
                    } else {
                        codename = `n_${option}`;
                    }

                    return {
                        name: option.toString(),
                        codename
                    };
                });

                additionalFields = {
                    options,
                    mode: additionalFields.mode
                };
            }

            // Required to false to allow for different content entry format
            return {
                name: field.name,
                external_id: contentTypeMeta.external_id + '-' + field.id,
                type: fieldType,
                is_required: false,
                ...additionalFields
            };
        });
        return {
            ...contentTypeMeta,
            elements
        };
    });

    console.log('');
    console.log('Content entries mapping ...');

    const entries = input.entries.map((entry: any) => {
        try {
            const contentTypeId: string = entry.sys.contentType.sys.id;
            let displayField = displayFields[contentTypeId];
            let draft = false;

            if (!displayField) {
                displayField = entry.sys.contentType.sys.id;
            }

            if (!entry.sys.publishedBy) {
                draft = true;
            }

            const entryMeta = {
                name: displayField,
                draft,
                type: {
                    external_id: contentTypeId
                },
                external_id: entry.sys.id
            };

            const localeFields = localeCodeList
                .map((locale: string) => {
                    const mappedFields = Object.keys(entry.fields)
                        .map((fieldName: any) => {
                            const externalFieldName =
                                contentTypeId + '-' + fieldName;

                            const fieldItem = entry.fields[fieldName][locale];

                            if (!fieldItem) {
                                return null;
                            }

                            if (fieldName === displayField) {
                                if (entryMeta['name'] === displayField) {
                                    console.log('MY NAME IS: ', fieldItem);
                                    entryMeta['name'] = fieldItem;
                                }
                            }

                            let fieldValue: any = fieldItem.toString();

                            const fieldType = getContentTypeFieldType(
                                entryMeta.type.external_id,
                                externalFieldName
                            );

                            if (fieldType === 'modular_content') {
                                if (Array.isArray(fieldItem)) {
                                    fieldValue = fieldItem.map(
                                        (referenceItem: any) => ({
                                            external_id: referenceItem.sys.id
                                        })
                                    );
                                } else {
                                    fieldValue = [
                                        { external_id: fieldItem.sys.id }
                                    ];
                                }
                            }

                            if (fieldType === 'multiple_choice') {
                                if (Array.isArray(fieldItem)) {
                                    fieldValue = fieldItem.map((item: any) => {
                                        let codename = '';

                                        if (isNaN(item.toString())) {
                                            codename = item
                                                .toString()
                                                .toLowerCase()
                                                .replace(/ /g, '_')
                                                .replace(/[^a-zA-Z0-9_]/g, '');
                                        } else {
                                            codename = `n_${item}`;
                                        }

                                        return { codename };
                                    });
                                } else {
                                    let codename = '';

                                    if (isNaN(fieldValue)) {
                                        codename = fieldValue
                                            .toString()
                                            .toLowerCase()
                                            .replace(/ /g, '_')
                                            .replace(/[^a-zA-Z0-9_]/g, '');
                                    } else {
                                        codename = `n_${fieldValue}`;
                                    }

                                    fieldValue = [{ codename }];
                                }
                            }

                            if (fieldType === 'asset') {
                                if (Array.isArray(fieldItem)) {
                                    fieldValue = fieldItem.map(
                                        (referenceItem: any) => ({
                                            external_id: referenceItem.sys.id
                                        })
                                    );
                                } else {
                                    fieldValue = [
                                        { external_id: fieldItem.sys.id }
                                    ];
                                }
                            }

                            if (fieldType === 'rich_text') {
                                const options = {
                                    renderMark: {
                                        [MARKS.BOLD]: (text: any) =>
                                            `<strong>${text}</strong>`,
                                        [MARKS.ITALIC]: (text: any) =>
                                            `<em>${text}</em>`
                                    }
                                };
                                fieldValue = documentToHtmlString(
                                    fieldItem,
                                    options
                                );
                            }
                            if (fieldType === 'text') {
                                const reg = /\(\/\/.+ctf.+\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+).+\)/g;

                                fieldValue = fieldItem.toString();

                                const contentfulUrls = fieldValue.match(reg);

                                contentfulUrls?.map((url: string) => {
                                    const ctfReg = /\(\/\/.+ctf.+\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+).+\)/;

                                    const urlGroups = url.match(ctfReg);

                                    const external_id = urlGroups
                                        ? urlGroups[2]
                                        : null;

                                    if (external_id) {
                                        const kontentURL = `(${assetIds[external_id]})`;

                                        fieldValue = fieldValue.replace(
                                            url,
                                            kontentURL
                                        );
                                    }
                                });
                            }

                            if (fieldType === 'date_time') {
                                fieldValue = new Date(fieldItem);
                            }

                            return {
                                element: {
                                    external_id: externalFieldName
                                },
                                value: fieldValue
                            };
                        })
                        .filter(Boolean);

                    return {
                        locale,
                        elements: mappedFields
                    };
                })
                .filter((localeField: any) => {
                    return localeField.elements.length > 0;
                });

            return {
                entryMeta,
                localeFields
            };
        } catch (error) {
            console.log(error);
        }
    });

    fs.writeFileSync(
        `mappedExports/contentTypes.json`,
        JSON.stringify(contentTypes, undefined, 2)
    );
    fs.writeFileSync(
        `mappedExports/entries.json`,
        JSON.stringify(entries, undefined, 2)
    );

    console.log('');
    console.log(`Exported mapped exports mappedExports`);
    console.log('===========================================================');

    console.log('\n');
    console.log('===========================================================');
    console.log('Content mapping complete');
    console.log('===========================================================');

    return '';
};

migration();

export default migration;
