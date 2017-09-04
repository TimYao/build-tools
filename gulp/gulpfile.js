/*

   * @Author: TimYao
   * @Date:2015-12-09 10:54:27
   * @Last Modified by:TimYao
   * @Last Modified time:2015-12-09 23:57:01

   gulp-load-plugins -> 读取gulp插架模块
   gulp-util -> 功能函数，带有log,color着色等函数

    
   gulp --type=?
   gulp --env=?

   handlebars模板配置，处理错误函数

*/

var package = require('./package.json');
var pluginSeting = {
	  DEBUG:false,  					//设置为true时，插件会将信息记录到控制台。用于错误报告和问题调试
	  pattern:['gulp-*', 'gulp.*', '@*/gulp{-,.}*'],   				 //检索文件
	  config: package,  				//查找配置的文件
	  scope: ['dependencies', 'devDependencies', 'peerDependencies'],  //作用域在三个文件模块中
	  replaceString: /^gulp(-|\.)/,  	//替换gulp前缀
	  camelize: true,  				//如果为true，将连字符插件名称转换为骆驼案例
	  lazy: true,  					//懒加载模块
	  overridePattern: true, 			//开启正则匹配pattern
	  maintainScope: true    			//可以链式访问模块下插件,作用域下访问，层级访问
};

//导入gulp插件
var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(pluginSeting);
    plugins.sync = plugins['sync'];
    plugins.gulpsync = plugins.sync(gulp);//控制流程
    plugins.minify = plugins['minify'];
    plugins.jshint = plugins['jshint'];
    plugins.concat = plugins['concat'];
    plugins.rename = plugins['rename'];
    plugins.util = plugins['util'];
    plugins.filter = plugins['filter'];
    plugins.stylus = plugins['stylus'];
    plugins.gulpif = plugins['if'];
    plugins.uglify = plugins['uglify'];
    plugins.coffee = plugins['coffee'];
    plugins.notify = plugins['notify'];
    plugins.postcss = plugins['postcss'];
    plugins.filter = plugins['filter'];
    plugins.jade = plugins['jade'];
    plugins.cssmin = plugins['cssmin'];
    plugins.minifycss = plugins['minifyCss'];  //待删除
    plugins.csslint = plugins['csslint'];
    plugins.uncss = plugins['uncss'];
    plugins.jslint = plugins['jslint'];
    plugins.handlebars = plugins['handlebars']; //待学习
    plugins.compilehandlebars = plugins['compileHandlebars'];
    plugins.plumber = plugins['plumber'];
    plugins.urladjuster = plugins['cssUrlAdjuster'];
    plugins.imagemin = plugins['imagemin'];
    plugins.spriteGenerator2 = plugins['spriteGenerator2'];
    plugins.spritesmith = plugins['spritesmith'];
    plugins.fontSpider = plugins['fontSpider'];
    plugins.fontmin = plugins['fontmin'];
    plugins.sequence = plugins['sequence'];  //控制流程
    plugins.revs = plugins['rev'];//版本内容变化设置hash
    plugins.revCollector = plugins['revCollector']; //替换地址
    plugins.sourcemaps = plugins['sourcemaps'];
    //plugins.autoprefixer = plugins['autoprefixer'];待删除
    //console.log(plugins.gulpsync);
    

//导入其他模块
var fs = require('fs'),
    paths = require('path'),
    del = require('del'),
    chalk = require('chalk'),
    karmaServer = require('karma').Server,
    through2 = require('through2'),
    mkdir = require('mkdirp'), //生成目录
    autoprefixer = require('autoprefixer'),
    nib = require('nib'),
    es = require('event-stream'),
    browserSync = require('browser-sync').create(),
    Q = require('q'),
    buffer = require('vinyl-buffer'),
    mergeStream = require('merge-stream'),
    sizeOf = require('image-size');


//定义文本打印颜色
var colorsText = {
    finishBlueColor:chalk.hex('#83baf1')
};

//生成项目目录结构
var prefixRoot = 'src',
      root = __dirname,
      dist = '/dist',
	  templatesSrc = prefixRoot+'/templates',
	  staticsSrc = prefixRoot+'/static';
var docDir = [
     templatesSrc+'/layout',
     templatesSrc+'/modules',
     templatesSrc+'/templates',
     staticsSrc+'/css',
     staticsSrc+'/css/modules',
     staticsSrc+'/css/templates',
     staticsSrc+'/js',
     staticsSrc+'/js/test',
     staticsSrc+'/images',
     staticsSrc+'/fonts'
];


//配置编译打包目录
var configPath = {
    sourcePath:{
        templates:{
            jade:[templatesSrc+'/**/*.jade'],
            handlebars:[templatesSrc+'/**/*.hbs']
        },
        styles:{
            styl:[staticsSrc+'/css/**/*.styl'],
            less:[],
            sass:[]
        },
        javascripts:{
            coffee:[staticsSrc+'/js/**/*.coffee'],
            js:[staticsSrc+'js/**/*.js']
        },
        images:[staticsSrc+'/images'],
        fonts:[staticsSrc+'/fonts']
    },
    buildPath:{
        dist:root+dist,
        compeleteSrc:{
            styles:staticsSrc+'/css',
            js:staticsSrc+'/js',
            templates:prefixRoot+'/html'    
        },
        distSrc:{
            styles:root+dist,
            templates:root+dist,
            fonts:root+dist+'/static/fonts'
        }
    },
    //use rev to reset html resource url
    rev:{
        revJson: root+'/dist/*.json',
        src: root+'/dist/**/*.html', //root index.html
        dest: ""
    },
    root:'./',
    src:'test',
    buildSrc : '',
    distSrc : ''
}


/***************定义全局参量**************/

var globalArr = {
        'jade':[],
        'styls':[],
        'handlebar':[]
    },
    cssplugins = [
        autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],// 浏览器版本
            cascade:true,                             // 美化属性，默认true
            add:true,                                // 是否添加前缀，默认true
            remove:true,                             // 删除过时前缀，默认true
            flexbox:true                            // 为flexbox属性添加前缀，默认true
        })
    ],
    servers = {
      open: false,
      notify: false,
      server:{
          baseDir: "./",
          directory: true,
          index: "index.html",
          serveStaticOptions: {
             extensions:["html"]
          }
      },
      //files:[''], 这里也可以配置监测
      //proxy:'http://www.test.com',  //设置代理 后端服务端与前端服务访问问题(这里待解决问题，使用代理，browsersync实时监测问题)
      port:8989,  //这里我们可动态设置
      browser:["google chrome"],
      logPrefix: "My Project",
      logConnections: true,
      logFileChanges: true,
      logLevel: "silent",
      reloadDelay: 1000,
      reloadOnRestart: true
    },
    global={
       isDist:false,
       sourceHost:''
    };


/***************目录结构生成**************/

//question test karma文件配置

/*
 目录创建
*/
gulp.task('mkDoc',function(cb){
  if(global.isDist){
      mkdir.sync(__dirname+'/dist');
      global.isDist = false;
  }else{
    for(var val in docDir){
      mkdir.sync(docDir[val]);
    }
  }
  plugins.util.log(colorsText.finishBlueColor("目录生成完成!"));
  return cb();
});


/*
 创建karma测试配置
*/
gulp.task('mkKarma',function(cb){
    var work = "jasmine",data; //qunit
    if(plugins.util.env.type==="jasmine"){
        work = "jasmine";
    }
    /*
    *   singleRun: true  开启或禁用持续集成模式 设置为true, Karma将打开浏览器，执行测试并最后退出
    *   config.LOG_DISABLE //不输出信息
    *   config.LOG_ERROR    //只输出错误信息
    *   config.LOG_WARN //只输出警告信息
    *   config.LOG_INFO //输出全部信息
    *   config.LOG_DEBUG //输出调试信息
    *   concurrency:Infinity 并发连接
    */
    data = ";module.exports = function(config){" +
            "config.set({" +
                "basePath:"+staticsSrc+"/js"+"," +
                "frameworks: ["+work+"]," +
                "files:['/*.js'],"+
                "autoWatchBatchDelay:1000," +
                "captureTimeout:5000," +
                "client.clearContext:false," +
                "preprocessors:{" +
                    "'src/static/js/**/*.js' : 'coverage'" +
                "}," +
                "reporters: ['progress', 'coverage']," +
                "coverageReporter:{" +
                    "type:'html',"+
                    "dir:'test/coverage'" +
                "}," +
                "port:9876," +
                "colors:true," +
                "autoWatch:true," +
                "singleRun:false," +
                "logLevel:config.LOG_INFO," +
                "browsers:[]," +
                "concurrency:Infinity" +
            "})" +
        "}";
    fs.writeFileSync(paths.join(__dirname,'/karma.conf.js'),data,'utf8');
    plugins.util.log(colorsText.finishBlueColor('测试文件：karma.conf.js is generate finished!'));
    cb();
});


/*
 测试任务 有测试问题，监测文件问题
*/
gulp.task('test',function(cb){
    new karmaServer({
        config:paths.join(__dirname,'/karma.conf.js')
    },cb).start();
});


/*
 删除已经存在的目录
*/
gulp.task('delDir',function(cb){
    var dels,path;
    if(global.isDist){
       path = [__dirname+'/dist'];
    }else{
       path = ['./'+prefixRoot+'/**/']; 
    }
    //del(path).then(function(paths){
       //plugins.util.log('Files and folders that would be deleted:\n',paths.join('\n'),colorsText.finishBlueColor('\n目录删除完成!')); 
       //cb();
       //if(global.isDist){
         //gulp.start('mkDoc');
       //}
    //});
    del.sync(path);
    plugins.util.log('Files and folders that would be deleted:\n',colorsText.finishBlueColor([].join.apply(path,['\n'])),paths.join('\n'),colorsText.finishBlueColor('--------------目录删除完成!--------------'));
    return cb();
});


/*
 product dist目录
*/
gulp.task('mvDir',function(cb){
    global.isDist = true;
    if(fs.existsSync(configPath.buildPath.dist)){
        gulp.start('delDir');
    }
    gulp.start('mkDoc');
    cb();
    gulp.start('builds');
});




/********编译任务**********/

//question coffee test  handlebar 实现 requirejs

/*
  stylus 编译
*/
gulp.task('stylus',function(){
   var spriteOutput,spriteCss,spriteImg,roudom = 1000*Math.random() | 0;
   spriteOutput = gulp.src(globalArr.styls).pipe(plugins.sourcemaps.init({
      loadMaps:true,
      largeFile:true
   })).pipe(plugins.plumber({errorHandler:onError})).pipe(logFile(es)).pipe(plugins.stylus({use:[nib()]})).pipe(plugins.postcss(cssplugins)).pipe(plugins.csslint(package.cssLintConfig)).pipe(plugins.csslint.formatter('text',{logger:plugins.util.log.bind(null,'gulp-csslint:')})).pipe(plugins.urladjuster({
      prepend:'../../images/'
   })).pipe(plugins.spriteGenerator2({
       baseUrl:'./'+staticsSrc+ '/images',
       spriteSheetName:'isprite.png',
       spriteSheetPath:'../images',
       filter: [
           function(image) {
               console.log(image.url);
               return !(image.url.indexOf("icons") === -1);  //只对icons进行雪碧图合并
           }
       ],
       verbose:true
   })); //css里图片路径的处理
   spriteCss = spriteOutput.css.pipe(plugins.urladjuster({
       replace:  ['../../images/','../images/'],
       append: '?version='+roudom,
   })).pipe(plugins.sourcemaps.write('../maps',{
        addComment:true, //配置下面的必配
        includeContent:false,
        sourceRoot:staticsSrc+'/css'
   })).pipe(gulp.dest(configPath.buildPath.compeleteSrc.styles));
    spriteImg = spriteOutput.img.pipe(gulp.dest(staticsSrc+'/images'));

   globalArr.styls = [];
   return mergeStream(spriteCss,spriteImg);
});


/*
  coffee 编译
*/
gulp.task('js',function(cb){
  gulp.src(configPath.sourcePath.javascripts.coffee).pipe(plugins.sourcemaps.init({
      loadMaps:true,
      largeFile:true
   })).pipe(plugins.plumber({errorHandler:onError})).pipe(logFile(es)).pipe(plugins.coffee({bare:true})).pipe(plugins.jslint()).pipe(plugins.jslint.reporter('default', errorsOnly)).pipe(plugins.sourcemaps.write('../maps',{
      addComment:true, //配置下面的必配
      includeContent:false,
      sourceRoot:staticsSrc+'/js'
   })).pipe(gulp.dest(configPath.buildPath.compeleteSrc.js));;
});


/*
  jade 模板编译
*/
gulp.task('jade',function(cb){
    gulp.src(globalArr.jade).pipe(plugins.jade({
        pretty:true
    })).pipe(gulp.dest(configPath.buildPath.compeleteSrc.templates));
    globalArr.jade = [];
    cb();
});


/*
 handlebar 编译
*/
gulp.task('handlebar',function(cb){
    var templateData = {
        firstName: 'Kaanon'
    },
    options = {
        ignorePartials: true,
        partials : {
            footer : '<footer>the end</footer>'
        },
        batch : ['./src/templates/modules'],
        helpers : {
            capitals : function(str){
                return str;
            }
        }
    }
    gulp.src(globalArr.handlebar).pipe(plugins.compilehandlebars(templateData,options)).pipe(plugins.rename('hbs.html')).pipe(gulp.dest(configPath.buildPath.compeleteSrc.templates));
    globalArr.handlebar = [];
    cb();
});





/********打包任务**********/

//question  关于build后字体库样式重新生成，如果去除多余CSS文件，以及替换之前，目前只能手动替换 uncss

/*
  css 中雪碧图的处理生成
*/
gulp.task('buildcss',function(){
  var f;
  f = plugins.filter(['**/!(*.min.css)'],{restore: true});
  return gulp.src(configPath.buildPath.compeleteSrc.styles+'/**/*.css',{base:prefixRoot}).pipe(f).pipe(plugins.cssmin({
      showLog:true
  })).pipe(f.restore).pipe(gulp.dest(configPath.buildPath.dist));

  //spriteOutput = sprites();
  // spriteCss = spriteOutput.css.pipe(plugins.cssmin({
  //   showLog:true
  // })).pipe(gulp.dest(configPath.buildPath.dist+'/static/css'));
  // spriteImg = spriteOutput.img.pipe(plugins.imagemin([
  //     plugins.imagemin.gifsicle({optimizationLevel:3,interlaced:true}),
  //     plugins.imagemin.jpegtran({progressive:true}),
  //     plugins.imagemin.optipng({optimizationLevel:5}),
  //     plugins.imagemin.svgo({plugins:[{removeViewBox:true}]})
  // ],{
  //     verbose:true
  // })).pipe(gulp.dest(configPath.buildPath.dist+'/static/images'));
  //   spriteOutput = gulp.src(configPath.buildPath.compeleteSrc.styles+'/**/*.css').pipe(plugins.spriteGenerator2({
  //       baseUrl:'./'+staticsSrc+ '/images',
  //       spriteSheetName:'isprite.png',
  //       spriteSheetPath:'../images/sprites',
  //       //styleSheetName:"isprite.css",
  //       algorithm:'binary-tree',
  //       verbose:true,
  //       filter:[
  //           function(image){
  //               return image.url.indexOf('icons') !== -1;
  //           }
  //       ]
  //   }));
  //
  //   spriteCss = spriteOutput.css.pipe(gulp.dest(configPath.buildPath.dist+'/static/css'));
  //   spriteImg = spriteOutput.img.pipe(gulp.dest(configPath.buildPath.dist+'/static/images'));
  // return mergeStream(spriteCss,spriteImg);
});
gulp.task('uncss',function(){
   return gulp.src(configPath.buildPath.distSrc.styles+'/static/css/**/*.css').pipe(plugins.uncss({
       html:[configPath.buildPath.distSrc.templates+'/htm/**/*.html']
   })).pipe(gulp.dest('./out'));
});


/*
 js 打包压缩
 */
gulp.task('buildjs',function(){
  var f;
  f = plugins.filter(['**/!(*.min.js)'],{restore: true});
  return gulp.src(configPath.buildPath.compeleteSrc.js+'/**/*.js',{base:prefixRoot}).pipe(f).pipe(plugins.uglify()).pipe(f.restore).pipe(gulp.dest(configPath.buildPath.dist));
});


/*
 html 映射文件替换
*/
gulp.task('buildhtml',function(){ 
  return gulp.src([configPath.rev.revJson,configPath.buildPath.compeleteSrc.templates+'/**/*.html'],{base:prefixRoot}).pipe(logFile(es)).pipe(plugins.revCollector({
    replaceReved:true,
    //这里要求只替换目录，条件排除隐射中带有目录情况
    //dirReplacements:{
    //  'static/css/':'static/css/'
    //},
    extMap:{
      '.scss': '.css',
      '.less': '.css',
      '.jsx': '.js'
    }
  })).pipe(gulp.dest(configPath.buildPath.dist));
  cb();
});


/*
 image 压缩处理
*/
gulp.task('buildimages',function(){ 
  return gulp.src([configPath.sourcePath.images+'/**/*.{jpg,png,gif,jpeg,svg}','!**/icons/**/*.{jpg,png,gif,jpeg,svg}'],{base:prefixRoot}).pipe(plugins.notify({
      title:'imagemins start',
      sound:false,
      message:"images is start compression!"
  })).pipe(plugins.imagemin([
      plugins.imagemin.gifsicle({optimizationLevel:3,interlaced:true}),
      plugins.imagemin.jpegtran({progressive:true}),
      plugins.imagemin.optipng({optimizationLevel:5}),
      plugins.imagemin.svgo({plugins:[{removeViewBox:true}]})
  ],{
      verbose:true
  })).pipe(gulp.dest(configPath.buildPath.dist));
});


/*
    task:sprites
    通过图片来生成雪碧图
    生成目录到编译后的目录
*/
gulp.task('sprites',function(){
  var spriteData,imgStream,cssStream;
  spriteData = gulp.src(configPath.sourcePath.images+'/sprites/*.{jpg,png,gif,jpeg}').pipe(plugins.spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.styl',
    algorithm:'binary-tree'
  }));
  imgStream = spriteData.img.pipe(buffer()).pipe(gulp.dest(configPath.sourcePath.images+'/'));
  cssStream = spriteData.css.pipe(gulp.dest(staticsSrc+'/css/modules/'));
  return mergeStream(imgStream,cssStream);
});


/*
 font 字体库处理  notice当build 后页面中生成一个修正好的字体css文件，这里还是需要手动替换下
*/
gulp.task('buildfonts',function(cb){
    var buffers = [];
    return gulp.src(configPath.buildPath.compeleteSrc.templates+'/**/*.html').on('data', function(file) {
        buffers.push(file.contents);
    }).on('end', function() {
        var text = Buffer.concat(buffers).toString('utf-8');
        minifyFont(text, cb);
    });
});
gulp.task('cleanfile',['mcss','mfonts'],function(){
    return del.sync(configPath.sourcePath.fonts+'/ifonts/**');
});
gulp.task('mfonts',function(){
    return gulp.src(configPath.sourcePath.fonts+'/ifonts/**/*.{ttf,eot,svg,woff,woff2,otf}').pipe(gulp.dest(configPath.buildPath.distSrc.fonts));
});
gulp.task('mcss',function(){
    return gulp.src(configPath.sourcePath.fonts+'/ifonts/**/*.css').pipe(gulp.dest(configPath.buildPath.compeleteSrc.styles));
});


/*
  css，js 版本戳映射生成
*/
gulp.task('rev',function(){
  var delaArr = [];//记录删除的非hash后的文件
  //这里待实现新功能方式
  // return gulp.src([configPath.buildPath.compeleteSrc.styles+'/**/*.css',configPath.buildPath.compeleteSrc.js+'/**/*.js'],{base:prefixRoot}).pipe(through2.obj(function(file,enc,cb){
  //   var extname = paths.extname(file.relative);
        
  //   if(extname.indexOf('.css')){
  //       isFlg = 'css';
  //   }else if(extname.indexOf('.js')){
  //       isFlg = 'js';
  //   }
  //   console.log(isFlg);
  //   cb(null,file);
  // })).pipe(gulp.dest(configPath.buildPath.dist));
  return gulp.src([configPath.buildPath.dist+'/**/*.{css,js}']).pipe(through2.obj(function(file,enc,cb){
    delaArr.push(file.path);
    cb(null,file);
  })).pipe(plugins.revs()).pipe(gulp.dest(configPath.buildPath.dist)).pipe(plugins.revs.manifest(configPath.buildPath.dist+"/rev-manifest.json",{
    base:'.'+dist,
    merge:true
  })).pipe(gulp.dest(configPath.buildPath.dist)).pipe(through2.obj(function(file,enc,cb){
    if(delaArr.length>0){
       del.sync(delaArr);
    }
    cb(null);
  }));
});




/**************功能函数*******************/
//TODO 如果写公共功能提示错误信息函数，主要是怎么运动stream function
function minifyFont(text, cb) {
    gulp.src(configPath.sourcePath.fonts+'/**/*.ttf').pipe(plugins.fontmin({
        text:text,
        hinting:true
    })).pipe(gulp.dest(configPath.sourcePath.fonts+'/ifonts')).on('end',function(){
        gulp.start('cleanfile');
    });
}
function onError(err){
  plugins.notify.onError({
      title:'Gulp',
      subtitle:'Failure!',
      message:'Error: <%= error.message %>'
  })(err);
  this.emit('end');
}
function onSuccess(){
  return plugins.notify({
      title: 'Gulp',
      subtitle: 'success',
      message: 'Success!'
  });
}
function onMessage(){
  // plugins.notify({
  //     message: "Generated file: <%= file.relative %> @ <%= options.date %>",
  //     templateOptions: {
  //       date: new Date()
  //     }
  // })
  return plugins.notify.withReporter(function(options,cb){
      // return plugins.notify({
      //     message: "Generated file: <%= file.relative %> @ <%= options.date %>",
      //     templateOptions: {
      //       date: new Date()
      //     }
      // });
    console.log("Title:", options.title);
    console.log("Message:", options.message);
    cb();
  });
}
//recursiveDir
function recursiveDir(dirs){

}
//logfile 
function logFile(es){
  return es.map(function(file,cb){
      plugins.util.log(file.path); 
      cb(null,file);
  });
}
//styles handle
function sortStyles(evt){
    var sPath = staticsSrc+'/css/templates',
        ipath = evt.path,
        name = paths.basename(ipath,'.styl')
        regTem = new RegExp("@import .+"+name,'g');

    sortTemp({
        sPath:sPath,
        ipath:ipath,
        name:name,
        regTem:regTem,
        compileFlg:'styl'
    });       
}
//jade/stylus编译模板
function sortTemp(opts){
    var sPath = opts.sPath || '',
        ipath = opts.ipath || '',
        name = opts.name || '',
        compileFlg = opts.compileFlg || '',
        regTem = opts.regTem || '',
        files = fs.readdirSync(sPath),
        len = files.length,
        regTmp = /templates/,
        fileSrc,
        isTmp,
        ext;

    //删除非监测文件     
    if(fs.existsSync(sPath+'/.DS_Store')){
        fs.unlinkSync(sPath+'/.DS_Store');  
        len = files.length;  
    } 
    if(compileFlg === "styl"){
        ext = '/*.styl';
        sTmps = globalArr.styls;
    }
    if(compileFlg === "jade"){
        ext = '/*.jade';
        sTmps = globalArr.jade;
    }   
    if(compileFlg === "handlebar"){
        ext = '/*.hbs';
        sTmps = globalArr.handlebar;
    }
    if(regTmp.test(ipath)){
        fileSrc = ipath;
        isTmp = true;
    }else{  
        fileSrc = sPath+ext;
    }
    
    gulp.src(fileSrc).pipe(plugins.gulpif(function(file){
         var contents;
         file.type = compileFlg;
         if(isTmp){
             sTmps.push(sPath+"/"+file.relative);  
             return true;
         }else{
            contents = file.contents.toString(); 
            if(regTem.test(contents)){
                sTmps.push(sPath+"/"+file.relative);
            }
            --len;
            return len==0;
         }  
    },compileHandler()));
    return     
}
function compileHandler(){  
  return through2.obj(function(file, enc, cb) {
    //console.log(globalArr.styls);
    //console.log('----------');
    console.log(globalArr.handlebar);
    //plugins.util.log(colorsText.finishBlueColor("---模板编译开始---"));
    if(globalArr.styls.length>0){
        gulp.start('stylus');
    }
    if(globalArr.jade.length>0){
        gulp.start('jade');
    }
    if(globalArr.handlebar.length>0){
        gulp.start('handlebar');
    }
    this.push(file);
    cb();
  });
}
//templates handle
function sortCompile(evt){
  var sPath = templatesSrc+'/templates',
      ipath = evt.path,
      name = paths.basename(ipath,'.jade'),
      regTem = new RegExp('(extends|include)\\s*.+'+name,'g');
  sortTemp({
    sPath:sPath,
    ipath:ipath,
    name:name,
    regTem:regTem,
    compileFlg:'jade'
  });
}
function sortHandlebarsCompile(evt){
  var sPath = templatesSrc+'/templates',
      ipath = evt.path,
      name = paths.basename(ipath,'.hbs');
      regTem = new RegExp('\{\{\>\\s*.+'+name+'\}\}','g');
  sortTemp({
    sPath:sPath,
    ipath:ipath,
    name:name,
    regTem:regTem,
    compileFlg:'handlebar'
  });
}
//扩展流函数写法 问题...
function sprites(){
  var stream;
  stream = gulp.src(configPath.buildPath.compeleteSrc.styles+'/**/*.css').pipe(plugins.spriteGenerator2({
       baseUrl:'./'+staticsSrc+ '/images',
       spriteSheetName:'isprite.png',
       //spriteSheetPath:'../images/sprites',
       //styleSheetName:"isprite.css",
       algorithm:'binary-tree',
       verbose:true,
       filter:[
          function(image){
            return image.url.indexOf('icons') != -1;
          } 
       ]
  }));
  return stream;
}


//启动服务
gulp.task('server',function(){
  //开启服务
  browserSync.init(servers);

  gulp.watch(configPath.sourcePath.styles.styl,sortStyles);
  gulp.watch(configPath.sourcePath.templates.jade,sortCompile);
  gulp.watch(configPath.sourcePath.templates.handlebars,sortHandlebarsCompile);

  gulp.watch(configPath.buildPath.compeleteSrc.styles+'/*.css').on('change', browserSync.reload);
  gulp.watch(configPath.buildPath.compeleteSrc.templates+'/*.html').on('change', browserSync.reload);
  browserSync.notify("browser is loading.....");
});
//任务启动
gulp.task('mkdir',['mkDoc','mkKarma']);
gulp.task('clean',['delDir']);
gulp.task('build',plugins.gulpsync.sync(['mvDir']));
gulp.task('builds',plugins.gulpsync.sync(['buildfonts','buildcss','buildjs','buildimages','rev','buildhtml']));
gulp.task('default',['server']);
