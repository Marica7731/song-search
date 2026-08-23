const DATE_TAG_REGEX = /\[\d{4}[-\/]?\d{2}[-\/]?\d{2}\]/g;
const CLEAN_SUFFIX_REGEX = /(\s*\(\d+\)|_(sub|copy|backup|1080p|720p|\d+))$/i;
const LEADING_SOURCE_REGEX = /^(?:\s*【[^】]+】)+\s*/;
const LEADING_WITH_INDEX_REGEX = /^\s*with\s+.+?\s+\d+\.\s+/i;
const LEADING_INDEX_REGEX = /^(?:\s*\[\d+(?:\s*[-/]\s*\d+)+\]\.?\s*|\s*\d+\.\s+|\s*P\d+[：:]\s*)/i;
const TRAILING_EMPTY_ARTIST_REGEX = /\s+-\s*$/;

function cleanSongTitle(rawTitle) {
    let title = String(rawTitle || '').replace(DATE_TAG_REGEX, '');
    let previousLength;

    do {
        previousLength = title.length;
        title = title
            .replace(LEADING_SOURCE_REGEX, '')
            .replace(LEADING_WITH_INDEX_REGEX, '')
            .replace(LEADING_INDEX_REGEX, '')
            .trim();
    } while (title.length !== previousLength);

    return title
        .replace(TRAILING_EMPTY_ARTIST_REGEX, '')
        .replace(CLEAN_SUFFIX_REGEX, '')
        .trim();
}

module.exports = { cleanSongTitle };
