var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var router = require('./router')
var session = require('express-session')

var app = express()
/*
    path也是一个核心模块 具有很多与路径相关的方法 例如:
        path.basename():获取一个文件的路径名(默认包含扩展名)
        path.dirname():获取一路径中的目录部分
        path.extname():获取一个路径的扩展名部分
        path.parse():将一个路径转换为对象
    join()方法的作业是拼接路径 避免自己拼接错误
*/
/*
    在每个模块中 除了require 和 exports等模块相关API之外 还有两个特殊的成员 可直接输出的那种
    __dirname:可以动态获取当前文件模块所属目录的绝对路径
    __filename:可以用来动态获取当前文件的绝对路径
*/
app.use('/public/', express.static(path.join(__dirname, './public/')))
app.use('/node_modules/', express.static(path.join(__dirname, './node_modules/')))

app.engine('html',require('express-art-template'))
//默认就是views目录 下次如果要修改直接改此处就行
app.set('views',path.join(__dirname,'./views/'))

// 配置解析表单 POST 请求体插件（注意：一定要在 app.use(router) 之前 ）
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

/*
    Express框架默认不支持session和cookie
    需要使用第三方插件 express-session
    默认session数据是内存储存的 服务器一旦重启就会丢失 真正的生产环境会把session数据进行持久化存储
*/
app.use(session({
  // 配置加密字符串，它会在原有加密基础之上和这个字符串拼起来去加密
  // 目的是为了增加安全性，防止客户端恶意伪造
  secret: 'itcast',
  resave: false,
  saveUninitialized: false // 无论你是否使用 Session ，我都默认直接给你分配一把钥匙
}))

//挂载路由
app.use(router)

//配置一个处理404的中间件
app.use(function(req,res){
    res.render('404.html')
})

//配置一个全局错误处理中间件
app.use(function(err,req,res,next){
    res.status(500).json({
        err_code:500,
        message:err.message
    })
})

app.listen(5000,function(){
    console.log('server is running...')
})
