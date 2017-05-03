function makeBlock(e, callback = (c: string) => c){
    var colors = {
        'default': {
            'title': {
                'background': 'rgba(140, 140, 255, 1)',
                'foreground': 'white'
            },
            'content': {
                'background': 'rgba(240, 240, 255, 1)',
                'foreground': 'black'
            }
        },
        'alert': {
            'title':{
                'background': 'rgba(255, 100, 100, 1)',
                'foreground': 'white'
            },
            'content': {
                'background': 'rgba(255, 235, 235, 1)',
                'foreground': 'black'
            }
        },
        'example': {
            'title': {
                'background': 'rgba(100, 180, 100, 1)',
                'foreground': 'white'
            },
            'content': {
                'background': 'rgba(230, 255, 230, 1)',
                'foreground': 'black'
            }
        }
    };

    function setColor(elm, elmType, blockType){
        var bgColor = colors.default[elmType].background;
        var fgColor = colors.default[elmType].foreground;

        if(blockType != null){
            if(blockType in colors){
                var color = colors[blockType];
                bgColor = color[elmType].background;
                fgColor = color[elmType].foreground;
            }
        }

        var blockBackground = elm.getAttribute('block-background');

        if(blockBackground){
            bgColor = blockBackground;
        }

        var blockForeground = elm.getAttribute('block-foreground');

        if(blockForeground){
            fgColor = blockForeground;
        }

        elm.style.backgroundColor = bgColor;
        elm.style.color = fgColor;
    }

    Array.prototype.forEach.call(e.getElementsByClassName('block'), (e, i, a) => {
        var title = e.getElementsByClassName('block-title');
        var blockType = e.getAttribute('block-type');

        if(title.length){
            var titleElm = title.item(0);

            setColor(titleElm, 'title', blockType);

            titleElm.style.paddingLeft = '10px';
            titleElm.style.paddingRight = '10px';
            titleElm.style.paddingTop = '5px';
            titleElm.style.paddingBottom = '5px';
            titleElm.style.borderRadius = '15px 15px 0px 0px';
        }

        var content = e.getElementsByClassName('block-content').item(0);

        setColor(content, 'content', blockType);

        content.innerHTML = callback(content.innerHTML);
        content.style.padding = '10px';

        if(title.length){
            content.style.borderRadius = '0px 0px 15px 15px';
        }else{
            content.style.borderRadius = '15px';
        }

        e.style.borderRadius = '15px';
        e.style.boxShadow = '3px 3px 7px rgba(128, 128, 128, 0.5)';
    });
}