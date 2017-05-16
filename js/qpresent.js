/// <reference path="marked/index.d.ts" />
/// <reference path="highlight.js/index.d.ts" />
/// <reference path="katex/index.d.ts" />
/// <reference path="katex-auto-render.d.ts" />
var QPresent;
(function (QPresent) {
    'use strict';
    var QPresentOption = (function () {
        function QPresentOption() {
        }
        QPresentOption["default"] = function () {
            return {
                pageDelimiter: '^------$',
                columnDelimiter: '^----$',
                blockDelimiter: '^\\*\\*\\*$',
                pageWidth: 1122,
                pageHeight: 792,
                mathDelimiter: [
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                ]
            };
        };
        return QPresentOption;
    }());
    var defaultOption = QPresentOption["default"]();
    function newPage() {
        var pageOuterContElem = document.createElement('div');
        var pageInnerContElem = document.createElement('div');
        var pageElem = document.createElement('div');
        var pageContentElem = document.createElement('div');
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
            pageContentElem: pageContentElem
        };
    }
    function makePageContent(content, colDelim, blockDelim) {
        var c = content.replace(/\\\r?\n\s*/g, '').replace(/([^\\])~/g, '$1<span class="qpresent-space">&nbsp;</span>').replace(/\\~/g, '~');
        if (blockDelim) {
            var e = void 0;
            var lastIndex = void 0;
            content = '';
            blockDelim.lastIndex = 0;
            for (;;) {
                lastIndex = blockDelim.lastIndex;
                if (!(e = blockDelim.exec(c)))
                    break;
                content += e[1];
                var blockElem = document.createElement('div');
                var bodyElem = document.createElement('div');
                blockElem.classList.add('block');
                bodyElem.classList.add('block-body');
                if (e[2].trim().length != 0) {
                    var titleElem = document.createElement('div');
                    titleElem.classList.add('block-title');
                    titleElem.innerHTML = e[2];
                    blockElem.appendChild(titleElem);
                }
                bodyElem.innerHTML = marked(e[3]);
                blockElem.appendChild(bodyElem);
                content += blockElem.outerHTML;
            }
            content += (lastIndex == 0) ? c : c.substr(lastIndex);
            c = content;
        }
        if (colDelim) {
            content = '';
            colDelim.lastIndex = 0;
            var e = void 0;
            var lastIndex = void 0;
            for (;;) {
                lastIndex = colDelim.lastIndex;
                if (!(e = colDelim.exec(c)))
                    break;
                content += marked(e[1]);
                var container = document.createElement('div');
                var left = document.createElement('div');
                var right = document.createElement('div');
                container.classList.add('qpresent-twocol-container');
                left.classList.add('qpresent-twocol-left');
                right.classList.add('qpresent-twocol-right');
                left.innerHTML = marked(e[2]);
                right.innerHTML = marked(e[3]);
                container.appendChild(left);
                container.appendChild(right);
                content += container.outerHTML;
            }
            content += marked((lastIndex == 0) ? c : c.substr(lastIndex));
        }
        else {
            content = marked(c);
        }
        return content;
    }
    function makePageNumber(index, totalNum) {
        var pageNum = document.createElement('span');
        var currentNumElem = document.createElement('span');
        var separatorElem = document.createElement('span');
        var totalNumElem = document.createElement('span');
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
    function makeNavigationButtons() {
        var container = document.createElement('span');
        var prev = document.createElement('input');
        var buttonSep = document.createElement('span');
        var next = document.createElement('input');
        container.classList.add('qpresent-navigation-button-container');
        prev.classList.add('qpresent-prev-button', 'qpresent-navigation-button');
        buttonSep.classList.add('qpresent-navigation-button-separator');
        next.classList.add('qpresent-next-button', 'qpresent-navigation-button');
        prev.type = 'button';
        next.type = 'button';
        container.appendChild(prev);
        container.appendChild(buttonSep);
        container.appendChild(next);
        return container;
    }
    var slideAttrRegExp = /^\s*.slide:\s*/g;
    var elementAttrRegExp = /^\s*.element:\s*/g;
    var attributeRegExp = /\s*(.*?)="(.*?)"/g;
    function addAttributesInElement(elem, attr) {
        attributeRegExp.lastIndex = 0;
        var match = attributeRegExp.exec(attr);
        while (match !== null) {
            if (match[1] == 'class') {
                (_a = elem.classList).add.apply(_a, match[2].split(/\s+/g));
            }
            else if (match[1] == 'style') {
                elem.style.cssText += match[2];
            }
            else {
                elem.setAttribute(match[1], match[2]);
            }
            match = attributeRegExp.exec(attr);
        }
        var _a;
    }
    function addAttributes(topmostElem, node, prevNode) {
        if (node.nodeType == Node.ELEMENT_NODE
            && (node.tagName == 'PRE'
                || node.classList.contains('katex'))) {
            return;
        }
        if (node.nodeType == Node.COMMENT_NODE) {
            slideAttrRegExp.lastIndex = 0;
            var elem = node;
            var matched = slideAttrRegExp.test(elem.data);
            if (matched) {
                addAttributesInElement(topmostElem, elem.data.substr(slideAttrRegExp.lastIndex));
            }
            elementAttrRegExp.lastIndex = 0;
            matched = elementAttrRegExp.test(elem.data);
            if (matched) {
                var dest = void 0;
                if (!prevNode || prevNode.nodeType != Node.ELEMENT_NODE) {
                    /*if (prevNode.nodeType == Node.TEXT_NODE && prevNode.textContent.trim().length == 0) {
                        if (prevNode.previousSibling
                            && prevNode.previousSibling.nodeType == Node.ELEMENT_NODE
                        ) {
                            dest = prevNode.previousSibling as HTMLElement;
                        } else {
                            dest = node.parentElement;
                        }
                    } else {
                        dest = node.parentElement;
                    }*/
                    dest = node.parentElement;
                }
                else {
                    dest = prevNode;
                }
                addAttributesInElement(dest, elem.data.substr(elementAttrRegExp.lastIndex));
            }
        }
        if (node.hasChildNodes()) {
            addAttributes(topmostElem, node.firstChild, null);
        }
        var next = node.nextSibling;
        while (next !== null) {
            if (next.nodeType != Node.TEXT_NODE)
                addAttributes(topmostElem, next, node);
            node = next;
            next = next.nextSibling;
        }
    }
    var userAgent = window.navigator.userAgent.toLowerCase();
    var isIE = (userAgent.indexOf('msie') != -1) || (userAgent.indexOf('trident') != -1);
    var isEdge = userAgent.indexOf('edge') != -1;
    var isChrome = !isEdge && userAgent.indexOf('chrome') != -1;
    var isSafari = !isEdge && !isChrome && userAgent.indexOf('safari') != -1;
    var isFirefox = userAgent.indexOf('firefox') != -1;
    var isOpera = userAgent.indexOf('opera') != -1;
    var renderer = new marked.Renderer();
    renderer.code = function (code, language) {
        var table = document.createElement('table');
        var tr = document.createElement('tr');
        var lineNums = document.createElement('td');
        var lineNumsContainer = document.createElement('pre');
        var codeElem = document.createElement('td');
        var lineCount = code.split('\n').length;
        lineNumsContainer.classList.add('qpresent-line-number-container');
        for (var i = 0; i < lineCount; ++i) {
            lineNumsContainer.innerHTML += '<span class="qpresent-line-number"></span>\n';
        }
        lineNums.appendChild(lineNumsContainer);
        codeElem.classList.add('qpresent-code-container');
        codeElem.innerHTML = '<pre><code class="hljs">' + hljs.highlightAuto(code).value + '</code></pre>';
        tr.appendChild(lineNums);
        tr.appendChild(codeElem);
        table.appendChild(tr);
        table.classList.add('qpresent-code-table');
        return table.outerHTML;
    };
    marked.setOptions({
        renderer: renderer
    });
    var Manager = (function () {
        function Manager(elem, content, options) {
            if (options === void 0) { options = defaultOption; }
            var _this = this;
            options = Object.assign(QPresentOption["default"](), options);
            this.element = elem;
            this.pages = [];
            this.pageSize = [options.pageWidth, options.pageHeight];
            var pageDelim = new RegExp(options.pageDelimiter, 'm');
            var colDelim = new RegExp("((?:\r|\n|\u2028|\u2029|.)*?)" + options.columnDelimiter + "((?:\r|\n|\u2028|\u2029|.)*?)" + options.columnDelimiter + "((?:\r|\n|\u2028|\u2029|.)*?)" + options.columnDelimiter, 'mg');
            var blockDelim = new RegExp("((?:\r|\n|\u2028|\u2029|.)*?)" + options.blockDelimiter + "((?:\r|\n|\u2028|\u2029|.)*?)" + options.blockDelimiter + "((?:\r|\n|\u2028|\u2029|.)*?)" + options.blockDelimiter, 'mg');
            var pages = content.split(pageDelim);
            pages.forEach(function (pageContent, index) {
                var page = newPage();
                page.outerContainerElem.id = 'qpresent-page-' + index;
                page.pageContentElem.innerHTML = makePageContent(pageContent, colDelim, blockDelim);
                page.pageElem.appendChild(makePageNumber(index + 1, pages.length));
                page.pageElem.style.width = options.pageWidth + "px";
                page.pageElem.style.height = options.pageHeight + "px";
                renderMathInElement(page.pageElem, {
                    delimiters: options.mathDelimiter,
                    ignoredTags: []
                });
                Array.prototype.forEach.call(page.pageElem.getElementsByClassName('block-content'), function (e) {
                    e.innerHTML = marked(e.innerHTML);
                });
                addAttributes(page.pageContentElem, page.pageContentElem.firstChild, null);
                _this.element.appendChild(page.outerContainerElem);
                _this.pages.push(page);
            });
            this.overlayElem = document.createElement('div');
            this.overlayElem.classList.add('qpresent-overlay');
            this.buttonContainer = makeNavigationButtons();
            this.overlayElem.appendChild(this.buttonContainer);
            this.element.appendChild(this.overlayElem);
            var prevButton = this.buttonContainer.getElementsByClassName('qpresent-prev-button')[0];
            var nextButton = this.buttonContainer.getElementsByClassName('qpresent-next-button')[0];
            prevButton.value = 'prev';
            nextButton.value = 'next';
            prevButton.addEventListener('click', function (e) { return _this.prevPage(); });
            nextButton.addEventListener('click', function (e) { return _this.nextPage(); });
            this.currentPage = 0;
            setTimeout(function () {
                for (var _i = 0, _a = _this.pages; _i < _a.length; _i++) {
                    var p = _a[_i];
                    p.outerContainerElem.style.display = 'none';
                }
                _this.onResize();
                _this.jumpTo(0);
            }, 1);
        }
        Manager.prototype.jumpTo = function (pageIndex) {
            this.pages[this.currentPage].outerContainerElem.style.display = 'none';
            this.pages[pageIndex].outerContainerElem.style.display = 'block';
            this.currentPage = pageIndex;
            this.resizeCurrentPage();
        };
        Manager.prototype.nextPage = function () {
            if (this.currentPage + 1 < this.pages.length) {
                this.jumpTo(this.currentPage + 1);
            }
        };
        Manager.prototype.prevPage = function () {
            if (this.currentPage > 0) {
                this.jumpTo(this.currentPage - 1);
            }
        };
        Manager.prototype.requestFullscreen = function () {
            var element = document.documentElement;
            var method = element.requestFullscreen ||
                element.webkitRequestFullScreen ||
                element.webkitRequestFullscreen ||
                element.mozRequestFullScreen;
            if (method) {
                method.call(element);
            }
        };
        Manager.prototype.exitFullscreen = function () {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                var method = document.exitFullscreen ||
                    document.webkitExitFullscreen ||
                    document.mozCancelFullScreen;
                if (method) {
                    method.call(document);
                }
            }
        };
        Manager.prototype.onResize = function () {
            var w = document.documentElement.clientWidth;
            var h = document.documentElement.clientHeight;
            if (w / h > this.pageSize[0] / this.pageSize[1]) {
                this.zoomRate = h / this.pageSize[1];
            }
            else {
                this.zoomRate = w / this.pageSize[0];
            }
            this.resizeCurrentPage();
        };
        Manager.prototype.resizePage = function (pageIndex) {
            var r = this.zoomRate;
            var w = this.pageSize[0] * r;
            var h = this.pageSize[1] * r;
            this.pages[pageIndex].pageElem.style.transform = "scale(" + r + ", " + r + ")";
            this.pages[pageIndex].innerContainerElem.style.width = w + "px";
            this.pages[pageIndex].innerContainerElem.style.height = h + "px";
            this.pages[pageIndex].outerContainerElem.style.width = w + "px";
            this.pages[pageIndex].outerContainerElem.style.height = h + "px";
            this.buttonContainer.style.transform = "scale(" + r + ", " + r + ")";
            this.overlayElem.style.width = w + "px";
            this.overlayElem.style.height = h + "px";
        };
        Manager.prototype.resizeCurrentPage = function () {
            this.resizePage(this.currentPage);
        };
        Manager.prototype.beforePrint = function () {
            this.zoomRate = 1;
            for (var i = 0; i < this.pages.length; ++i) {
                this.pages[i].outerContainerElem.style.display = 'block';
                this.resizePage(i);
            }
        };
        Manager.prototype.afterPrint = function () {
            for (var _i = 0, _a = this.pages; _i < _a.length; _i++) {
                var p = _a[_i];
                p.outerContainerElem.style.display = 'none';
            }
            this.jumpTo(this.currentPage);
            this.onResize();
        };
        Manager.prototype.registerPrintListener = function () {
            var _this = this;
            if (isChrome) {
                window.matchMedia('print').addListener(function (m) {
                    if (m.matches) {
                        _this.beforePrint();
                        setTimeout(function () { return _this.afterPrint(); }, 0);
                    }
                });
            }
            else if (window.onbeforeprint !== undefined) {
                window.onbeforeprint = function (e) { return _this.beforePrint(); };
                window.onafterprint = function (e) { return _this.afterPrint(); };
            }
            else {
                window.matchMedia('print').addListener(function (m) {
                    if (m.matches) {
                        _this.beforePrint();
                    }
                    else {
                        _this.afterPrint();
                    }
                });
            }
        };
        return Manager;
    }());
    QPresent.Manager = Manager;
})(QPresent || (QPresent = {}));
