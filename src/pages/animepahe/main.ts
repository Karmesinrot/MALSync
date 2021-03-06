/*By Deterio*/
import { pageInterface } from "./../pageInterface";

export const animepahe: pageInterface = {
  name: 'animepahe',
  domain: 'https://animepahe.com',
  type: 'anime',
  isSyncPage: function(url){
    if(url.split('/')[3] !== 'play'){
      return false;
    }else{
      return true;
    }
  },
  sync:{
    getTitle: function(url){return j.$('.theatre-info h1 a').first().text()},
    getIdentifier: function(url){return utils.urlPart(url, 4);},
    getOverviewUrl: function(url){
      return animepahe.domain+'/anime/'+animepahe.sync.getIdentifier(url);
    },
    getEpisode: function(url){
      return j.$('.theatre-info h1')[0].childNodes[2].textContent.replace(/[^0-9\.]+/g, '')
    },
    nextEpUrl: function(url){
      var nextEp = j.$('.sequel a').first().attr('href');
      if(!nextEp) return nextEp;
      return animepahe.domain + nextEp;
    },
    uiSelector: function(selector){selector.insertAfter(j.$(".anime-season"));},
  },
  overview:{
    getTitle: function(url){return utils.getBaseText(j.$('.title-wrapper h1').first()).trim();},
    getIdentifier: function(url){return utils.urlPart(url, 4);},
    uiSelector: function(selector){
      selector.insertAfter(j.$( ".anime-detail"));
    },
    getMalUrl: function(provider) {
      var url = j.$('a[href^="https://myanimelist.net/anime/"]').not("#malRating").first().attr('href');
      if(url) return url;
      if(provider === 'ANILIST'){
        url = j.$('a[href^="https://anilist.co/anime/"]').not("#malRating").first().attr('href');
        if(url) return url;
      }
      if(provider === 'KITSU'){
        url = j.$('a[href^="https://kitsu.io/anime/"]').not("#malRating").first().attr('href');
        if(url) return url;
      }
      return false;
    },
    list:{
      offsetHandler: false,
      elementsSelector: function(){return j.$('.episode-list .episode');},
      elementUrl: function(selector){return animepahe.domain + selector.find("a").first().attr('href');},
      elementEp: function(selector){return selector.find('.episode-number').first().text().replace(selector.find('.episode-number > *').text() ,'');},
    }
  },
  init(page){
    if(document.title == "Just a moment..."){
      con.log("loading");
      page.cdn();
      return;
    }
    api.storage.addStyle(require('!to-string-loader!css-loader!less-loader!./style.less').toString());
    if (!animepahe.isSyncPage(page.url)){
      utils.waitUntilTrue(function(){return animepahe.overview!.list!.elementsSelector!()}, function(){
        page.handlePage();
      });
    } else{
      $(document).ready(function(){
        page.handlePage();
      });
    }
  }
};
