export function normalizeText(text: string): string {
  return (
    text
      // Fix common OCR errors
      .replace(/[óòôõö]/gi, 'o')
      .replace(/[áàâãä]/gi, 'a')
      .replace(/[éèêë]/gi, 'e')
      .replace(/[íìîï]/gi, 'i')
      .replace(/[úùûü]/gi, 'u')
      .replace(/ç/gi, 'c')
      // Fix common Portuguese OCR mistakes
      .replace(/totaI/gi, 'total')
      .replace(/tota1/gi, 'total')
      .replace(/0(?=\d)/g, 'O') // Replace 0 with O when followed by digits in words
      .replace(/1(?=[a-z])/gi, 'l') // Replace 1 with l when followed by letters
      .replace(/5(?=[a-z])/gi, 'S') // Replace 5 with S when followed by letters
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Fix euro symbol recognition
      .replace(/[€€]/g, '€')
      .trim()
  );
}
