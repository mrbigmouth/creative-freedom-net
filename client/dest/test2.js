/************************
考試解說
考試者可在有網路可Google情況下進行考試，考試時間為三十分鐘，可跳題做答。
每題皆為已完成一半的程式碼，考試者需依題目指示在規定位置撰寫程式碼，
每題的程式碼皆獨立測試，必須在輸入最新版Chrome瀏覽器「新增分頁」的console模式不顯示錯誤，
並可達成考題需求。
************************/

/************************
第一題
提示：依題目需求設計validateAndCorrectMacAddress function
關鍵字：regexp、replace
************************/

var tester = /^\s*([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\s*$/;
function validateAndFormatMacAddress(macAddress) {
  if (tester.test(macAddress)) {
    return macAddress.replace(/^\s+|\s+$/g, '').replace(/\-/g, ':').toLocaleUpperCase();
  }
  else {
    return false;
  }
}

validateAndFormatMacAddress('00:0C:29:A6:20:31');  //程式回傳00:0C:29:A6:20:31
validateAndFormatMacAddress('00:0c:29:a6:20:31');  //程式回傳00:0C:29:A6:20:31
validateAndFormatMacAddress('00-0c-29-a6-20-31');  //程式回傳00:0C:29:A6:20:31
validateAndFormatMacAddress(' 00:0c:29:a6:20:31  ');  //程式回傳00:0C:29:A6:20:31
validateAndFormatMacAddress('00:0c:29:a6:20:31  ,');  //程式回傳false
validateAndFormatMacAddress('00:0g:29:a6:20:31');  //程式回傳false
validateAndFormatMacAddress('00a:0c:29:a6:20:3');  //程式回傳false
validateAndFormatMacAddress('0df0c::29:a6:20::');  //程式回傳false

/************************
第一題結束
************************/

/************************
第二題
提示：依題目需求設計eventEmitter物件
關鍵字：Subscribe/Publish pattern、event driven programming
************************/

const eventEmitter = {
  subscriber: {},
  on(event, callback) {
    this.subscriber[event] = callback;
  },
  trigger(event, ...arg) {
    this.subscriber[event](...arg);
  }
};

const randomString = '' + Math.floor(Math.random() * 1000);
console.log('randomString is: ' + randomString); // 此處會顯示隨機字串
eventEmitter.on(randomString, (text) => {
  console.log(text + ', ' + randomString);
});
eventEmitter.trigger(randomString, 'hello');

/************************
第二題結束
************************/

/************************
第三題
提示：依題目需求設計Counter function/class
關鍵字：prototype 或 ecmascript 2015 class，factory pattern
************************/

function Counter() {
  this.counter = 0;

  return this;
}
Counter.prototype.count = function() {
  this.counter += 1;
  alert(this.counter);
};
var counter1 = new Counter();
var counter2 = new Counter();
delete counter1.count;  //請不要為每個instance都創建一個function
delete counter2.count;
counter1.count();  //此行程式執行時，需以任意方式顯示文字"1"在瀏覽者眼前
counter1.count();  //此行程式執行時，需以任意方式顯示文字"2"在瀏覽者眼前
counter2.count();  //此行程式執行時，需以任意方式顯示文字"1"在瀏覽者眼前
counter1.count();  //此行程式執行時，需以任意方式顯示文字"3"在瀏覽者眼前

/************************
第三題結束
************************/

/************************
第四題
提示：依題目需求設計someoneSay function
關鍵字：curry pattern
************************/

function someoneSay(data) {
  return (function(msg) {
    alert(data.name + ':' + msg);
  });
}
var jackSay = someoneSay({name: 'Jack'});
var johnSay = someoneSay({name: 'John'});

jackSay('123'); //此行程式執行時，需以任意方式顯示文字"Jack：123"在瀏覽者眼前
johnSay('456'); //此行程式執行時，需以任意方式顯示文字"John：456"在瀏覽者眼前

/************************
第四題結束
************************/

/************************
第五題
提示：依題目需求設計isStudent、studyHard、showScore function
關鍵字：decorator pattern，method chain
************************/

function studyHard() {
  this.score += 10;
  return this;
}
function showScore() {
  alert(this.name + ':' + this.score);
  return this;
}
function isStudent(obj) {
  obj.studyHard = studyHard;
  obj.showScore = showScore;
}
var Admn = {
  name: 'Admn',
  score: 50
};
isStudent(Admn);
Admn
  .studyHard()
  .showScore()   //此行程式執行時，需以任意方式顯示文字"Admn:60"在瀏覽者眼前
  .studyHard()
  .studyHard()
  .showScore();  //此行程式執行時，需以任意方式顯示文字"Admn:80"在瀏覽者眼前

/************************
第五題結束
************************/