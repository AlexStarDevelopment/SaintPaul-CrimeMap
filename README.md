# Saint Paul Crime Map

An interactive web application that visualizes crime data for Saint Paul, Minnesota. This modern, React-based application provides residents with a reliable, user-friendly interface to view and analyze local crime incidents on an interactive map.

## 🌟 Features

- **Interactive Map Visualization**: View crime incidents plotted on an interactive Leaflet map
- **Smart Clustering**: Automatic clustering of nearby incidents for better performance and clarity
- **Advanced Filtering**: Filter crimes by:
  - Crime type
  - Neighborhood
  - Date range
- **Responsive Design**: Fully responsive UI that works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light themes for comfortable viewing
- **Monthly Data Updates**: Regularly updated with the latest crime data from Saint Paul
- **Detailed Crime Information**: Click on any incident to see detailed information including:
  - Crime type and description
  - Date and time
  - Location
  - Case number
  - Neighborhood

## 🚀 Technology Stack

- **Frontend**: Next.js 15.1.4, React 18.3.1, TypeScript
- **UI Components**: Material-UI (MUI) 6.3.1
- **Mapping**: Leaflet 1.9.4, React-Leaflet 4.2.1
- **Database**: MongoDB 6.12.0
- **Styling**: Tailwind CSS 3.4.17, Emotion
- **Testing**: Jest, React Testing Library
- **Icons**: FontAwesome 6.7.2

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- MongoDB database (local or cloud instance)

## 🛠️ Installation

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

Create a `.env.local` file in the root of the project:

```env
MONGODB_URI=your_mongodb_connection_string_here
```

Replace `your_mongodb_connection_string_here` with your actual MongoDB connection string.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## 📜 Available Scripts

- `npm run dev` - Runs the app in development mode on port 3001
- `npm run build` - Builds the application for production
- `npm run start` - Starts the production server on port 3001
- `npm run lint` - Runs ESLint to check for code quality issues
- `npm run format` - Formats code using Prettier
- `npm run test` - Runs the test suite using Jest

## 🗂️ Project Structure

```
saint-paul-crime-map/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── crimes/          # Crime data endpoints
│   │   └── total-crimes/    # Total crimes statistics
│   ├── components/          # React components
│   │   ├── map.tsx         # Main map component
│   │   ├── Navigation.tsx  # Top navigation bar
│   │   ├── drawer.tsx      # Filter drawer
│   │   └── ...
│   ├── models/             # TypeScript type definitions
│   └── page.tsx           # Main application page
├── lib/                    # Utility functions
│   └── mongodb.js         # MongoDB connection handler
├── __tests__/             # Test files
└── public/                # Static assets
```

## 🔌 API Endpoints

### GET `/api/crimes`

Fetches crime data with pagination support.

Query parameters:
- `type`: Month identifier (e.g., 'june', 'july')
- `year`: Year (e.g., '2024')
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20000)

### GET `/api/total-crimes`

Returns total crime count and pagination information.

## 🎨 Customization

### Theme Configuration

The application supports Material-UI theming. Themes are configured in the `ThemeProvider` component and can be customized by modifying the theme objects.

### Map Styling

Map markers use FontAwesome icons that are mapped to specific crime types:
- 🤜 Assault (Hand/Fist icon)
- 🚗 Auto Theft (Car icon)
- 💰 Theft/Financial (Money icon)
- 🏠 Burglary (House icon)
- 🔫 Weapons (Gun icon)
- 🎨 Vandalism (Spray can icon)
- And more...

## 📊 Data Source

Crime data is sourced from the City of Saint Paul's public crime database. The data includes:
- Reported criminal incidents
- Approximate locations (addresses are obfuscated for privacy)
- Crime types and descriptions
- Date and time information
- Neighborhood information

### Data Limitations

- Locations are approximate and rounded for privacy
- Only reported crimes that have been entered into the city's database are displayed
- Data is updated monthly

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Node.js applications:
- AWS
- Google Cloud
- Heroku
- DigitalOcean

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- City of Saint Paul for providing public crime data
- OpenStreetMap for map tiles
- The open-source community for the amazing tools and libraries

## 📞 Support

If you find this tool helpful, consider supporting its continued development and maintenance.
