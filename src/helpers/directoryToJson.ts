interface DirectoryAssets {
    [key: string]: DirectoryAssets | BinaryAsset;
}

interface BinaryAsset {
    filepath: string;
    contentLength: number;
    contentType: string | false;
    filename: string;
}

export default (results: any) => {
    const assetDirectory: DirectoryAssets = {};

    Object.keys(results).map((assetTypeFolder: string) => {
        Object.keys(results[assetTypeFolder]).map((spaceId: string) => {
            Object.keys(results[assetTypeFolder][spaceId]).map(
                (assetId: string) => {
                    console.log('assetid: ', assetId);

                    Object.keys(results[assetTypeFolder][spaceId][assetId]).map(
                        (itemId: string) => {
                            Object.keys(
                                results[assetTypeFolder][spaceId][assetId][
                                    itemId
                                ]
                            ).map((fileName: string) => {
                                console.log('fileName', fileName);
                                console.log(
                                    '==============================================='
                                );

                                assetDirectory[assetId] =
                                    results[assetTypeFolder][spaceId][assetId][
                                        itemId
                                    ][fileName];
                            });
                        }
                    );
                }
            );
        });
    });
    return assetDirectory;
};
