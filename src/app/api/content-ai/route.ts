import { contentAiApi } from '../../../lib/api/contentAi';

/**
 * API route handler for content analysis
 */
export async function POST(req: Request) {
  // Parse the URL to extract the operation
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const operation = segments[segments.length - 1];
  
  // Route to the appropriate handler based on the operation
  switch (operation) {
    case 'analyze':
      return contentAiApi.analyzeContent(req);
      
    case 'recommendations':
      return contentAiApi.getRecommendations(req);
      
    case 'query':
      return contentAiApi.processQuery(req);
      
    case 'token-balance':
      return contentAiApi.checkTokenBalance(req);
      
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 400 }
      );
  }
}
