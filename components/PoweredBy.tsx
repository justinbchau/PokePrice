export default function PoweredBy() {
  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      Powered by{" "}
      <a 
        href="https://airbyte.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="font-semibold hover:text-gray-700 dark:hover:text-gray-300"
      >
        Airbyte
      </a>{" "}
      &{" "}
      <a 
        href="https://js.langchain.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="font-semibold hover:text-gray-700 dark:hover:text-gray-300"
      >
        LangChain
      </a>
    </div>
  );
}