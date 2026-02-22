// Echo Chat - 12-Channel Emotion Detection Engine
// Ported from echo-talk-api.ts emotion lexicon

import type { EmotionDetection } from './types';

interface EmotionLexicon {
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

const EMOTION_LEXICONS: Record<string, EmotionLexicon> = {
  joy: {
    keywords: ['happy', 'excited', 'great', 'awesome', 'love', 'amazing', 'wonderful', 'fantastic', 'brilliant', 'celebrate', 'thrilled', 'delighted', 'ecstatic', 'yay', 'woohoo', 'hell yeah', 'perfect', 'best'],
    patterns: [/!\s*$/, /!{2,}/, /\b(lol|lmao|haha|hehe)\b/i, /[😀😁😂🤣😃😄😆🥳🎉]/],
    weight: 1.0,
  },
  sadness: {
    keywords: ['sad', 'depressed', 'unhappy', 'miserable', 'heartbroken', 'crying', 'tears', 'grief', 'loss', 'lonely', 'devastated', 'hopeless', 'disappointed', 'hurt'],
    patterns: [/[😢😭😞😔💔😿]/],
    weight: 1.0,
  },
  anger: {
    keywords: ['angry', 'furious', 'pissed', 'mad', 'rage', 'hate', 'frustrated', 'annoyed', 'irritated', 'livid', 'outraged', 'infuriated', 'bullshit', 'damn', 'wtf', 'stupid'],
    patterns: [/!{3,}/, /[😡🤬😤👊💢]/],
    weight: 1.2,
  },
  fear: {
    keywords: ['scared', 'afraid', 'terrified', 'anxious', 'worried', 'nervous', 'panic', 'dread', 'horrified', 'frightened', 'uneasy', 'concerned', 'alarm'],
    patterns: [/[😰😨😱🫣]/],
    weight: 1.0,
  },
  surprise: {
    keywords: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'unexpected', 'wow', 'whoa', 'omg', 'no way', 'holy', 'unbelievable', 'incredible'],
    patterns: [/\?!/, /!{2,}\?/, /[😮😲🤯😳]/],
    weight: 0.9,
  },
  disgust: {
    keywords: ['disgusting', 'gross', 'revolting', 'nasty', 'repulsive', 'vile', 'sick', 'ew', 'yuck', 'horrible', 'terrible', 'awful'],
    patterns: [/[🤮🤢😷]/],
    weight: 0.8,
  },
  curiosity: {
    keywords: ['how', 'why', 'what', 'when', 'where', 'who', 'curious', 'wonder', 'explain', 'tell me', 'interested', 'fascinating', 'intriguing', 'learn', 'understand'],
    patterns: [/\?$/, /\?{2,}/, /[🤔🧐💭]/],
    weight: 0.7,
  },
  trust: {
    keywords: ['trust', 'believe', 'faith', 'reliable', 'honest', 'loyal', 'count on', 'depend', 'confident', 'sure', 'certain', 'promise'],
    patterns: [/[🤝💯✅🙏]/],
    weight: 0.6,
  },
  anticipation: {
    keywords: ['excited', 'waiting', 'looking forward', 'can\'t wait', 'eager', 'ready', 'upcoming', 'soon', 'planning', 'hope', 'expect'],
    patterns: [/[⏳🔜🤞]/],
    weight: 0.6,
  },
  sarcasm: {
    keywords: ['sure', 'right', 'obviously', 'totally', 'clearly', 'brilliant', 'genius', 'wow great', 'oh really', 'no kidding'],
    patterns: [/\b(suuure|riiight|yeaaah)\b/i, /[🙄😏]/],
    weight: 0.8,
  },
  confusion: {
    keywords: ['confused', 'lost', 'don\'t understand', 'makes no sense', 'unclear', 'huh', 'what', 'wut', 'idk', 'not sure', 'complex'],
    patterns: [/\?{3,}/, /[🤷😕❓]/],
    weight: 0.7,
  },
  determination: {
    keywords: ['must', 'need to', 'going to', 'will', 'shall', 'committed', 'determined', 'focused', 'resolve', 'no matter what', 'let\'s go', 'build', 'ship it', 'execute'],
    patterns: [/[💪🔥⚡🚀]/],
    weight: 0.9,
  },
};

export function detectEmotion(message: string): EmotionDetection {
  const scores: Record<string, number> = {};
  const lower = message.toLowerCase();

  for (const [emotion, lexicon] of Object.entries(EMOTION_LEXICONS)) {
    let score = 0;

    for (const keyword of lexicon.keywords) {
      if (lower.includes(keyword)) {
        score += lexicon.weight;
      }
    }

    for (const pattern of lexicon.patterns) {
      if (pattern.test(message)) {
        score += lexicon.weight * 0.8;
      }
    }

    scores[emotion] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[1] > 0 ? sorted[0][0] : 'neutral';
  const intensity = Math.min(sorted[0]?.[1] ?? 0, 5) / 5;
  const secondary = sorted[1]?.[1] > 0 ? sorted[1][0] : null;

  return { dominant, intensity, secondary };
}

export function selectPersonalityByEmotion(
  emotion: EmotionDetection,
  userPreference: string | null,
  siteDefault: string,
  isCommander: boolean,
): string {
  if (userPreference) return userPreference;

  if (isCommander) {
    if (emotion.dominant === 'anger' || emotion.dominant === 'determination') return 'EP';
    if (emotion.dominant === 'curiosity') return 'RA';
    return 'EP';
  }

  switch (emotion.dominant) {
    case 'fear':
    case 'sadness':
      return 'WM';
    case 'curiosity':
      return emotion.intensity > 0.6 ? 'RA' : siteDefault;
    case 'anger':
    case 'disgust':
      return 'EP';
    case 'sarcasm':
      return 'BR';
    case 'determination':
      return 'EP';
    default:
      return siteDefault;
  }
}

export function getEmotionTag(emotion: string): string {
  const tags: Record<string, string> = {
    joy: '[laughs]',
    sadness: '[sighs]',
    anger: '[stern]',
    fear: '[reassuring]',
    surprise: '[excited]',
    disgust: '[concerned]',
    curiosity: '[curious]',
    trust: '[warm]',
    anticipation: '[excited]',
    sarcasm: '[sarcastic]',
    confusion: '[thoughtful]',
    determination: '[resolute]',
    neutral: '',
  };
  return tags[emotion] ?? '';
}
