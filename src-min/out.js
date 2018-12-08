const{ipcRenderer:ipcRenderer,remote:remote}=require("electron");const isDev=require("electron-is-dev");var tabID=0;const{Menu:Menu,MenuItem:MenuItem}=remote;const path=require("path");fs=require("fs");var lastid;var shown=true;const online=window.navigator.onLine;search=$("#search");doc=$(document);content=$("#content");var tabContainer=[];var overlayup=false;var currentTabID=0;var currentURL="";var currentScroll=0;var lastScroll=0;var init_page=function(){var webview=document.querySelector("#webview");var contextMenu=require("electron-context-menu")({window:webview});const indicator=$(".indicator");webview.addEventListener("page-title-updated",function(){$("#search").val(webview.getURL());csspath=path.resolve(__dirname,"scrollbar.css");css=fs.readFileSync(csspath,"utf8");webview.insertCSS(css);if(lastid){$("option").each(function(index,obj){if($(obj).attr("value")==lastid){$(obj).remove()}})}});webview.addEventListener("did-fail-load",failload);webview.addEventListener("did-get-response-details",function(response){});webview.addEventListener("ipc-message",function(event){if(event.channel=="navAttempt"){clickedURL=event.args[0];if(clickedURL){loadURL(clickedURL)}}if(event.channel=="scrollY"){currentScroll=event.args[0]}})};doc.ready(function(){$(".overlay").fadeOut(0);loadBookmarks();arg=remote.getGlobal("sharedObj").args[isDev?2:1];init_page();lastHeight=$(window).height();$(window).resize(function(){if($(this).height()==lastHeight){return}$("#top").css("top","0px");$("#bookmarks").css("top","0px");lastHeight=$(window).height()});doc.bind("mousewheel",function(e){if(e.originalEvent.wheelDelta/120>0&&$("#top").css("top")=="-25px"){newH=$(window).height()-25;$("#top").animate({top:0});$("#bookmarks").animate({top:25});content.animate({top:"50px",height:newH})}else if(e.originalEvent.wheelDelta/120<=0&&$("#top").css("top")=="0px"){$("#top").animate({top:-25});$("#bookmarks").animate({top:0});content.animate({top:"25px",height:"100%"})}});window.setTimeout(checkArgs,100)});var checkArgs=function(){if(arg){if(!fs.existsSync(arg)){if(arg.startsWith("http")){loadURL(arg)}else{loadURL("file:\\\\"+__dirname+"\\pages\\DNE.html")}return}ext=path.extname(arg);if(ext==".url"){fs.readFile(arg,"utf8",function(err,data){let url=data.split("URL=")[1];loadURL(url)})}else if(ext==".html"){let url=path.resolve(arg);loadURL(url)}}};var loadURL=function(url,scoll=0){lastScroll=currentScroll;$("#search").focusout();webview.loadURL(url,{extraHeaders:"DNT:1\n"});webview.send("scrollTo",scroll)};var failload=function(error){if(error.errorCode==-105){webview.loadURL("http://google.com/search?q="+encodeURI(val))}if(!online){webview.loadURL("file://pages/offline.html")}};const tld=require("tldjs");const match=function(query){splitquery=query.split(".");if(query.startsWith("r/")||query.startsWith("/r/")){return"https://reddit.com/r/"+query.split("r/")[1]}if(query.startsWith("file://")){return query}if(query.startsWith(":://")){return"Run Command: "+query.split(":://")[1]}if(query.startsWith("http://")||query.startsWith("https://")){return query}if(query.startsWith("www.")){return"http://"+query}if(splitquery.length==1){return"http://google.com/search?q="+encodeURI(query)}domain=splitquery[splitquery.length-2]+"."+splitquery[splitquery.length-1];if(tld.isValid(domain)){return"http://"+query}else{return query}};const getDomain=function(query){return query.split("://")[1].split("/")[0]};doc.on("mousemove",function(event){if(event.pageY>$(window).height()-40&&shown==false){$("#mynavbar").slideDown();shown=true}else if(event.pageY<=$(window).height()-40&&shown==true&&!$("#search").hasClass("searchfocus")){$("#mynavbar").slideUp();shown=false}});$("#close").on("click",function(){ipcRenderer.sendSync("synchronous-message","close")});$("#min").on("click",function(){remote.getCurrentWindow().minimize()});$("#max").on("click",function(){switch(remote.getCurrentWindow().isMaximized()){case true:{remote.getCurrentWindow().unmaximize();break};case false:{remote.getCurrentWindow().maximize();break}}});$("#back").on("click",function(){webview.goBack()});$("#forward").on("click",function(){webview.goForward()});$("#bkmks").on("click",function(){$("#bookmarkPopup").css("display","flex").hide().fadeIn()});$("#closePopup").on("click",function(){$("#bookmarkPopup").fadeOut()});$("#addBookmark").on("click",function(){const name=$("#bookmarkName").val();const url=$("#bookmarkUrl").val();saveBookmark(name,url)});$("#removeBookmark").on("click",function(){try{const name=$("#bookmarkName").val();removeBookmark(name)}catch(e){alert(`No bookmark named ${name}`)}});$("#export").on("click",function(){exportBookmarks()});$("#import").on("click",function(){importBookmarks()});$("#dev").on("click",()=>webview.openDevTools());doc.keydown(function(e){if(e.keyCode===123){remote.getCurrentWindow().toggleDevTools()}if(e.keyCode===116){webview.reload()}if(e.keyCode==27){webview.sendInputEvent({type:"keyDown",keyCode:"Esc"})}});doc.keyup(function(e){if(document.readyState!=="complete"){return}if(e.keyCode==18&&!overlayup){initializeTabs();$(".overlay").fadeIn("fast");overlayup=true}else if(e.keyCode==18&&overlayup){$(".overlay").fadeOut("fast");overlayup=false}});$("#search").keyup(function(event){updateSearchText();if(event.key=="Enter"){let query=getSearchQuery();if(query.startsWith(":://")){let command=query.split(":://")[1];console.log(command);if(Object.keys(commands).includes(command))commands[command]();else alert(`${command} is not a valid command`);return}if(query){$("#search").val("Loading!");loadURL(match(query))}}});const updateSearchText=function(){$("#searchMatch").text(match(getSearchQuery()))};$("#search").focus(function(){$(this).addClass("searchfocus")});$("#search").focusout(function(){$(this).removeClass("searchfocus")});const getSearchQuery=function(){return $("#search").val()};var loadTab=function(tabToLoad){for(let i=0;i<tabContainer.length;i++){if(tabContainer[i].id===tabToLoad.id){currentTabID=i;break}}$(".awebview").each(function(index,elem){$(elem).css("visibility","hidden");$(elem).attr("id","hiddentab");if($(elem).attr("tabID")==tabToLoad.id){$(elem).css("visibility","visible");$(elem).attr("id","webview");return}});init_page();$(".overlay").fadeOut("fast");overlayup=false};class tab{constructor(URL,width,height,imgsrc,id){this.URL=URL;this.width=width;this.height=height;this.imgsrc=imgsrc;this.id=id;this.currwebview='<webview id="webview" preload="src/preload.js" tabID="'+this.id+'" style="visibility:visible" class="awebview" src="'+URL+'"></webview>'}getThumbnail(){return'<div class="tabContainer">        <i class="fa fa-times closeTab" id="closeTab'+this.id+'" aria-hidden="true"></i>        <img class="tabPreview" src="'+this.imgsrc+'"id="tab'+this.id+'" style ="width:'+this.width+";height:"+this.height+'">        </img></div>'}remove(container){$(".webview").each(function(index,elem){if($(elem).attr("tabID")==this.id.toString()){$(elem).remove()}});if(container.length==1&&container[0].id==this.id){for(let i=0;i<container.length;i++){if(container[i].id==this.id){container.splice(i,1);return}}tabID+=1;let newtab=new tab("file://pages/homepage.html",this.width,this.height,"null",tabID);container.push(newtab);$("#content").prepend(newtab.currwebview);loadTab(newtab)}for(let i=0;i<container.length;i++){if(container[i].id==this.id){container.splice(i,1);let nextTab=container[i-1]?i-1:i;loadTab(container[nextTab]);return}}}}const initializeTabs=function(){$(".tabs").empty();img=webview.capturePage(function(image){let imgsrc=image.toDataURL();let imgAR=image.getAspectRatio();let resizedW=(200*imgAR).toString()+"px";let resiedH="200px";if(tabContainer.length==0){tabContainer[0]=new tab(webview.getURL(),resizedW,resiedH,imgsrc,tabID)}tabContainer[currentTabID].imgsrc=imgsrc;tabContainer[currentTabID].width=resizedW;for(let i=0;i<tabContainer.length;i++){$(".tabs").append(tabContainer[i].getThumbnail())}$(".tabs").append('<div class="tabContainer"><div class="tabPreview" id="newTab"             style ="width:'+resizedW+";height:"+resiedH+';background-color:rgba(0,0,0,0.5)">            <i class="fa fa-plus-square-o fa-4x" style="position:relative;top: 50%;transform: translateY(-50%);" aria-hidden="true"></i>            </div></div>');$(".tabPreview").on("click",function(){if($(this).attr("id")=="newTab"){tabID+=1;newtab=new tab("pages/homepage.html",$(this).width(),$(this).height(),$(this).attr("src"),tabID);tabContainer.push(newtab);$("#content").prepend(newtab.currwebview);loadTab(newtab)}else{for(let i=0;i<tabContainer.length;i++){peekTab=tabContainer[i];if("tab"+peekTab.id==$(this).attr("id")){loadTab(peekTab)}}}});$(".closeTab").on("click",function(){let myID=$(this).attr("id").split("closeTab")[1];$("#tab"+myID).fadeOut("fast",function(){for(let i=0;i<tabContainer.length;i++){let peekTab=tabContainer[i];if(peekTab.id==myID){peekTab.remove(tabContainer)}}$(this).remove()})})})};const commands={store:()=>{localStorage.setItem("lastname","Smith")}};const dialog=require("electron").remote.dialog;function saveBookmark(name,URL){let bookmarks=JSON.parse(localStorage.getItem("bookmarks"))||{};bookmarks[name]=URL;addBookmarkLink(name,URL);localStorage.setItem("bookmarks",JSON.stringify(bookmarks))}function removeBookmark(name){let bookmarks=JSON.parse(localStorage.getItem("bookmarks"))||{};delete bookmarks[name];removeBookmarkLink(name);localStorage.setItem("bookmarks",JSON.stringify(bookmarks))}function exportBookmarks(){let bookmarks=localStorage.getItem("bookmarks");let path=dialog.showSaveDialog({filters:[{name:"json",extensions:["json"]}]});fs.writeFile(path,bookmarks,"utf8",()=>alert(`Exported bookmarks to ${path}`))}function importBookmarks(){if(!confirm("WARNING: This will override existing bookmarks. Continue?"))return;let path=dialog.showOpenDialog({filters:[{name:"json",extensions:["json"]}]});fs.readFile(path[0],(err,data)=>{if(err)throw err;localStorage.setItem("bookmarks",data);loadBookmarks()})}function addBookmarkLink(name,URL){$("#bookmarks").append(`<a class="bookmark" id=${name} url=${URL}>${name}</a>`);$(".bookmark").click(function(){const url=$(this).attr("url");loadURL(match(url))})}function removeBookmarkLink(name){$(`#${name}`).remove()}function loadBookmarks(){let bookmarks=JSON.parse(localStorage.getItem("bookmarks"))||{};for(let[name,URL]of Object.entries(bookmarks)){addBookmarkLink(name,URL)}}