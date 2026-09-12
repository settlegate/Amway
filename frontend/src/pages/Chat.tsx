import { useLocation } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import ChatPanel from '../components/ChatPanel'
import type { ChatMessage } from '../components/ChatPanel'

export default function Chat() {
  const location = useLocation()
  const state = (location.state as { messages?: ChatMessage[]; initialQuestion?: string } | null) || null
  const initialMessages = state?.messages
  const initialQuestion = state?.initialQuestion

  return (
    <PageLayout>
      <div className="chat-focus">
        <h2 className="chat-page-title">건강 상담 챗봇</h2>
        <ChatPanel initialMessages={initialMessages} initialQuestion={initialQuestion} />
      </div>
    </PageLayout>
  )
}
