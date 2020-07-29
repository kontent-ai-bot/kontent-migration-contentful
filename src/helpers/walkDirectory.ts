import fs from 'fs';
import mime from 'mime-types';
import path from 'path';

interface DirectoryAssets {
    [key: string]: DirectoryAssets | BinaryAsset;
}

interface BinaryAsset {
    filepath: string;
    contentLength: number;
    contentType: string | false;
    filename: string;
}

const walk = function(dir: any, done: any) {
    const results: DirectoryAssets = {};

    fs.readdir(dir, function(err, list) {
        if (err) {
            return done(err);
        }
        let pending = list.length;

        if (!pending) {
            return done(null, results);
        }

        list.forEach(function(file) {
            file = path.resolve(dir, file);

            fs.stat(file, function(err, stat) {
                if (err) {
                    return done(err);
                }
                if (stat && stat.isDirectory()) {
                    walk(file, function(err: any, res: any) {
                        const edge = path.basename(file);
                        results[edge] = res;

                        if (!--pending) {
                            done(null, results);
                        }
                    });
                } else {
                    const data = fs.readFileSync(file);
                    let mimeType = mime.lookup(file);
                    const fileName: string = path.basename(file);
                    const edge = path.basename(file);

                    const extension: string = fileName
                        .split('.')
                        .pop() as string;

                    if (extension.includes('svg')) {
                        mimeType = 'image/svg+xml';
                    }
                    if (extension.includes('jpg')) {
                        mimeType = 'image/jpg';
                    }
                    if (extension.includes('png')) {
                        mimeType = 'image/png';
                    }

                    results[edge] = {
                        filepath: file,
                        contentLength: data.byteLength,
                        contentType: mimeType,
                        filename: fileName
                    };

                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
};

export default walk;
