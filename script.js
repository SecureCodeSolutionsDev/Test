const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputFile = '/storage/emulated/0/MT2/apks/dump.txt';
const splitDir = '/data/data/com.termux/files/home';
const outputDir = path.join(splitDir, 'organized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Split the file into chunks of 5MB
execSync(`split -b 5m --additional-suffix=.txt "${inputFile}" "${splitDir}/dump_part_"`);

// Define target values
const valueSpeed = "speed";
const valueDamage = "damage";

// Function to decode file content for various encodings
function decodeFile(filePath) {
    const decodedFilePath = `${filePath}.decoded`;
    try {
        // Base64 decoding
        execSync(`base64 --decode "${filePath}" > "${decodedFilePath}"`);
        fs.renameSync(decodedFilePath, filePath);
        return;
    } catch {}

    // Additional decoding methods can be added here...

    console.log(`No decoding applied for ${filePath}`);
}

// Loop through each split file
fs.readdirSync(splitDir).forEach(file => {
    if (file.startsWith('dump_part_') && file.endsWith('.txt')) {
        const filePath = path.join(splitDir, file);
        decodeFile(filePath);

        const hasSpeed = fs.readFileSync(filePath, 'utf8').includes(valueSpeed);
        const hasDamage = fs.readFileSync(filePath, 'utf8').includes(valueDamage);

        let folderName;
        if (hasSpeed && hasDamage) folderName = "speed_and_damage";
        else if (hasSpeed) folderName = "speed";
        else if (hasDamage) folderName = "damage";
        else folderName = "Others_no_targeted_values_found";

        const targetDir = path.join(outputDir, folderName);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.renameSync(filePath, path.join(targetDir, file));
    }
});

// Generate classes.txt for each folder
fs.readdirSync(outputDir).forEach(folder => {
    const folderPath = path.join(outputDir, folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
        const classesFile = path.join(folderPath, 'classes.txt');
        fs.writeFileSync(classesFile, '');

        fs.readdirSync(folderPath).forEach(file => {
            if (file.endsWith('.txt')) {
                const content = fs.readFileSync(path.join(folderPath, file), 'utf8');
                const classNames = content.match(/class \w+/g) || [];
                classNames.forEach(className => {
                    fs.appendFileSync(classesFile, className.replace('class ', '') + '\n');
                });
            }
        });

        // Remove duplicates and sort
        const uniqueClasses = [...new Set(fs.readFileSync(classesFile, 'utf8').split('\n'))].filter(Boolean);
        fs.writeFileSync(classesFile, uniqueClasses.sort().join('\n'));
    }
});

console.log("Files have been split, organized, and class names collected successfully!");