const https=require('https');
const fs=require('fs');
const request=require('request');
const async=require('async');
const cheerio = require('cheerio');
const nodejieba = require('nodejieba');
const startPage =0;//开始页
const endPage = 4;//结束页
const keyWord = "";//关键词
const keyWord2 = "前端";
let page=startPage;
let i=0;
//初始url
const url={	
    hostname: 'www.nowcoder.com',
    path: '/discuss?type=2&order=' + startPage,
    headers: {
      	'Content-Type': 'text/html',
    	'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36',  
  }
}
let urlList=[];//存储图片页面地址
//获取图片所在页面
function getUrl(url){
	//采用http模块向服务器发起一次get请求  
	https.get(url,function(res){
		var html='';
		//res.setEncoding('binary');
		//监听data事件，每次取一块数据
		res.on('data',function(chunk){
			html+=chunk;
		});
		res.on('end',function(){
			var $ = cheerio.load(html); //采用cheerio模块解析html

			$('li .discuss-main.clearfix').each(function(){
				var title=$(this).children().first().text();	            
	            if(title.indexOf(keyWord2)>=0){
		            var search=$(this).children().first().attr('href');
		            //console.log(search);
		            let nextLink = "https://www.nowcoder.com" + search;
		            urlList.push(nextLink);
				}
            })
			page++;
			if(page<=endPage){
				let tempUrl='https://www.nowcoder.com/discuss?type=2&order=' + page;
				getUrl(tempUrl);		
			}else{
				fetchPage();
			}
		})
	}).on('err',function(err){
		console.log(err);
	})
}
function fetchPage(){
	//异步控制并发
	async.mapLimit(urlList,5,function(url,callback){
		https.get(url,function(res){
			//console.log(url);
			let html='';
			//res.setEncoding('binary');
			res.on('data',function(chunk){
				html+=chunk;
			})
			res.on('end',function(){
				//console.log(html);
		        var $ = cheerio.load(html); //采用cheerio模块解析html
				var content = $('.post-topic-des').text().trim();
				//console.log(content);
				appendText(content);
			})

		}).on('err',function(err){
				console.log(err);
			});
		callback(null,'成功');
	},
	function(err,result){
		if (err){
				console.log(err)
			}
		else{
			console.log('结束');
			wordCluod();
			}			
		})
}
function appendText(text){
	fs.appendFile('./data/word.txt', text, 'utf-8', function (err) {
	  if (err) {
	    console.log(err);
	  }
	});
}

function wordCluod(){
	fs.readFile('./data/word.txt', 'utf8', function(err, data){
    	nodejieba.load({
  			userDict: './user.utf8',
		});
    	const result = nodejieba.extract(data, 120);
    	const tagList = ['原型', '闭包', 'HTTP', 'CORP', 'TCP', 'HTTPS','跨域','XSS','安全','事件循环','VUE','CSS','算法','线程','NODE','缓存','内存','作用域链','垂直居中','布局','状态码','原型链','ES6','箭头函数','PROMISE','垃圾回收','优化','继承'];
    	let textNo = JSON.stringify(result.filter(item => tagList.indexOf(item.word.toUpperCase()) >= 0));     	
    	let text = JSON.parse(textNo);
    	let temp = "";
    	for(let i in text){
    		temp += text[i].word + " " + Math.ceil(text[i].weight) + "\n";
    	}
    	fs.writeFile('./data/'+'wordCloud'+'.txt',temp, 'utf-8', function (err) {
		  if (err) {
		    console.log(err);
		  }
		});
	});
	
}


getUrl(url);//主程序开始运行