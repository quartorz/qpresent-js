/// <reference path="marked/index.d.ts" />
/// <reference path="highlight.js/index.d.ts" />
/// <reference path="katex/index.d.ts" />
/// <reference path="katex-auto-render.d.ts" />
/// <reference path="block.ts" />

interface Document {
    mozCancelFullScreen: () => void;
    mozFullScreenElement: () => void;
}

interface HTMLElement {
    mozRequestFullScreen: () => void;
}

module QPresent {
    class QPresentOption {
        pageDelimiter?: string;
        pageWidth?: number;
        pageHeight?: number;
        mathDelimiter?: AutoRenderDelimiter[];

        static default(): QPresentOption {
            return {
                pageDelimiter: '^---$',
                pageWidth: 1122,    // 297mm
                pageHeight: 792,    // 210mm
                mathDelimiter: [
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                ],
            };
        }
    }

    let defaultOption = QPresentOption.default();

    interface Page {
        outerContainerElem: HTMLElement;
        innerContainerElem: HTMLElement;
        pageElem: HTMLElement;
        pageContentElem: HTMLElement;
    }

    function newPage() {
        let pageOuterContElem: HTMLDivElement = document.createElement('div');
        let pageInnerContElem: HTMLDivElement = document.createElement('div');
        let pageElem: HTMLDivElement = document.createElement('div');
        let pageContentElem: HTMLDivElement = document.createElement('div');

        pageOuterContElem.classList.add('qpresent-page-outer-container');
        pageInnerContElem.classList.add('qpresent-page-inner-container');
        pageElem.classList.add('qpresent-page');
        pageContentElem.classList.add('qpresent-page-content');

        pageOuterContElem.appendChild(pageInnerContElem);
        pageInnerContElem.appendChild(pageElem);
        pageElem.appendChild(pageContentElem);

        return {
            outerContainerElem: pageOuterContElem,
            innerContainerElem: pageInnerContElem,
            pageElem: pageElem,
            pageContentElem: pageContentElem,
        };
    }

    function makePageContent(content: string): string {
        return marked(content.replace(/([^\\])~/g, '$1&#x2005;'));
    }

    function makePageNumber(index: number, totalNum: number): HTMLElement {
        let pageNum = document.createElement('span');
        let currentNumElem = document.createElement('span');
        let separatorElem = document.createElement('span');
        let totalNumElem = document.createElement('span');

        pageNum.classList.add('qpresent-page-number');
        currentNumElem.classList.add('qpresent-page-number-current');
        separatorElem.classList.add('qpresent-page-number-separator');
        totalNumElem.classList.add('qpresent-page-number-total');

        currentNumElem.innerText = index.toString();
        separatorElem.innerText = '/';
        totalNumElem.innerText = totalNum.toString();

        pageNum.appendChild(currentNumElem);
        pageNum.appendChild(separatorElem);
        pageNum.appendChild(totalNumElem);

        return pageNum;
    }

    let slideAttrRegExp = /^\s*.slide:\s*/g;
    let elementAttrRegExp = /^\s*.element:\s*/g;
    let attributeRegExp = /\s*(.*)="(.*)"/g;

    function addAttributesInElement(elem: HTMLElement, attr: string) {
        attributeRegExp.lastIndex = 0;

        let match = attributeRegExp.exec(attr);

        while (match !== null) {
            if (match[1] == 'class') {
                elem.classList.add(...match[2].split(/\s+/g));
            }

            match = attributeRegExp.exec(attr);
        }
    }

    function addAttributes(topmostElem: HTMLElement, node: Node, prevNode: Node): void {
        if (node.nodeType == Node.COMMENT_NODE) {
            slideAttrRegExp.lastIndex = 0;

            let elem = node as Comment;
            let matched = slideAttrRegExp.test(elem.data);

            if (matched) {
                addAttributesInElement(topmostElem, elem.data.substr(slideAttrRegExp.lastIndex));
            }
        }

        if (node.hasChildNodes()) {
            addAttributes(topmostElem, node.firstChild, null);
        }

        let next = node.nextSibling;

        while (next !== null) {
            if (next.nodeType != Node.ELEMENT_NODE && next.nodeType != Node.COMMENT_NODE) {
                next = next.nextSibling;
                continue;
            }

            addAttributes(topmostElem, next, node);
            node = next;
            next = next.nextSibling;
        }
    }

    let userAgent = window.navigator.userAgent.toLowerCase();
    let isIE = (userAgent.indexOf('msie') != -1) || (userAgent.indexOf('trident') != -1);
    let isEdge = userAgent.indexOf('edge') != -1;
    let isChrome = !isEdge && userAgent.indexOf('chrome') != -1;
    let isSafari = !isEdge && !isChrome && userAgent.indexOf('safari') != -1;
    let isFirefox = userAgent.indexOf('firefox') != -1;
    let isOpera = userAgent.indexOf('opera') != -1;

    var renderer = new marked.Renderer();

    renderer.code = function(code, language) {
        let table = document.createElement('table');
        let tr = document.createElement('tr');
        let lineNums = document.createElement('td');
        let lineNumsContainer = document.createElement('pre');
        let codeElem = document.createElement('td');
        let lineCount = code.split('\n').length;

        lineNumsContainer.classList.add('line-number-container');
        for(let i = 0; i < lineCount; ++i) {
            lineNumsContainer.innerHTML += '<span class="line-number"></span>\n';
        }
        lineNums.appendChild(lineNumsContainer);

        codeElem.classList.add('code-container');
        codeElem.innerHTML = '<pre><code class="hljs">' + hljs.highlightAuto(code).value + '</code></pre>';

        tr.appendChild(lineNums);
        tr.appendChild(codeElem);
        table.appendChild(tr);
        table.classList.add('code-table');

        return table.outerHTML;
    };

    marked.setOptions({
        renderer: renderer,
    });

    export class Manager {
        element: HTMLElement;
        pages: Page[];
        currentPage: number;
        pageSize: [number, number];
        zoomRate: number;

        constructor(elem: HTMLElement, content: string, options: QPresentOption = defaultOption) {
            options = Object.assign(QPresentOption.default(), options);

            this.element = elem;
            this.pages = [];
            this.pageSize = [options.pageWidth, options.pageHeight];

            let pageDelim = new RegExp(options.pageDelimiter, 'm');
            let pages = content.split(pageDelim);
            pages.forEach((pageContent, index) => {
                let page = newPage();

                page.outerContainerElem.id = 'qpresent-page-' + index;
                page.pageContentElem.innerHTML = makePageContent(pageContent);
                page.pageElem.appendChild(makePageNumber(index+1, pages.length));
                page.pageElem.style.width = `${options.pageWidth}px`;
                page.pageElem.style.height = `${options.pageHeight}px`;

                renderMathInElement(page.pageElem, {
                    delimiters: options.mathDelimiter,
                    ignoredTags: []
                });

                makeBlock(page.pageElem, c => marked(c));
                addAttributes(page.pageContentElem, page.pageContentElem.firstChild, null);

                this.element.appendChild(page.outerContainerElem);
                this.pages.push(page);
            });

            this.currentPage = 0;

            setTimeout(() => {
                for (let p of this.pages)
                    p.outerContainerElem.style.display = 'none';
                this.onResize();
                this.jumpTo(0);
            }, 1);
        }

        jumpTo(pageIndex: number) {
            this.pages[this.currentPage].outerContainerElem.style.display = 'none';
            this.pages[pageIndex].outerContainerElem.style.display = 'block';
            this.currentPage = pageIndex;
            this.resizeCurrentPage();
        }

        nextPage() {
            if (this.currentPage + 1 < this.pages.length) {
                this.jumpTo(this.currentPage + 1);
            }
        }

        prevPage() {
            if (this.currentPage > 0) {
                this.jumpTo(this.currentPage - 1);
            }
        }

        requestFullscreen() {
            let element = document.documentElement;
            let method = element.requestFullscreen ||
                element.webkitRequestFullScreen ||
                element.webkitRequestFullscreen ||
                element.mozRequestFullScreen;

            if (method) {
                method.call(element);
            }
        }

        exitFullscreen() {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                let method = document.exitFullscreen ||
                    document.webkitExitFullscreen ||
                    document.mozCancelFullScreen;

                if (method) {
                    method.call(document);
                }
            }
        }

        onResize() {
            let w = window.innerWidth;
            let h = window.innerHeight;

            if (w / h > this.pageSize[0] / this.pageSize[1]) {
                this.zoomRate = h / this.pageSize[1];
            } else {
                this.zoomRate = w / this.pageSize[0];
            }

            this.resizeCurrentPage();
        }

        resizePage(pageIndex: number) {
            let r = this.zoomRate;
            let w = this.pageSize[0] * r;
            let h = this.pageSize[1] * r;

            this.pages[pageIndex].pageElem.style.transform = `scale(${r}, ${r})`;
            this.pages[pageIndex].innerContainerElem.style.width = `${w}px`;
            this.pages[pageIndex].innerContainerElem.style.height = `${h}px`;
            this.pages[pageIndex].outerContainerElem.style.width = `${w}px`;
            this.pages[pageIndex].outerContainerElem.style.height = `${h}px`;
        }

        resizeCurrentPage() {
            this.resizePage(this.currentPage);
        }

        beforePrint() {
            this.zoomRate = 1;
            for (let i = 0; i < this.pages.length; ++i) {
                this.pages[i].outerContainerElem.style.display = 'block';
                this.resizePage(i);
            }
        }

        afterPrint() {
            for (let p of this.pages) {
                p.outerContainerElem.style.display = 'none';
            }

            this.jumpTo(this.currentPage);
            this.onResize();
        }

        registerPrintListener() {
            if (isChrome) {
                window.matchMedia('print').addListener(m => {
                    if (m.media.indexOf('print') != -1) {
                        this.beforePrint();
                        setTimeout(() => this.afterPrint(), 1);
                    }
                });
            } else if (window.onbeforeprint !== undefined) {
                window.onbeforeprint = e => this.beforePrint();
                window.onafterprint = e => this.afterPrint();
            } else {
                window.matchMedia('print').addListener(m => {
                    if (m.matches) {
                        this.beforePrint();
                    } else {
                        this.afterPrint();
                    }
                });
            }
        }
    }
}
