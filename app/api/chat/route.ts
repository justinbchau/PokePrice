import { NextRequest, NextResponse } from "next/server";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { Annotation } from "@langchain/langgraph";
import { StateGraph } from "@langchain/langgraph";
import { pgVectorStoreConfig } from "@/config/database";
import { BufferMemory } from "langchain/memory";

// Create our own prompt template instead of pulling from hub
const promptTemplate = ChatPromptTemplate.fromTemplate(`You are a helpful assistant that answers questions about Pokemon card prices.

Previous conversation:
{chat_history}

Context information from database:
{context}

Current question: {question}

Please provide a helpful answer based the question the user asked using the context and previous conversation. If you cannot find the information in the context, please say so.`);

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history",
  inputKey: "question",
  outputKey: "answer",
});

type InputStateType = {
  question: string;
  chat_history: string;
};

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  chat_history: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.split(' ')[1];
    

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey
    });

    // Initialize vector store with Supabase
    const vectorStore = await PGVectorStore.initialize(embeddings, pgVectorStoreConfig);

    // Initialize ChatOpenAI with the provided API key
    const chat = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Log the incoming request
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });

    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is required", details: "No request body found" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await req.json();
      console.log('Parsed request body:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: "Invalid JSON", details: "Could not parse request body" },
        { status: 400 }
      );
    }

    if (!body?.question) {
      return NextResponse.json(
        { error: "Question is required", details: "No question provided in request" },
        { status: 400 }
      );
    }

    // Check environment variables
    const requiredEnvVars = ['PG_HOST', 'PG_PASSWORD'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error('Missing environment variables:', missingEnvVars);
      return NextResponse.json(
        { 
          error: "Configuration Error", 
          details: `Missing environment variables: ${missingEnvVars.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const { question } = body;

    const retrieve = async (state: InputStateType) => {
      console.log('Starting retrieval for question:', state.question);
      try {
        const retrievedDocs = await vectorStore.similaritySearch(
          state.question,
          10
        );
        
        console.log('Retrieved documents:', retrievedDocs.length);
        retrievedDocs.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, doc.pageContent);
        });
        
        return { context: retrievedDocs };
      } catch (error) {
        console.error('Error in retrieval:', error);
        throw error;
      }
    };

    const generate = async (state: typeof StateAnnotation.State) => {
      console.log('Starting generation with context length:', state.context.length);
      
      if (state.context.length === 0) {
        return { 
          answer: "I apologize, but I couldn't find any relevant information about that in my database. Could you please try rephrasing your question or ask about a different card?" 
        };
      }

      const docsContent = state.context
        .map((doc) => doc.pageContent)
        .join("\n\n");
      
      console.log('Using context:', docsContent);

      const memoryResult = await memory.loadMemoryVariables({});
      
      const messages = await promptTemplate.invoke({
        question: state.question,
        context: docsContent,
        chat_history: memoryResult.chat_history || "",
      });

      const response = await chat.invoke(messages);
      
      // Clean up the response by removing Markdown formatting
      const cleanedResponse = String(response.content)
        .replace(/\*\*/g, '')  // Remove bold formatting
        .replace(/\*/g, '')    // Remove any remaining asterisks
        .replace(/`/g, '')     // Remove code formatting
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2') // Convert markdown links to text: url format
        
      console.log('Generated clean response:', cleanedResponse);

      await memory.saveContext(
        { question: state.question },
        { answer: cleanedResponse }
      );

      return { answer: cleanedResponse };
    };

    const graph = new StateGraph(StateAnnotation)
      .addNode("retrieve", retrieve)
      .addNode("generate", generate)
      .addEdge("__start__", "retrieve")
      .addEdge("retrieve", "generate")
      .addEdge("generate", "__end__")
      .compile();

    console.log('Invoking graph with question:', question);
    const result = await graph.invoke({ 
      question,
      chat_history: await memory.loadMemoryVariables({}).then(m => m.chat_history || "")
    });

    return NextResponse.json({
      context: result.context.slice(0, 2),
      answer: result.answer,
    });

  } catch (error) {
    console.error('Detailed API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
