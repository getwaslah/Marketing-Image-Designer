
import React from 'react';
import { MarketingStyle } from './types';

export const MARKETING_STYLES: MarketingStyle[] = [
  {
    id: 'studio',
    name: 'استوديو 3D احترافي',
    description: 'رندر ثلاثي الأبعاد بإضاءة استوديو ناعمة وتركيز فائق على التفاصيل.',
    promptPrefix: 'High-fidelity 3D product render, professional studio lighting, Octane render, ray tracing, soft shadows, 8k resolution, photorealistic, macro details, depth of field.',
    icon: '📸'
  },
  {
    id: 'luxury',
    name: 'فخامة سينمائية',
    description: 'أجواء راقية مع إضاءة درامية وخلفيات رخامية ثلاثية الأبعاد.',
    promptPrefix: 'Cinematic 3D luxury product visualization, elegant dark marble environment, golden rim lighting, sophisticated atmosphere, unreal engine 5 render, high-end commercial quality, 8k UHD.',
    icon: '✨'
  },
  {
    id: 'nature',
    name: 'بيئة طبيعية واقعية',
    description: 'دمج المنتج في بيئة طبيعية ثلاثية الأبعاد مع ظلال واقعية وضوء شمس.',
    promptPrefix: 'Realistic 3D organic product shot, hyper-realistic nature environment, sunlight dapples, volumetric lighting, botanical elements, Unreal Engine 5 style, fresh and vibrant.',
    icon: '🌿'
  },
  {
    id: 'minimalist',
    name: 'بسيط عصري 3D',
    description: 'تصميم مينيماليست بأبعاد هندسية واضحة وألوان متناسقة بدقة عالية.',
    promptPrefix: 'Minimalist 3D isometric product render, pastel monochromatic setting, clean geometric shapes, sharp ray-traced shadows, modern architectural composition, 8k resolution.',
    icon: '⬛'
  },
  {
    id: 'creative',
    name: 'إبداع فني ثلاثي الأبعاد',
    description: 'ألوان نيون جريئة وتكوين ديناميكي يعزز العمق البصري.',
    promptPrefix: 'Creative artistic 3D visualization, abstract liquid background, neon glowing accents, dynamic gravity-defying composition, pop art 3D render, high energy, vibrant 8k.',
    icon: '🎨'
  },
  {
    id: 'tech',
    name: 'تقني مستقبلي (Sci-Fi)',
    description: 'مظهر مستقبلي مع عناصر هولوغرافية وإضاءة ليزر ثلاثية الأبعاد.',
    promptPrefix: 'Futuristic Sci-Fi 3D product shot, holographic interfaces, blue and purple cyberpunk lighting, sleek metallic surfaces, high-tech laboratory render, ray tracing, 8k.',
    icon: '🚀'
  },
  {
    id: 'festive',
    name: 'احتفالي مجسم',
    description: 'أجواء احتفالية مليئة بالعمق والبهجة مع تأثيرات إضاءة دافئة.',
    promptPrefix: 'Festive 3D holiday product render, 3D confetti particles, warm bokeh string lights, celebration atmosphere, joyful volumetric lighting, high-quality commercial render.',
    icon: '🎉'
  },
  {
    id: 'vintage',
    name: 'كلاسيكي عتيق بدقة',
    description: 'لمسة كلاسيكية بأسلوب سينمائي قديم مع تفاصيل مادية واقعية.',
    promptPrefix: 'Vintage 3D aesthetic photography, retro warm cinematic tones, realistic material textures (wood, leather), classic vibe, soft shadows, nostalgic 8k photorealistic render.',
    icon: '📻'
  },
  {
    id: 'dynamic',
    name: 'حركي فائق الواقعية',
    description: 'تأثيرات حركية مجسمة مثل قطرات الماء المتطايرة بدقة مذهلة.',
    promptPrefix: 'Dynamic 3D action render, realistic water splashes, frozen motion particles, depth of field, high-speed photography style, high energy, photorealistic 8k visualization.',
    icon: '⚡'
  }
];

export const ASPECT_RATIOS: { label: string; value: string }[] = [
  { label: 'مربع (1:1)', value: '1:1' },
  { label: 'بورتريه (3:4)', value: '3:4' },
  { label: 'لاندسكيب (4:3)', value: '4:3' },
  { label: 'ستوري (9:16)', value: '9:16' },
  { label: 'سينمائي (16:9)', value: '16:9' },
];
