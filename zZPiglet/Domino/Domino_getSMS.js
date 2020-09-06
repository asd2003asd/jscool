/*
"达美乐比萨" 微信公众号 "优惠｜咨询" - "有奖游戏" 半自动获取奖励（省略玩游戏一步），支持 Quantumult X（理论上也支持 Surge、Loon，未尝试）。
请先按下述方法进行配置，进入微信公众号"达美乐比萨" - "优惠｜咨询" - "有奖游戏"，正常游戏一次并获取验证码，若弹出"首次写入 Domino RequestBody 成功"即可正常食用，其他提示或无提示请发送日志信息至 issue。
运行前请先在 BoxJs 中订阅 https://raw.githubusercontent.com/zZPiglet/Task/master/zZPiglet.boxjs.json
到 cron 设定时间自动签到时，若弹出"达美乐 - 点击填写验证码"表示成功，请点击通知跳转至 BoxJs 填写验证码并保存，再手动执行「获取奖励」脚本即可，其他提示或无提示请发送日志信息至 issue。

⚠️免责声明：
1. 此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2. 由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3. 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4. 此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5. 本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6. 如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7. 所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。

Author：zZPiglet

Quantumult X:
[task_local]
0 0 * * * https://raw.githubusercontent.com/zZPiglet/Task/master/Domino/Domino_getSMS.js, tag=达美乐
; cron 时间请设置为使用手机的时间，验证码有效期为 10 分钟。

[rewrite_local]
^https?:\/\/dominos0724\.shjimang\.com\/Ajax\/GetSmsCode url script-request-body https://raw.githubusercontent.com/zZPiglet/Task/master/Domino/Domino_getSMS.js


Surge & Loon:
[Script]
cron "0 0 * * *" script-path=https://raw.githubusercontent.com/zZPiglet/Task/master/Domino/Domino_getSMS.js
http-request ^https?:\/\/dominos0724\.shjimang\.com\/Ajax\/GetSmsCode requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/zZPiglet/Task/master/Domino/Domino_getSMS.js

// 由于请求是 http，故可不用填写 MitM，如抓包发现自己设备的请求为 https，请加上 MitM
All app:
[mitm]
hostname = dominos0724.shjimang.com

获取完 RequestBody 因 MitM 导致该软件网络不稳定，需注释掉 hostname。
*/

const $ = new API("Domino");
$.debug = [true, "true"].includes($.read("debug")) || false;
$.boxlink = $.read("#boxjs_host") || "http://boxjs.com";
const reg = /OpenId=((\w|-)*)/

if ($.isRequest) {
    getRequestBody();
    $.done({ body: $request.body });
} else {
    $.openid = $.read("openid");
    $.phonenum = $.read("phonenum");
    $.sec = $.read("sec");
    if (!$.phonenum || !$.sec || !$.openid) {
        $.notify("达美乐 - 验证码", "缺失信息", "请按脚本开头配置获取信息。");
    } else {
        getSMS();
    }
    $.done()
}

function getSMS() {
    $.post({
        url: "http://dominos0724.shjimang.com/Ajax/GetSmsCode",
        headers: {
            "Content-Type": "application/json",
            "Cookie": "Web2005=controller=Home&action=Default&OpenId=" + $.openid,
            "Host": "dominos0724.shjimang.com",
            "Origin": "http://dominos0724.shjimang.com",
            "Referer": "http://dominos0724.shjimang.com/Home/Default?utm_source=weixin&utm_campaign=0724%E6%89%87%E8%B4%9D&utm_channel=%E5%85%AC%E4%BC%97%E5%8F%B7&utm_content=%E8%8F%9C%E5%8D%95"
        },
        body: '{"mobile":' + $.phonenum + ',"sec":"' + $.sec + '"}'
    })
        .then((resp) => {
            $.log("getSMS: " + JSON.stringify(resp.body));
            let obj = JSON.parse(resp.body);
            let openurl = $.boxlink + "/app/zZ.Domino";
            if (obj.Code == "1000") {
                $.notify("达美乐 - 验证码", "发送成功，请点击填写验证码", "验证码有效期为 10 分钟，请尽快点击跳转至 BoxJs 中填写、保存并执行下一步。", openurl)
            } else {
                $.error("getSMS ERROR: " + JSON.stringify(resp.body));
                $.notify("达美乐 - 验证码", "发送错误：" + obj.Msg, "请检查 BoxJs 中是否有数据，若有，数据可能失效，请重新获取。", openurl);
            }
        })
        .catch((err) => {
            $.notify("达美乐 - 验证码", "发送错误", JSON.stringify(err));
            $.error(JSON.stringify(err));
        })
}

function getRequestBody() {
    if ($request && $request.method == "POST" && $request.url.indexOf("GetSmsCode") >= 0) {
        let openidValue = reg.exec($request.headers['Cookie'])[1];
        let RequestBodyValue = JSON.parse($request.body);
        let phonenumValue = RequestBodyValue.mobile;
        let secValue = RequestBodyValue.sec;
        if ($.read("openid") != (undefined || null)) {
            if ($.read("openid") != openidValue || $.read("phonenum") != phonenumValue || $.read("sec") != secValue) {
                $.write(openidValue, "openid");
                $.write(phonenumValue, "phonenum");
                $.write(secValue, "sec");
                $.notify("更新 " + $.name + " RequestBody 成功 🎉", "", "");
            }
        } else {
            $.write(openidValue, "openid");
            $.write(phonenumValue, "phonenum");
            $.write(secValue, "sec");
            $.notify("首次写入 " + $.name + " RequestBody 成功 🎉", "", "");
        }
    } else {
        $.notify("写入" + $.name + "RequestBody 失败‼️", "", "配置错误, 无法读取请求头。");
    }
}


// OpenAPI by Peng-YM, modified by zZPiglet
function API(s="untitled",t=!1){return new class{constructor(s,t){this.name=s,this.debug=t,this.isRequest="undefined"!=typeof $request,this.isQX="undefined"!=typeof $task,this.isLoon="undefined"!=typeof $loon,this.isSurge="undefined"!=typeof $httpClient&&!this.isLoon,this.isNode="function"==typeof require,this.isJSBox=this.isNode&&"undefined"!=typeof $jsbox,this.node=(()=>{if(this.isNode){const s="undefined"!=typeof $request?void 0:require("request"),t=require("fs");return{request:s,fs:t}}return null})(),this.initCache();const e=(s,t)=>new Promise(function(e){setTimeout(e.bind(null,t),s)});Promise.prototype.delay=function(s){return this.then(function(t){return e(s,t)})}}get(s){return this.isQX?("string"==typeof s&&(s={url:s,method:"GET"}),$task.fetch(s)):new Promise((t,e)=>{this.isLoon||this.isSurge?$httpClient.get(s,(s,i,o)=>{s?e(s):t({status:i.status,headers:i.headers,body:o})}):this.node.request(s,(s,i,o)=>{s?e(s):t({...i,status:i.statusCode,body:o})})})}post(s){return this.isQX?("string"==typeof s&&(s={url:s}),s.method="POST",$task.fetch(s)):new Promise((t,e)=>{this.isLoon||this.isSurge?$httpClient.post(s,(s,i,o)=>{s?e(s):t({status:i.status,headers:i.headers,body:o})}):this.node.request.post(s,(s,i,o)=>{s?e(s):t({...i,status:i.statusCode,body:o})})})}initCache(){if(this.isQX&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(this.isLoon||this.isSurge)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),this.isNode){let s="root.json";this.node.fs.existsSync(s)||this.node.fs.writeFileSync(s,JSON.stringify({}),{flag:"wx"},s=>console.log(s)),this.root={},s=`${this.name}.json`,this.node.fs.existsSync(s)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(s,JSON.stringify({}),{flag:"wx"},s=>console.log(s)),this.cache={})}}persistCache(){const s=JSON.stringify(this.cache);this.isQX&&$prefs.setValueForKey(s,this.name),(this.isLoon||this.isSurge)&&$persistentStore.write(s,this.name),this.isNode&&(this.node.fs.writeFileSync(`${this.name}.json`,s,{flag:"w"},s=>console.log(s)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root),{flag:"w"},s=>console.log(s)))}write(s,t){this.log(`SET ${t}`),-1!==t.indexOf("#")?(t=t.substr(1),this.isSurge&this.isLoon&&$persistentStore.write(s,t),this.isQX&&$prefs.setValueForKey(s,t),this.isNode&&(this.root[t]=s)):this.cache[t]=s,this.persistCache()}read(s){return this.log(`READ ${s}`),-1===s.indexOf("#")?this.cache[s]:(s=s.substr(1),this.isSurge&this.isLoon?$persistentStore.read(s):this.isQX?$prefs.valueForKey(s):this.isNode?this.root[s]:void 0)}delete(s){this.log(`DELETE ${s}`),-1!==s.indexOf("#")?(s=s.substr(1),this.isSurge&this.isLoon&&$persistentStore.write(null,s),this.isQX&&$prefs.removeValueForKey(s),this.isNode&&delete this.root[s]):delete this.cache[s],this.persistCache()}notify(t=s,e="",i="",o,n){const r=i+(null==o?"":`\n\n跳转链接：${o}`)+(null==n?"":`\n\n多媒体链接：${n}`);if(this.isSurge&&$notification.post(t,e,r),this.isQX){let s={};o&&(s["open-url"]=o),n&&(s["media-url"]=n),"{}"==JSON.stringify(s)?$notify(t,e,i):$notify(t,e,i,s)}if(this.isLoon){let s={};o&&(s.openUrl=o),n&&(s.mediaUrl=n),"{}"==JSON.stringify(s)?$notification.post(t,e,i):$notification.post(t,e,i,s)}if(this.isNode)if(this.isJSBox){const s=require("push");s.schedule({title:t,body:e?e+"\n"+i:i})}else console.log(`${t}\n${e}\n${r}\n\n`)}log(s){this.debug&&console.log(s)}info(s){console.log(s)}error(s){console.log("ERROR: "+s)}wait(s){return new Promise(t=>setTimeout(t,s))}done(s={}){this.isQX?this.isRequest&&$done(s):this.isLoon||this.isSurge?this.isRequest?$done(s):$done():this.isNode&&!this.isJSBox&&"undefined"!=typeof $context&&($context.headers=s.headers,$context.statusCode=s.statusCode,$context.body=s.body)}}(s,t)}