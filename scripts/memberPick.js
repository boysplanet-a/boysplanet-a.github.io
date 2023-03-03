let showEliminated = true;
let showTop11 = false;
let sortOrder;

const URL_PREFIX = "https://boysplanet-a.github.io/?r=";
const CHECKED_CLASS = "trainee_picker__container__entry-check";
const CHECKED_IMAGE = `<img class="${CHECKED_CLASS}" src="assets/check.png"/>`;
const C_COOKIE_NAME = 'c';
const C_COOKIE_EXPIRES_SECOND = 3600 * 24 * 90; // 3month

function clickEntry(trainee, element) {
  const picksToBe = picks.slice(0, picks.length);
  // delete if included
  for (let i = 0; i < PYRAMID_MAX; i++) {
    if (picks[i] === trainee.id) {
      picksToBe[i] = null;
      changePicks(picksToBe);
      element.getElementsByClassName(CHECKED_CLASS)[0].remove();
      return;
    }
  }
  // add
  for (let i = 0; i < PYRAMID_MAX; i++) {
    if (typeof picks[i] === 'undefined' || picks[i] === null || typeof trainees[picks[i]] === 'undefined') {
      picksToBe[i] = trainee.id;
      changePicks(picksToBe);
      element.insertAdjacentHTML("beforeend", CHECKED_IMAGE);
      return;
    }
  }
}

function deleteEntryPick(id){
  const picksToBe = picks.slice(0, picks.length);
  Array.from(document.getElementsByClassName('trainee_picker__container__entry'))
      .forEach(e =>{
        if(e.dataset.id == id){
          if(e.getElementsByClassName(CHECKED_CLASS).length > 0){
            e.getElementsByClassName(CHECKED_CLASS)[0].remove();
          }
        }
      });
}

function renderBox(trainees, picks){
  if(typeof sortOrder === 'undefined'){
    sortOrder = getSortOrder(trainees, "id", false);
  }
  const traineePicker = document.getElementById("trainee_picker__container");
  traineePicker.innerHTML = "";
  sortOrder.forEach(index =>{
    traineePicker.insertAdjacentHTML("beforeend", getTableEntryHTML(trainees[index], picks.includes(trainees[index].id)));
    let insertedEntry = traineePicker.lastChild;
    insertedEntry.addEventListener("click", event => {
      clickEntry(trainees[index], event.currentTarget.getElementsByClassName("trainee_picker__container__entry-icon")[0]);
    });
  });
}

function getTableEntryHTML(trainee, selected) {
  let eliminated = (showEliminated && trainee.eliminated) && "eliminated";
  const tableEntry = `
  <div class="trainee_picker__container__entry ${eliminated}" data-id="${trainee.id}">
    <div class="trainee_picker__container__entry-icon">
      <img class="trainee_picker__container__entry-img" src="assets/trainees_s/${trainee.image}" />
      <div class="trainee_picker__container__entry-icon-border ${trainee.group}-rank-border"></div>
      ${
        selected ? CHECKED_IMAGE: ""
      }
    </div>
    <div class="trainee_picker__container__entry-text">
      <span class="rank" style="display: none;">${trainee.rank}</span>
      <span class="name"><strong>${trainee.name}</strong></span>
      <span class="name sub">(${trainee.name_sub})</span>
      <div class="info">
        <span class="name sub">${trainee.company}</span>
      </div>
      <div class="info">
        <span class="name sub">${trainee.birth} ${trainee.birthplace} ${trainee.height}cm <a target="_blank" class="profile_link" href="${`https://service.mnet.world/boysplanet/artist/${trainee.id + 1}`}" onclick="event.stopPropagation();">Profile   <i class="fa-solid fa-up-right-from-square"></i>
</a> </span>
      </div>
    </div>
  </div>`;
  return tableEntry;
}

function getSortOrder(trainees, field, isReverse) {
  return Object.keys(trainees).sort((a, b) => {
      if (trainees[a][field] > trainees[b][field]) {
        return isReverse ? -1 : 1;
      } else if (trainees[a][field] === trainees[b][field]){
        return 0;
      } else {
        return isReverse? 1 : -1;
      }
    });
}

function searchMember(event) {
  const filterText = event.target.value.toLowerCase();
  sortOrder = Object.keys(trainees)
                    .filter(key => {
                       return includesIgnCase(trainees[key].name, filterText)
                               || includesIgnCase(trainees[key].name_sub, filterText);
                    })
  renderBox(trainees, picks)
}

function includesIgnCase(mainString, subString) {
  return mainString.toLowerCase().includes(subString.toLowerCase());
}

function changeUrlBox(code){
  document.getElementById("ranking__pyramid-tools-text").value = URL_PREFIX + code;
  document.getElementById("ranking__pyramid-tools-twitter").href =
      "https://twitter.com/intent/tweet?text=" + URL_PREFIX + code + "&hashtags=BoysPlanetRanker,boysplanet"
}

function getPickFromCookie() {
	var value = "; " + document.cookie;
	var parts = value.split("; " + C_COOKIE_NAME + "=");
	if (parts.length == 2) {
	  return parts.pop().split(";").shift();
	}
}

function setPickToCookie(code){
  const d = new Date(new Date().getTime() + 1000 * C_COOKIE_EXPIRES_SECOND);
  const cookieValue = C_COOKIE_NAME + '=' + code + '; expires=' + d.toGMTString() + ';';
  document.cookie = cookieValue;
}

function addEventToTools(trainees){
  document.getElementById("button__sortAZ").onclick =
    () => {
      sortOrder = getSortOrder(trainees, "id", false);
      renderBox(trainees, picks);
      document.getElementById("button__sort19").classList.remove('active');
      document.getElementById("button__sortAZ").classList.add('active');
    }
  document.getElementById("button__sort19").onclick =
    () => {
      sortOrder = getSortOrder(trainees, "rank", false);
      renderBox(trainees, picks);
      document.getElementById("button__sort19").classList.add('active');
      document.getElementById("button__sortAZ").classList.remove('active');
    }
  document.getElementById("button__filter").onclick =
    () => {
      showEliminated = !showEliminated;
      renderBox(trainees, picks);
      updateCanvas(picks, true);
      if(showEliminated){
        document.getElementById("button__filter").classList.add('active');
      } else{
        document.getElementById("button__filter").classList.remove('active');
      }
    }
  document.getElementById("ranking__pyramid-tools-copy").onclick =
    () => {
        const url = document.getElementById("ranking__pyramid-tools-text").value;
        const listener = function(e){
          e.clipboardData.setData("text/plain" , url);
          e.preventDefault();
          document.removeEventListener("copy", listener);
        };
        document.addEventListener("copy" , listener);
        document.execCommand("copy");
        alert("URL copied!");
    }

  // init
  document.getElementById("button__sortAZ").classList.add('active');
  if(showEliminated){
    document.getElementById("button__filter").classList.add('active');
  }

}
