/// <reference path="marked/index.d.ts" />
/// <reference path="highlight.js/index.d.ts" />
/// <reference path="katex/index.d.ts" />
/// <reference path="katex-auto-render.d.ts" />

interface Document {
    mozCancelFullScreen: () => void;
    mozFullScreenElement: () => void;
}

interface HTMLElement {
    mozRequestFullScreen: () => void;
}

module QPresent {
    'use strict';

    class QPresentOption {
        pageDelimiter?: string;
        columnDelimiter?: string;
        blockDelimiter?: string;
        pageWidth?: number;
        pageHeight?: number;
        mathDelimiter?: AutoRenderDelimiter[];
        mathAutoEscape?: boolean;

        static default(): QPresentOption {
            return {
                pageDelimiter: '^------$',
                columnDelimiter: '^----$',
                blockDelimiter: '^\\*\\*\\*$',
                pageWidth: 1122,    // 297mm
                pageHeight: 792,    // 210mm
                mathDelimiter: [
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                ],
                mathAutoEscape: false,
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

        pageContentElem.setAttribute('tabindex', '0');

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

    function makeColumn(content: string, colDelim: RegExp) {
        let result = '';

        colDelim.lastIndex = 0;

        let e: RegExpExecArray;
        let lastIndex: number;

        for (;;) {
            lastIndex = colDelim.lastIndex;

            if (!(e = colDelim.exec(content)))
                break;

            result += marked(e[1]);

            let container = document.createElement('div');
            let left = document.createElement('div');
            let right = document.createElement('div');

            container.classList.add('qpresent-twocol-container');
            left.classList.add('qpresent-twocol-left');
            right.classList.add('qpresent-twocol-right');

            left.innerHTML = marked(e[2]);
            right.innerHTML = marked(e[3]);

            container.appendChild(left);
            container.appendChild(right);

            result += container.outerHTML;
        }

        result += marked((lastIndex == 0) ? content : content.substr(lastIndex));

        return result;
    }

    function makePageContent(content: string, colDelim: RegExp, blockDelim: RegExp): string {
        let c = content.replace(/\\\r?\n\s*/g, '').replace(/([^\\])~/g, '$1<span class="qpresent-space">&nbsp;</span>').replace(/\\~/g, '~');

        let e: RegExpExecArray;
        let lastIndex: number;

        content = '';
        blockDelim.lastIndex = 0;

        for (;;) {
            lastIndex = blockDelim.lastIndex;

            if (!(e = blockDelim.exec(c)))
                break;

            content += makeColumn(e[1], colDelim);

            let blockElem = document.createElement('div');
            let bodyElem = document.createElement('div');

            blockElem.classList.add('block');
            bodyElem.classList.add('block-body');

            if (e[2].trim().length != 0) {
                let titleElem = document.createElement('div');
                titleElem.classList.add('block-title');
                titleElem.innerHTML = e[2];
                blockElem.appendChild(titleElem);
            }

            bodyElem.innerHTML = marked(e[3]);
            blockElem.appendChild(bodyElem);

            content += blockElem.outerHTML;
        }

        content += makeColumn((lastIndex == 0) ? c : c.substr(lastIndex), colDelim);
        
        return content;
    }

    function makePageNumber(manager: Manager, index: number, totalNum: number): HTMLElement {
        let pageNum = document.createElement('span');
        let currentNumElem = document.createElement('span');
        let separatorElem = document.createElement('span');
        let totalNumElem = document.createElement('span');

        pageNum.classList.add('qpresent-page-number');
        currentNumElem.classList.add('qpresent-page-number-current');
        separatorElem.classList.add('qpresent-page-number-separator');
        totalNumElem.classList.add('qpresent-page-number-total');

        currentNumElem.setAttribute('contenteditable', 'true');

        currentNumElem.innerText = index.toString();
        separatorElem.innerText = '/';
        totalNumElem.innerText = totalNum.toString();

        pageNum.appendChild(currentNumElem);
        pageNum.appendChild(separatorElem);
        pageNum.appendChild(totalNumElem);

        let onConfirm = () => {
            let n = parseInt(currentNumElem.innerText);
            currentNumElem.innerText = index.toString();
            if (isFinite(n)) {
                manager.jumpTo(Math.max(0, Math.min(totalNum - 1, n - 1)));
            }
        };

        currentNumElem.addEventListener('focus', (e) => {
            setTimeout(() => currentNumElem.innerText = '', 0);
        });

        currentNumElem.addEventListener('keydown', (e) => {
            if (e.keyCode == 0x0d) {
                let n = parseInt(currentNumElem.innerText);

                if (isFinite(n)) {
                    onConfirm();
                } else {
                    currentNumElem.innerHTML = '';
                }

                e.preventDefault();
                return false;
            }
        });

        currentNumElem.addEventListener('blur', (e) => {
            if (currentNumElem.offsetParent !== null) {
                onConfirm();
            }
        });

        return pageNum;
    }

    function makeNavigationButtons(): HTMLElement {
        let container = document.createElement('span');
        let prev = document.createElement('input');
        let buttonSep = document.createElement('span');
        let next = document.createElement('input');

        container.classList.add('qpresent-navigation-button-container');
        prev.classList.add('qpresent-prev-button', 'qpresent-navigation-button');
        buttonSep.classList.add('qpresent-navigation-button-separator');
        next.classList.add('qpresent-next-button', 'qpresent-navigation-button');

        prev.setAttribute('tabindex', '-1');
        next.setAttribute('tabindex', '-1');

        prev.type = 'button';
        next.type = 'button';

        container.appendChild(prev);
        container.appendChild(buttonSep);
        container.appendChild(next);

        return container;
    }

    let slideAttrRegExp = /^\s*.slide:\s*/g;
    let elementAttrRegExp = /^\s*.element:\s*/g;
    let attributeRegExp = /\s*(.*?)="(.*?)"/g;

    function addAttributesInElement(elem: HTMLElement, attr: string) {
        attributeRegExp.lastIndex = 0;

        let match = attributeRegExp.exec(attr);

        while (match !== null) {
            if (match[1] == 'class') {
                elem.classList.add(...match[2].split(/\s+/g));
            } else if (match[1] == 'style') {
                elem.style.cssText += match[2];
            } else {
                elem.setAttribute(match[1], match[2]);
            }

            match = attributeRegExp.exec(attr);
        }
    }

    function addAttributes(topmostElem: HTMLElement, node: Node, prevNode: Node): void {
        if (node.nodeType == Node.ELEMENT_NODE
            && ((node as HTMLElement).tagName == 'PRE'
                || (node as HTMLElement).classList.contains('katex')
            )
        ) {
            return;
        }

        if (node.nodeType == Node.COMMENT_NODE) {
            slideAttrRegExp.lastIndex = 0;

            let elem = node as Comment;
            let matched = slideAttrRegExp.test(elem.data);

            if (matched) {
                addAttributesInElement(topmostElem, elem.data.substr(slideAttrRegExp.lastIndex));
            }

            elementAttrRegExp.lastIndex = 0;
            matched = elementAttrRegExp.test(elem.data);

            if (matched) {
                let dest: HTMLElement;

                if (!prevNode) {
                    dest = node.parentElement;
                } else if (prevNode.nodeType != Node.ELEMENT_NODE) {
                    if (prevNode.nodeType == Node.TEXT_NODE && /(?:\r?\n)+/.test(prevNode.textContent)) {
                        if (prevNode.previousSibling
                            && prevNode.previousSibling.nodeType == Node.ELEMENT_NODE
                        ) {
                            dest = prevNode.previousSibling as HTMLElement;
                        } else {
                            dest = node.parentElement;
                        }
                    } else {
                        dest = node.parentElement;
                    }
                } else {
                    dest = prevNode as HTMLElement;
                }

                addAttributesInElement(dest, elem.data.substr(elementAttrRegExp.lastIndex));
            }
        }

        if (node.hasChildNodes()) {
            addAttributes(topmostElem, node.firstChild, null);
        }

        let next = node.nextSibling;

        while (next !== null) {
            if (next.nodeType != Node.TEXT_NODE
                && !(
                    next.nodeType == Node.ELEMENT_NODE
                    && (next as HTMLElement).classList.contains('qpresent-space')
                )
            )
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

        lineNumsContainer.classList.add('qpresent-line-number-container');
        lineNumsContainer.innerHTML += '<span class="qpresent-line-number"></span>\n'.repeat(lineCount);
        lineNums.appendChild(lineNumsContainer);

        codeElem.classList.add('qpresent-code-container');
        codeElem.innerHTML = '<pre><code class="hljs">' + hljs.highlightAuto(code, [language]).value + '</code></pre>';

        tr.appendChild(lineNums);
        tr.appendChild(codeElem);
        table.appendChild(tr);
        table.classList.add('qpresent-code-table');

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
        overlayElem: HTMLElement;
        buttonContainer: HTMLElement;

        constructor(elem: HTMLElement, content: string, options: QPresentOption = defaultOption) {
            options = Object.assign(QPresentOption.default(), options);

            this.element = elem;
            this.pages = [];
            this.pageSize = [options.pageWidth, options.pageHeight];

            let pageDelim = new RegExp(options.pageDelimiter, 'm');
            let colDelim = new RegExp(`((?:\r|\n|\u2028|\u2029|.)*?)${options.columnDelimiter}((?:\r|\n|\u2028|\u2029|.)*?)${options.columnDelimiter}((?:\r|\n|\u2028|\u2029|.)*?)${options.columnDelimiter}`, 'mg');
            let blockDelim = new RegExp(`((?:\r|\n|\u2028|\u2029|.)*?)${options.blockDelimiter}((?:\r|\n|\u2028|\u2029|.)*?)${options.blockDelimiter}((?:\r|\n|\u2028|\u2029|.)*?)${options.blockDelimiter}`, 'mg');
            let pages = content.split(pageDelim);

            pages.forEach((pageContent, index) => {
                let page = newPage();

                if (options.mathAutoEscape) {
                    let indices: number[] = [];
                    let char = /\\|_|\*/g;

                    options.mathDelimiter.forEach((v) => {
                        let begin = pageContent.indexOf(v.left);

                        if (begin === -1)
                            return;

                        let end = pageContent.indexOf(v.right, begin+1);
                        let e: RegExpExecArray;

                        char.lastIndex = begin;

                        while (end !== -1) {
                            if (begin + v.left.length === end){
                                begin = pageContent.indexOf(v.left, end+1);
                                end = begin === -1 ? -1 : pageContent.indexOf(v.right, begin+1);
                                continue;
                            }

                            while (e = char.exec(pageContent)){
                                if (e.index >= end)
                                    break;
                                indices.push(e.index);
                            }

                            begin = pageContent.indexOf(v.left, end+1);
                            end = begin === -1 ? -1 : pageContent.indexOf(v.right, begin+1);
                        }
                    });

                    let a = 0;
                    let c: string[] = [];

                    indices.sort().forEach((v) => {
                        c.push(pageContent.slice(a, v));
                        a = v;
                    });

                    c.push(pageContent.slice(a));
                    pageContent = c.join('\\');
                }

                page.outerContainerElem.id = 'qpresent-page-' + index;
                page.pageContentElem.innerHTML = makePageContent(pageContent, colDelim, blockDelim);
                page.pageElem.appendChild(makePageNumber(this, index+1, pages.length));
                page.pageElem.style.width = `${options.pageWidth}px`;
                page.pageElem.style.height = `${options.pageHeight}px`;

                addAttributes(page.pageContentElem, page.pageContentElem.firstChild, null);

                renderMathInElement(page.pageElem, {
                    delimiters: options.mathDelimiter,
                    ignoredTags: []
                });

                this.element.appendChild(page.outerContainerElem);
                this.pages.push(page);
            });

            this.overlayElem = document.createElement('div');
            this.overlayElem.classList.add('qpresent-overlay');

            this.buttonContainer = makeNavigationButtons();

            this.overlayElem.appendChild(this.buttonContainer);
            this.element.appendChild(this.overlayElem);

            let prevButton = this.buttonContainer.getElementsByClassName('qpresent-prev-button')[0] as HTMLInputElement;
            let nextButton = this.buttonContainer.getElementsByClassName('qpresent-next-button')[0] as HTMLInputElement;

            prevButton.value = 'prev';
            nextButton.value = 'next';

            prevButton.addEventListener('click', e => this.prevPage());
            nextButton.addEventListener('click', e => this.nextPage());

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

            this.pages[pageIndex].pageContentElem.focus();
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
            let w = document.documentElement.clientWidth;
            let h = document.documentElement.clientHeight;

            if (w / h > this.pageSize[0] / this.pageSize[1]) {
                this.zoomRate = h / this.pageSize[1];
            } else {
                this.zoomRate = w / this.pageSize[0];
            }

            this.resizeCurrentPage();
        }

        private resizePage(pageIndex: number) {
            let r = this.zoomRate;
            let w = this.pageSize[0] * r;
            let h = this.pageSize[1] * r;

            this.pages[pageIndex].pageElem.style.transform = `scale(${r}, ${r})`;
            this.pages[pageIndex].pageContentElem.style.height = `${this.pageSize[1]}px`;
            this.pages[pageIndex].pageContentElem.style.minHeight = `${this.pageSize[1]}px`;
            this.pages[pageIndex].pageContentElem.style.maxHeight = `${this.pageSize[1]}px`;
            this.pages[pageIndex].innerContainerElem.style.width = `${w}px`;
            this.pages[pageIndex].innerContainerElem.style.height = `${h}px`;
            this.pages[pageIndex].outerContainerElem.style.width = `${w}px`;
            this.pages[pageIndex].outerContainerElem.style.height = `${h}px`;
            this.buttonContainer.style.transform = `scale(${r}, ${r})`;
            this.overlayElem.style.width = `${w}px`;
            this.overlayElem.style.height = `${h}px`;
        }

        private resizeCurrentPage() {
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
                    if (m.matches) {
                        this.beforePrint();
                        setTimeout(() => this.afterPrint(), 0);
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
