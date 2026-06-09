"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
const textsplitters_1 = require("@langchain/textsplitters");
async function chunkText(text) {
    const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    return splitter.splitText(text);
}
