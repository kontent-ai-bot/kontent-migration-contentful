export default () => {
    try {
        const badFiles = require(`../../mappedExports/badFiles.json`);

        console.log('');
        console.log('Running Migration Summary...');
        console.log('===============================================');
        console.log('');

        console.log(
            'Number of files too large to migrate over: ',
            badFiles.tooLarge.length
        );

        console.log(
            'Number of files with filename / titles shortened: ',
            badFiles.badTitle.length
        );

        console.log(
            'Number of files that do not exist: ',
            badFiles.nonExists.length
        );

        console.log('');
        console.log(
            `Log of all these files are in mappedExports/badFiles.json`
        );
    } catch {
        console.log(`mappedExports/badFiles.json does not exist...`);
        console.log(
            `Make sure you have run the migration tool for this project.`
        );
    }
};
