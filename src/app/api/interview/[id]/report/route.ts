import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel, extractAIConfig, AIConfigError, getJsonProviderOptions } from '@/lib/ai/provider';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { interviewReportSchema } from '@/lib/ai/interview-report-schema';
import { extractJson } from '@/lib/ai/extract-json';
import { dbReady } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id: sessionId } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const session = await interviewRepository.findSession(sessionId);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const report = await interviewRepository.findReportBySessionId(sessionId);
  if (!report) return NextResponse.json({ error: 'No report found' }, { status: 404 });

  return NextResponse.json(report);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbReady;
    const { id: sessionId } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) return new Response('Unauthorized', { status: 401 });

    const session = await interviewRepository.findSession(sessionId);
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const existing = await interviewRepository.findReportBySessionId(sessionId);
    if (existing) return NextResponse.json(existing);

    const { model: modelId, locale = 'de' } = await request.json();
    const aiConfig = extractAIConfig(request, user);
    const model = getModel(aiConfig, modelId);

    const roundsWithMessages = await interviewRepository.findAllMessagesBySessionId(sessionId);

    const conversationLog = roundsWithMessages.map(({ round, messages }) => {
      const config = round.interviewerConfig as any;
      return {
        interviewerType: round.interviewerType,
        interviewerName: config.name,
        roundId: round.id,
        messages: messages.map((m: { role: string; content: string; metadata: unknown }) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata,
        })),
      };
    });

    const lang = locale === 'de' ? 'Deutsch' : 'English';
    const reportPrompt = locale === 'de'
      ? `Du bist ein erfahrener Experte für Talentbewertung. Bitte erstelle basierend auf den folgenden Interview-Protokollen eine systematische, strukturierte Bewertung des Kandidaten. Die Ausgabe muss im JSON-Format erfolgen.

# Stellenanforderungen

${session.jobDescription}

# Interview-Protokolle

${JSON.stringify(conversationLog, null, 2)}

# Bewertungsanforderungen

## 1. Gesamtpunktzahl (0-100)
Bewerte basierend auf der Leistung des Kandidaten in allen Runden:
- 90-100: Übertrifft die Anforderungen bei weitem - unbedingte Einstellungsempfehlung
- 75-89: Erfüllt oder übertrifft die Anforderungen - Einstellungsempfehlung
- 60-74: Erfüllt im Allgemeinen die Anforderungen, mit erkennbaren Lücken
- 40-59: Teilweise qualifiziert - mit Vorsicht zu genießen
- 0-39: Erfüllt die Anforderungen nicht

## 2. Kompetenzdimensionen (6-8 Dimensionen, jeweils 0-100)
Wähle die 6-8 relevantesten Dimensionen für die Rolle aus (z. B. technische Tiefe, Systemdesign, Programmierfähigkeit, Kommunikation, Teamarbeit, Lernfähigkeit, Geschäftssinn, Problemlösung). Werte jede Dimension unabhängig für das Radar-Diagramm aus.

## 3. Bewertung pro Runde und Frage
Für jede Frage in jeder Runde:
- Punktzahl (1-5): 1=Keine Antwort möglich / 2=Schwache Grundlagen / 3=Ausreichend / 4=Gut / 5=Exzellent
- Highlights: Besondere Stärken in der Antwort
- Schwächen: Probleme oder Bereiche mit Verbesserungspotenzial
- Referenz-Tipps: Bessere Antwortrichtungen oder wichtige Wissenspunkte, um dem Kandidaten bei der Verbesserung zu helfen

## 4. Gesamtrückmeldung
Verfasse 3-5 Absätze professionelles, konstruktives Feedback zu: Kernkompetenzen, Hauptschwächen, Analyse der Rollenpassung und Einstellungsempfehlung.

## 5. Verbesserungsplan
Liste Bereiche auf, in denen Verbesserungsbedarf besteht, geordnet nach Priorität (high/medium/low), mit: Beschreibung dessen, was verbessert werden sollte, und spezifischen Lernressourcen (Bücher, Kurse, Dokumentationen, Open-Source-Projekte).

# Spezielle Markierungen
- \`"marked": true\`: Der Kandidat hat dies zur Überprüfung markiert → Im Bericht hervorheben
- \`"hinted": true\`: Der Kandidat hat um einen Hinweis gebeten → Als "Hinweis verwendet" in der Bewertung vermerken
- \`"skipped": true\`: Der Kandidat hat die Frage übersprungen → Als "Übersprungen" markieren und in die Punktzahl einfließen lassen

Bitte gib den Bericht auf Deutsch aus.`
      : `You are an experienced talent assessment professional. Based on the following interview transcripts, produce a systematic, structured evaluation of the candidate. Output the report in JSON format.

# Job Requirements

${session.jobDescription}

# Interview Transcripts

${JSON.stringify(conversationLog, null, 2)}

# Evaluation Requirements

## 1. Overall Score (0-100)
Score based on the candidate's performance across all rounds:
- 90-100: Significantly exceeds requirements — strong hire
- 75-89: Meets or exceeds requirements — recommended hire
- 60-74: Generally meets requirements with notable gaps
- 40-59: Partially qualified — proceed with caution
- 0-39: Does not meet requirements

## 2. Competency Dimension Scores (6-8 dimensions, each 0-100)
Select 6-8 dimensions most relevant to the role (e.g., Technical Depth, System Design, Coding Ability, Communication, Teamwork, Learning Ability, Business Acumen, Problem Solving). Score each independently for the radar chart.

## 3. Per-Round Per-Question Evaluation
For each question in each round:
- Score (1-5): 1=Unable to answer / 2=Weak fundamentals / 3=Adequate / 4=Good / 5=Excellent
- Highlights: Specific strengths demonstrated in the answer
- Weaknesses: Issues or areas for improvement revealed
- Reference tips: Better answer direction or key knowledge points to help the candidate improve

## 4. Overall Feedback
Write 3-5 paragraphs of professional, constructive feedback covering: core strengths, main weaknesses, role-fit analysis, and hire recommendation.

## 5. Improvement Plan
List areas for improvement ranked by priority (high/medium/low), each with: description of what to improve and specific learning resources (books, courses, docs, open-source projects).

# Special Markers
- \`"marked": true\`: Candidate flagged this for review → highlight in report
- \`"hinted": true\`: Candidate requested a hint → note as "hint used" in evaluation
- \`"skipped": true\`: Candidate skipped the question → mark as "skipped" and factor into scoring

Output the report in English.`;

    const { text } = await generateText({
      model,
      maxOutputTokens: 16384,
      system: `You are a professional interview evaluator. Output your evaluation as a single valid JSON object. Do NOT wrap the JSON in markdown code fences. Do NOT wrap the result in an array.

The JSON MUST use EXACTLY these top-level keys (camelCase, English, no translation, no synonyms):
- "overallScore" (number 0-100)
- "dimensionScores" (array of { "dimension": string, "score": number 0-100, "maxScore": number })
- "roundEvaluations" (array of { "roundId": string, "interviewerType": string, "interviewerName": string, "score": number 0-100, "feedback": string, "questions": array of { "question": string, "answerSummary": string, "score": number 1-5, "highlights": string[], "weaknesses": string[], "referenceTips": string, "marked": boolean, "hinted": boolean, "skipped": boolean } })
- "overallFeedback" (string, 3-5 paragraphs)
- "improvementPlan" (array of { "priority": "high"|"medium"|"low", "area": string, "description": string, "resources": string[] })

DO NOT use alternative names like "comprehensiveScore", "capabilityScores", "direction", "feedback" instead of "overallFeedback", etc. Field names must match EXACTLY. All fields are REQUIRED.`,
      prompt: reportPrompt,
      providerOptions: getJsonProviderOptions(aiConfig),
    });

    const report = extractJson(text, interviewReportSchema);

    const saved = await interviewRepository.createReport({
      sessionId,
      overallScore: report.overallScore,
      dimensionScores: report.dimensionScores,
      roundEvaluations: report.roundEvaluations,
      overallFeedback: report.overallFeedback,
      improvementPlan: report.improvementPlan,
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof AIConfigError) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }
    console.error('POST /api/interview/[id]/report error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
