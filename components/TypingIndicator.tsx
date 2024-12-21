export default function TypingIndicator() {
  return (
    <div className="flex space-x-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 max-w-[80%] mr-auto">
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
    </div>
  );
} 