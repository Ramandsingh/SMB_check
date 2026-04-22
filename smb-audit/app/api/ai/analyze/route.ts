import { openrouter, AI_MODEL } from '@/lib/openrouter'
import { DOMAIN_META } from '@/lib/questions'
import { Domain } from '@/types'

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { type, domain, auditData, scores } = body

  let prompt = ''

  if (type === 'domain' && domain) {
    const meta = DOMAIN_META[domain as Domain]
    prompt = `You are a business lending analyst reviewing a small joinery business in Brisbane, Australia.

You have just completed the ${meta.label} assessment section. Here is the data:

Business: ${auditData.businessName || 'Unknown'}
Domain: ${meta.label} (${meta.description})
Domain Score: ${scores.domains[domain]?.score ?? 'N/A'}/100

Answers collected:
${JSON.stringify(body.domainAnswers, null, 2)}

Domain Notes: ${auditData.domainNotes[domain] || 'None'}

Please provide:
1. **Key Strengths** (2-3 bullet points) - what this domain does well
2. **Key Risks** (2-3 bullet points) - red flags or concerns for a lender
3. **Recommended Actions** (2-3 bullet points) - what the business should do before a loan is approved, or conditions to attach

Keep it concise and practical. Use the context of a small Brisbane joinery/carpentry trade business.`
  } else if (type === 'summary') {
    prompt = `You are a business lending analyst writing an executive summary for a loan application review.

Business Details:
- Name: ${auditData.businessName || 'Unknown'}
- ABN: ${auditData.abn || 'Not provided'}
- Contact: ${auditData.contactName || 'Unknown'}
- Loan Amount Requested: AUD ${auditData.loanAmount || 'Not specified'}
- Loan Purpose: ${auditData.loanPurpose || 'Not specified'}
- Audit Date: ${auditData.auditDate}
- Auditor: ${auditData.auditorName || 'Unknown'}

Assessment Scores:
- Overall: ${scores.overall}/100
- Finance (40% weight): ${scores.domains.finance?.score ?? 'N/A'}/100
- Operations (25% weight): ${scores.domains.operations?.score ?? 'N/A'}/100
- Sales (20% weight): ${scores.domains.sales?.score ?? 'N/A'}/100
- Marketing (15% weight): ${scores.domains.marketing?.score ?? 'N/A'}/100
- Recommendation: ${scores.recommendation}

General Notes: ${auditData.generalNotes || 'None'}

Write a professional executive summary (3-4 paragraphs) that:
1. Introduces the business and loan request
2. Summarises the key findings across all assessment areas
3. Highlights the primary risks and mitigants
4. Provides a clear lending recommendation with any suggested conditions

Write in a formal but readable tone suitable for a credit committee review.`
  } else {
    return Response.json({ error: 'Invalid request type' }, { status: 400 })
  }

  try {
    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    return Response.json({ text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
