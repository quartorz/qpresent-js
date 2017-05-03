interface AutoRenderDelimiter {
    left: string;
    right: string;
    display: boolean;
}

interface AutoRenderOption {
    delimiters: AutoRenderDelimiter[];
    ignoredTags: string[];
}

declare function renderMathInElement(element: HTMLElement, options: AutoRenderOption): void;
