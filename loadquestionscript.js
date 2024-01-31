const fs = require('fs');
const Question=require('./modals/Question');
const JSON_FILE = './questions.json';
const VERSION_FILE = './version.txt';

const insertMCQ = async(mcq) => {
  const newMCQ = new Question(mcq);
  let result=await newMCQ.save();
  if(!result){
    console.log('Error inserting MCQ to MongoDB')
  }
};

const updateVersionFile = (timestamp) => {
    fs.writeFileSync(VERSION_FILE, timestamp.toString(), 'utf8');
};

const readAndImportJSON = () => {
  fs.readFile(JSON_FILE, 'utf8', async (err, data) => {
    if (err) {
      console.error(`Error reading JSON file: ${err}`);
      return;
    }

    try {
      let mcqs = JSON.parse(data);
      mcqs=mcqs.mcqs;
      if (fs.existsSync(VERSION_FILE)) {
        const lastImportTimestamp = parseFloat(fs.readFileSync(VERSION_FILE, 'utf8'));
        const jsonModificationTime = fs.statSync(JSON_FILE).mtimeMs;
        if (jsonModificationTime > lastImportTimestamp) {
          let result=await Question.deleteMany({});
          if(result && result.deletedCount>0){
            mcqs.forEach((mcq) => insertMCQ(mcq));
            updateVersionFile(jsonModificationTime);
          }
        }
      } else {
        mcqs.forEach((mcq) => insertMCQ(mcq));
        updateVersionFile(fs.statSync(JSON_FILE).mtimeMs);
      }
    } catch (parseError) {
      console.error(`Error parsing JSON data: ${parseError}`);
    }
  });
};


module.exports = readAndImportJSON;
