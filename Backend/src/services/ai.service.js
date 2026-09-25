require('dotenv').config()
const OpenAI = require("openai")
const puppeteer = require("puppeteer")
const { jsonrepair } = require("jsonrepair")

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
})

const FALLBACK_MODELS = [
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    "z-ai/glm-5.3-flash"
];


async function callOpenAiWithFallback(params) {
    let lastError = null;
    for (const model of FALLBACK_MODELS) {
        try {
            return await openai.chat.completions.create({
                ...params,
                model
            });
        } catch (err) {
            console.warn(`[AI Service] Model ${model} failed (${err.status || err.message}). Trying fallback model...`);
            lastError = err;
        }
    }
    throw lastError || new Error("All AI models failed to respond.");
}

function safeParseAiJson(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
        throw new Error("Empty AI response received.");
    }

    // Strip markdown code blocks
    let cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // Find first '{' and last '}'
    const startIndex = cleaned.indexOf('{');
    const endIndex = cleaned.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Failed to find JSON object in AI response");
    }

    let jsonString = cleaned.substring(startIndex, endIndex + 1);

    // 1. Try standard JSON.parse
    try {
        return JSON.parse(jsonString);
    } catch (e1) {
        // 2. Try jsonrepair
        try {
            const repaired = jsonrepair(jsonString);
            return JSON.parse(repaired);
        } catch (e2) {
            // 3. Normalize unescaped newlines/tabs and trailing commas, then repair
            try {
                let sanitized = jsonString
                    .replace(/,\s*([}\]])/g, '$1')
                    .replace(/[\u0000-\u001F]+/g, (match) => {
                        if (match === '\n') return '\\n';
                        if (match === '\r') return '\\r';
                        if (match === '\t') return '\\t';
                        return '';
                    });
                const repaired2 = jsonrepair(sanitized);
                return JSON.parse(repaired2);
            } catch (e3) {
                console.error("[safeParseAiJson] Raw failed JSON string:", jsonString);
                throw new Error(`Failed to parse JSON response: ${e1.message}`);
            }
        }
    }
}

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
const jsonSchemaExplanation = `Return ONLY valid JSON matching this exact structure. All values must be specific to the candidate's actual resume and the job description — no generic text:

{
  "matchScore": <0-100 integer>,
  "title": "<job title from JD>",
  "resumeAnalysis": {
    "skillsScore": <0-100>,
    "experienceScore": <0-100>,
    "projectsScore": <0-100>,
    "educationScore": <0-100>,
    "strengths": ["<specific strength 1 from resume>", "<specific strength 2>"],
    "weaknesses": ["<specific gap 1 for this role>", "<specific gap 2>"],
    "suggestions": ["<actionable tip 1 for this candidate>", "<actionable tip 2>"],
    "summary": "<2-sentence assessment of this specific candidate for this role>"
  },
  "technicalQuestions": [
    {"question": "<technical q1>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q2>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q3>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q4>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q5>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q6>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q7>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q8>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q9>", "intention": "<why>", "answer": "<short answer>"},
    {"question": "<technical q10>", "intention": "<why>", "answer": "<short answer>"}
  ],
  "behavioralQuestions": [
    {"question": "<behavioral q1>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q2>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q3>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q4>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q5>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q6>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q7>", "intention": "<why>", "answer": "<STAR answer>"},
    {"question": "<behavioral q8>", "intention": "<why>", "answer": "<STAR answer>"}
  ],
  "technicalQuiz": [
    {"question": "<mcq 1>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 2>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 3>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 4>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 5>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 6>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 7>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"},
    {"question": "<mcq 8>", "options": ["A","B","C","D"], "correctAnswer": "<correct option>"}
  ],
  "skillGaps": [
    {"skill": "<missing skill 1 from JD>", "severity": "high|medium|low"},
    {"skill": "<missing skill 2 from JD>", "severity": "high|medium|low"},
    {"skill": "<missing skill 3 from JD>", "severity": "high|medium|low"},
    {"skill": "<missing skill 4 from JD>", "severity": "high|medium|low"},
    {"skill": "<missing skill 5 from JD>", "severity": "high|medium|low"}
  ],
  "preparationPlan": [
    {"day": 1, "focus": "<study topic 1>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 2, "focus": "<study topic 2>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 3, "focus": "<study topic 3>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 4, "focus": "<study topic 4>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 5, "focus": "<study topic 5>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 6, "focus": "<study topic 6>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 7, "focus": "<study topic 7>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 8, "focus": "<study topic 8>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 9, "focus": "<study topic 9>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 10, "focus": "<study topic 10>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 11, "focus": "<study topic 11>", "tasks": ["<task 1>", "<task 2>"]},
    {"day": 12, "focus": "<study topic 12>", "tasks": ["<task 1>", "<task 2>"]}
  ]
}

RULES: 1) Generate 10-12 technical questions, 8 behavioral questions, 8 quiz MCQs. 2) Create an extensive 10-14 day preparation plan roadmap covering all candidate skill gaps thoroughly. 3) Keep all answer & description strings concise (1 sentence max). 4) Scores must differ per section.`


async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Evaluate resume vs job description. Return a complete JSON object with 10-12 technical questions, 8 behavioral questions, 8 quiz MCQs, and an extensive 10-14 day skill gap roadmap. Keep all text values concise (1 sentence max).

Resume:
${(resume || selfDescription || "Not provided").slice(0, 2500)}

Job Description:
${jobDescription.slice(0, 1200)}

${jsonSchemaExplanation}`

    const callParams = {
        messages: [
            { 
                role: "system", 
                content: "You are a technical recruiter. Return ONLY a valid JSON object. Keep all answer and description strings punchy and concise (1 sentence max). Never truncate the JSON — always close all brackets."
            },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3800,
        top_p: 1,
        response_format: { type: "json_object" }
    }

    let parsed = null
    let lastParseError = null

    // Try up to 2 times — retry once if JSON is truncated/malformed
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await callOpenAiWithFallback(callParams)
            let content = response.choices[0].message.content
            parsed = safeParseAiJson(content)
            break // success
        } catch (err) {
            console.warn(`[AI Service] Attempt ${attempt} failed: ${err.message}`)
            lastParseError = err
            if (attempt === 1) {
                // On retry, increase token limit
                callParams.max_tokens = 4500
            }
        }
    }

    if (!parsed) {
        throw lastParseError || new Error("Failed to generate interview report after retries.")
    }

    // Sanitize arrays to prevent Mongoose CastError
    if (Array.isArray(parsed.technicalQuestions)) {
        parsed.technicalQuestions = parsed.technicalQuestions
            .filter(q => typeof q === 'object' && q !== null && q.question)
            .map(q => ({
                question: String(q.question),
                intention: String(q.intention || 'Assess candidate technical ability'),
                answer: String(q.answer || '')
            }))
            .slice(0, 20)
    } else {
        parsed.technicalQuestions = []
    }

    if (Array.isArray(parsed.behavioralQuestions)) {
        parsed.behavioralQuestions = parsed.behavioralQuestions
            .filter(q => typeof q === 'object' && q !== null && q.question)
            .map(q => ({
                question: String(q.question),
                intention: String(q.intention || 'Assess past experience and situational behavior'),
                answer: String(q.answer || '')
            }))
            .slice(0, 20)
    } else {
        parsed.behavioralQuestions = []
    }

    if (Array.isArray(parsed.technicalQuiz)) {
        parsed.technicalQuiz = parsed.technicalQuiz
            .filter(q => typeof q === 'object' && q !== null && q.question && Array.isArray(q.options) && (q.correctAnswer || q.answer))
            .map(q => ({
                question: String(q.question),
                options: q.options.map(String),
                correctAnswer: String(q.correctAnswer || q.answer)
            }))
    } else {
        parsed.technicalQuiz = []
    }

    if (Array.isArray(parsed.skillGaps)) {
        parsed.skillGaps = parsed.skillGaps
            .filter(s => typeof s === 'object' && s !== null && s.skill)
            .map(s => ({
                skill: String(s.skill),
                severity: ['low', 'medium', 'high'].includes(String(s.severity).toLowerCase()) ? String(s.severity).toLowerCase() : 'medium'
            }))
    } else {
        parsed.skillGaps = []
    }

    if (Array.isArray(parsed.preparationPlan)) {
        parsed.preparationPlan = parsed.preparationPlan
            .filter(p => typeof p === 'object' && p !== null && p.day)
            .map((p, idx) => ({
                day: Number(p.day) || (idx + 1),
                focus: String(p.focus || 'Key Study Area'),
                tasks: Array.isArray(p.tasks) ? p.tasks.map(String) : [String(p.tasks || 'Review focus topics')]
            }))
    } else {
        parsed.preparationPlan = []
    }

    // Default matchScore and title if missing
    const rawScore = Number(parsed.matchScore)
    parsed.matchScore = (rawScore > 0 && rawScore <= 100) ? rawScore : 0
    parsed.title = parsed.title || "Interview Strategy Plan"

    return parsed
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

    const dataResponse = await callOpenAiWithFallback({
        messages: [{ role: "user", content: dataExtractionPrompt }],
        temperature: 0.2,
        max_tokens: 3000,
        top_p: 1,
        response_format: { type: "json_object" }
    })

    let jsonContent = dataResponse.choices[0].message.content
    const resumeData = safeParseAiJson(jsonContent)

    // STEP 2: Inject data into a fixed HTML template (same format as user's example)
    const htmlContent = buildResumeHtml(resumeData)

    const pdfBuffer = await generatePdfFromHtml(htmlContent)

    return pdfBuffer
}

async function evaluateCandidateAnswer({ question, answer }) {
    const prompt = `You are a real-world expert technical & behavioral hiring manager. Carefully evaluate the candidate's actual reply to the specific interview question below.

Interview Question:
"${question}"

Candidate's Actual Reply:
"${answer}"

CRITICAL EVALUATION GUIDELINES:
1. Deeply analyze what the candidate ACTUALLY said in their reply. Reference their specific words, tools, logic, or terminology.
2. Judge accuracy, depth, and clarity of their reply and give an objective score out of 100.
3. If they missed important concepts, highlight exactly what was missing.
4. Provide the complete ideal 10/10 correct answer for this question.

Return ONLY a valid JSON object matching this schema:
{
  "score": <integer 0-100>,
  "rating": "<Excellent|Good|Needs Improvement|Poor>",
  "feedback": "Concise 1-2 sentence overall evaluation directly referencing the candidate's reply.",
  "strengths": [
    "Specific concept or point the candidate explained correctly",
    "Specific positive aspect of their phrasing or approach"
  ],
  "weaknesses": [
    "Specific technical gap or missing detail in their answer",
    "Specific point that was inaccurate, vague, or lacked depth"
  ],
  "improvements": [
    "Clear point on what exact concepts or syntax they should add next time",
    "Clear recommendation to make their answer a 10/10 response"
  ],
  "correctAnswer": "Complete ideal 10/10 model answer explaining the topic accurately and thoroughly."
}`

    const response = await callOpenAiWithFallback({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1200,
        top_p: 1,
        response_format: { type: "json_object" }
    })

    let content = response.choices[0].message.content
    const parsed = safeParseAiJson(content)

    // Ensure improvements is an array and backwards compatible with improvement
    if (!Array.isArray(parsed.improvements)) {
        if (Array.isArray(parsed.improvement)) {
            parsed.improvements = parsed.improvement
        } else if (typeof parsed.improvement === 'string') {
            parsed.improvements = [parsed.improvement]
        } else {
            parsed.improvements = []
        }
    }
    if (!Array.isArray(parsed.strengths)) parsed.strengths = []
    if (!Array.isArray(parsed.weaknesses)) parsed.weaknesses = []

    parsed.score = Number(parsed.score) || 70
    parsed.rating = parsed.rating || (parsed.score >= 80 ? "Excellent" : parsed.score >= 60 ? "Good" : "Needs Improvement")

    return parsed
}

module.exports = { generateInterviewReport, generateResumePdf, evaluateCandidateAnswer }

module.exports = { generateInterviewReport, generateResumePdf, evaluateCandidateAnswer }