const pdf = require('pdf-parse');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const stopwords = require('stopwords').english;

async function jobRecommendation(jobs,user){
    try{
        const userResume=await fetchResume(user);
        const jobDescriptions=jobs.map((job)=>job.description);
        const tokenizedJobDescriptions = jobDescriptions.map(desc => preprocess(desc));
        const tokenizedResume = preprocess(userResume);
        const tfidf = new TfIdf();
        tokenizedJobDescriptions.forEach(tokens => tfidf.addDocument(tokens.join(' ')));
        tfidf.addDocument(tokenizedResume.join(' '));
        const recommendations = [];
        tokenizedJobDescriptions.forEach((tokens, index) => {
            const similarity = tfidf.tfidf(preprocess(userResume).join(' '), index);
            recommendations.push({ ...jobs[index]._doc, similarity });
        });
        
// Sort recommendations by similarity
recommendations.sort((a, b) => b.similarity - a.similarity);
return recommendations;

    }
    catch(error){
        console.log(error);
    }
}
function preprocess(text){
    return text.toLowerCase().replace(/[^\w\s]|_/g, "").split(/\s+/).filter(word => !stopwords.includes(word));
}
async function fetchResume(user){
    try{
        const resume=await fetch(user.resume);
        if(!resume)throw "Resume Fetching Error"
        const resumeContent=await resume.arrayBuffer();
        if(!resumeContent)throw "Error In Parsing Resume";
        const resumetext=await pdf(resumeContent);
        if(!resumetext)throw "Error In Parsing Resume"
        return resumetext.text;
    }
    catch(error){
        console.log(error);
    }
}
module.exports=jobRecommendation;