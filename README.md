# Saint Paul Crime Map

This is a Next.js project that visualizes crime data for Saint Paul, MN.

## Getting Started

To get started with the project, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/your-username/saint-paul-crime-map.git
cd saint-paul-crime-map
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of the project based on the `.env.local.example` file:

```
MONGODB_URI=your_mongodb_connection_string_here
```

Replace `your_mongodb_connection_string_here` with your actual MongoDB connection string.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

### Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode on `http://localhost:3001`.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production Next.js server on `http://localhost:3001`.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run format`: Formats code using Prettier.
- `npm run test`: Runs tests using Jest.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
