const nodemailer = require('nodemailer');

const getTransporter = () => {
    if (!process.env.SMTP_HOST) {
        throw new Error("SMTP credentials not configured.");
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

function h2(title) {
    return '<h2 style="color:#0366d6;border-left:4px solid #0366d6;padding-left:12px;margin-top:35px;margin-bottom:12px;">' + title + '</h2>';
}

function card(content) {
    return '<div style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;margin-bottom:12px;">' + content + '</div>';
}

function safe(val) {
    return val ? String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}

/**
 * Sends the student complete profile + all interview sections to a professor.
 */
async function sendProfileToProfessor(professorEmail, studentData, pdfBuffer) {
    const transporter = getTransporter();

    const p = studentData.fullProfile || {};
    const r = studentData.interviewReport || {};

    // Build question -> candidate answer lookup map
    const candidateAnswerMap = {};
    const answers = Array.isArray(studentData.answers) ? studentData.answers : [];
    answers.forEach(function(a) {
        if (a && a.question) {
            candidateAnswerMap[a.question.trim()] = a.answer || '';
        }
    });

    /* ────────────────────────────────────────────
       PART 1: Student Profile Sections
    ──────────────────────────────────────────── */
    var profileHtml = '';

    if (p.summary) {
        profileHtml += h2('📝 Professional Summary');
        profileHtml += card('<p style="margin:0;color:#444;">' + safe(p.summary) + '</p>');
    }

    var educList = Array.isArray(p.education) ? p.education : [];
    if (educList.length > 0) {
        profileHtml += h2('🎓 Education');
        educList.forEach(function(ed) {
            profileHtml += card(
                '<strong>' + safe(ed.degree) + ' in ' + safe(ed.branch) + '</strong><br/>' +
                safe(ed.college) + (ed.university ? ' &mdash; ' + safe(ed.university) : '') + '<br/>' +
                '<span style="color:#555;">' + safe(ed.startYear) + ' &ndash; ' + safe(ed.endYear) +
                ' &nbsp;|&nbsp; ' + safe(ed.scoreType) + ': ' + safe(ed.score) + '</span>'
            );
        });
    }

    var expList = Array.isArray(p.experience) ? p.experience : [];
    if (expList.length > 0) {
        profileHtml += h2('💼 Work Experience');
        expList.forEach(function(exp) {
            var endYr = exp.isCurrent ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '');
            profileHtml += card(
                '<strong>' + safe(exp.role) + '</strong> &mdash; ' + safe(exp.company) +
                ' <span style="color:#888;">(' + safe(exp.type) + ')</span><br/>' +
                '<span style="color:#555;">' + new Date(exp.startDate).getFullYear() + ' &ndash; ' + endYr + '</span>' +
                (exp.description ? '<br/><span style="color:#444;">' + safe(exp.description) + '</span>' : '')
            );
        });
    }

    var projList = Array.isArray(p.projects) ? p.projects : [];
    if (projList.length > 0) {
        profileHtml += h2('🚀 Projects');
        projList.forEach(function(proj) {
            var techStr = Array.isArray(proj.technologies) && proj.technologies.length > 0
                ? '<br/><em style="color:#0366d6;">Tech: ' + proj.technologies.join(', ') + '</em>'
                : '';
            profileHtml += card(
                '<strong>' + safe(proj.title) + '</strong>' + (proj.role ? ' &mdash; ' + safe(proj.role) : '') + '<br/>' +
                (proj.description ? '<span style="color:#444;">' + safe(proj.description) + '</span>' : '') +
                techStr +
                (proj.githubUrl ? '<br/><a href="' + proj.githubUrl + '" style="color:#0366d6;">GitHub</a>' : '')
            );
        });
    }

    var skillList = Array.isArray(p.skills) ? p.skills : [];
    if (skillList.length > 0) {
        profileHtml += h2('🛠️ Skills');
        var skillChips = '';
        skillList.forEach(function(skill) {
            var color = skill.level === 'Advanced' ? '#2ea44f' : skill.level === 'Intermediate' ? '#0366d6' : '#e36209';
            skillChips += '<span style="display:inline-block;background:#f0f0f0;border:1px solid #d0d0d0;' +
                'padding:3px 10px;border-radius:99px;font-size:0.85em;margin:3px;color:' + color + ';">' +
                safe(skill.name) + ' &bull; ' + safe(skill.level) + '</span> ';
        });
        profileHtml += '<p style="margin:8px 0;">' + skillChips + '</p>';
    }

    var achList = Array.isArray(p.achievements) ? p.achievements : [];
    if (achList.length > 0) {
        profileHtml += h2('🏆 Achievements');
        achList.forEach(function(ach) {
            profileHtml += card(
                '<strong>' + safe(ach.title) + '</strong> &mdash; <span style="color:#888;">' +
                safe(ach.type) + ' (' + (ach.date ? new Date(ach.date).getFullYear() : '') + ')</span>' +
                (ach.description ? '<br/><span style="color:#444;">' + safe(ach.description) + '</span>' : '')
            );
        });
    }

    /* ────────────────────────────────────────────
       PART 2: Interview Report Sections
    ──────────────────────────────────────────── */
    var interviewHtml = '';

    // Technical Questions
    var techQs = Array.isArray(r.technicalQuestions) ? r.technicalQuestions : [];
    if (techQs.length > 0) {
        interviewHtml += h2('💻 Technical Questions');
        techQs.forEach(function(q, i) {
            var candidateAnswer = candidateAnswerMap[q.question ? q.question.trim() : ''];
            var answerBlock = '';
            if (candidateAnswer) {
                answerBlock = '<div style="background:#e6f3ff;border-left:3px solid #0366d6;padding:8px 12px;' +
                    'margin-top:8px;border-radius:0 4px 4px 0;">' +
                    '<strong style="color:#0366d6;">Candidate\'s Answer:</strong><br/>' +
                    safe(candidateAnswer) + '</div>';
            } else {
                answerBlock = '<p style="margin:6px 0 0 0;color:#999;font-style:italic;">Candidate did not attempt this question.</p>';
            }
            interviewHtml += card(
                '<p style="margin:0 0 8px 0;"><strong>Q' + (i + 1) + ':</strong> ' + safe(q.question) + '</p>' +
                '<p style="margin:0 0 6px 0;color:#555;font-size:0.85em;"><em>Why asked: ' + safe(q.intention) + '</em></p>' +
                '<p style="margin:0 0 6px 0;"><strong>Expected Answer:</strong> ' + safe(q.answer) + '</p>' +
                answerBlock
            );
        });
    }

    // Technical Quiz (MCQ)
    var quizQs = Array.isArray(r.technicalQuiz) ? r.technicalQuiz : [];
    if (quizQs.length > 0) {
        interviewHtml += h2('❓ Technical Quiz (MCQ)');
        quizQs.forEach(function(q, i) {
            var options = Array.isArray(q.options) ? q.options : [];
            var optHtml = '<ul style="margin:4px 0 6px 0;padding-left:20px;">';
            options.forEach(function(opt) {
                var isCorrect = opt === q.correctAnswer;
                optHtml += '<li style="margin-bottom:3px;' +
                    (isCorrect ? 'color:#2ea44f;font-weight:bold;' : 'color:#555;') + '">' +
                    safe(opt) + (isCorrect ? ' &#10003; Correct' : '') + '</li>';
            });
            optHtml += '</ul>';
            interviewHtml += card(
                '<p style="margin:0 0 8px 0;"><strong>Q' + (i + 1) + ':</strong> ' + safe(q.question) + '</p>' +
                optHtml
            );
        });
    }

    // Behavioral Questions
    var behavQs = Array.isArray(r.behavioralQuestions) ? r.behavioralQuestions : [];
    if (behavQs.length > 0) {
        interviewHtml += h2('💬 Behavioral Questions');
        behavQs.forEach(function(q, i) {
            interviewHtml += card(
                '<p style="margin:0 0 6px 0;"><strong>Q' + (i + 1) + ':</strong> ' + safe(q.question) + '</p>' +
                '<p style="margin:0 0 4px 0;color:#555;font-size:0.85em;"><em>Purpose: ' + safe(q.intention) + '</em></p>' +
                '<p style="margin:0;"><strong>Model Answer:</strong> <span style="color:#444;">' + safe(q.answer) + '</span></p>'
            );
        });
    }

    // Road Map
    var plan = Array.isArray(r.preparationPlan) ? r.preparationPlan : [];
    if (plan.length > 0) {
        interviewHtml += h2('🗺️ Study Road Map');
        plan.forEach(function(day) {
            var tasks = Array.isArray(day.tasks) ? day.tasks : [];
            var taskHtml = '<ul style="margin:4px 0 0 0;padding-left:20px;color:#555;">';
            tasks.forEach(function(t) { taskHtml += '<li>' + safe(t) + '</li>'; });
            taskHtml += '</ul>';
            interviewHtml += card(
                '<p style="margin:0 0 6px 0;"><strong>Day ' + safe(day.day) + ':</strong> ' +
                '<span style="color:#0366d6;">' + safe(day.focus) + '</span></p>' + taskHtml
            );
        });
    }

    /* ────────────────────────────────────────────
       Compose Final Email HTML
    ──────────────────────────────────────────── */
    var studentName = p.fullName || studentData.name || 'Student';
    var scoreColor = '#e36209';
    if (studentData.score >= 80) scoreColor = '#2ea44f';
    else if (studentData.score < 60) scoreColor = '#d73a49';

    var summaryRows =
        '<tr><td style="padding:5px 0;width:160px;color:#555;font-weight:600;">Student Name</td><td><strong>' + safe(studentName) + '</strong></td></tr>' +
        '<tr><td style="padding:5px 0;color:#555;font-weight:600;">Email</td><td>' + safe(studentData.email) + '</td></tr>';

    if (p.phone) summaryRows += '<tr><td style="padding:5px 0;color:#555;font-weight:600;">Phone</td><td>' + safe(p.phone) + '</td></tr>';
    if (studentData.score !== null && studentData.score !== undefined) {
        summaryRows += '<tr><td style="padding:5px 0;color:#555;font-weight:600;">AI Match Score</td><td><strong style="color:' + scoreColor + ';font-size:1.1rem;">' + safe(studentData.score) + '%</strong></td></tr>';
    }
    if (r.title) summaryRows += '<tr><td style="padding:5px 0;color:#555;font-weight:600;">Target Role</td><td>' + safe(r.title) + '</td></tr>';
    summaryRows += '<tr><td style="padding:5px 0;color:#555;font-weight:600;">Questions Answered</td><td>' + Object.keys(candidateAnswerMap).length + ' of ' + techQs.length + ' technical questions</td></tr>';
    if (studentData.message) {
        summaryRows += '<tr><td style="padding:5px 0;color:#555;font-weight:600;vertical-align:top;">Message</td><td style="font-style:italic;color:#555;">"' + safe(studentData.message) + '"</td></tr>';
    }

    var jobDescExcerpt = '';
    if (r.jobDescription) {
        var excerpt = r.jobDescription.substring(0, 500);
        if (r.jobDescription.length > 500) excerpt += '...';
        jobDescExcerpt = '<div style="background:#fff8dc;border:1px solid #f0c060;border-radius:6px;padding:12px 16px;margin-bottom:20px;">' +
            '<strong>Job Description (excerpt):</strong><br/><span style="color:#555;">' + safe(excerpt) + '</span></div>';
    }

    var pdfNote = pdfBuffer
        ? '<div style="background:#e6f3ff;border:1px solid #0366d6;border-radius:8px;padding:14px 18px;margin-top:30px;">' +
          '<strong style="color:#0366d6;">📄 Attachment:</strong> An AI-generated resume tailored to this student is attached as a PDF.</div>'
        : '';

    var htmlContent =
        '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;max-width:720px;margin:0 auto;color:#24292e;line-height:1.6;">' +

        // Header
        '<div style="background:linear-gradient(135deg,#0366d6,#6f42c1);padding:28px 30px;border-radius:10px 10px 0 0;color:white;">' +
        '<h1 style="margin:0;font-size:1.5rem;">🎯 MockMate AI</h1>' +
        '<p style="margin:6px 0 0 0;opacity:0.85;">Student Profile &amp; Full Interview Report</p>' +
        '</div>' +

        // Body
        '<div style="background:white;border:1px solid #e1e4e8;border-top:none;padding:28px 30px;border-radius:0 0 10px 10px;">' +
        '<p style="margin-top:0;">Dear Professor,</p>' +
        '<p>Your student <strong>' + safe(studentName) + '</strong> has shared their complete MockMate AI profile, mock interview performance, and AI-generated resume for your evaluation.</p>' +

        // Summary table
        '<div style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:8px;padding:16px 20px;margin:20px 0;">' +
        '<h3 style="margin:0 0 12px 0;color:#0366d6;">📋 Quick Summary</h3>' +
        '<table style="width:100%;border-collapse:collapse;">' + summaryRows + '</table>' +
        '</div>' +

        // Part 1 Profile
        '<h1 style="font-size:1.3rem;color:#24292e;border-bottom:2px solid #e1e4e8;padding-bottom:8px;margin-top:35px;">PART 1 — Student Profile</h1>' +
        (profileHtml || '<p style="color:#888;">No profile data filled in yet.</p>') +

        // Part 2 Interview
        '<h1 style="font-size:1.3rem;color:#24292e;border-bottom:2px solid #e1e4e8;padding-bottom:8px;margin-top:40px;">PART 2 — AI Interview Report</h1>' +
        jobDescExcerpt +
        (interviewHtml || '<p style="color:#888;">No interview data available.</p>') +

        pdfNote +

        // Footer
        '<p style="color:#999;font-size:0.82em;margin-top:40px;border-top:1px solid #eaecef;padding-top:16px;">' +
        'This email was generated automatically by MockMate AI.<br/>Please do not reply to this automated address.</p>' +
        '</div>' +
        '</div>';

    var mailOptions = {
        from: '"MockMate AI" <' + process.env.SMTP_USER + '>',
        to: professorEmail,
        subject: '[SmartIG AI] Full Report — ' + studentName + (r.title ? ' | ' + r.title : ''),
        html: htmlContent
    };

    if (pdfBuffer) {
        mailOptions.attachments = [{
            filename: studentName.replace(/\s+/g, '_') + '_Resume.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
        }];
    }

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendProfileToProfessor
};
