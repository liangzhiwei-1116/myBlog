var express = require('express')
var User = require('./models/user')
var Topic = require('./models/topic')
var Comment = require('./models/comment')
var md5 = require('blueimp-md5')
var chinaTime = require('china-time');
var url = require('url');

var router = express.Router()

//渲染首页
router.get('/',function(req,res){
    Topic.find({},function(err,result){
        if(err) throw err
        //获取session数据
        //req.session.user
        /*var i = 1
        result.form_name = result.form_name+i
        i++*/
        for (var key in result)
        {
            result[key].form_name = result[key].form_name + key
        }
        res.render('index.html',{
            user:req.session.user,
            theme:result
        })
    })
})

//清除用户数据后回到首页
router.post('/',function(req,res){
    User.remove({
        email:req.session.user.email
        },function(err,ret){
            if (err)
            {
                console.log('删除失败')
            } else {
                console.log('删除成功')
                console.log(ret)
            }
    })
    Topic.remove({
        email:req.session.user.email
        },function(err,ret){
            if (err)
            {
                console.log('删除失败')
            } else {
                console.log('删除成功')
                console.log(ret)
            }
    })
    //清除登录状态
    req.session.user = null
    res.redirect('/')
})

//渲染登入页面
router.get('/login',function(req,res){
    res.render('login.html')
})

//处理登入页面用户的登入请求
router.post('/login',function(req,res,next){
    var body = req.body
    User.findOne({
        email:body.email,
        password:md5(md5(body.password))
    },function(err,user){
        if (err)
        {
            /*return res.status(500).json({
                err_code:500,
                message:err.message
            })*/
            return next(err)
        }
        //判断用户是否匹配
        if (!user)
        {
            return res.status(200).json({
                err_code:1,
                message:'Email or password is invalid.'
            })
        }
        //使用session记录登录状态
        req.session.user = user
        res.status(200).json({
            err_code:0,
            message:'OK'
        })
    })
})

//处理用户退出情况
router.get('/logout',function(req,res){
    //清除登录状态
    req.session = null
    // a 标签使用的是同步请求 所以可以直接使用重定向的方式
    res.redirect('/login')
})

//渲染用户注册页面
router.get('/register',function(req,res){
    res.render('register.html')
})

//处理主页页面用户提交的注册请求
router.post('/register',function(req,res,next){
    /*
        1.获取表单提交的数据
        2.操作数据库
        3.发送响应
        console.log(req.body) 输出：
        [Object: null prototype] {
          email: '123@123',
          nickname: '梁志伟',
          password: 'liang123'
        }
    */
    var body = req.body
    User.findOne({
        //或操作
        $or:[
            {email:body.email},
            {nickname:body.nickname}
        ]
    },function(err,data){
        if (err)
        {
            /*return res.status(500).json({
                err_code:500,
                message:'Internal error.'
            })*/
            return next(err)
        }
        if (data)
        {
            //邮箱或昵称已存在
            return res.status(200).json({
                err_code:1,
                meaasge:'Email or nickname already exists.'
            })
        }
        //对密码进行md5重复加密
        body.password = md5(md5(body.password))
        new User(body).save(function(err,user){
            if (err)
            {
                /*return res.status(500).json({
                    err_code:500,
                    message:'Internal error.'
                })*/
                return next(err)
            } else {
                //添加session数据
                req.session.user = user
                return res.status(200).json({
                    err_code:0,
                    meaasge:'ok'
                })
                //服务端重定向只针对同步请求才有效 异步请求无效
                //res.redirect('/')
                //所以需要在客户端使用location自己跳转
            }
        })
    })
})

//渲染发表话题的页面
router.get('/topic/new',function(req,res){
    res.render('./topic/new.html',{
        user:req.session.user
    })
})

//处理发表话题的post请求
router.post('/topic/new',function(req,res,next){
    var body = req.body
    body["email"] = req.session.user.email
    body["avatar"] = req.session.user.avatar
    new Topic(body).save(function(err,topic){
        if (err)
        {
            return next(err)
        } else {
            //保存topic的session数据
            req.session.topic = topic
            req.session.topic.email = req.session.user.email
            return res.status(200).json({
                err_code:0,
                message:'操作成功'
            })
        }
    })
})

//渲染用户设置页面
router.get('/settings/profile',function(req,res){
    if (req.session.user.birthday==null)
    {
        var date = null
    } else {
        var date = (req.session.user.birthday).substr(0,10)
    }
    res.render('./settings/profile.html',{
        user:req.session.user,
        email:req.session.user.email,
        nickname:req.session.user.nickname,
        bio:req.session.user.bio,
        birthday:date,
        check0:req.session.user.check0,
        check1:req.session.user.check1,
        check2:req.session.user.check2
    })
})

//处理用户更改信息请求
router.post('/settings/profile',function(req,res,next){
    var body = req.body
    /*console.log(body)
      输出:
      [Object: null prototype] {
          email: 'liang@liang.com',
          nickname: 'liangzhiwei',
          myself: '天蝎男一枚',
          gender: '3',
          birthday: '1999-11-16'
    }*/
    User.findOneAndUpdate(
        {email:body.email},
        {
            nickname:body.nickname,
            bio:body.myself,
            gender:body.gender,
            last_modified_time:(chinaTime('YYYY-MM-DD HH:mm:ss')).toString(),
            birthday:body.birthday
        },
        function(err,user){
            if (err)
            {
                return next(err)
            } else {
                /*console.log(message)
                {
                  avatar: '/public/img/avatar-default.png',
                  bio: '你是一头猪',
                  gender: 0,
                  status: 0,
                  _id: 5eb8fef93a14e81fe0a2c8fd,
                  email: 'liang@liang.com',
                  nickname: 'liangzhiwei',
                  password: '94975e6157cfb375214e134bb2ae7ba3',
                  created_time: 2020-05-11T07:30:01.259Z,
                  last_modified_time: 2020-05-13T04:00:15.000Z,
                  __v: 0,
                  birthday: 1999-11-16T00:00:00.000Z
                }*/
                //使用session记录信息
                req.session.user.nickname = body.nickname
                req.session.user.bio = body.myself
                req.session.user.gender = body.gender
                req.session.user.last_modified_time = body.last_modified_time
                req.session.user.birthday = body.birthday
                //性别判断(愚蠢的方法)
                if (req.session.user.gender==0)
                {
                    User.findOneAndUpdate(
                        {email:body.email},
                        {check0:"checked",check1:"null",check2:"null"},
                        function(err,data){
                            if(err)
                            {    
                                return next(err)
                            }
                        }
                    )
                    req.session.user.check0 = "checked"
                    req.session.user.check1 = "null"
                    req.session.user.check2 = "null"
                }
                if (req.session.user.gender==1)
                {
                    User.findOneAndUpdate(
                        {email:body.email},
                        {check0:"null",check1:"checked",check2:"null"},
                        function(err,data){
                            if(err)
                            {    
                                return next(err)
                            }
                        }
                    )
                    req.session.user.check0 = "null"
                    req.session.user.check1 = "checked"
                    req.session.user.check2 = "null"
                }
                if (req.session.user.gender==2)
                {
                    User.findOneAndUpdate(
                        {email:body.email},
                        {check0:"null",check1:"null",check2:"checked"},
                        function(err,data){
                            if(err)
                            {    
                                return next(err)
                            }
                        }
                    )
                    req.session.user.check0 = "null"
                    req.session.user.check1 = "null"
                    req.session.user.check2 = "checked"
                }
                return res.status(200).json({
                    err_code:0,
                    meaasge:'ok'
                })
            }
        }
    )
})

//处理用户修改密码的请求
router.post('/settings/admin',function(req,res,next){
    var body = req.body
    if ( md5(md5(body.pwd_now)) === req.session.user.password )
    {
        if ( body.pwd_change1 === body.pwd_change2 )
        {
            User.findOneAndUpdate(
                {email:req.session.user.email},
                {password:md5(md5(body.pwd_change1))},
                function(err,user)
                {
                    if (err)
                    {
                        return next(err)
                    } else {
                        req.session.user.password = md5(md5(body.pwd_change1))
                        return res.status(200).json({
                            err_code:0,
                            message:'修改成功'
                        })
                    }
                }
            )
        } else {
                return res.status(200).json({
                err_code:10,
                message:'两次输入的密码不一样'
            })
        }
    } else {
        return res.status(200).json({
            err_code:5,
            message:'密码错误'
        })
    }
})

//处理用户提交评论
router.get('/topic/show',function(req,res,next){
    var mycomment = url.parse(req.url, true).query
    mycomment["email"] = req.session.user.email
    mycomment["nickname"] = req.session.user.nickname 
    mycomment["text"] = mycomment.comment
    mycomment["comment_title"] = req.session.topic.title
    new Comment(mycomment).save(function(err,comment){
        if (err)
        {
            return next(err)
        } else {
            //保存topic的session数据
            /*req.session.comment = comment
            req.session.topic.email = req.session.user.email*/
            return res.status(200).json({
                err_code:0,
                message:'操作成功'
            })
        }
    })
    
    
})

//渲染打开一个话题的页面
router.post('/topic/show',function(req,res,next){
    var body = req.body;
    /*
        console.log(body)
        [Object: null prototype] {
          mytitle: 'JQuery中多个相同id添加同一个事件',
          myemail: 'liang@liang.com'
        }
    */
    /*console.log(body)*/
    Topic.findOne({
        email: body.myemail,
        title: body.mytitle
    },function(err,topic){
        if (err)
        {
            return next(err)
        }
        /*console.log(topic)会返回这条数据*/
        var my_block = null
        if (topic.block === "0")
        {
            my_block = "分享"
        } else if (topic.block === "1")
        {
            my_block = "问答"
        } else {
            my_block = "招聘"
        }
        
        req.session.topic = topic
        req.session.topic.title = topic.title
        
        Comment.find({comment_title:req.session.topic.title},function(err,result){
            if(err) throw err
            res.render('./topic/show.html',{
                user:req.session.user,
                blocks:my_block,
                motif:topic.motif,
                title:topic.title,
                txt:topic.txt,
                code:topic.code,
                comment_all:result
            })
        })
    })
})

//渲染账户设置的页面
router.get('/settings/admin',function(req,res){
    /*console.log(req.session.user)*/
    res.render('./settings/admin.html',{
        user:req.session.user
    })
})

module.exports = router
