import { type ChatGPTMessage } from '../../components/ChatLine'
import { OpenAIStream, OpenAIStreamPayload } from '../../utils/OpenAIStream'
import { GraphQLClient, gql } from 'graphql-request'

// Ensure the necessary environment variables are set
if (!process.env.OPENAI_API_KEY || !process.env.HYGRAPH_ENDPOINT || !process.env.HYGRAPH_TOKEN) {
  throw new Error('Missing Environment Variable')
}

export const config = {
  runtime: 'edge',
}

const hygraphClient = new GraphQLClient(process.env.HYGRAPH_ENDPOINT, {
  headers: {
    authorization: `Bearer ${process.env.HYGRAPH_TOKEN}`,
  },
})

const saveConversationToHygraph = async (messages: ChatGPTMessage[]) => {
  const saveConversationMutation = gql`
    mutation($messages: Json!, $timestamp: DateTime!) {
      createSentimentTranscript(data: { messages: $messages, timestamp: $timestamp }) {
        id
      }
    }
  `

  const timestamp = new Date().toISOString()

  await hygraphClient.request(saveConversationMutation, {
    messages: JSON.stringify(messages), // Ensure messages are sent as a JSON string
    timestamp: timestamp,
  })
}

const handler = async (req: Request): Promise<Response> => {
  const body = await req.json()

  const messages: ChatGPTMessage[] = [
    {
      role: 'system',
      content: `You have three objectives which you must execute in every message:

1) You are a helpful assistant for a fortune 500 company based in Seattle.
2) At the end of your messages, always include a sentiment analysis of the user and show this to the user. Describe the user's sentiment and provide a reasoning for your sentiment analysis. 
3) Use the sentiment analysis to make a decision about whether you (the chatbot) should continue trying to help the user or if you should route the user to our company's human advocates. Explain your decision.

(begin example)

User: I'm new to cooking lol. What temperature should I set the oven for cooking salmon?
Assistant: 420 degrees Fahrenheit, according to most recommendations. Cook it for 15 minutes if fresh, or 20 minutes if frozen. 
Sentiment analysis - User is happy and playful.
Reasoning - User used terms such as "lol."
Routing decision - I will continue to help the user

(end example)`,
    },
  ]
  messages.push(...body?.messages)

  const payload: OpenAIStreamPayload = {
    model: 'gpt-4',
    messages: messages,
    temperature: 0.4,
    max_tokens: 300,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    user: body?.user,
    n: 1,
  }

  const stream = await OpenAIStream(payload)

  // Capture the assistant's response from the stream and add it to the messages array
  const decoder = new TextDecoder()
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let assistantMessage = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    assistantMessage += decoder.decode(value, { stream: true })
  }

  messages.push({ role: 'assistant', content: assistantMessage })

  // Save the conversation to Hygraph after processing the full response
  await saveConversationToHygraph(messages)

  return new Response(new Blob(chunks))
}

export default handler
