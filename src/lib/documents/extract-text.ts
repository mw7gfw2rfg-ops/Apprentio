import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

export async function extractText(bytes: ArrayBuffer, storagePath: string): Promise<string> {
  if (storagePath.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractPdfText(pdf, { mergePages: true });
    return text;
  }
  return new TextDecoder("utf-8").decode(bytes);
}
