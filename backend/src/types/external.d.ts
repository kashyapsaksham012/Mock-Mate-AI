declare module 'mammoth' {
    export interface ExtractResult {
        value: string;
        messages: any[];
    }
    export function extractRawText(options: { buffer: Buffer }): Promise<ExtractResult>;
}