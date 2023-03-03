const L_COOKIE_NAME = 'list';
const L_COOKIE_EXPIRES_SECOND = 3600 * 24 * 90; // 3month
const CURRENT_RANK_COLUMN = 12;
const CURRENT_BORDER = 52;
const MEMBER_FILE = {
  default: "trainee_info.ko.csv",
  ja : "trainee_info.ja.csv",
  en : "trainee_info.en.csv",
  "zh-CN": "trainee_info.zh-CN.csv",
  "zh-TW": "trainee_info.zh-TW.csv"
}
const FILE_VERSION = "202303031340";
const ICON_PREFIX = "assets/trainees_s/";

// Takes in name of csv and populates necessary data in table
function readFromCSV(path) {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", path, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status === 0) {
        let allText = rawFile.responseText;
        let out = CSV.parse(allText);
        let trainees = convertCSVArrayToTraineeData(out);
        renderList(trainees);
      }
    }
  };
  rawFile.send(null);
}

// Takes in an array of trainees and converts it to js objects
function convertCSVArrayToTraineeData(csvArrays) {
  trainees = csvArrays.map(function(traineeArray, index) {
    trainee = {};
    trainee.id = index;
    trainee.image = traineeArray[0] + ".png";
    trainee.name = traineeArray[1];
    trainee.name_sub = traineeArray[2];
    trainee.rank = traineeArray[CURRENT_RANK_COLUMN] || 1;
    trainee.eliminated = trainee.rank > CURRENT_BORDER; // t if eliminated
    trainee.grade = "n";
    trainee.birth = traineeArray[3];
    trainee.height = traineeArray[4];
    trainee.group = traineeArray[5];
    trainee.company = traineeArray[6];
    trainee.birthplace = traineeArray[7] || "";
    trainee.hobby = traineeArray[8];
    trainee.skills = traineeArray[9];
    trainee.comment = traineeArray[10];
    trainees[trainee.id] = trainee;
    return trainee;
  });
  filteredTrainees = trainees;
  return trainees;
}

// Uses populated local data structure from getRanking to populate ranking
function renderList(trainee) {
  let listTrainee = document.getElementById("trainee__list");
  for (let i = 0; i < trainee.length; i++) {
    listTrainee.insertAdjacentHTML("beforeend", renderListEntry(trainee[i]))
    document.getElementById("list__entry-trainee-"+ i)
      .addEventListener("click", function (event) {
        var currentGrade = getGradeOfTrainee(i);
        var hasA = false;
        for (let j = 0; j < trainee.length; j++) {
          if(getGradeOfTrainee(j) === "a"){
            hasA = true;
            break;
          }
        }
        var nextGrade = toggleGrade(currentGrade, hasA);
        setGradeToTrainee(i, nextGrade);
        setPickToCookie(getCurrentShareCode());
      });
  }
}

function getGradeOfTrainee(traineeIdToGet){
  var target = document.getElementById("list__entry-view-"+ traineeIdToGet);
  if(!target){
    return "no";
  }
  var targetClass = target.className;
  if(targetClass.includes("a-rank")){
    return "a";
  }
  if(targetClass.includes("b-rank")){
    return "b";
  }
  if(targetClass.includes("c-rank")){
    return "c";
  }
  return "no";
}

function setGradeToTrainee(traineeIdToSet, traineeGradeToSet){
  document.getElementById("list__entry-view-"+traineeIdToSet).className = traineeGradeToSet+"-rank";
}

function toggleGrade(currentGrade, hasA){
  if(currentGrade === "no"){
    return "c";
  }
  if(currentGrade === "c"){
    return "b";
  }
  if(currentGrade === "b"){
    if(hasA){
      return "no";
    }else{
      return "a";
    }
  }
  if(currentGrade === "a"){
    return "no";
  }
}

function renderListEntry(trainee) {
  var eliminatedClass = trainee.eliminated && "eliminated";
  const rankingEntry = `
  <div id="list__entry-trainee-${trainee.id}" class="list__entry ${eliminatedClass}" data-isEliminated="${trainee.eliminated}">
    <div id="list__entry-view-${trainee.id}" class="no-rank">
      <div class="list__entry-view">
        <div class="list__entry-icon">
          <img class="list__entry-img" src="${ICON_PREFIX}${trainee.image}" />
        </div>
      </div>
      <div class="list__row-text">
        <div class="name">${trainee.name}</div>
      </div>
    </div>
  </div>`;
  return rankingEntry;
}

const currentURL = "https://boysplanet-a.github.io/list.html";
const paramGroupNum = 15;
const paramGroupDigits = 6;
// Serializes the ranking into a string and appends that to the current URL
function generateShareLink() {
  var shareCode= getCurrentShareCode();
  shareURL = currentURL + "?p=" + shareCode;
  showShareLink(shareURL);
}

function getCurrentShareCode() {
  var shareCode= "";
  var tmpShareNum = 0;
  for (let j = 0; j < trainees.length + paramGroupNum - (trainees.length % paramGroupNum); j++) {
    var grade = getGradeOfTrainee(j);
    tmpShareNum = getGradeNum(grade) +  (tmpShareNum << 2);
    if((j+1) % paramGroupNum === 0){
      shareCode += zeroPadding(tmpShareNum.toString(32), paramGroupDigits); // 6 digits
      tmpShareNum = 0;
    }
  }
  return shareCode;
}

// return max 3 bit num
function getGradeNum(gradeStr){
  if(gradeStr === "a"){
    return 1;
  }
  if(gradeStr === "b"){
    return 2;
  }
  if(gradeStr === "c"){
    return 3;
  }
  return 0;
}

// return max 3 bit num
function getGradeFromNum(gradeNum){
  if(gradeNum === 1){
    return "a";
  }
  if(gradeNum === 2){
    return "b";
  }
  if(gradeNum === 3){
    return "c";
  }
  return "no";
}

function showShareLink(shareURL) {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.value = shareURL;
  document.getElementById("getlink-textbox").style.display = "block";
  document.getElementById("copylink-button").style.display = "block";
}

function copyLink() {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.select();
  document.execCommand("copy");
}

function setDate() {
  var today = new Date();
  var dateString = today.getFullYear()
                   + "/" + zeroPadding(today.getMonth() + 1, 2)
                   + "/" + zeroPadding(today.getDate() , 2)
                   + " " + zeroPadding(today.getHours() , 2)
                   + ":" + zeroPadding(today.getMinutes(), 2) ;

  document.getElementById("current_date").innerHTML = "at " + dateString;
}

function zeroPadding(num, length){
  var tempNum = num;
  for(let i = 0;i < length+1; i++){
    tempNum = '0' + tempNum;
  }
  return tempNum.slice(-length);
}

function setGrades() {
  var urlParams = new URLSearchParams(window.location.search);
  const lCookie = getPickFromCookie();
  if (urlParams.has("p")) {
    let rankString = urlParams.get("p");
    loadFromCode(rankString);
  } else if (typeof lCookie !== 'undefined') {
    loadFromCode(lCookie);
  }
}

function loadFromCode(rankString) {
  let k = 0;
  for (let i = 0; i < rankString.length; i += paramGroupDigits) {
    var groupValue = zeroPadding(parseInt(rankString.substr(i, paramGroupDigits), 32).toString(2), paramGroupNum * 2);
    for (let j = 0; j < groupValue.length; j += 2) {
      var traineeId = k++;
      if(traineeId >= trainees.length){
        break;
      }
      var traineeGrade = getGradeFromNum(parseInt(groupValue.substr(j, 2), 2));
      setGradeToTrainee(traineeId, traineeGrade);
    }
  }
}

function resetAll(){
 for (let i = 0; i < trainees.length; i++) {
   setGradeToTrainee(i, "no");
 }
 setPickToCookie("")
}

// Event handler for when user checks show eliminated
function showEliminatedClick(event) {
  console.log(event);
  let checkbox = event.target;
  if (checkbox.checked) {
      for (let i = 0; i < trainees.length; i++) {
        if(document.getElementById("list__entry-trainee-"+i).getAttribute("data-isEliminated") === "true" ){
          document.getElementById("list__entry-trainee-"+i).className = "list__entry eliminated";
        }
      }
  } else {
      for (let i = 0; i < trainees.length; i++) {
          document.getElementById("list__entry-trainee-"+i).className = "list__entry";
      }
  }
}

function getPickFromCookie() {
  var value = "; " + document.cookie;
  var parts = value.split("; " + L_COOKIE_NAME + "=");
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
}

function setPickToCookie(code){
  const d = new Date(new Date().getTime() + 1000 * L_COOKIE_EXPIRES_SECOND);
  document.cookie = L_COOKIE_NAME + '=' + code + '; expires=' + d.toGMTString() + ';';
}

function getSetLang() {
  let lang = getLangSetting()
  document.documentElement.lang = lang;
  return lang;
}

function getLangSetting() {
  let urlParams = new URLSearchParams(window.location.search);
  let langParamFull = (urlParams.get("lang") || window.navigator.userLanguage || window.navigator.language
                       || window.navigator.browserLanguage)
  let langParam = langParamFull.substring(0, 2)
  if (langParam === "ja" || langParam === "ko" ) {
    return langParam
  } else if(langParam === "zh" && (langParamFull === "zh-TW" || langParamFull === "zh-CN")) {
    return langParamFull
  }else {
    return "en"
  }
}

// holds the list of all trainees
var trainees = [];
// holds the list of trainees to be shown on the table
var filteredTrainees = [];
// holds true if using japanese
var isJapanese = false;

const lang = getSetLang();
const file = MEMBER_FILE[lang] || MEMBER_FILE["default"]

readFromCSV(file + "?" + FILE_VERSION);
//getRanking();
setDate();
setGrades();
