import { openai } from '@/lib/utils/openai'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export async function POST(request) {
  try {
    const { question, studies } = await request.json()

    if (!studies || studies.length === 0) {
      // get embedding for the question
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: question
      })
      const questionEmbedding = embeddingResponse.data[0].embedding

      // Search for relevant studies using vector similarity
      const { data: relevantStudies, error } = await supabase.rpc(
        'match_studies',
        {
          query_embedding: questionEmbedding,
          match_threshold: 0.7, 
          match_count: 5 
        }
      )

      if (error) throw error
      if (!relevantStudies.length) {
        return NextResponse.json(
          { error: 'No relevant studies found' },
          { status: 400 }
        )
      }

      studies = relevantStudies
    }

    const studiesText = studies
      .map((study, index) => 
        `Study ${index + 1}:
         Title: ${study.title}
         Abstract: ${study.abstract}
         Year: ${study.year}
         Authors: ${study.authors}
         Source: ${study.source}`
      )
      .join('\n\n')

    const response = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: [
        {
          role: "system",
          content: `You are an expert at winning arguments using scientific evidence. 
          Your goal is to provide clear, convincing responses that someone can use immediately in a conversation. 
          Focus on being persuasive while maintaining scientific accuracy.
          Always cite the specific studies you're referencing in your response.`
        },
        {
          role: "user",
          content: `Question: "${question}"

Available Studies:

${studiesText}

Please provide:
1. Quick Response (2-3 sentences to say immediately)
2. Key Scientific Evidence:
   - Most convincing statistics/findings from the provided studies
   - Specific citations to use (including authors and years)
3. Counter-Arguments:
   - How to handle common objections using the evidence
   - Fallback points from other studies if challenged
4. Expert Quotes:
   - Direct quotes from the studies that support your point

Format the response to be easily readable on a phone screen.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return NextResponse.json({
      answer: response.choices[0].message.content,
      studies: studies 
    })
  } catch (error) {
    // console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze studies' },
      { status: 500 }
    )
  }
}