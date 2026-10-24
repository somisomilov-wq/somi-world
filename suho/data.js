// 수호 월드 이야기: 16개 경기장, 인물 대사, 안내 음성
// 대사는 모두 voice/lines.json 으로 모아서 AI 음성 파일을 만듦 (tools/make_voices.py)
(function () {
  // unit: 기록 단위(목소리로 읽음), lower: 작을수록 좋은 기록(시간), target: 코인을 받는 목표, fmt: 화면에 보이는 모양
  const VENUES = [
    { id: 'archery', icon: 'archery', host: '햇살반선생님', unit: '점', target: 30, name: '양궁장',
      talk: ['수호야, 양궁장에 온 걸 환영해!', '과녁이 왔다 갔다 움직여. 가운데에 왔을 때 스페이스바를 눌러서 화살을 쏴!', '화살은 다섯 개야. 30점을 넘으면 코인을 줄게!'], keys: ['space'] },
    { id: 'soccer', icon: 'soccer', host: '동원', unit: '골', target: 3, name: '축구장',
      talk: ['수호야, 축구하자! 내가 골키퍼 할게!', '왼쪽 오른쪽 방향키로 찰 곳을 고르고, 스페이스바로 뻥 차!', '다섯 번 차서 세 골을 넣으면 코인이야!'], keys: ['left', 'right', 'space'] },
    { id: 'baseball', icon: 'baseball', host: '아빠', unit: '점', target: 8, name: '야구장',
      talk: ['수호야, 아빠랑 야구 한판 하자!', '아빠가 공을 던지면, 공이 수호 앞에 왔을 때 스페이스바를 눌러서 방망이를 휘둘러!', '홈런은 3점, 안타는 1점이야. 8점을 넘으면 코인!'], keys: ['space'] },
    { id: 'tennis', icon: 'tennis', host: '소미누나', unit: '개', target: 10, name: '테니스장',
      talk: ['수호야, 누나랑 테니스 치자!', '왼쪽 오른쪽 방향키로 공 있는 데로 가서, 공이 오면 스페이스바를 눌러 쳐!', '공을 10개 넘기면 코인이야. 세 번 놓치면 끝!'], keys: ['left', 'right', 'space'] },
    { id: 'fishing', icon: 'fishing', host: '아빠', unit: '마리', target: 4, name: '낚시터',
      talk: ['수호야, 아빠랑 낚시하자!', '스페이스바를 누르면 낚싯대를 던져. 찌가 쏙 들어가면 얼른 스페이스바!', '그다음 스페이스바를 다다다 눌러서 물고기를 끌어올려! 4마리 잡으면 코인!'], keys: ['space'] },
    { id: 'handball', icon: 'handball', host: '시현', unit: '골', target: 6, name: '핸드볼장',
      talk: ['수호야, 핸드볼 하자! 내가 골키퍼야!', '위 아래 방향키로 움직이고, 스페이스바를 누르면 공을 던져!', '6골을 넣으면 코인이야!'], keys: ['up', 'down', 'space'] },
    { id: 'basketball', icon: 'basketball', host: '예나', unit: '골', target: 8, name: '농구장',
      talk: ['수호야, 농구 같이 하자!', '힘 막대가 올라갔다 내려갔다 해. 초록색에 왔을 때 스페이스바를 눌러 슛!', '8골을 넣으면 코인이야!'], keys: ['space'] },
    { id: 'running', icon: 'running', host: '햇님반선생님', unit: '초', lower: true, target: 15, name: '달리기 경기장',
      talk: ['수호야, 친구들이랑 달리기 시합하자!', '스페이스바를 다다다다 빨리 누르면 빨리 달려!', '15초 안에 결승선에 들어오면 코인이야!'], keys: ['space'] },
    { id: 'shotput', icon: 'shotput', host: '아빠', unit: '미터', target: 8, name: '투포환 경기장',
      talk: ['수호야, 투포환은 힘이 세야 해!', '스페이스바를 다다다 눌러서 힘을 모으고, 화살표가 위로 비스듬히 올라갔을 때 한 번 더 눌러서 던져!', '세 번 던질 수 있어. 8미터를 넘으면 코인!'], keys: ['space'] },
    { id: 'bowling', icon: 'bowling', host: '엄마', unit: '개', target: 18, name: '볼링장',
      talk: ['수호야, 엄마랑 볼링 치자!', '공이 왔다 갔다 해. 가운데에 왔을 때 스페이스바를 눌러서 굴려! 굴러갈 때 방향키로 살짝 움직일 수 있어.', '세 번 굴려서 핀을 18개 넘어뜨리면 코인!'], keys: ['left', 'right', 'space'] },
    { id: 'eating', icon: 'eating', host: '엄마', unit: '초', lower: true, target: 25, name: '식당',
      talk: ['수호야, 맛있는 밥 먹자!', '반찬이 나온 쪽 방향키를 누르면 냠냠 먹어. 국이 나오면 스페이스바!', '25초 안에 다 먹으면 코인이야! 골고루 먹자!'], keys: ['up', 'down', 'left', 'right', 'space'] },
    { id: 'seesaw', icon: 'seesaw', host: '소미누나', unit: '개', target: 10, name: '시소 놀이터',
      talk: ['수호야, 누나랑 시소 타자!', '수호 쪽이 땅에 쿵 닿을 때 스페이스바를 누르면 높이 올라가!', '별을 10개 모으면 코인이야!'], keys: ['space'] },
    { id: 'slide', icon: 'slide', host: '예나', unit: '개', target: 12, name: '미끄럼틀 놀이터',
      talk: ['수호야, 미끄럼틀 타자!', '위쪽 방향키를 눌러서 사다리를 올라가!', '미끄럼틀을 탈 때 스페이스바를 누르면 점프해서 별을 잡아. 별 12개면 코인!'], keys: ['up', 'space'] },
    { id: 'swimming', icon: 'swimming', host: '시현', unit: '초', lower: true, target: 12, name: '수영장',
      talk: ['수호야, 나랑 수영 시합하자!', '왼쪽 오른쪽 방향키를 번갈아 누르면 팔을 저어서 앞으로 가!', '12초 안에 도착하면 코인이야!'], keys: ['left', 'right'] },
    { id: 'volleyball', icon: 'volleyball', host: '햇님반선생님', unit: '개', target: 8, name: '배구장',
      talk: ['수호야, 친구들이랑 배구하자!', '공 그림자 아래로 방향키로 가서, 공이 내려오면 스페이스바를 눌러 톡 올려 줘!', '8번 받으면 코인이야. 세 번 떨어뜨리면 끝!'], keys: ['left', 'right', 'space'] },
    { id: 'longjump', icon: 'longjump', host: '햇살반선생님', unit: '미터', target: 3, name: '멀리뛰기 경기장',
      talk: ['수호야, 멀리뛰기 해 볼까?', '스페이스바를 다다다 눌러서 달리다가, 하얀 선 앞에서 위쪽 방향키를 눌러서 점프!', '선을 넘으면 안 돼. 3미터를 넘게 뛰면 코인!'], keys: ['space', 'up'] }
  ];
  const byId = {}; VENUES.forEach(v => byId[v.id] = v);

  // 마을 사람들: 말을 걸면 하는 말 (아이콘은 말풍선에 그려짐)
  const TOWN_TALK = {
    '엄마': [['수호야, 사랑해!', 'heart'], ['식당에 가서 밥 빨리 먹기 해 볼까?', 'eating'], ['볼링장에서 엄마랑 볼링 치자!', 'bowling']],
    '아빠': [['수호야, 아빠랑 야구 한판 할까?', 'baseball'], ['낚시터에서 큰 물고기 잡으러 가자!', 'fishing'], ['투포환은 힘이 세야 해. 수호는 힘이 세지?', 'shotput']],
    '소미누나': [['수호야, 누나랑 테니스 치자!', 'tennis'], ['시소 같이 타자!', 'seesaw'], ['우리 수호 최고!', 'heart']],
    '동원': [['수호야, 축구하자!', 'soccer'], ['달리기 시합하자! 내가 이길 거야!', 'running']],
    '예나': [['수호야, 미끄럼틀 타러 가자!', 'slide'], ['농구 같이 하자!', 'basketball']],
    '시현': [['수영장 물이 시원해!', 'swimming'], ['핸드볼 진짜 재밌어!', 'handball']],
    '햇살반선생님': [['수호야, 양궁 해 봤니?', 'archery'], ['멀리뛰기 경기장에 가 볼까?', 'longjump'], ['유치원에 들어가면 수호 기록을 볼 수 있어!', 'trophy']],
    '햇님반선생님': [['달리기 경기장에서 친구들이 기다려!', 'running'], ['배구장에 가 보자!', 'volleyball']]
  };

  const SAY = {
    title: [['안내', '수호월드!'], ['안내', '스페이스바를 눌러 봐!']],
    start: [['햇살반선생님', '수호야, 안녕! 여기는 수호월드야!'], ['햇님반선생님', '방향키로 걸어 다니면서 경기장에 들어가 봐! 친구들한테 가서 스페이스바를 누르면 이야기할 수 있어.']],
    welcomeBack: [['햇살반선생님', '수호야, 또 왔구나! 오늘도 신나게 놀자!']],
    records: [['햇님반선생님', '여기는 수호의 기록실이야! 수호가 세운 기록이 다 모여 있어.']],
    ready: ['안내', '준비됐으면 스페이스바를 눌러!'],
    count: [['안내', '셋'], ['안내', '둘'], ['안내', '하나'], ['안내', '시작!']],
    finish: ['안내', '끝!'],
    goal: ['안내', '목표 달성! 코인 하나!'],
    record: ['안내', '새 기록이야! 코인 하나 더!'],
    firstRecord: ['안내', '첫 기록이야!'],
    almost: ['안내', '아깝다! 다시 해 볼까?'],
    good: ['안내', '잘했어!'],
    choose: ['안내', '다시 할까? 마을로 갈까?'],
    recordIs: ['안내', '수호 기록은'],
    nice: ['안내', '좋아!'],
    great: ['안내', '최고야!'],
    oops: ['안내', '괜찮아!'],
    homerun: ['아빠', '홈런이다!'],
    hitBall: ['아빠', '안타!'],
    fish: ['아빠', '와, 물고기다!'],
    foul: ['햇살반선생님', '앗, 선을 넘었어!'],
    goalIn: ['동원', '골인! 수호 잘한다!'],
    saved: ['동원', '막았다!'],
    win1: ['햇님반선생님', '수호가 일등이야!'],
    eatDone: ['엄마', '골고루 다 먹었네! 최고!']
  };
  // 숫자 + 단위 (기록 읽기용)
  const UNIT_RANGE = { '점': [0, 50], '골': [0, 20], '개': [0, 40], '마리': [0, 15], '초': [1, 99], '미터': [0, 20] };
  function numberLine(v, unit) { return ['안내', Math.round(v) + unit]; }

  // 모든 대사 목록 (음성 파일 만들기용)
  function allLines() {
    const out = [], seen = {};
    const add = (w, t) => { const k = w + '|' + t; if (!seen[k]) { seen[k] = 1; out.push([w, t]); } };
    VENUES.forEach(v => v.talk.forEach(t => add(v.host, t)));
    Object.entries(TOWN_TALK).forEach(([w, ls]) => ls.forEach(([t]) => add(w, t)));
    Object.values(SAY).forEach(x => (Array.isArray(x[0]) ? x : [x]).forEach(([w, t]) => add(w, t)));
    Object.entries(UNIT_RANGE).forEach(([u, [a, b]]) => { for (let i = a; i <= b; i++) add('안내', i + u); });
    return out;
  }

  window.SUHO = { VENUES, byId, TOWN_TALK, SAY, numberLine, allLines };
})();
