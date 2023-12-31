"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptGenerator = void 0;
// prompt-generator.ts
const axios_1 = require("axios");
class PromptGenerator {
    constructor(analysisResults) {
        this.apiKey = "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";
        this.chatGPTUrl = "https://api.openai.com/v1/completions";
        this.analysisResults = analysisResults;
    }
    generateAnalysisReport() {
        // Implement logic to generate an analysis report 
        const analysisReport = `
      Analysis Report:
      - Total API Endpoints: ${this.analysisResults.apiEndpointsnum}
      - Total API Calling Functions: ${this.analysisResults.apiCallingFunctions.length}
      - Total Code Quality Issues: ${this.analysisResults.codeQualityIssues.length}
      `;
        return analysisReport;
    }
    async generateExtensionPrompt(fileContent, retryCount = 0) {
        const instruction1 = `Provide 1 efficient and effective suggestion for a new feature or improvement in the code. Alongside it, provide example code based on the latest version of Flutter:\n\n`;
        const instruction = `Provide a list of 5 suggestions for a new feature or improvement in the code. Alongside each suggestion, provide example code based on the latest version of Flutter. Ensure there are 32 tab spaces between each of the 5 suggestions for clarity. Additionally, maintain 5 empty lines between each suggestion to enhance readability:\n\n`;
        try {
            const response = await axios_1.default.post(this.chatGPTUrl, {
                model: "text-davinci-003",
                prompt: `${instruction1}${fileContent}`,
                max_tokens: 2000,
                temperature: 0.5,
            }, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            // Check if the response has the expected structure
            if (response.data &&
                response.data.choices &&
                response.data.choices.length > 0 &&
                response.data.choices[0].text) {
                console.log("Response from GPT API:", response.data);
                const generatedText = response.data.choices[0].text.trim();
                console.log("Generated Text:", generatedText);
                return generatedText;
            }
            else {
                console.error("Invalid response structure from GPT API");
                throw new Error("Invalid response structure from GPT API");
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 429) {
                // Retry after a certain interval (you can use the Retry-After header)
                const retryAfter = error.response.headers["retry-after"];
                const waitTime = retryAfter ? parseInt(retryAfter, 10) : 5; // default to 5 seconds
                if (retryCount < 3) {
                    console.log(`Rate limited. Retrying after ${waitTime} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
                    return this.generateExtensionPrompt(fileContent, retryCount + 1);
                }
                else {
                    console.error("Retry limit reached. Exiting.");
                    throw error;
                }
            }
            else {
                console.error("Error fetching response from GPT API:", error.message);
                throw error;
            }
        }
    }
}
exports.PromptGenerator = PromptGenerator;
//# sourceMappingURL=PromptGenerator.js.map