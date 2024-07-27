import { readdir, rename, readFile, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory of the module
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Directory containing your built files
const buildDir = __dirname;
const indexFile = join(buildDir, 'index.js');

// Function to rename .js files to .cjs
const renameFiles = async (dir) => {
    try {
        const files = await readdir(dir);

        for (const file of files) {
            const filePath = join(dir, file);
            const fileExt = extname(file);

            if (fileExt === '.js') {
                const newFilePath = join(dir, basename(file, fileExt) + '.cjs');
                await rename(filePath, newFilePath);
                console.log(`Renamed: ${filePath} -> ${newFilePath}`);
            }
        }
    } catch (err) {
        console.error('Error renaming files:', err);
    }
};

// Function to update imports in the index.cjs file
const updateImports = async (file) => {
    try {
        let content = await readFile(file, 'utf-8');

        content = content.replace(/require\((['"])(\.\/.*?\.js)\1\)/g, (match, p1, p2) => {
            return `require(${p1}${p2.replace('.js', '.cjs')}${p1})`;
        });

        content = content.replace(/from (['"])(\.\/.*?\.js)\1/g, (match, p1, p2) => {
            return `from ${p1}${p2.replace('.js', '.cjs')}${p1}`;
        });

        await writeFile(file, content);
        console.log(`Updated imports in: ${file}`);
    } catch (err) {
        console.error('Error updating imports:', err);
    }
};

// Run the rename function and update imports
const main = async () => {
    await updateImports(indexFile);
    await renameFiles(buildDir);
};

main();