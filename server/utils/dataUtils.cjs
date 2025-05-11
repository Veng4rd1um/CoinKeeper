// server/utils/dataUtils.cjs
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '..', 'data'); // Путь к папке data

// Helper to read JSON file
const readDataFile = async (fileName) => {
    try {
        const filePath = path.join(dataDir, fileName);
        await fs.access(filePath); // Check if file exists
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { // File not found
            // For users.json, return empty array. For others, it might indicate an issue or initial state.
            if (fileName === 'users.json') return [];
            if (fileName.startsWith('categories_') || fileName.startsWith('transactions_')) {
                // For categories, return default structure, for transactions empty array
                return fileName.startsWith('categories_') ? { income: [], expense: [] } : [];
            }
        }
        console.error(`Error reading ${fileName}:`, error);
        throw new Error(`Could not read data file ${fileName}`);
    }
};

// Helper to write JSON file
const writeDataFile = async (fileName, data) => {
    try {
        const filePath = path.join(dataDir, fileName);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing ${fileName}:`, error);
        throw new Error(`Could not write data file ${fileName}`);
    }
};

// Ensure data directory exists
const ensureDataDirExists = async () => {
    try {
        await fs.access(dataDir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dataDir, { recursive: true });
            console.log(`Data directory created: ${dataDir}`);
        } else {
            throw error;
        }
    }
};

const defaultCategoryIconName = 'QuestionMarkCircleIcon';

module.exports = {
    // ...
    defaultCategoryIconName,
};

module.exports = {
    readDataFile,
    writeDataFile,
    ensureDataDirExists,
    uuidv4,
    dataDir // Export dataDir if needed elsewhere directly, though unlikely
};