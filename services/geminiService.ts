
import { GoogleGenAI, GenerateContentResponse, Chat, Content as GeminiContent } from "@google/genai";
import { UserData, CalculatedMetrics, ExercisePlan, DietPlan, DietPreference, KnownAllergen, ChatMessage as AppChatMessage } from '../types';
import { GEMINI_TEXT_MODEL_NAME } from '../constants';

// Ensure API_KEY is set in your environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please set the process.env.API_KEY environment variable.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

let activeChat: Chat | null = null;

const parseGeminiJsonResponse = <T,>(responseText: string | undefined): T | null => {
  if (!responseText) return null;
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error("Failed to parse JSON response from Gemini:", error);
    console.error("Raw response text:", responseText);
    return null;
  }
};

const generatePlan = async <T,>(prompt: string): Promise<T | null> => {
  if (!API_KEY) {
     throw new Error("API_KEY for Gemini is not set. Cannot generate plan.");
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, 
      }
    });
    return parseGeminiJsonResponse<T>(response.text);
  } catch (error) {
    console.error("Error generating plan with Gemini:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("Invalid API Key. Please check your Gemini API Key.");
    }
    if (error instanceof Error && (error.message.includes("quota") || error.message.includes("rate limit"))) {
        throw new Error("API quota exceeded or rate limit hit. Please try again later.");
    }
    throw error;
  }
};

export const generateExercisePlan = async (
  userData: UserData,
  metrics: CalculatedMetrics
): Promise<ExercisePlan | null> => {
  const prompt = `
    Based on the following user data:
    Age: ${metrics.age}
    Gender: ${userData.gender}
    Height: ${userData.heightCm} cm
    Weight: ${userData.weightKg} kg
    BMI: ${metrics.bmi.value} (${metrics.bmi.category})
    BMR: ${metrics.bmr} calories/day
    TDEE: ${metrics.tdee} calories/day
    Activity Level: ${userData.activityLevel}

    Generate a 7-day personalized exercise plan.
    For each day, include:
    - Day (e.g., "Monday", "Day 1")
    - Focus (e.g., "Cardio", "Strength Training - Upper Body", "Rest")
    - Exercises: Array of objects, each with:
      - name (e.g., "Running", "Push-ups")
      - duration (e.g., "30 minutes", "3 sets of 10-12 reps")
      - intensity (e.g., "Moderate", "High", "To failure")
    - Notes (optional, e.g., "Warm-up for 5 minutes before", "Cool-down and stretch after")

    The plan should be suitable for the user's current fitness level and goals implied by their activity level and BMI.
    Prioritize safety and effectiveness. Suggest rest days as appropriate.
    Return the response as a JSON object with a single key "exercisePlan" which is an array of 7 day objects.
    Example of a day object in the array:
    {
      "day": "Monday",
      "focus": "Cardio & Core",
      "exercises": [
        { "name": "Brisk Walking", "duration": "30 minutes", "intensity": "Moderate" },
        { "name": "Plank", "duration": "3 sets, 30 seconds hold", "intensity": "Moderate" }
      ],
      "notes": "Remember to stay hydrated."
    }
  `;
  return generatePlan<ExercisePlan>(prompt);
};

export const generateDietPlan = async (
  userData: UserData,
  metrics: CalculatedMetrics
): Promise<DietPlan | null> => {
  let targetCaloriesInstruction = `target TDEE (${metrics.tdee} calories) for maintenance.`;
  if (metrics.bmi.category === 'Overweight' || metrics.bmi.category === 'Obese') {
    targetCaloriesInstruction = `target a moderate caloric deficit, around ${Math.max(1200, metrics.tdee - 500)} calories, for healthy weight loss.`;
  } else if (metrics.bmi.category === 'Underweight') {
    targetCaloriesInstruction = `target a moderate caloric surplus, around ${metrics.tdee + 300} calories, for healthy weight gain.`;
  }

  let dietPreferenceInstruction = '';
  if (userData.dietPreference && userData.dietPreference !== DietPreference.NONE) {
    const preferenceDescription = userData.dietPreference; 
    dietPreferenceInstruction = `
    Dietary Preference: ${preferenceDescription}. 
    Please ensure ALL meal suggestions strictly adhere to this preference.
    - If Vegan: no animal products whatsoever (no meat, poultry, fish, dairy, eggs, honey).
    - If Vegetarian: no meat, poultry, or fish. Dairy and eggs are okay.
    - If Pescatarian: Vegetarian diet that includes fish and seafood. No other meat or poultry.
    - If Pollotarian: Excludes red meat and fish, but includes poultry (chicken, turkey). Dairy and eggs may be included.
    - If Carnivore: Primarily meat, fish, and eggs. Minimal to no plant-based foods.
    If the preference is 'None', provide a balanced, general healthy diet.`;
  }

  let allergiesInstruction = '';
  const allAllergens: string[] = [];
  if (userData.allergies && userData.allergies.length > 0) {
    allAllergens.push(...userData.allergies); 
  }
  if (userData.customAllergies && userData.customAllergies.trim() !== "") {
    allAllergens.push(...userData.customAllergies.split(',').map(a => a.trim()).filter(a => a));
  }

  if (allAllergens.length > 0) {
    allergiesInstruction = `
    Food Allergies: The user is allergic to the following items: ${allAllergens.join(', ')}.
    ABSOLUTELY AVOID all ingredients containing these allergens in all meal suggestions. Double-check ingredients (e.g., sauces, dressings, processed foods) for hidden allergens.`;
  }

  const prompt = `
    Based on the following user data:
    Age: ${metrics.age}
    Gender: ${userData.gender}
    Height: ${userData.heightCm} cm
    Weight: ${userData.weightKg} kg
    BMI: ${metrics.bmi.value} (${metrics.bmi.category})
    BMR: ${metrics.bmr} calories/day
    TDEE: ${metrics.tdee} calories/day
    Activity Level: ${userData.activityLevel}
    ${dietPreferenceInstruction}
    ${allergiesInstruction}

    Generate a 7-day personalized diet plan.
    The daily calorie intake should ${targetCaloriesInstruction}.
    For each day, include:
    - Day (e.g., "Monday", "Day 1")
    - totalCalories (approximate for the day, close to the target)
    - Meals: Array of objects, each with:
      - name (e.g., "Breakfast", "Lunch", "Dinner", "Snack 1")
      - description (detailed, e.g., "Oatmeal (1/2 cup dry) cooked with water or unsweetened almond milk, topped with mixed berries (1 cup) and a sprinkle of chia seeds (1 tbsp).")
      - estimatedCalories (approximate)
    - Macronutrients (optional, for the whole day):
      - protein (grams)
      - carbs (grams)
      - fat (grams)

    Suggest varied, balanced, and healthy meals. Include a mix of whole foods.
    Ensure the meal descriptions are specific enough for the user to understand what to prepare.
    If allergies are specified, all meal suggestions MUST be free of those allergens.
    Return the response as a JSON object with a single key "dietPlan" which is an array of 7 day objects.
  `;
  return generatePlan<DietPlan>(prompt);
};


const formatContextForChat = (
    userData: UserData,
    metrics: CalculatedMetrics,
    exercisePlan: ExercisePlan | null,
    dietPlan: DietPlan | null
): string => {
    let context = `USER PROFILE:
Age: ${metrics.age} years
Gender: ${userData.gender}
Height: ${userData.heightCm} cm
Weight: ${userData.weightKg} kg
BMI: ${metrics.bmi.value} (${metrics.bmi.category})
BMR (Basal Metabolic Rate): ${metrics.bmr} calories/day
TDEE (Total Daily Energy Expenditure): ${metrics.tdee} calories/day
Activity Level: ${userData.activityLevel}
Dietary Preference: ${userData.dietPreference || 'None specified'}
Allergies: ${[...userData.allergies, ...userData.customAllergies.split(',').map(s=>s.trim()).filter(Boolean)].filter(Boolean).join(', ') || 'None specified'}

`;

    if (exercisePlan && exercisePlan.exercisePlan && exercisePlan.exercisePlan.length > 0) {
        context += `\nCURRENTLY GENERATED 7-DAY EXERCISE PLAN:
${JSON.stringify(exercisePlan, null, 2)}\n`;
    } else {
        context += `\nNo exercise plan was generated or it's currently empty.\n`;
    }

    if (dietPlan && dietPlan.dietPlan && dietPlan.dietPlan.length > 0) {
        context += `\nCURRENTLY GENERATED 7-DAY DIET PLAN:
${JSON.stringify(dietPlan, null, 2)}\n`;
    } else {
        context += `\nNo diet plan was generated or it's currently empty.\n`;
    }
    return context;
};

export const startOrContinueChat = async (
  messageHistory: AppChatMessage[], // App's ChatMessage format
  currentUserMessage: string,
  userData: UserData,
  metrics: CalculatedMetrics,
  initialExercisePlan: ExercisePlan | null,
  initialDietPlan: DietPlan | null
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY for Gemini is not set. Cannot start chat.");
  }

  const systemInstruction = `You are "MetaFlux AI", a friendly and knowledgeable health and fitness assistant.
The user has just received personalized 7-day exercise and diet plans based on their profile.
Your primary role is to discuss these plans with the user. You should help them understand their plans, answer any questions they have, and assist with making reasonable adjustments or modifications if they request them.
When providing information or making suggestions:
- Be encouraging, clear, and provide actionable advice.
- Always refer to the user's specific data, metrics, and the current plans they have (which are provided below as context).
- If the user asks for a revision (e.g., "Can I swap the Tuesday lunch?" or "Make Friday's workout focus on legs"), provide the updated part of the plan or the full revised plan.
- If you provide a revised plan or part of a plan, try to output it in the original JSON structure if possible, like: \`\`\`json\n{ "dietPlan": [...] }\n\`\`\` or \`\`\`json\n{ "exercisePlan": [...] }\n\`\`\` for easier integration, or as a clearly formatted list.
- Prioritize safety. If a user's request seems unsafe or counterproductive to their implied goals (e.g. drastic calorie cuts, overtraining), gently guide them towards safer alternatives.
- Remind the user that these are suggestions and they should listen to their body.
- CRITICALLY IMPORTANT: DO NOT PROVIDE MEDICAL ADVICE. For any medical concerns, injuries, or health conditions, strictly advise the user to consult with a healthcare professional or doctor. You can say something like, "For specific medical conditions or advice, it's always best to consult with your doctor or a registered dietitian/physician."
- Keep responses concise but informative.

INITIAL CONTEXT FOR THIS CONVERSATION:
${formatContextForChat(userData, metrics, initialExercisePlan, initialDietPlan)}
`;

  // Convert app's message history to Gemini's format
  const geminiHistory: GeminiContent[] = messageHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
  }));

  try {
    if (!activeChat) {
      console.log("Creating new chat session with system instruction and history.");
      activeChat = ai.chats.create({
          model: GEMINI_TEXT_MODEL_NAME,
          config: {
              systemInstruction: systemInstruction,
              // temperature: 0.7, // can be part of chat config
          },
          history: geminiHistory // Pass previous messages if any (excluding the current one being sent)
      });
    }
    
    // console.log("Sending message to active chat:", currentUserMessage);
    // console.log("Chat history being sent with message:", geminiHistory);

    const response = await activeChat.sendMessage({ message: currentUserMessage });
    // For streaming:
    // const streamResponse = await activeChat.sendMessageStream({ message: currentUserMessage });
    // let fullText = "";
    // for await (const chunk of streamResponse) {
    //   fullText += chunk.text;
    // }
    // return fullText;
    return response.text;

  } catch (error) {
    console.error("Error sending message in chat:", error);
    activeChat = null; // Reset activeChat on error so it can be re-initialized
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            throw new Error("Invalid API Key for Gemini. Please check your configuration.");
        }
        if (error.message.includes("quota") || error.message.includes("rate limit")) {
            throw new Error("Gemini API quota exceeded or rate limit hit. Please try again later.");
        }
        // Specific error for chat context length if it occurs
        if (error.message.includes("context length") || error.message.includes("token limit")) {
             throw new Error("The conversation history is too long. Please start a new plan generation to reset the chat or try a shorter message.");
        }
    }
    throw error; // Re-throw other errors
  }
};

export const resetChatSession = () => {
    console.log("Resetting active chat session.");
    activeChat = null;
};
