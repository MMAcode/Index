let dueCount = 0;
let toLearnCount = 0;
const cards = db.collection('FlipCards');
const currentCardS = null;
let currentCard = {};
let currentCardID = null;
let wordOne = '';
let wordTwo = '';
const refresh = document.querySelector('#test');
const nextBt = document.querySelector('#b_next');
const threeBt = document.querySelector('#threeButtons');
let firstWordHTML = document.querySelector('#wordOne');
let secondWordHTML = document.querySelector('#wordTwo');
let clickHintCounter = 0;
let hintLettersToShow = '';


// levels - times
let arrayTimes = [];
let timeCounter = 3000;
for (let i = 1; i < 10; i++) {
  arrayTimes.push(timeCounter);
  timeCounter = timeCounter * 5;
}
// console.log('array of times for levels:');
// console.log(arrayTimes);




////////////////////////////// F SET UP
// F-update and Count Due
let updateAndCountDue = async data => {
  let now = new Date().getTime();
  dueCount = 0;
  // console.log('L1-1-1: starting "updateAndCountDue" in MAIN-ASYNC');
  data.docs.forEach(doc => {
    let card = doc.data();
    if (card.dueTime < now) {
      cards.doc(doc.id).update({ due: true });
      dueCount++;
    } else {
      cards.doc(doc.id).update({ due: false });
    }
  });
  console.log(`dueCount = ${dueCount}.`);
  // console.log('L1-1-1: finishing "updateAndCountDue" in MAIN-ASYNC');
  return dueCount;
};

// get current card from DUE
let getCardFromDue = async cards => {
  // console.log('L1-1-2: starting "getCardFromDue" in MAIN-ASYNC');
  let dataOrdered = await cards.where('due', '==', true).orderBy('lastSeen').get();
  // console.log('error content');
  currentCard = await dataOrdered.docs[0].data();
  currentCardID = dataOrdered.docs[0].id;
  // console.log('Most current DUE card:');
  // console.log(currentCard);
  // console.log(currentCardID);
  // console.log('L1-1-2: finishing "getCardFromDue" in MAIN-ASYNC');
  return currentCard;
}

// count "to learn" cards
let countToLearnCards = async (cards) => {
  toLearnCount = 0;
  // console.log('L1-1-3: STARTING counting "to learn" elements:');
  let dataToCount = await cards.where('mainStage', '==', 'to learn').get();
  toLearnCount = dataToCount.docs.length;
  console.log('L1-1-3: ENDING to learn counted:', toLearnCount);
  return toLearnCount;
};

// get "to learn" card
let getCardFromToLearn = async (cards) => {
  // console.log('L1-1-4 STARTING getting ToLEARN card.');
  let dataOfToLearnCards = await cards.where('mainStage', '==', 'to learn').get();
  currentCard = dataOfToLearnCards.docs[0].data();
  currentCardID = dataOfToLearnCards.docs[0].id;
  // console.log('L1-1-4 ENDING - Card from "to learn" cards:');
  // console.log(currentCard);
  // console.log(currentCardID);
  currentCard.mainStage = 'learning';
  return currentCard;
}

/////////////////////////////// F-Main async
let updateDataReturnCard = async () => {
  let data = await cards.get();
  dueCount = await updateAndCountDue(data);
  // console.log('L1-1 MAIN ASYNC: returned "dueCount"=', dueCount);
  if (dueCount > 0) {
    currentCard = await getCardFromDue(cards);
    // console.log('L1-1 MAIN ASYNC: returned "currentCard"=', currentCard);
    // console.log('L1-1 MAIN ASYNC:  "currentCardID"=', currentCardID);
    return currentCard;
  }
  else {
    let toLearnCount = await countToLearnCards(cards);
    console.log('L1-1 toLEarnCount RETURNED value:', toLearnCount);
    if (toLearnCount > 0) {
      currentCard = await getCardFromToLearn(cards);
      // console.log('L1-1 toLEARN card returned');
      // console.log(currentCard);
      // console.log(currentCardID);
      return currentCard;
    } else {
      return 'no card to use.';
    }
  }
}




///////////////////////////// UI
let assignWordsAndColours = (currentCard) => {
  // console.log('1.2.1.1 assign words');
  // console.log(currentCard.enCheck);
  let en = currentCard.enCheck;
  if (en) {
    wordOne = currentCard.czWord;
    wordTwo = currentCard.enWord;
    firstWordHTML.style.color = 'blue';
    secondWordHTML.style.color = 'red';
  } else {
    wordOne = currentCard.enWord;
    wordTwo = currentCard.czWord;
    firstWordHTML.style.color = 'red';
    secondWordHTML.style.color = 'blue';
  }
  // console.log('1.2.1.1 word 1 is:', wordOne);
  // console.log('1.2.1.1 word 2 is:', wordTwo);
}


let showThreeButtons = () => {
  nextBt.style.display = 'none';
  threeBt.style.display = 'flex';
}



let hintNotUsed = () => {
  console.log('checking cheating');
  console.log(clickHintCounter);
  if (clickHintCounter > 0) { return false }
  else { return true };
}
let updateCurrentCard = (e) => {
  let en = currentCard.enCheck;
  let lev = currentCard.level;
  if (e.target.parentNode.id === 'BtnDown') {
    lev = lev > 2 ? lev - 2 : 0;
  }
  if (e.target.parentNode.id === 'BtnStay') {
    lev = lev > 1 ? lev - 1 : 0;
  }
  if (e.target.parentNode.id === 'BtnUp') {

    if (hintNotUsed()) {
      if (en) {
        lev++;
        en = false;
      } else {
        en = true;
      }
    } else {
      alert('STOP CHEATING, I know you used a hint!;-)');
    }
  }

  currentCard.enCheck = en;
  currentCard.level = lev;

  let now = new Date().getTime();
  currentCard.lastSeen = now;
  currentCard.due = false;
  currentCard.dueTime = now + arrayTimes[lev];

  if (lev > 8) {
    currentCard.mainStage = 'learned';
    // console.log('card labeled learned');
    // console.log(currentCard);
    alert('Congrats -this card was added to "learned" pile.');
  }
}

let updateCardInFirebase = async () => {
  await cards.doc(currentCardID).update({
    enCheck: currentCard.enCheck,
    level: currentCard.level,
    lastSeen: currentCard.lastSeen,
    due: currentCard.due,
    dueTime: currentCard.dueTime,
    mainStage: currentCard.mainStage
  });
  // console.log(' card in FIREBASE updated');
}


// update ALL from second page to new card
let updateALL = async (e) => {
  // console.log('this was clicked:');
  // console.log(e.target.parentNode.id);

  updateCurrentCard(e);
  await updateCardInFirebase();
  // console.log('GOING TO UPDATE DATABASE AGAIN...');
  updateDatabaseTHEN_UI();
}



// HINTS on p1:   show LETTER on click as 
let ShowLetterOnClick = () => {
  clickHintCounter++;
  console.log('click counter in function:', clickHintCounter);
  let hintWord = wordTwo;
  // console.log('you just clicked on hint');
  if (clickHintCounter <= wordTwo.length) {
    hintLettersToShow += wordTwo[clickHintCounter - 1];
    secondWordHTML.textContent = hintLettersToShow + '...';
  }
  if (clickHintCounter > wordTwo.length) {
    secondWordHTML.textContent = hintLettersToShow;
  }
  // console.log('hintLettersToShow:', hintLettersToShow);
}

let ResetLettersOnClick = () => {
  clickHintCounter = 0;
  hintLettersToShow = '';

}

// PAGES
let showPageOne = () => {
  assignWordsAndColours(currentCard);
  firstWordHTML.textContent = wordOne;
  secondWordHTML.textContent = '...';
  nextBt.style.display = 'block';
  threeBt.style.display = 'none';
  // activating letter hints
  clickHintCounter = 0;
  console.log('current clickhintCouner=', clickHintCounter);
  hintLettersToShow = '';
  console.log('page one Activated');


  // secondWordHTML.onclick = ShowLetterOnClick();
  secondWordHTML.addEventListener('click', ShowLetterOnClick);

}

let showPageTwo = () => {
  console.log('Page two Activated.');
   // secondWordHTML.onclick = null;
  // secondWordHTML.removeEventListener();
  // secondWordHTML.removeEventListener('click', e => ResetLettersOnClick());
  console.log('clickHint listener SHOUND be removed');
  console.log('current clickhintCouner=', clickHintCounter);
  secondWordHTML.textContent = wordTwo;
  showThreeButtons();

}





let updateDatabaseTHEN_UI = () => {
  updateDataReturnCard().then((ans) => {
    // console.log('L1 "updateDataReturnCard" function finished.');
    ResetLettersOnClick();
    console.log('Card got from database:', ans, typeof ans);
    if (typeof ans === 'string') {
      console.log('string returned from main function');
      nextBt.style.display = 'none';
      threeBt.style.display = 'none';
      // alert('You are out of cards to learn./some may be waiting/. Add/Make new cards to learn.');
      if (window.confirm('You are out of cards to learn./some may be waiting/. Add/Make new cards to learn.')) {
        window.location.href = 'index.html';
      };
      // window.open(/index.html);
    }
    if (typeof ans === 'object') {
      showPageOne();
    }
    console.log('"updateDatabaseTHEN_UI" JUST FINISHING!!!!!!!!!!!!!!!!!!');
  });
}


//////////////////////////////// MAIN
refresh.style.display = 'none';

updateDatabaseTHEN_UI();
nextBt.addEventListener('click', e => { showPageTwo(); });
threeBt.addEventListener('click', ee => { updateALL(ee); })