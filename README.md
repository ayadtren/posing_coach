# PosePrep Pro - AI Bodybuilding Pose Coach

PosePrep Pro is an AI-powered application that helps bodybuilders perfect their competition poses through real-time feedback and analysis.

## Features

- **Real-time Pose Analysis**: Get instant feedback on your bodybuilding poses
- **Detailed Muscle Group Feedback**: Receive specific feedback for each muscle group
- **Interactive Practice Mode**: Practice poses with guided instructions
- **Progress Tracking**: Track your improvement over time
- **Personalized Guidance**: Get customized advice based on your body type and goals
- **Enhanced Physique Visualization**: See a realistic muscle overlay that adapts to your proportions

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/poseprep-pro.git
   cd poseprep-pro
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev:all
   ```

   This will start both the Next.js application and the API proxy server.

   - Next.js app: http://localhost:3000 (or another available port)
   - API proxy server: http://localhost:3334

## CORS Issues and API Proxy

This application uses external LLM APIs for generating feedback. To handle CORS issues, we've implemented a proxy server that forwards requests to these APIs and adds the necessary CORS headers.

### Running the Proxy Server

The proxy server is automatically started when you run `npm run dev:all`. If you want to run it separately, you can use:

```
npm run proxy
```

### API Endpoints

- `/api/llm/primary`: Proxy for the primary LLM API
- `/api/llm/fallback`: Proxy for the fallback LLM API
- `/api/llm/mock`: Mock API that returns predefined responses

## Troubleshooting

### CORS Errors

If you see CORS errors in the console, make sure the proxy server is running. The application is designed to fall back to local feedback generation if the APIs are unavailable.

### API Connection Issues

The application has multiple fallback mechanisms:
1. Primary API -> Fallback API -> Mock API -> Local Feedback Generation

Even if all API connections fail, the application will still function using locally generated feedback.

### Port Conflicts

If you encounter port conflicts:
- The Next.js app will automatically find an available port
- The proxy server uses port 3334 by default, but you can change it by setting the PORT environment variable

## License

This project is licensed under the MIT License - see the LICENSE file for details. 