/**
 * セッションタイマー（GAS版）
 * 設定（セッション・指示・アラームなど）を、使っている人のGoogleアカウントに保存します。
 * 同じGoogleアカウントなら、どのパソコンで開いても同じ設定になります。
 */
const STATE_KEY = 'session-timer-state';
const CHUNK = 2000; // 1つの保存枠に入れる文字数（日本語でも上限9KBを超えない大きさ）

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('セッションタイマー')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** 保存してある設定を読み込む（なければ null） */
function loadState() {
  const props = PropertiesService.getUserProperties();
  const n = Number(props.getProperty(STATE_KEY + ':n') || 0);
  if (!n) return null;
  let json = '';
  for (let i = 0; i < n; i++) json += props.getProperty(STATE_KEY + ':' + i) || '';
  return json;
}

/** 設定を保存する */
function saveState(json) {
  if (typeof json !== 'string' || json.length > 300000) throw new Error('保存できない大きさです');
  JSON.parse(json); // 壊れたデータは保存しない
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getUserProperties();
    const old = Number(props.getProperty(STATE_KEY + ':n') || 0);
    const data = {};
    let n = 0;
    for (let i = 0; i < json.length; i += CHUNK) data[STATE_KEY + ':' + (n++)] = json.slice(i, i + CHUNK);
    data[STATE_KEY + ':n'] = String(n);
    props.setProperties(data, false);
    for (let i = n; i < old; i++) props.deleteProperty(STATE_KEY + ':' + i);
  } finally {
    lock.releaseLock();
  }
  return true;
}
