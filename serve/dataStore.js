const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  forumPosts: [],
  userLists: {},
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!content) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading data file, resetting to defaults:', error);
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function readData() {
  return ensureDataFile();
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  readData,
  writeData,
  DATA_FILE,
};
