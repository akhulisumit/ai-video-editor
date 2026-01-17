const MAX_WORDS = 6;
const MIN_WORDS = 2;

function splitTextSmart(text) {
  // try punctuation-based splitting first
  const parts = text
    .replace(/,/g, " , ")
    .replace(/\band\b|\bbut\b/gi, match => ` ${match} `)
    .split(/\s{2,}|(?<=,)|(?<=\.)/);

  return parts
    .map(p => p.trim())
    .filter(Boolean);
}

function distributeTime(chunks, start, end) {
  const totalWords = chunks.reduce(
    (sum, c) => sum + c.split(" ").length,
    0
  );

  let currentTime = start;
  const result = [];

  for (let i = 0; i < chunks.length; i++) {
    const words = chunks[i].split(" ").length;
    const duration = ((end - start) * words) / totalWords;

    result.push({
      text: chunks[i],
      start: currentTime,
      end: currentTime + duration
    });

    currentTime += duration;
  }

  return result;
}

export function segmentTranscript(transcript) {
  const finalSegments = [];

  for (const entry of transcript) {
    const words = entry.text.split(" ");

    if (words.length <= MAX_WORDS) {
      finalSegments.push(entry);
      continue;
    }

    let chunks = splitTextSmart(entry.text);

    // fallback: brute force word split
    if (chunks.some(c => c.split(" ").length > MAX_WORDS)) {
      chunks = [];
      for (let i = 0; i < words.length; i += MAX_WORDS) {
        chunks.push(words.slice(i, i + MAX_WORDS).join(" "));
      }
    }

    let timedChunks = distributeTime(chunks, entry.start, entry.end);

    // merge tiny captions
    for (const chunk of timedChunks) {
      const wordCount = chunk.text.split(" ").length;

      if (wordCount < MIN_WORDS && finalSegments.length > 0) {
        finalSegments[finalSegments.length - 1].text += " " + chunk.text;
        finalSegments[finalSegments.length - 1].end = chunk.end;
      } else {
        finalSegments.push(chunk);
      }
    }
  }

  return finalSegments;
}

export function cleanSegments(segments) {
    return segments.map(seg => ({
        ...seg,
        text: seg.text.trim()
    })).filter(seg => seg.text.length > 0);
}
