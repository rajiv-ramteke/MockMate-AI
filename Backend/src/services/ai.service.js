const OpenAI = require("openai")
const puppeteer = require("puppeteer")

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
})

/**
 * Builds a pixel-perfect HTML resume matching the user's exact desired format.
 * This ensures consistent formatting regardless of AI output variance.
 */
function buildResumeHtml(data) {
    const safe = (str) => (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    const educationRows = (data.education || []).map(edu => `
        <tr>
            <td style="font-weight:bold;">${safe(edu.degree)}</td>
            <td style="text-align:right; color:#333;">${safe(edu.years)}</td>
        </tr>
        <tr>
            <td colspan="2">${safe(edu.institution)}</td>
        </tr>`).join('')

    const skillRows = (data.technicalSkills || []).map(s => `
        <p style="margin:2px 0;"><strong>${safe(s.label)}:</strong> ${safe(s.skills)}</p>`).join('')

    const experienceBlocks = (data.experience || []).map(exp => `
        <p style="margin:6px 0 1px 0;">
            <strong>${safe(exp.title)}</strong>
            <span style="float:right; font-size:9pt;">${safe(exp.duration)}</span>
        </p>
        <p style="margin:0 0 4px 0; font-style:italic;">${safe(exp.company)}</p>
        <ul style="margin:2px 0 6px 18px; padding:0;">
            ${(exp.bullets || []).map(b => `<li style="margin-bottom:2px;">${safe(b)}</li>`).join('')}
        </ul>`).join('')

    const projectBlocks = (data.projects || []).map(proj => `
        <p style="margin:6px 0 1px 0;"><strong>${safe(proj.name)}</strong></p>
        <ul style="margin:2px 0 6px 18px; padding:0;">
            ${(proj.bullets || []).map(b => `<li style="margin-bottom:2px;">${safe(b)}</li>`).join('')}
        </ul>`).join('')

    const certList = (data.certifications || []).map(c => `
        <li style="margin-bottom:2px;">${safe(c)}</li>`).join('')

    const extraRows = (data.extracurricular || []).map(e => `
        <p style="margin:2px 0;"><strong>${safe(e.label)}:</strong> ${safe(e.value)}</p>`).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safe(data.name)} - Resume</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10.5pt;
    color: #000;
    margin: 0;
    padding: 28px 36px;
    line-height: 1.35;
  }
  h1.resume-name {
    text-align: center;
    font-size: 18pt;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0 0 4px 0;
  }
  .contact-line {
    text-align: center;
    font-size: 9.5pt;
    margin: 2px 0;
  }
  .contact-line a { color: #000; text-decoration: underline; }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    border-bottom: 1.5px solid #000;
    margin: 12px 0 4px 0;
    padding-bottom: 1px;
  }
  table.edu-table { width: 100%; border-collapse: collapse; }
  table.edu-table td { padding: 1px 0; }
  ul { margin: 3px 0 4px 18px; padding: 0; }
  li { margin-bottom: 2px; }
  p { margin: 3px 0; }
  .clearfix::after { content: ''; display: table; clear: both; }
</style>
</head>
<body>

  <h1 class="resume-name">${safe(data.name)}</h1>
  <p class="contact-line">${safe(data.location)}</p>
  <p class="contact-line">
    ${safe(data.phone)}
    ${data.email ? ` — <a href="mailto:${safe(data.email)}">${safe(data.email)}</a>` : ''}
  </p>
  <p class="contact-line">
    ${data.linkedin ? `LinkedIn: <a href="https://${safe(data.linkedin)}">${safe(data.linkedin)}</a>` : ''}
    ${data.github ? ` — GitHub: <a href="https://${safe(data.github)}">${safe(data.github)}</a>` : ''}
  </p>

  ${data.careerObjective ? `
  <div class="section-title">Career Objective</div>
  <p>${safe(data.careerObjective)}</p>
  ` : ''}

  ${(data.education || []).length > 0 ? `
  <div class="section-title">Education</div>
  <table class="edu-table">${educationRows}</table>
  ` : ''}

  ${(data.technicalSkills || []).length > 0 ? `
  <div class="section-title">Technical Skills</div>
  ${skillRows}
  ` : ''}

  ${(data.experience || []).length > 0 ? `
  <div class="section-title">Internship Experience</div>
  ${experienceBlocks}
  ` : ''}

  ${(data.projects || []).length > 0 ? `
  <div class="section-title">Projects</div>
  ${projectBlocks}
  ` : ''}

  ${(data.certifications || []).length > 0 ? `
  <div class="section-title">Certifications &amp; Achievements</div>
  <ul>${certList}</ul>
  ` : ''}

  ${(data.extracurricular || []).length > 0 ? `
  <div class="section-title">Extracurricular &amp; Interests</div>
  ${extraRows}
  ` : ''}

</body>
</html>`
}

// Since we are using an OpenAI-compatible endpoint with Llama 3, 
// we will instruct the model explicitly to return pure JSON.
const jsonSchemaExplanation = `
You must respond strictly with a valid JSON object. Do not include markdown formatting like \`\`\`json. 
The JSON object must EXACTLY match this structure (use this as a template, but fill it with 10 questions each):

{
  "matchScore": 85,
  "title": "Position Title",
  "technicalQuestions": [
    {
      "question": "Example technical question?",
      "intention": "Why are you asking this?",
      "answer": "Ideal answer."
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Example behavioral question?",
      "intention": "Why are you asking this?",
      "answer": "Ideal answer."
    }
  ],
  "technicalQuiz": [
    {
      "question": "Example multiple choice question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B"
    }
  ],
  "skillGaps": [
    {
      "skill": "Missing Skill",
      "severity": "low|medium|high"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "Study Focus",
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}

CRITICAL: Return ONLY valid JSON. Ensure "behavioralQuestions" is at the ROOT level, NOT inside "technicalQuestions".`

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate by analyzing their resume against the job description:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Important constraints:
1. **Match Score Calculation**: Analyze the Resume against the Job Description. Calculate the 'matchScore' (percentage 0-100). This score MUST strictly represent how closely the candidate's skills, experience, and projects in their Resume align with the exact requirements of the Job Description.
2. **Skill Gaps Identification**: Identify specific 'skillGaps'. You MUST list only the skills that are explicitly required by the Job Description but are completely missing or weak in the candidate's Resume. For each missing required skill, specify the 'skill' name and 'severity' (low, medium, high).
3. Generate EXACTLY 5 PURELY technical questions tailored to the job description and the candidate's resume. Place them in the 'technicalQuestions' array. EVERY question MUST have all 3 fields: 'question', 'intention', and 'answer'.
4. Generate EXACTLY 5 PURELY behavioral questions tailored to the candidate's experience and the job role. Place them in the 'behavioralQuestions' array. EVERY question MUST have all 3 fields: 'question', 'intention', and 'answer'.
5. Generate EXACTLY 5 multiple-choice questions for the 'technicalQuiz' array. Each MUST have 'question', 'options' (array of 4 strings), and 'correctAnswer'.
6. Generate a detailed 'preparationPlan' roadmap. It should have a day-by-day 'focus' and specific 'tasks' to help the candidate overcome their skill gaps and prepare for the interview.
7. DO NOT mix technical questions into the behavioral section or vice versa.
8. Do NOT generate more than 5 items in any question array.

${jsonSchemaExplanation}`

    const response = await openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
            { 
                role: "system", 
                content: "You are an expert technical recruiter and interviewer. You must return a fully complete JSON object with all required keys: 'matchScore', 'title', 'technicalQuestions', 'behavioralQuestions', 'technicalQuiz', 'skillGaps', and 'preparationPlan'. NEVER omit any of these keys."
            },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 6000,
        top_p: 1,
        response_format: { type: "json_object" }
    })

    let content = response.choices[0].message.content.trim()
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // Extract JSON object from the response (finds first { and last })
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Failed to find JSON object in AI response");
    }
    
    let jsonString = content.substring(startIndex, endIndex + 1);

    // Fix common LLM JSON errors: trailing commas
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    
    // Fix common LLM JSON errors: unescaped newlines in strings (basic heuristic)
    // Sometimes LLMs generate literal newlines inside string values.

    try {
        const parsed = JSON.parse(jsonString)
        
        // Sanitize arrays to prevent Mongoose CastError
        // Filter out any questions missing required fields: question, intention, answer
        if (Array.isArray(parsed.technicalQuestions)) {
            parsed.technicalQuestions = parsed.technicalQuestions
                .filter(q => typeof q === 'object' && q !== null
                    && q.question && typeof q.question === 'string'
                    && q.intention && typeof q.intention === 'string'
                    && q.answer && typeof q.answer === 'string'
                )
                .slice(0, 10) // cap to prevent runaway arrays
        }
        if (Array.isArray(parsed.behavioralQuestions)) {
            parsed.behavioralQuestions = parsed.behavioralQuestions
                .filter(q => typeof q === 'object' && q !== null
                    && q.question && typeof q.question === 'string'
                    && q.intention && typeof q.intention === 'string'
                    && q.answer && typeof q.answer === 'string'
                )
                .slice(0, 10) // cap to prevent runaway arrays
        }
        if (Array.isArray(parsed.technicalQuiz)) {
            parsed.technicalQuiz = parsed.technicalQuiz
                .filter(q => typeof q === 'object' && q !== null && q.question && Array.isArray(q.options) && (q.correctAnswer || q.answer))
                .map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer || q.answer
                }))
        }
        if (Array.isArray(parsed.skillGaps)) {
            parsed.skillGaps = parsed.skillGaps.filter(s => typeof s === 'object' && s !== null && s.skill && typeof s.skill === 'string')
        }
        if (Array.isArray(parsed.preparationPlan)) {
            parsed.preparationPlan = parsed.preparationPlan.filter(p => typeof p === 'object' && p !== null && p.day)
        }
        
        return parsed
    } catch (e) {
        console.error("RAW JSON FAILED TO PARSE:", jsonString);
        throw new Error(`Failed to parse JSON. Error: ${e.message}. Content was: ${jsonString.substring(0, 100)}...`);
    }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Docker environments like Hugging Face
    })
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription, candidateAnswers = [] }) {

    // Format candidate's Q&A for the prompt
    let answersSection = ""
    if (candidateAnswers && candidateAnswers.length > 0) {
        answersSection = `\n\nCandidate's Interview Answers (use these to understand their real experience and strengths):\n`
        candidateAnswers.forEach((qa, i) => {
            answersSection += `\nQ${i+1}: ${qa.question}\nA${i+1}: ${qa.answer}\n`
        })
    }

    // STEP 1: Ask AI to rewrite and structure the resume data as JSON
    const dataExtractionPrompt = `You are an expert resume re-writer and career coach. Your task is to REWRITE, OPTIMIZE, and ENHANCE the candidate's original resume to perfectly align with the target job description.

Candidate's Original Resume:
${resume}

Self Description:
${selfDescription || "Not provided"}

Target Job Description:
${jobDescription}
${answersSection}

CRITICAL INSTRUCTIONS FOR REWRITING:
1. DO NOT simply copy-paste the original resume. You must rewrite the bullet points.
2. Formulate a brand new Career Objective that strongly positions the candidate for the Target Job Description.
3. Integrate the "Candidate's Interview Answers" as NEW or ENHANCED bullet points in the Experience or Projects sections. Their answers demonstrate their real skills—add them to the resume!
4. Filter out irrelevant skills and prioritize the technical skills mentioned in the Target Job Description.
5. Ensure the final resume reads professionally and highlights why they are the perfect fit for this specific job role.

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Full Name",
  "location": "City, State, Country",
  "phone": "+91-XXXXXXXXXX",
  "email": "email@example.com",
  "linkedin": "linkedin.com/in/username",
  "github": "github.com/username",
  "careerObjective": "2-3 sentence career objective tailored to the job description",
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "years": "Start Year - End Year"
    }
  ],
  "technicalSkills": [
    { "label": "Category Name", "skills": "Skill1, Skill2, Skill3" }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Mon YYYY - Mon YYYY",
      "bullets": ["Rewritten Achievement 1", "Rewritten Achievement 2 (from interview answers)"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "bullets": ["Rewritten point 1", "Rewritten point 2"]
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "extracurricular": [
    { "label": "Activities", "value": "Activity description" },
    { "label": "Hobbies", "value": "Hobby 1, Hobby 2" }
  ]
}`

    const dataResponse = await openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: dataExtractionPrompt }],
        temperature: 0.2,
        max_tokens: 3000,
        top_p: 1,
        response_format: { type: "json_object" }
    })

    let jsonContent = dataResponse.choices[0].message.content.trim()
    // Strip markdown if present
    jsonContent = jsonContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const startIdx = jsonContent.indexOf('{')
    const endIdx = jsonContent.lastIndexOf('}')
    let resumeData
    try {
        resumeData = JSON.parse(jsonContent.substring(startIdx, endIdx + 1).replace(/,\s*([}\]])/g, '$1'))
    } catch(e) {
        console.error("Resume JSON parse failed:", e.message)
        throw new Error("AI failed to extract resume data. Please try again.")
    }

    // STEP 2: Inject data into a fixed HTML template (same format as user's example)
    const htmlContent = buildResumeHtml(resumeData)

    const pdfBuffer = await generatePdfFromHtml(htmlContent)


    return pdfBuffer
}

async function evaluateCandidateAnswer({ question, answer }) {
    const prompt = `You are an expert technical and behavioral interviewer. Evaluate the candidate's answer to the following interview question.

Question: "${question}"
Candidate's Answer: "${answer}"

Provide constructive feedback. Highlight what they did well (strengths), what they missed or got wrong (weaknesses), and how they can improve.

You must respond strictly with a valid JSON object. Do not include markdown formatting.
The JSON object must match this schema:
{
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improvement": "string"
}`

    const response = await openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 1,
        response_format: { type: "json_object" }
    })

    let content = response.choices[0].message.content.trim()
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // Extract JSON object from the response (finds first { and last })
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Failed to find JSON object in AI evaluation response");
    }
    
    let jsonString = content.substring(startIndex, endIndex + 1);

    // Fix common LLM JSON errors: trailing commas
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

    try {
        return JSON.parse(jsonString)
    } catch (e) {
        console.error("RAW EVALUATION JSON FAILED TO PARSE:", jsonString);
        throw new Error(`Failed to parse evaluation JSON. Error: ${e.message}. Content was: ${jsonString.substring(0, 100)}...`);
    }
}

module.exports = { generateInterviewReport, generateResumePdf, evaluateCandidateAnswer }