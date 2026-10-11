
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

export const generateProductImage = async (
  productDescription: string,
  stylePrompt: string,
  aspectRatio: AspectRatio,
  productBase64?: string,
  brandLogoBase64?: string,
  styleImageBase64?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  let instructions = brandLogoBase64 
    ? `IMPORTANT: I have provided a brand logo. Please incorporate this logo naturally into the final marketing image, perhaps on the product itself or as a subtle watermark in a corner. `
    : "";

  const qualityInstruction = "Ensure the output is a high-fidelity 3D render with professional lighting, realistic textures, and distinct depth of field. ";

  let basePrompt = "";
  
  if (styleImageBase64) {
    basePrompt = `${instructions}${qualityInstruction}
    MANDATORY: Follow the exact visual style, lighting, color palette, and artistic atmosphere of the provided STYLE REFERENCE image. 
    Task: Render the product from the PRODUCT image (if provided) or based on description "${productDescription}" using that exact style. 
    The product should be the focus. Integration must be seamless with matching shadows and reflections.`;
  } else {
    basePrompt = productBase64 
      ? `${instructions}${qualityInstruction}Take the product shown in the first image and place it in a new professional 3D scene: ${stylePrompt}. Maintain the exact product details, shape, and proportions. Integrate it perfectly with lighting and shadows. Additional details: ${productDescription}. No text other than the provided logo.`
      : `${instructions}${qualityInstruction}${stylePrompt} Product description: ${productDescription}. The image should be a stunning 3D visualization focused on the product. No text other than the provided logo if applicable.`;
  }

  const parts: any[] = [];

  // 1. Product Image (if exists)
  if (productBase64) {
    const cleanProductBase64 = productBase64.split(',')[1] || productBase64;
    parts.push({
      inlineData: {
        data: cleanProductBase64,
        mimeType: 'image/png'
      }
    });
  }

  // 2. Style Reference Image (if exists) - Critical for mimicry
  if (styleImageBase64) {
    const cleanStyleBase64 = styleImageBase64.split(',')[1] || styleImageBase64;
    parts.push({
      inlineData: {
        data: cleanStyleBase64,
        mimeType: 'image/png'
      }
    });
  }

  // 3. Logo (if exists)
  if (brandLogoBase64) {
    const cleanLogoBase64 = brandLogoBase64.split(',')[1] || brandLogoBase64;
    parts.push({
      inlineData: {
        data: cleanLogoBase64,
        mimeType: 'image/png'
      }
    });
  }

  // 4. Text prompt
  parts.push({ text: basePrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("لم يتم العثور على صورة في الاستجابة");
  } catch (error) {
    console.error("خطأ في إنشاء الصورة:", error);
    throw error;
  }
};
