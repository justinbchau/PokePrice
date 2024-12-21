'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TypingIndicator from '@/components/TypingIndicator';
import MessageContent from '@/components/MessageContent';

interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    const currentQuestion = question;
    setQuestion('');
    
    setMessages(prev => [...prev, { content: currentQuestion, role: 'user' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentQuestion }),
      });

      console.log('Raw response status:', response.status);
      console.log('Raw response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Raw error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { details: errorText };
        }

        console.error('Parsed error details:', errorData);
        throw new Error(`Server error: ${errorData.details || response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMessages(prev => [...prev, { content: data.answer, role: 'assistant' }]);
    } catch (error) {
      console.error('Full error object:', error);
      setMessages(prev => [...prev, { 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please check the console for more details.`, 
        role: 'assistant' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Header />
      <div className="flex-1 overflow-hidden">
        <main className="h-full p-4 flex flex-col max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
            Check Pokemon Card Prices
          </h1>
          
          {/* Messages Container - This will scroll */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 w-full max-w-xl mx-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto max-w-[80%]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white mr-auto max-w-[80%]'
                }`}
              >
                <MessageContent content={message.content} />
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Form stays at bottom */}
          <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about card prices..."
                className="flex-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Ask'}
              </button>
            </div>
          </form>
        </main>
      </div>
      <Footer />
    </div>
  );
}
