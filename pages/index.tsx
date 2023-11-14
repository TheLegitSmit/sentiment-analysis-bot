import { Layout, Text, Page } from '@vercel/examples-ui'
import { Chat } from '../components/Chat'

function Home() {
  return (
    <Page className="flex flex-col px-5 gap-12 bg-zinc-100 min-h-screen min-w-full px=6 items-center">
      <section className="flex flex-col gap-6 lg:w-1/2">
        <Text variant="h1">Sentiment analysis bot</Text>
        <Text className="text-zinc-600">
         Gauges user sentiment. Decides when to route to a human. Explains logic.
        </Text>
      </section>

      <section className="flex flex-col gap-3 lg:w-1/2">
        <div className="">
          <Chat />
        </div>
      </section>
    </Page>
  )
}

Home.Layout = Layout

export default Home
