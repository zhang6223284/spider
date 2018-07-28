/*
* @Author: user
* @Date: 2018-05-02 09:46:38
* @Last Modified by:   user
* @Last Modified time: 2018-05-02 09:46:45
*/
const https=require('https');
const fs=require('fs');
const request=require('request');
const async=require('async');
const startPage =0;//开始页
const endPage = 1;//结束页
let page=startPage;
let i=0;
//初始url
const url={	
    hostname: 'www.toutiao.com',
    path: '/search_content/?offset='+startPage*20+'&format=json&keyword=%E8%A1%97%E6%8B%8D&autoload=true&count=20&cur_tab=3&from=gallery',
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
		res.setEncoding('binary');
		//监听data事件，每次取一块数据
		res.on('data',function(chunk){
			html+=chunk;
		});
		res.on('end',function(){
			html=JSON.parse(html);//由于获取到的数据是JSON格式的，所以需要JSON.parse方法浅解析  
			for(let i of html.data){
				var obj ={title:i.title,url:i.article_url};
				urlList.push(obj);
			}
			console.log(urlList.length);
			page++;
			if(page<=endPage){
				let tempUrl='https://www.toutiao.com/search_content/?offset='+page*20+'&format=json&keyword=%E8%A1%97%E6%8B%8D&autoload=true&count=20&cur_tab=3&from=gallery';
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
		//截取字符串拼接为图片所在文章地址
		url.url='https://www.'+url.url.substring(7,19)+'a'+url.url.substring(25);
		https.get(url.url,function(res){
			let html='';
			res.setEncoding('binary');
			res.on('data',function(chunk){
				html+=chunk;
			})
			res.on('end',function(){
				var news_item = {
		            //获取文章的标题
		            title: url.title,
		            //i是用来判断获取了多少篇文章
		            i: i = i + 1,     
      			  };
          		console.log(news_item);     //打印信息
         		 //用来匹配script中的图片链接
				const reg=/http\:\\\/\\\/p\d\.pstatp\.com\\\/origin(\\\/pgc\-image)?\\\/[A-Za-z0-9]+/g;
				let imageList=html.match(reg);
				savedImg(imageList,url.title);
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
			}			
		})
}
function savedImg(imageList,title){
	fs.mkdir('./image/'+title,function(err){
		if(err){console.log(err)};
	});
	console.time('下载'+title+'耗时');
	imageList.forEach(function(item,index){
		let img_title=index;
		let img_filename = img_title + '.jpg';
		let img_src='http://'+item.substring(9);
		request({uri:img_src,encoding:'binary'},function(err,res,body){
			if(!err&&res.statusCode==200){
				fs.writeFile('./image/'+title+'/' + img_filename,body,'binary',function(err){
					if(err){
						console.log(err);
					}
				})
			}
		})
	})
	console.timeEnd('下载'+title+'耗时');
}


getUrl(url);//主程序开始运行