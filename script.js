// This script organizes files by decoding and categorizing them based on specific values.

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
        // Base64 decoding (if needed)
        execSync(`base64 --decode "${filePath}" > "${decodedFilePath}"`);
        fs.renameSync(decodedFilePath, filePath);
        return;
    } catch (error) {
        console.error(`Error decoding file ${filePath}:`, error);
    }

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

console.log("Files have been split and organized successfully!");
