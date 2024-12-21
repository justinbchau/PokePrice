export default function MessageContent({ content }: { content: string }) {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split content by URLs and map each part
  const parts = content.split(urlRegex);
  const matches: string[] = content.match(urlRegex) || [];
  
  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        // If this part matches a URL, render it as a link
        if (matches.includes(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {part}
            </a>
          );
        }
        // Otherwise render as regular text
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
} 