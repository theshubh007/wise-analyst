"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAnalyzer = void 0;
class ApiAnalyzer {
    constructor() {
        this.apiEndpoints = new Set();
        this.apiEndpointsarr = [];
        this.apiEndpointsVariables = new Set();
        this.apiCallingFunctions = new Set();
        this.errorHandlingFunctions = new Set();
        this.errorhandlingarr = [];
    }
    analyzeApi(content) {
        this.extractApiEndpoints(content);
        this.analyzeApiFlow(content);
    }
    extractApiEndpoints(content) {
        this.extractApiEndpoints_regx(content);
        this.extractApiEndpoints_subEndPoints(content);
        this.apiEndpointsarr = Array.from(this.apiEndpoints);
        // console.log("API Endpointsarr:", this.apiEndpointsarr)
    }
    extractApiEndpoints_regx(content) {
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
            }
        }
    }
    extractApiEndpoints_subEndPoints(content) {
        // Iterate through the base URLs and find associated sub-URLs
        // console.log("extractapiendpoints_subendpoints entered")
        this.apiEndpointsVariables.forEach((baseUrl) => {
            // Create a regex pattern for matching lines containing the base URL
            const lineRegex = new RegExp(`\\b${RegExp.escape(baseUrl)}(?:/[^"'\s]+)?\\b`, "g");
            // Extract lines from the content that contain the base URL
            const lines = content.split("\n");
            // Filter lines that contain the base URL or its sub-URLs
            const linesWithBaseUrl = lines.filter((line) => line.match(lineRegex));
            // Add the matching lines to the set
            linesWithBaseUrl.forEach((matchingLine) => {
                this.apiEndpoints.add(matchingLine.trim());
            });
        });
    }
    //apiCallingFunctions overflow
    async analyzeApiFlow(content) {
        // Identify API calls within functions
        // console.log("analyzeapiflow entered")
        this.GetRequestFlow(content);
        this.PostRequestFlow(content);
        this.PutRequestFlow(content);
        this.DeleteRequestFlow(content);
        const functionsWithCatch = this.detectFunctionsWithCatchDart(content);
        // console.log("Functions with catch:", this.errorhandlingarr)
        // console.log("Functions with catch length:", this.errorhandlingarr.length)
    }
    GetRequestFlow(content) {
        const lineRegexget = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.get\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set(); // Use a Set to store unique matches
        // Use matchAll instead of match
        const matches = content.matchAll(lineRegexget);
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
        console.log("Unique Matches Array: ", uniqueMatchesArray);
    }
    PostRequestFlow(content) {
        const lineRegexpost = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.post\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set(); // Use a Set to store unique matches
        // Use matchAll instead of match
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
    PutRequestFlow(content) {
        const lineRegexput = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.put\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set(); // Use a Set to store unique matches
        // Use matchAll instead of match
        const matches = content.matchAll(lineRegexput);
        if (!matches) {
            return;
        }
        console.log("apifunctionmatches: ");
        for (const match of matches) {
            const apiFunctionMatch = match[0];
            console.log("apifunctionmatch: ", apiFunctionMatch);
            apiFunctionMatches.add(apiFunctionMatch);
            this.apiCallingFunctions.add(apiFunctionMatch);
        }
        // If you need to convert the Set back to an array:
        const uniqueMatchesArray = Array.from(apiFunctionMatches);
        console.log("Unique Matches Array: ", uniqueMatchesArray);
    }
    DeleteRequestFlow(content) {
        const lineRegexdelete = new RegExp(`\\b(\\w+<.*?>)?\\s*\\.delete\\([^)]*\\)[^}]*}`, "g");
        const apiFunctionMatches = new Set(); // Use a Set to store unique matches
        // Use matchAll instead of match
        const matches = content.matchAll(lineRegexdelete);
        if (!matches) {
            return;
        }
        console.log("apifunctionmatches: ");
        for (const match of matches) {
            const apiFunctionMatch = match[0];
            console.log("apifunctionmatch: ", apiFunctionMatch);
            apiFunctionMatches.add(apiFunctionMatch);
            this.apiCallingFunctions.add(apiFunctionMatch);
        }
        // If you need to convert the Set back to an array:
        const uniqueMatchesArray = Array.from(apiFunctionMatches);
        console.log("Unique Matches Array: ", uniqueMatchesArray);
    }
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
    getApiEndpoints() {
        return Array.from(this.apiEndpoints);
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