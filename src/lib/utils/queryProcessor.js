import { openai } from './openai'

export async function processQuery(userQuestion) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a research assistant helping to convert questions into scientific search terms. Extract key concepts and return them as search terms. Focus on scientific terminology."
        },
        {
          role: "user",
          content: `Convert this question into search terms: "${userQuestion}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    })

    return response.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error processing query:', error)
    throw error
  }
}