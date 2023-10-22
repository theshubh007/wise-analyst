"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAnalyzer = void 0;
class ApiAnalyzer {
    constructor() {
        this.apiEndpoints = new Set();
        this.apiEndpointsarr = [];
        this.apiEndpointsVariables = new Set();
        this.apiCallingFunctions = new Set();
        this.errorhandlingarr = [];
    }
    //MainAnalyzer function to call functions to detect api endpoints and api calling functions
    analyzeApi(content, filePath) {
        this.extractApiEndpoints(content, filePath);
        this.analyzeApiFlow(content);
    }
    //Function to detect api endpoints
    //It contains 2 sub-functions 
    extractApiEndpoints(content, filePath) {
        this.extractApiEndpoints_regx(content, filePath);
        this.extractApiEndpoints_subEndPoints(content, filePath);
    }
    //It detects main api endpoints using regex
    extractApiEndpoints_regx(content, filePath) {
        const apiEndpointRegex = /(?:http|https):\/\/[^"\s]+/g;
        // Extract potential API endpoints from the content
        const matches = content.matchAll(apiEndpointRegex);
        for (const match of matches) {
            const endpoint = match[0];
            // Extract the variable name preceding the URL without including equal sign and surrounding spaces
            const variableMatch = content
                .substring(0, match.index)
                .match(/\b(\w+)\s*=\s*["'`]$/);
            if (variableMatch) {
                // Use the captured group (variable name) and add it to the set
                const variableName = variableMatch[1].trim();
                this.apiEndpoints.add(endpoint);
                this.apiEndpointsVariables.add(variableName);
                this.apiEndpointsarr.push({
                    filePath,
                    apiendpoint: endpoint,
                });
            }
        }
    }
    //It detects sub api endpoints related to variable name allocated to main API endpoints, using regex
    extractApiEndpoints_subEndPoints(content, filePath) {
        this.apiEndpointsVariables.forEach((baseUrl) => {
            const lineRegex = new RegExp(`\\b${RegExp.escape(baseUrl)}(?:/[^"'\s]+)?\\b`, "g");
            // Extract lines from the content that contain the base URL
            const lines = content.split("\n");
            // Filter lines that contain the base URL or its sub-URLs
            const linesWithBaseUrl = lines.filter((line) => line.match(lineRegex));
            // Add the matching lines to the set
            linesWithBaseUrl.forEach((matchingLine) => {
                this.apiEndpoints.add(matchingLine.trim());
                this.apiEndpointsarr.push({
                    filePath,
                    apiendpoint: matchingLine.trim(),
                });
            });
        });
    }
    //Detects api calling functions
    async analyzeApiFlow(content) {
        this.GetRequestFlow(content);
        this.PostRequestFlow(content);
        this.PutRequestFlow(content);
        this.DeleteRequestFlow(content);
        const functionsWithCatch = this.detectFunctionsWithCatchDart(content);
    }
    GetRequestFlow(content) {
        const lineRegexget = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.get\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set();
        const matches = content.matchAll(lineRegexget);
        if (!matches) {
            return;
        }
        for (const match of matches) {
            const apiFunctionMatch = match[0];
            apiFunctionMatches.add(apiFunctionMatch);
            this.apiCallingFunctions.add(apiFunctionMatch);
        }
    }
    //Detects api "POST" request functions
    PostRequestFlow(content) {
        const lineRegexpost = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.post\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set();
        const matches = content.matchAll(lineRegexpost);
        if (!matches) {
            return;
        }
        console.log("apifunctionmatches: ");
        for (const match of matches) {
            const apiFunctionMatch = match[0];
            // console.log("apifunctionmatch: ", apiFunctionMatch)
            apiFunctionMatches.add(apiFunctionMatch);
            this.apiCallingFunctions.add(apiFunctionMatch);
        }
        // If you need to convert the Set back to an array:
        const uniqueMatchesArray = Array.from(apiFunctionMatches);
        // console.log("Unique Matches Array: ", uniqueMatchesArray)
    }
    //Detects api "PUT" request functions
    PutRequestFlow(content) {
        const lineRegexput = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.put\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set();
        const matches = content.matchAll(lineRegexput);
        if (!matches) {
            return;
        }
        console.log("apifunctionmatches: ");
        for (const match of matches) {
            const apiFunctionMatch = match[0];
            apiFunctionMatches.add(apiFunctionMatch);
            this.apiCallingFunctions.add(apiFunctionMatch);
        }
    }
    //Detects api "DELETE" request functions
    DeleteRequestFlow(content) {
        const lineRegexdelete = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.delete\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set();
        const matches = content.matchAll(lineRegexdelete);
        if (!matches) {
            return;
        }
        for (const match of matches) {
            const apiFunctionMatch = match[0];
            apiFunctionMatches.add(apiFunctionMatch);
            this.apiCallingFunctions.add(apiFunctionMatch);
        }
    }
    //Detects functions with catch block for error handling
    detectFunctionsWithCatchDart(code) {
        // Regular expression to match functions with a catch block
        const functionRegex = /(\b\w+\b)\([^)]*\)\s*async\s*{\s*try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/g;
        const functions = [];
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            console.log("match: ", match);
            this.errorhandlingarr.push(match[0]);
            functions.push(match[1]);
        }
        return functions;
    }
    //Getter methods to return the results
    getApiEndpoints() {
        return this.apiEndpointsarr;
    }
    getApiCallingFunctions() {
        return Array.from(this.apiCallingFunctions);
    }
    getErrorHandlingFunctions() {
        return this.errorhandlingarr;
    }
}
exports.ApiAnalyzer = ApiAnalyzer;
//# sourceMappingURL=Apianalyzer.js.map