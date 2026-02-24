// Echo Chat - TTS Voice Routing
// Echo Speak (Qwen3-TTS, free, local GPU) + ElevenLabs (premium)

import type { Env, PersonalityDef, EmotionVoiceSettings } from './types';

export async function generateVoice(
  text: string,
  personality: PersonalityDef,
  emotion: string,
  env: Env,
  provider?: string,
): Promise<{ audio_url?: string; audio_base64?: string; content_type?: string; error?: string }> {
  const useProvider = provider ?? personality.voice_provider ?? 'echo-speak';

  if (useProvider === 'echo-speak') {
    return generateEchoSpeak(text, personality, emotion, env);
  } else if (useProvider === 'elevenlabs') {
    return generateElevenLabs(text, personality, emotion, env);
  } else if (useProvider === 'cartesia') {
    return generateCartesia(text, personality, emotion, env);
  }

  return { error: `Unknown voice provider: ${useProvider}` };
}

async function generateEchoSpeak(
  text: string,
  personality: PersonalityDef,
  emotion: string,
  env: Env,
): Promise<{ audio_base64?: string; content_type?: string; error?: string }> {
  try {
    const voiceName = getEchoSpeakVoice(personality.id);
    const cleanText = stripMarkdown(text);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${env.ECHO_SPEAK_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voice_id: voiceName,
        speed: 1.0,
        output_format: 'wav',
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      return { error: `Echo Speak error: ${response.status}` };
    }

    // Echo Speak returns raw audio bytes, not JSON
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'audio/wav';
    return { audio_base64: base64, content_type: contentType };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Echo Speak unavailable' };
  }
}

async function generateElevenLabs(
  text: string,
  personality: PersonalityDef,
  emotion: string,
  env: Env,
): Promise<{ audio_base64?: string; error?: string }> {
  if (!env.ELEVENLABS_API_KEY || !personality.voice_id) {
    return { error: 'ElevenLabs not configured for this personality' };
  }

  try {
    const voiceSettings = personality.emotion_settings[emotion] ?? personality.emotion_settings['neutral'];
    const cleanText = stripMarkdown(text);

    const elController = new AbortController();
    const elTimer = setTimeout(() => elController.abort(), 5000);
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${personality.voice_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style,
            use_speaker_boost: true,
          },
        }),
        signal: elController.signal,
      }
    );
    clearTimeout(elTimer);

    if (!response.ok) {
      return { error: `ElevenLabs error: ${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return { audio_base64: base64 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'ElevenLabs unavailable' };
  }
}

async function generateCartesia(
  text: string,
  personality: PersonalityDef,
  emotion: string,
  env: Env,
): Promise<{ audio_url?: string; error?: string }> {
  // Cartesia is used for GS343 -- fallback to Echo Speak for now
  return generateEchoSpeak(text, personality, emotion, env);
}

function getEchoSpeakVoice(personalityId: string): string {
  const voiceMap: Record<string, string> = {
    EP: 'default',
    BR: 'luna',
    RA: 'ryan',
    SA: 'default',
    TH: 'ryan',
    NX: 'luna',
    GS: 'default',
    PH: 'default',
    PR: 'ryan',
    BE: 'luna',
    TE: 'ryan',
    WM: 'luna',
    R2: 'default',
    '3P': 'default',
  };
  return voiceMap[personalityId] ?? 'default';
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
