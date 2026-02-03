import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    // Check for environment variable API key
    const envApiKey = process.env.OPENAI_API_KEY;
    
    if (!envApiKey) {
      // Return a specific status to indicate env key is not available
      return NextResponse.json(
        { error: 'NO_ENV_KEY', message: 'Environment API key not configured' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { systemPrompt, userPrompt } = body;

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required prompts' },
        { status: 400 }
      );
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${envApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      // Log the actual error for debugging (server-side only)
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      
      // Return sanitized error messages - don't expose internal OpenAI errors
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key configuration. Please check your OPENAI_API_KEY environment variable.' },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      } else if (response.status === 400) {
        return NextResponse.json(
          { error: 'Invalid request to AI service. Please try again.' },
          { status: 400 }
        );
      } else if (response.status >= 500) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 502 }
        );
      }
      
      // Generic error - don't expose details
      return NextResponse.json(
        { error: 'Failed to analyze simulation. Please try again.' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze simulation' },
      { status: 500 }
    );
  }
}
