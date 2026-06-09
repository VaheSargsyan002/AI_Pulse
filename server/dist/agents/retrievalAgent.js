"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrievalAgent = retrievalAgent;
function retrievalAgent(query, chunks, topN = 5) {
    if (chunks.length <= topN)
        return chunks;
    const queryWords = new Set(query.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
    return chunks
        .map((chunk, i) => ({
        i,
        score: chunk.toLowerCase().split(/\W+/).filter((w) => queryWords.has(w)).length,
    }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map(({ i }) => chunks[i]);
}
