const { ipcRenderer, remote } = require('electron')
const isDev = require('electron-is-dev');
var tabID = 0;
const { Menu, MenuItem } = remote
const path = require('path')
fs = require('fs')
var lastid;
var shown = true;
const online = window.navigator.onLine;
search = $('#search')
doc = $(document)
content = $("#content")
var tabContainer = []
var overlayup = false
var currentTabID = 0;
var currentURL = ''
var currentScroll = 0;
var lastScroll = 0;

//Navbar scroll detection
doc.on("mousemove", function (event) {
    if (event.pageY > $(window).height() - 40 && shown == false) {
        $("#mynavbar").slideDown();
        shown = true;
    }
    else if (event.pageY <= $(window).height() - 40 && shown == true) {
        $("#mynavbar").slideUp();
        shown = false;
    }
});
//Initialize a page - Called on ready and loadTab.
var init_page = function () {
    var webview = document.querySelector('#webview')
    var contextMenu = require('electron-context-menu')({
        window: webview,
    });
    const indicator = $('.indicator')
    webview.addEventListener('page-title-updated', function () {
        $(".val").fadeOut('fast', function () {
            $('#val1').text(webview.getURL())
            $('#val2').text('')
            $(".val").fadeIn('fast', function () {
            });
        });
        
        //$('#val').css('width', '50%')

        csspath = path.resolve(__dirname, 'scrollbar.css')
        css = fs.readFileSync(csspath, 'utf8')
        webview.insertCSS(css);
        if (lastid) {
            $("option").each(function (index, obj) {
                if ($(obj).attr('value') == lastid) {
                    $(obj).remove()
                }
            })
        }
    })
    webview.addEventListener('did-fail-load', failload)
    webview.addEventListener('did-get-response-details', function (response) {
        
    })
    /**
     * Handles link override:
     * If a user clicks a link, the preload script interrupts it and sends the url here
     * Allows injecting headers and programmatic control for every navigation.
     */
    webview.addEventListener('ipc-message', function (event) {
        if (event.channel == "navAttempt") {
            clickedURL = event.args[0]
            console.log('clicked hyperlink '+clickedURL)
            if (clickedURL) { loadURL(clickedURL) }
        }
        if (event.channel == "scrollY") {
            currentScroll = event.args[0]
            console.log(currentScroll)
        }
    })
}

doc.ready(function () {
    $('.overlay').fadeOut(0)
    
    
    var updatePoll = setInterval(checkUpdateStatus,500)
    function checkUpdateStatus() {
        var updateStatus = ipcRenderer.sendSync('synchronous-message', 'updateStatus')
        console.log(updateStatus)
        if (updateStatus.code == -1) { $('#loadOverlay').remove(); clearInterval(updatePoll) }
        $('#loadText').text(updateStatus.status)
    }
    
    arg = remote.getGlobal('sharedObj').args[(isDev ? 2 : 1)]
    console.time("initpage");
    init_page()
    console.timeEnd("initpage");
    doc.bind('mousewheel', function (e) {
        if (e.originalEvent.wheelDelta / 120 > 0 && $('#windowbar').css('top')=='-25px') {
            newH = $(window).height() - 25
            $('#windowbar').animate({ top: 0 });
            content.animate({
                top: '24px',
                height: newH
            })
        }
        else if (e.originalEvent.wheelDelta / 120 <= 0 && $('#windowbar').css('top') == '0px') {
            $('#windowbar').animate({ top: -25 });
            content.animate({
                top: '0',
                height: "100%"
            })
            
        }
    });
    window.setTimeout(checkArgs, 100);
})
var checkArgs = function () {
    if (arg) { //If the program has started with an argument (file to load)
        if (!fs.existsSync(arg)) { //If file does not exist, it's either a URL we will try to load, or we redirect to DNE page.
            if (arg.startsWith('http')) {
                loadURL(arg)
            }
            else {
                loadURL('file:\\\\' + __dirname + '\\pages\\DNE.html')
            }
            return;
        }
        ext = path.extname(arg)
        if (ext == '.url') {
            fs.readFile(arg, 'utf8', function (err, data) {
                let url = data.split('URL=')[1]
                loadURL(url)
            })
        }
        else if (ext == '.html') {
            let url = path.resolve(arg);
            loadURL(url)
        }
    }
}
$('#close').on('click', function () {
    ipcRenderer.sendSync('synchronous-message', 'close')
})
$('#min').on('click', function () {
    ipcRenderer.sendSync('synchronous-message', 'min')
})
$('#max').on('click', function () {
    ipcRenderer.sendSync('synchronous-message', 'max')
})
$('#back').on('click', function () {
    webview.goBack()
})
$('#forward').on('click', function () {
    webview.goForward()
})

$('#search').keypress(function (event) {
    //input = $('#search').val();
    //console.log(input)
    //$('#search').attr("placeholder", "-------"+input);
    event.preventDefault();
    
    if (event.key.length == 1) {
        $('#val1').text($('#val1').text() + event.key)
        updateSearchText()
    }
    else {
        console.log(event.key)
    }
});
$('#search').keydown(function (event) {
    //console.log(event.key)
    
    if (event.key == 'ArrowRight') {
        console.log(v1.text())
        console.log(v2.text())
        v1 = $('#val1')
        v2 = $('#val2')
        v1.text(v1.text() + v2.text().charAt(0))
        v2.text(v2.text().slice(1))
    }
    if (event.key == 'ArrowLeft') {
        v1 = $('#val1')
        v2 = $('#val2')
        v2.text(v1.text().charAt(v1.text().length - 1) + v2.text())
        v1.text(v1.text().slice(0, -1))
    }
    if (event.key == 'ArrowUp') {
        $('#searchMatch').css('color', 'green');
        $('#search').css('color', 'grey');
    }
    if (event.key == 'ArrowDown') {
        $('#searchMatch').css('color', 'rgb(20,255,30)');
        $('#search').css('color', 'white');
    }
    if (event.key == 'Backspace') {
        if (window.getSelection && !window.getSelection().toString() == '') {
            
            text = window.getSelection().toString();
            if (text.substr(-1) == '_') {
                text = text.substring(0, text.length - 1);
            }
            if (text.substr(0,1) == '>') {
                text = text.substr(1)
            }
            
            console.log(text)
            //$('#val1').text($('#val').text().replace(text, ''))
        }
        else {
            $('#val1').text($('#val1').text().slice(0, -1))
        }
        updateSearchText()
        
   
    }
    if (event.key == 'Enter') {
        $(".val").fadeOut('fast', function () {
            $("#val1").text('Loading')
            $("#val2").text('')
            $(".val").fadeIn('fast', function () {
            });
        });
        let query = getSearchQuery()
        if (query) { loadURL(match(query))}
        
    }
})
$('#search').attr('tabindex', -1).focus( function () {
    //console.log('focus')
    $(this).addClass('searchfocus');
    if ($(this).text() == '') {
        $(this).append('<span style="color:white;-webkit-user-select: none;">></span>')
        $(this).append('<span class="val" id="val1"></span>')
        $(this).append('<span style="color:white;-webkit-user-select: none;" id="cursor">_</span>')
        $(this).append('<span class="val" id="val2"></span>')
        $('.val').on('click', function () {
            $('.val').select();
            console.log('select')
        })
    }
    
    var cursor = $('#cursor')
    setInterval(function () {
        if (cursor.css('visibility') == 'hidden') {
            cursor.css('visibility', 'visible');
        } else {
            cursor.css('visibility', 'hidden');
        }
    }, 500);
});
const updateSearchText = function () {
    $('#searchMatch').text(match($('#val1').text() + $('#val2').text()))
}
$('#search').focusout(function () {
    $(this).removeClass('searchfocus');
});
const getSearchQuery = function () {
    return $('#val1').text() + $('#val2').text()
}
/**
 * Load a URL in webview.
*/
var loadURL = function (url,scoll=0) { //Defined as an external function for scoping with webview.
    lastScroll = currentScroll;
    console.log('Loading url '+url)
    webview.loadURL(url, {
        extraHeaders:"DNT:1"
    })
    webview.send('scrollTo',scroll)
}
/**
 * Error handling script.
 */
var failload = function (error) {
    if (error.errorCode == -105) {
        console.log('loading')
        webview.loadURL('http://google.com/search?q=' + encodeURI(val))
    }
    if (!online) {
        webview.loadURL('file://pages/offline.html')
    }
}
/**
 * @param {tab} tabToLoad - The tab we are loading. 
 */
var loadTab = function (tabToLoad) {
    for (let i = 0;i<tabContainer.length; i++) {
        if (tabContainer[i].id === tabToLoad.id) {
            currentTabID = i;
            break;
        }
    }
    $('.awebview').each(function (index, elem) {
        $(elem).css('visibility', 'hidden')
        $(elem).attr("id", "hiddentab");
        //console.log('Found webview '+$(elem).attr('tabID'))
        if ($(elem).attr('tabID') == tabToLoad.id) {
            $(elem).css('visibility', 'visible')
            $(elem).attr("id", "webview");
            return;
        }
    })
    init_page()
    $('.overlay').fadeOut('fast')
    overlayup = false;
}
doc.keydown(function (e) {
    //console.log(e.keyCode)
    if (e.keyCode === 123) {
        webview.openDevTools()
        remote.getCurrentWindow().toggleDevTools();
    }
        
    if (e.keyCode === 116) {
        webview.reload();
    }
    if (e.keyCode == 27) {
        webview.sendInputEvent({ type: 'keyDown', keyCode :'Esc'})
    }
})

class tab{
    /**
     * @param {string} URL - URL associated with tab. Currently not updating correctly, but not necessary
     * @param {number} width - Width of the image thumbnal
     * @param {number} height - Height of the image thumbnal
     * @param {string} imgsrc - Path of the actual image associated with the tab
     * @param {number} id - ID of the tab. Starting at 0 and incrememnting on creation
     */
    constructor(URL, width, height, imgsrc, id) {
        this.URL = URL;
        this.width = width;
        this.height = height;
        this.imgsrc = imgsrc;
        this.id = id;
        console.log('Constructor!')
        this.currwebview = '<webview id="webview" preload="src/preload.js" tabID="'+this.id+'" style="visibility:visible" class="awebview" src="'+URL+'"></webview>'
    }
    /**
     * Function to convert tab into thumbnail HTML
     * @returns {string} HTML string representing a thumbnail for tab display
     */
    getThumbnail() {
        return '<div class="tabContainer">\
        <i class="fa fa-times closeTab" id="closeTab' + this.id +'" aria-hidden="true"></i>\
        <img class="tabPreview" src="' + this.imgsrc + '"id="tab' + this.id + '" style ="width:' + this.width + ';height:' + this.height + '">\
        </img></div>'
    }
    remove(container) {
        $('.webview').each(function (index, elem) {
            if ($(elem).attr('tabID') == this.id.toString()) {
                console.log('removing webview')
                $(elem).remove()
            }
        })
        
        if (container.length == 1 && container[0].id == this.id) {
            for (let i = 0; i < container.length; i++) {
                if (container[i].id == this.id) {
                    container.splice(i,1)
                    return;
                }
            }
            tabID += 1;
            let newtab = new tab('file://pages/homepage.html', this.width, this.height, 'null', tabID)
            container.push(newtab)
            $('#content').prepend(newtab.currwebview)
            loadTab(newtab)
            console.log('Removed only tab.')
        }
        for (let i = 0; i < container.length; i++) {
            if (container[i].id == this.id) {
                console.log(container)
                container.splice(i,1)
                console.log(container)
                let nextTab = (container[i-1] ? i-1:i )
                console.log('about to load next tab: '+nextTab)
                loadTab(container[nextTab])
                return;
            }
        }
        
    }
}

doc.keyup(function (e) {
    if (document.readyState !== 'complete'){return}
    if (e.keyCode == 18 && !overlayup) {
        $('.tabs').empty();
        img = webview.capturePage(function (image) {
            let imgsrc = image.toDataURL()
            let imgAR = image.getAspectRatio()
            let resizedW = (200 * imgAR).toString() + "px"
            let resiedH = "200px"
            if (tabContainer.length == 0) {
                tabContainer[0] = new tab(webview.getURL(), resizedW, resiedH, imgsrc, tabID)
            }
            tabContainer[currentTabID].imgsrc = imgsrc;
            tabContainer[currentTabID].width = resizedW;
            for (let i = 0; i < tabContainer.length; i++) {
                $('.tabs').append(tabContainer[i].getThumbnail())
            }
            $('.tabs').append('<div class="tabContainer"><div class="tabPreview" id="newTab" \
            style ="width:' + resizedW + ';height:' + resiedH + ';background-color:rgba(0,0,0,0.5)">\
            <i class="fa fa-plus-square-o fa-4x" style="position:relative;top: 50%;transform: translateY(-50%);" aria-hidden="true"></i>\
            </div></div>')
            $('.tabPreview').on('click', function () {
                console.log('tabPreview clicked')
                if ($(this).attr('id') == 'newTab') {
                    tabID += 1;
                    newtab = new tab('pages/homepage.html', $(this).width(), $(this).height(), $(this).attr('src'), tabID)
                    tabContainer.push(newtab)
                    $('#content').prepend(newtab.currwebview)
                    loadTab(newtab)
                }
                else {
                    console.log(tabContainer)
                    for (let i = 0; i < tabContainer.length; i++) {
                        peekTab = tabContainer[i]
                        if ('tab' + peekTab.id == $(this).attr('id')) {
                            loadTab(peekTab)
                        }
                    }
                }
            })
            $('.closeTab').on('click', function () {
                let myID = $(this).attr('id').split('closeTab')[1]
                $('#tab' + myID).fadeOut('fast', function () {
                    for (let i = 0; i < tabContainer.length; i++) {
                        let peekTab = tabContainer[i]
                        if (peekTab.id == myID) {  
                            peekTab.remove(tabContainer)
                        }
                    }
                    $(this).remove()
                })
            })
        })
        $('.overlay').fadeIn('fast')
        overlayup = true;
    }
    else if (e.keyCode == 18 && overlayup) {
        $('.overlay').fadeOut('fast')
        overlayup = false;
    }
})
