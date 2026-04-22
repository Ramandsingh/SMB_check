import OpenAI from 'openai'

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000',
    'X-Title': 'SMB Joinery Audit Tool',
  },
})

export const AI_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet'
