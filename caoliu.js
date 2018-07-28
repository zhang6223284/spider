/*
* @Author: user
* @Date:   2018-04-28 19:34:50
* @Last Modified by:   user
* @Last Modified time: 2018-04-30 21:35:26
*/
var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var iconv=require('iconv-lite');
var async= require('async');
var i = 0;
  let startPage=2;//从哪一页开始爬
  let page=startPage;
  let endPage=3;//爬到哪一页
  let searchText='';//爬取的关键字，默认全部爬取，根据自己需要
  //初始url 
  var url = {
    hostname: '1024liuyouba.tk',
    path: '/thread0806.php?fid=16'+'&search=&page='+startPage,
    headers: {
      'Content-Type': 'text/html',
    //没有这个字段的话访问不了
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36',  
  }};
//存储首页url
urlList=[];
//封装了一层函数
function fetchPage() { 
  async.mapLimit(urlList,5,function(x,callback){
    try{
     

         //采用http模块向服务器发起一次get请求      
     http.get(x, function (res) {     
      console.time('  耗时');
        var html = '';        //用来存储请求网页的整个html内容
        res.setEncoding('binary');     
     //监听data事件，每次取一块数据
     res.on('data', function (chunk) {   
      html += chunk;
    });
     //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
     res.on('end', function () {
      var buf=new Buffer(html,'binary');
      var str=iconv.decode(buf,'GBK');
         var $ = cheerio.load(str); //采用cheerio模块解析html
         var news_item = {
          //获取文章的标题
          title: $('h4').text().trim(),
        //i是用来判断获取了多少篇文章
        i: i = i + 1,     
      };
  console.log(news_item);  
  console.timeEnd("  耗时");   //打印信息
  var news_title = $('h4').text().trim();

  savedContent($,news_title);  //存储每篇文章的内容及文章标题

  savedImg($,news_title);    //存储每篇文章的图片及图片标题

});

   }).on('error', function (err) {
    console.log(err);
  });

   callback(null,x);
 }
 catch(err){
  console.log(err);
 }
}, function (err, result) {
  console.log('final:');
  console.log(result);
})

 

}
//首先存储要访问界面的url
function getUrl(x){
  http.get(x,function(res){
    var html = ''; 
    res.setEncoding('binary');
    res.on('data', function (chunk) {   
      html += chunk;
    });
    res.on('end', function () {
      var buf=new Buffer(html,'binary');
      var str=iconv.decode(buf,'GBK');
          var $ = cheerio.load(str); //采用cheerio模块解析html                
          $('tr.tr3 td.tal h3 a').each(function(){
            var search=$(this).text();
            if(search.indexOf(searchText)>=0){
              var nextLink="http://cl.5fy.xyz/" + $(this).attr('href');
            str1 = nextLink.split('-');  //去除掉url后面的中文
            str = encodeURI(str1[0]); 
            urlList.push(str); }
          })
          page++;
          if(page<endPage){
            //存储下一页url
            x.path='/thread0806.php?fid=16'+'&search=&page='+page,
            getUrl(x);
          }else if(urlList.length!=0){           
            fetchPage();
          }else{
            console.log('未查询到关键字！');
          }
        })
  }).on('error', function (err) {
    console.log(err);
  });

}

       //该函数的作用：在本地存储所爬取的文本内容资源
       function savedContent($, news_title) {
        $("div.t2[style] .tpc_content.do_not_catch").each(function (index, item) {
          var x = $(this).text();       
          x = x + '\n';   
//将新闻文本内容一段一段添加到/data文件夹下，并用新闻的标题来命名文件
fs.appendFile('./data/' + news_title + '.txt', x, 'utf-8', function (err) {
  if (err) {
    console.log(err);
  }
});

})
      }
//该函数的作用：在本地存储所爬取到的图片资源
function savedImg($,news_title) {
  //创建文件夹
  fs.mkdir('./image/'+news_title, function (err) {
    if(err){console.log(err)}
  });
  $('.tpc_content.do_not_catch input[src]').each(function (index, item) {
        var img_title = index;//给每张图片附加一个编号
        var img_filename = img_title + '.jpg';
        var img_src = $(this).attr('src'); //获取图片的url
//采用request模块，向服务器发起一次请求，获取图片资源
request.head(img_src,function(err,res,body){
  if(err){
    console.log(err);
  }
});
setTimeout(function(){
  request({uri: img_src,encoding: 'binary'}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile('./image/'+news_title+'/' + img_filename, body, 'binary', function (err) {
        if(err){console.log(err)}
      });
    }
  })
});
})
}
getUrl(url);      //主程序开始运行