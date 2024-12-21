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

Please provide a helpful answer based on the context and previous conversation. If you cannot find the information in the context, please say so.`);

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history",
  inputKey: "question",
  outputKey: "answer",
});

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
  chat_history: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  chat_history: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const llm = new ChatOpenAI({
  model: "gpt-4",
  temperature: 0,
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
    
    // Initialize ChatOpenAI with the provided API key
    const chat = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-3.5-turbo",
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
    const requiredEnvVars = ['PG_HOST', 'PG_PASSWORD', 'OPENAI_API_KEY'];
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

    try {
      const vectorStore = await PGVectorStore.initialize(embeddings, pgVectorStoreConfig);
      console.log('Vector store initialized successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: dbError instanceof Error ? dbError.message : "Unknown database error" },
        { status: 500 }
      );
    }

    const retrieve = async (state: typeof InputStateAnnotation.State) => {
      console.log('Starting retrieval for question:', state.question);
      const vectorStore = await PGVectorStore.initialize(embeddings, pgVectorStoreConfig);
      const retrievedDocs = await vectorStore.similaritySearch(state.question);
      console.log('Retrieved documents count:', retrievedDocs.length);
      return { context: retrievedDocs };
    };

    const generate = async (state: typeof StateAnnotation.State) => {
      console.log('Starting generation with context length:', state.context.length);
      const docsContent = state.context
        .map((doc) => doc.pageContent)
        .join("\n");

      const memoryResult = await memory.loadMemoryVariables({});
      
      const messages = await promptTemplate.invoke({
        question: state.question,
        context: docsContent,
        chat_history: memoryResult.chat_history || "",
      });

      const response = await chat.invoke(messages);
      console.log('Generated response successfully');

      await memory.saveContext(
        { question: state.question },
        { answer: response.content }
      );

      return { answer: response.content };
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
