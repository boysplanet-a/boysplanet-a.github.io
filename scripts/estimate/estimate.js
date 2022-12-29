// give me power!!!!!!

let estimateCache = {};
let estimateFightCount = 0;

function estimateFight(l, r) {
  const key = l <= r ? `${l},${r}` : `${r},${l}`;
  const cache = estimateCache[key];
  if (typeof cache !== "undefined") {
    return l === cache;
  }
  estimateFightCount++;
  if (l > r) {
    estimateCache[key] = l;
    return true;
  } else {
    estimateCache[key] = r;
    return false;
  }
}

function getEstimateEHeap(numbers, root, bottom) {
  let l_idx = (root * 2) + 1;
  let r_idx = (root * 2) + 2;

  let maxChild;

  if (l_idx <= bottom) {
    if (estimateFight(numbers[l_idx], numbers[root])) {
      maxChild = l_idx;
    } else {
      maxChild = root;
    }
  } else {
    maxChild = root;
  }

  if (r_idx <= bottom) {
    if (estimateFight(numbers[r_idx], numbers[root])) {
      maxChild = r_idx;
    }
  }

  if (maxChild !== root) {
    const temp = numbers[root];
    numbers[root] = numbers[maxChild];
    numbers[maxChild] = temp;
    getEstimateEHeap(numbers, maxChild, bottom);
  }
}

function getEstimateHeap(pool, top) {
  if (pool < top) {
    return -1;
  }
  let attendeesSorted = [];
  estimateCache = {};
  estimateFightCount = 0;
  for (let i = 0; i < pool; i++) {
    attendeesSorted.push(i)
  }
  attendeesSorted = shuffle(attendeesSorted);

  for (let i = (pool + pool % 2) / 2 - 1; i >= 0; i--) {
    getEstimateEHeap(attendeesSorted, i, attendeesSorted.length - 1);
  }
  for (let i = attendeesSorted.length - 1; i > attendeesSorted.length - top - 1; i--) {
    let temp = attendeesSorted[0];
    attendeesSorted[0] = attendeesSorted[i];
    attendeesSorted[i] = temp;
    getEstimateEHeap(attendeesSorted, 0, i - 1);
  }

  return estimateFightCount;
}

function getEstimateERank(pool) {
  const newPool = [];
  for (let i = 0; i < (pool.length - pool.length % 2) / 2; i++) {
    newPool.push(estimateFight(pool[i * 2], pool[i * 2 + 1]) ? pool[i * 2] : pool[i * 2 + 1]);
  }
  if (pool.length % 2 !== 0) {
    newPool.push(pool[pool.length - 1])
  }
  return newPool;
}

function getEstimateRank(pool, top) {
  const max = pool < top ? pool : top;
  let attendeesSorted = [];
  estimateCache = {};
  estimateFightCount = 0;
  estimateRanking = [];
  for (let i = 0; i < pool; i++) {
    attendeesSorted.push(pool - i - 1);
  }

  for (let i = 0; i < max; i++) {
    for (let nextPool = attendeesSorted.slice(0, attendeesSorted.length); ;) {
      nextPool = getEstimateERank(nextPool);
      if (nextPool.length <= 1) {
        estimateRanking.push(nextPool[0]);
        attendeesSorted = attendeesSorted.filter(e => e !== nextPool[0]);

        break;
      }
      const n = nextPool.shift();
      nextPool.push(n);
    }
  }

  return estimateFightCount;
}
