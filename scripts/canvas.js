const MEMBER_FILE = {
  default: "trainee_info.ko.csv",
  ja : "trainee_info.ja.csv"
}
const FILE_VERSION = "202212292256";
const CURRENT_BORDER = 97;
const CURRENT_RANK_COLUMN = 100;
const CANVAS_SCALE = 2;
const ICON_WIDTH = 65;
const ICON_PREFIX = "assets/trainees/";
const ICON_DEFAULT_IMAGE = ICON_PREFIX+"emptyrank.png";
const ICON_BORDER = 2;
const ICON_DEFAULT_LINE_COLOR = "#707070";
const ICON_LINE_COLOR = {
     a: "#f7abc5",
     b: "#f47f22",
     c: "#f6d12f",
     d: "#42b96d",
     f: "#a6a6a4",
     n: "#707070"
}
const ICON_RANK_FONT_SIZE = 10;
const ICON_RANK_FONT_COLOR = "#fff";
const ICON_RANK_BG_COLOR = "#0086ff";
const ICON_RANK_NAME_SIZE = 11;
const PYRAMID_PADDING_X = 40;
const PYRAMID_PADDING_Y = 40;
const HEADER_HEIGHT = 60;
const HEADER_MARGIN = HEADER_HEIGHT + PYRAMID_PADDING_Y / 2;
const HEADER_IMG = "assets/header.png?202102042312"
const PYRAMID_ROWS = [1, 2, 3, 5];
const PYRAMID_MAX = 11; // sum of PYRAMID_ROWS
const CODE_LENGTH = 6;
const CODE_PARAM = "r";

const FONT_DEFAULT = "'Noto Sans JP', 'Open Sans', sans-serif";

let trainees = [];
let draggingStart = {};
var picks = [];

function readFromCSV(path, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", path, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status === 0) {
        let allText = rawFile.responseText;
        let out = CSV.parse(allText);
        let trainees = convertCSVArrayToTraineeData(out);
        callback(trainees);
      }
    }
  };
  rawFile.send(null);
}

function convertCSVArrayToTraineeData(csvArrays) {
  const trainees = {};
  csvArrays.forEach(traineeArray => {
    const trainee = {};
    trainee.id = parseInt(traineeArray[0]) - 1;
    trainee.image = traineeArray[0] + ".png";
    trainee.name = traineeArray[1];
    trainee.name_sub = traineeArray[2];
    trainee.rank = traineeArray[CURRENT_RANK_COLUMN] || 1;
    trainee.eliminated = trainee.rank > CURRENT_BORDER; // t if eliminated
    trainee.grade = "n";
    trainee.birth = traineeArray[3];
    trainee.height = traineeArray[4];
    trainee.group = traineeArray[6];
    trainee.company = traineeArray[6];
    trainee.birthplace = traineeArray[7] || "";
    trainee.hobby = traineeArray[8];
    trainee.skills = traineeArray[9];
    trainee.comment = traineeArray[10];
    trainees[trainee.id] = trainee;
  });
  return trainees;
}

function zeroPadding(num, length){
  var tempNum = num;
  for(let i = 0;i < length+1; i++){
    tempNum = '0' + tempNum;
  }
  return tempNum.slice(-length);
}

function drawString(ctx, text, posX, posY, fontSize = 16, textColor = '#000000', align = "start", maxWidth) {
	ctx.save();
	ctx.font = fontSize + "px " + FONT_DEFAULT;
	ctx.fillStyle = textColor;
  ctx.textAlign = align;
  ctx.fillText(text, posX, posY, maxWidth);
	ctx.restore();
}

function getDateString() {
  var today = new Date();
  return today.getFullYear()
         + "/" + zeroPadding(today.getMonth() + 1, 2)
         + "/" + zeroPadding(today.getDate() , 2)
         + " " + zeroPadding(today.getHours() , 2)
         + ":" + zeroPadding(today.getMinutes(), 2) ;
}

function processPyramidCell(processCell){
  for (let i = 0; i < PYRAMID_ROWS.length; i++) {
    const row_icons_size = PYRAMID_ROWS[i];
    for(let j = 0; j < row_icons_size; j++){
      let rank_sum = 0;
      for(let k = 0; k < i; k++){
       rank_sum += PYRAMID_ROWS[k];
      }
      const rank = rank_sum + j;
      processCell(row_icons_size, i, j, rank)
    }
  }
}

function putTraineeCell(ctx, width, height, row_icons_size, i, j, trainee, rank) {
  // pixel
  const pCenterX = (width - ICON_WIDTH  * (row_icons_size - 1) - PYRAMID_PADDING_X * (row_icons_size - 1)) / 2  + ICON_WIDTH * j + PYRAMID_PADDING_X * j;
  const pCenterY = i * (ICON_WIDTH + PYRAMID_PADDING_Y) + ICON_WIDTH / 2+ HEADER_MARGIN;
  const pLeftX = (width - ICON_WIDTH  * (row_icons_size) - PYRAMID_PADDING_X * (row_icons_size - 1)) / 2 + ICON_WIDTH * j + PYRAMID_PADDING_X * j;
  const pLeftY = i * (ICON_WIDTH + PYRAMID_PADDING_Y)+ HEADER_MARGIN;
  const borderColor = trainee != null ? (showEliminated && trainee.eliminated) ? ICON_LINE_COLOR["n"] : ICON_LINE_COLOR[trainee.grade]
                                       : ICON_DEFAULT_LINE_COLOR;

  // reset name
  ctx.fillStyle = '#fff';
  ctx.fillRect(pLeftX - PYRAMID_PADDING_X / 2,
               pLeftY + ICON_WIDTH,
               ICON_WIDTH + PYRAMID_PADDING_X,
               PYRAMID_PADDING_Y - ICON_BORDER);

  const chara = new Image();
  chara.src = trainee != null ? ICON_PREFIX + trainee.image : ICON_DEFAULT_IMAGE

  chara.onload = () => {
    ctx.save();
    ctx.arc(pCenterX, pCenterY, ICON_WIDTH / 2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(chara, pLeftX, pLeftY, ICON_WIDTH, ICON_WIDTH);
    ctx.restore();

    if (trainee != null && showEliminated && trainee.eliminated) {
      let grayTarget = ctx.getImageData(pLeftX * 2, pLeftY * 2, ICON_WIDTH*2, ICON_WIDTH*2);
      let grayTargetData = grayTarget.data;
      for (let k = 0; k < grayTargetData.length; k += 4) {
        let y = 0.2126 *  grayTargetData[k] + 0.7152 *grayTargetData[k + 1]  + 0.0722 * grayTargetData[k + 2]
        y = parseInt(y, 10)

        const avg = (grayTargetData[k] + grayTargetData[k + 1] + grayTargetData[i + 2]) / 3;
        grayTargetData[k] = grayTargetData[k + 1] = grayTargetData[k + 2] = y;

      }
      ctx.putImageData(grayTarget, pLeftX * 2, pLeftY * 2);
    }

    // border
    if(trainee != null) {
      ctx.beginPath();
      ctx.arc(pCenterX, pCenterY, ICON_WIDTH / 2 - ICON_BORDER /2, 0, Math.PI*2);
      ctx.closePath();
      ctx.strokeStyle = (showEliminated && trainee.eliminated) ? ICON_LINE_COLOR["n"] : ICON_LINE_COLOR[trainee.grade];
      ctx.lineWidth = ICON_BORDER;
      ctx.stroke();
    }

    // put rank
    ctx.beginPath();
    ctx.arc(pCenterX, pCenterY + ICON_WIDTH / 2, ICON_RANK_FONT_SIZE / 2 + 1, 0, Math.PI*2);
    ctx.fillStyle = ICON_RANK_BG_COLOR;
    ctx.fill() ;
    ctx.strokeStyle = ICON_RANK_BG_COLOR;
    ctx.lineWidth = 0;
    ctx.stroke();
    drawString(ctx, rank + 1, pCenterX, pCenterY + ICON_WIDTH / 2 + ICON_RANK_FONT_SIZE / 2 - 1, ICON_RANK_FONT_SIZE, ICON_RANK_FONT_COLOR, "center")
  };

  // put name
  drawString(ctx,
            trainee != null ? trainee.name : "",
            pCenterX,
            pCenterY + ICON_WIDTH/2 + ICON_RANK_FONT_SIZE * 2,
            ICON_RANK_NAME_SIZE,
            "#000",
            "center",
            ICON_WIDTH + PYRAMID_PADDING_X - 10)

}

function drawPicture(ctx, width, height, picks){
  // background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // header
  const headerImg = new Image();
  headerImg.src = HEADER_IMG;
  headerImg.onload = () => {
    ctx.drawImage(headerImg, 0, 0, width, HEADER_HEIGHT);
  }

  // date
  drawString(ctx, 'at '+getDateString(),  width - 5,  height - 20, 12, "#000","end")

  // draw picture
  processPyramidCell((row_icons_size, i, j, rank) => {
    const trainee = picks[rank] !== 'undefined' && picks[rank] != null && typeof trainees[picks[rank]] !== 'undefined'
              ? trainees[picks[rank]] : null;
    putTraineeCell(ctx, width, height, row_icons_size, i, j, trainee, rank)
  })
}

function createCanvas(picks = [], isReset = false) {
  var canvas = document.getElementById('ranking__pyramid-canvas');
  if (!isReset) {
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onClickCanvas, false);
  }
  if (canvas.getContext){
    const ctx = canvas.getContext("2d");
    if ( !isReset ) {
      ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
    }else{
      ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    }
    drawPicture(ctx, canvas.width / CANVAS_SCALE , canvas.height / CANVAS_SCALE, picks)
  }
}

function updateCanvas(picksToBe, isForce = false) {
  var canvas = document.getElementById('ranking__pyramid-canvas');
  if (canvas.getContext){
    const ctx = canvas.getContext("2d");
    // draw picture
    processPyramidCell((row_icons_size, i,j, rank) => {
        if(picks[rank] !== picksToBe[rank] || isForce){
          const trainee = picksToBe[rank] !== 'undefined' && picksToBe[rank] != null && typeof trainees[picksToBe[rank]] !== 'undefined'
                    ? trainees[picksToBe[rank]] : null;
          putTraineeCell(ctx, canvas.width / CANVAS_SCALE, canvas.height / CANVAS_SCALE, row_icons_size, i, j, trainee, rank)
        }
    })
    picks = picksToBe;
  }
}

function download(event){
    let canvas = document.getElementById("ranking__pyramid-canvas");

    let link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `p101js2_${new Date().getTime()}.jpg`;
    link.click();
}

function deletePick(rank){
  const picksToBe = picks.slice(0, picks.length);
  const target = picksToBe[rank];
  deleteEntryPick(target);
  picksToBe[rank] = null;
  changePicks(picksToBe);
}

function switchPick(start, end){
  const picksToBe = picks.slice(0, picks.length);
  const tmpPick = picksToBe[start];
  picksToBe[start] = picksToBe[end];
  picksToBe[end] = tmpPick;
  changePicks(picksToBe);
}

function changePicks(picksToBe){
  const code = encodePicks(picksToBe);
  changeUrlBox(code);
  setPickToCookie(code)
  updateCanvas(picksToBe);
}

function encodePicks(picksArr){
  let code = "";
  for (let j = 0; j < PYRAMID_MAX; j++) {
    const rank = (typeof picksArr[j] === 'undefined' || picksArr[j] == null ) ? 0 : picksArr[j] + 1;
    code = code + zeroPadding(rank.toString(32), 2);
  }
  return code;
}

function decodePicks(code){
  let picksArr = [];
  for (let j = 0; j < PYRAMID_MAX; j ++) {
    const v = parseInt(code.substr( j * 2, 2), 32);
    if (v === 0) {
      picksArr[j] = null;
    }else{
      picksArr[j] = v - 1;
    }
  }
  return picksArr;
}

function getRankFrom(width, point){
  const x = point.x;
  const y = point.y;
  let result = null;
  processPyramidCell((row_icons_size, i, j, rank) => {
   const cellArea = {
     x: (width- (ICON_WIDTH + PYRAMID_PADDING_X) * row_icons_size + PYRAMID_PADDING_X) / 2 + (ICON_WIDTH + PYRAMID_PADDING_X) * j,
     xEnd: (width - (ICON_WIDTH + PYRAMID_PADDING_X) * row_icons_size + PYRAMID_PADDING_X) /2 + (ICON_WIDTH + PYRAMID_PADDING_X) * j + ICON_WIDTH,
     y:  i * (ICON_WIDTH + PYRAMID_PADDING_Y) + HEADER_MARGIN,
     yEnd:  i * (ICON_WIDTH + PYRAMID_PADDING_Y) + HEADER_MARGIN + ICON_WIDTH,
   }
   if(x >= cellArea.x && x <= cellArea.xEnd && y >= cellArea.y && y <= cellArea.yEnd) {
      result = rank;
   }
  });
  return result;
}

function onClickCanvas(e){
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  const point = {
   x: (e.clientX - rect.left) * e.target.width / (CANVAS_SCALE * e.target.clientWidth),
   y: (e.clientY - rect.top) * e.target.width / (CANVAS_SCALE * e.target.clientWidth)
  }
  const rank = getRankFrom(e.target.width / CANVAS_SCALE, point)
  if (typeof draggingStart.x !== 'undefined') {
    const startRank = getRankFrom(e.target.width / CANVAS_SCALE, draggingStart)
    if(startRank == rank){
      deletePick(rank);
    }else if(startRank != null && rank != null){
      switchPick(startRank, rank);
    }
    draggingStart = {};
  }
}

function onMouseDown(e){
  const rect = e.target.getBoundingClientRect();
  if (typeof draggingStart.x === 'undefined') {
    draggingStart = {
      x: (e.clientX - rect.left) * e.target.width / (CANVAS_SCALE * e.target.clientWidth),
      y: (e.clientY - rect.top) * e.target.width / (CANVAS_SCALE * e.target.clientWidth)
    }
  }
}

function getSetLang() {
  let urlParams = new URLSearchParams(window.location.search);
  let lang = "en";
  if (urlParams.get("lang")) {
    if (urlParams.get("lang") === "ja") {
      lang = "ja";
    }
  } else if ((window.navigator.userLanguage || window.navigator.language ||
              window.navigator.browserLanguage).substr(0, 2) === "ja") {
    lang = "ja";
  }

  document.documentElement.lang = lang;
  return lang;
}

function initRanking(){
  var urlParams = new URLSearchParams(window.location.search);
  const cookie = getPickFromCookie();
  if (urlParams.has(CODE_PARAM)) {
    const code = urlParams.get(CODE_PARAM)
    picks = decodePicks(code);
  } else if (typeof cookie !== 'undefined') {
    picks = decodePicks(cookie)
  }
  console.log("load picks: " + picks);
  changeUrlBox(encodePicks(picks));
}

const lang = getSetLang();

initRanking();

const file = MEMBER_FILE[lang] || MEMBER_FILE["default"]

readFromCSV(file,
            (t) => {
              trainees = t;
              createCanvas(picks);
              renderBox(trainees, picks);
              addEventToTools(trainees);
            });

document.getElementById("ranking__pyramid-tools-dl").onclick = download
