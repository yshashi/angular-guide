export const API_URL = import.meta.env.PROD 
  ? 'https://api.interviewhelper.in/api' 
  : (import.meta.env.PUBLIC_API_URL || 'http://localhost:5500/api');

// "Ask AI" docs assistant endpoint (see ai-backend/README.md). The widget is hidden when this is empty.
export const ASK_AI_ENDPOINT = import.meta.env.PUBLIC_ASK_AI_ENDPOINT || '';

// Google Analytics 4 Configuration
export const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || '';
