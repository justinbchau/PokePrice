# PokePrice Check

A real-time Pokémon card price checker powered by AI. Ask natural language questions about all the original 151 Pokémon and their card prices and get accurate, up-to-date answers.

## 🚀 Live Demo

Check out the live application: [PokePrice Check](https://poke-price.vercel.app/)

## ✨ Features

- Natural language queries for all 151 Pokémon and their card prices
- Up-to-date price data from TCGPlayer
- AI-powered responses using GPT-4
- Vector similarity search for accurate card matching

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Node.js, TypeScript
- **AI/ML**: LangChain, OpenAI
- **Data Pipeline**: Airbyte
- **Deployment**: Vercel
- **Database**: Supabase

## 🚦 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/justinbchau/PokePrice.git
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_APP_TITLE`
- `NEXT_PUBLIC_APP_DESCRIPTION`
- `PG_HOST`
- `PG_PORT`
- `PG_USER`
- `PG_PASSWORD`
- `PG_DATABASE`

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🔄 Data Pipeline

The application uses Airbyte to sync Pokémon card data and prices. The pipeline:
1. Fetches data from TCGPlayer API
2. Stores in Supabase with vector embeddings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

<!-- ## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. -->

## 📑 Resources

- [LangChain](https://js.langchain.com) for AI integration
- [Airbyte](https://airbyte.com) for data syncing
- [TCGPlayer](https://tcgplayer.com) for price data
- [Pokémon TCG API](https://pokemontcg.io/) for card data

## 📧 Contact

For questions or feedback, please open an issue or reach out to [justinbchau@gmail.com].

   
