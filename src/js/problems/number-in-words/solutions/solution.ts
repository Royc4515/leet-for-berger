// O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const below20 = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];

  const spellChunk = (n: number): string => {
    const words: string[] = [];
    if (n >= 100) {
      words.push(below20[Math.floor(n / 100)], 'Hundred');
      n %= 100;
    }
    if (n >= 20) {
      words.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) words.push(below20[n]);
    return words.join(' ');
  };

  const groups: string[] = [];
  let scale = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const text = spellChunk(chunk);
      groups.push(scales[scale] ? `${text} ${scales[scale]}` : text);
    }
    num = Math.floor(num / 1000);
    scale++;
  }
  return groups.reverse().join(' ');
}
