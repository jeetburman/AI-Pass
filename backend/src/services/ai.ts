import { Prisma } from "@prisma/client";

export interface AIResult {
  resultText: string;
  resultJson: Prisma.InputJsonValue;
}

export async function runAI(
  taskType: string,
  inputText: string
): Promise<AIResult> {
  // Simulate network latency like a real API call
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

  switch (taskType) {
    case "summarize":
      return summarize(inputText);
    case "classify_risk":
      return classifyRisk(inputText);
    case "extract_info":
      return extractInfo(inputText);
    default:
      return {
        resultText: "Unknown task type provided.",
        resultJson: {
          decision: "NEEDS_INFO",
          confidence: 0,
          reasons: ["Unrecognised task type"],
        },
      };
  }
}

function summarize(inputText: string): AIResult {
  const sentences = inputText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const words = inputText.split(/\s+/);
  const wordCount = words.length;

  // Build key points from actual sentences in the input
  const keyPoints = sentences.slice(0, 3).map((s) => s.trim());

  // Build summary from first and last sentence
  const summary =
    sentences.length > 1
      ? `${sentences[0]}. ${sentences[sentences.length - 1]}.`
      : sentences[0] ?? inputText.slice(0, 120);

  const confidence = parseFloat((0.82 + Math.random() * 0.13).toFixed(2));

  return {
    resultText: summary,
    resultJson: {
      decision: "PASS",
      confidence,
      reasons: [
        "Text successfully parsed and analysed",
        `Document contains ${wordCount} words across ${sentences.length} sentences`,
      ],
      wordCount,
      sentenceCount: sentences.length,
      keyPoints,
    },
  };
}

function classifyRisk(inputText: string): AIResult {
  const lower = inputText.toLowerCase();

  const criticalKeywords = [
    "waive all legal rights",
    "no liability",
    "no right to appeal",
    "waives all rights",
  ];
  const highKeywords = [
    "critical",
    "penalty",
    "termination",
    "breach",
    "loss",
    "damages",
    "failure",
    "urgent",
  ];
  const mediumKeywords = [
    "confidential",
    "restriction",
    "limitation",
    "clause",
    "obligation",
    "compliance",
  ];

  const foundCritical = criticalKeywords.filter((k) => lower.includes(k));
  const foundHigh = highKeywords.filter((k) => lower.includes(k));
  const foundMedium = mediumKeywords.filter((k) => lower.includes(k));

  let riskLevel: string;
  let decision: string;
  let confidence: number;
  let resultText: string;
  let riskFactors: string[];

  if (foundCritical.length > 0) {
    riskLevel = "CRITICAL";
    decision = "FAIL";
    confidence = parseFloat((0.91 + Math.random() * 0.08).toFixed(2));
    resultText = `Critical risk detected. The text contains clauses that significantly limit legal recourse and impose severe penalties.`;
    riskFactors = [
      ...foundCritical.map((k) => `Critical clause detected: "${k}"`),
      ...foundHigh.slice(0, 2).map((k) => `High risk term: "${k}"`),
    ];
  } else if (foundHigh.length >= 2) {
    riskLevel = "HIGH";
    decision = "FAIL";
    confidence = parseFloat((0.84 + Math.random() * 0.1).toFixed(2));
    resultText = `High risk content identified. Multiple risk indicators found that require legal review.`;
    riskFactors = foundHigh
      .slice(0, 4)
      .map((k) => `Risk indicator found: "${k}"`);
  } else if (foundMedium.length > 0 || foundHigh.length === 1) {
    riskLevel = "MEDIUM";
    decision = "NEEDS_INFO";
    confidence = parseFloat((0.72 + Math.random() * 0.12).toFixed(2));
    resultText = `Moderate risk level. Some clauses warrant attention but no critical issues found.`;
    riskFactors = [
      ...foundHigh.map((k) => `Moderate risk term: "${k}"`),
      ...foundMedium.slice(0, 2).map((k) => `Standard clause: "${k}"`),
    ];
  } else {
    riskLevel = "LOW";
    decision = "PASS";
    confidence = parseFloat((0.78 + Math.random() * 0.14).toFixed(2));
    resultText = `Low risk content. No significant legal or operational risk indicators detected.`;
    riskFactors = ["No critical terms found", "Standard language detected"];
  }

  return {
    resultText,
    resultJson: {
      decision,
      confidence,
      riskLevel,
      riskFactors,
      reasons: [
        `Risk level assessed as ${riskLevel}`,
        `Analysed ${inputText.split(/\s+/).length} words for risk indicators`,
      ],
    },
  };
}

function extractInfo(inputText: string): AIResult {
  const emails = inputText.match(/[\w.-]+@[\w.-]+\.\w{2,}/g) ?? [];
  const urls = inputText.match(/https?:\/\/[^\s]+/g) ?? [];
  const phoneNumbers =
    inputText.match(/(\+?\d[\d\s\-().]{7,}\d)/g)?.slice(0, 3) ?? [];
  const dates =
    inputText.match(
      /\b(\d{1,2}[\s/-]\w+[\s/-]\d{2,4}|\w+ \d{1,2}[,\s]+\d{4}|\d{4}-\d{2}-\d{2})\b/g
    ) ?? [];
  const numbers = inputText.match(/\b\d{4,}\b/g) ?? [];

  // Extract capitalised names (simple heuristic)
  const names =
    inputText
      .match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g)
      ?.filter((n) => !urls.some((u) => u.includes(n)))
      .slice(0, 5) ?? [];

  const totalExtracted =
    emails.length +
    urls.length +
    phoneNumbers.length +
    dates.length +
    numbers.length +
    names.length;

  const confidence = parseFloat(
    Math.min(0.95, 0.7 + totalExtracted * 0.04).toFixed(2)
  );

  return {
    resultText: `Extracted ${totalExtracted} item(s): ${emails.length} email(s), ${urls.length} URL(s), ${phoneNumbers.length} phone number(s), ${dates.length} date(s), ${names.length} name(s), ${numbers.length} number(s).`,
    resultJson: {
      decision: "PASS",
      confidence,
      reasons: [
        "Extraction completed successfully",
        `${totalExtracted} structured items identified`,
      ],
      extracted: {
        emails,
        urls,
        phoneNumbers,
        dates,
        names,
        numbers,
      },
    },
  };
}