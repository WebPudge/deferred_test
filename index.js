/* 
* node深浅练习
* 序列化执行
*
*/
var fs = require('fs');
var Deferrd = function () {
    this.promise = new Promise();
}

Deferrd.prototype.resolve = function (obj) {
    var promise = this.promise;
    var handler;
    while(handler = promise.queue.shift()) {
        if(handler && handler.fulfilled){
            var ret = handler.fulfilled(obj);
            if(ret && ret.isPromise){
                ret.queue = promise.queue;
                this.promise = ret;
                return;
            }
        }
    }
}

Deferrd.prototype.reject = function (err) {
    var promise = this.promise;
    var handler;
    while(handler = promise.queue.shift()) {
        if(handler && handler.error){
            var ret = handler.error(err);
            if(ret && ret.isPromise){
                ret.queue = promise.queue;
                this.promise = ret;
                return;
            }
        }
    }
}

Deferrd.prototype.callback = function () {
    var that = this;
    return function (err, file) {
        if(err){
            return that.reject(err)
        }
        that.resolve(file)
    }
}

var Promise = function () {
    this.queue = [];
    this.isPromise = true;
}

Promise.prototype.then = function (fulfilledHandler, errorHandler, progressHandler){
    var handler = {};
    if(typeof fulfilledHandler === 'function') {
        handler.fulfilled =fulfilledHandler;
    }
    if(typeof errorHandler === 'function') {
        handler.error =errorHandler;
    }
    this.queue.push(handler)
    return this
}

var readFile1 =function (file, encoding) {
    var deferrd = new Deferrd();
    fs.readFile(file,encoding,deferrd.callback());
    return deferrd.promise;
}

var readFile2 =function (file, encoding) {
    var deferrd = new Deferrd();
    fs.readFile(file,encoding,deferrd.callback());
    return deferrd.promise;
}

readFile1('1.txt','utf8').then(function (file1){
    return readFile2(file1,'utf8')
}).then(function (file2){
    console.log(file2)
})


/* 
*
* API封装
*
*/

var smooth = function (method){
    return function () {
        var deferred = new Deferrd();
        console.dir(arguments)
        var args = Array.prototype.slice.call(arguments,0);
        args.push(deferred.callback());
        method.apply(null,args);
        return deferred.promise;
    }
}

var readFile = smooth(fs.readFile);

readFile('1.txt','utf8').then(function(file1){
    return readFile(file1,'utf8');
}).then(function(file2){
    console.log(file2)
})
