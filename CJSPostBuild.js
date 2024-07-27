import { readdir, rename, readFile, writeFile, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory of the module
const __dirname = fileURLToPath(new URL('./lib/cjs/', import.meta.url));

// Directory containing your built files
const buildDir = __dirname;

// Function to rename .js files to .cjs
const renameFiles = async (dir) => {
    try {
        const files = await readdir(dir);

        for (const file of files) {
            const filePath = join(dir, file);
            const fileStat = await stat(filePath);

            if (fileStat.isDirectory()) {
                await renameFiles(filePath);
            } else {
                const fileExt = extname(file);

                if (fileExt === '.js') {
                    const newFilePath = join(dir, basename(file, fileExt) + '.cjs');
                    await rename(filePath, newFilePath);
                    console.log(`Renamed: ${filePath} -> ${newFilePath}`);
                }
            }
        }
    } catch (err) {
        console.error('Error renaming files:', err);
    }
};

// Function to update imports in .cjs files
const updateImports = async (dir) => {
    try {
        const files = await readdir(dir);

        for (const file of files) {
            const filePath = join(dir, file);
            const fileStat = await stat(filePath);

            if (fileStat.isDirectory()) {
                await updateImports(filePath);
            } else {
                const fileExt = extname(file);

                if (fileExt === '.cjs') {
                    let content = await readFile(filePath, 'utf-8');

                    content = content.replace(/require\((['"])(\.\/.*?\.js)\1\)/g, (match, p1, p2) => {
                        return `require(${p1}${p2.replace('.js', '.cjs')}${p1})`;
                    });

                    content = content.replace(/from (['"])(\.\/.*?\.js)\1/g, (match, p1, p2) => {
                        return `from ${p1}${p2.replace('.js', '.cjs')}${p1}`;
                    });

                    await writeFile(filePath, content);
                    console.log(`Updated imports in: ${filePath}`);
                }
            }
        }
    } catch (err) {
        console.error('Error updating imports:', err);
    }
};

// Run the rename function and update imports
const main = async () => {
    await renameFiles(buildDir);
    await updateImports(buildDir);
};

main();