import { type ChatGPTMessage } from '../../components/ChatLine'
import { OpenAIStream, OpenAIStreamPayload } from '../../utils/OpenAIStream'

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY')
}

export const config = {
  runtime: 'edge',
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
  return new Response(stream)
}
export default handler
