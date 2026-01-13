<script setup>
import { ref, computed, onMounted, shallowRef, onUnmounted } from 'vue'

// setting
const CLIENT_ID = import.meta.env.VITE_TRAQ_CLIENT_ID
const REDIRECT_URL = window.location.origin
const accessToken = ref(localStorage.getItem('traq_token') || null)

// stamps
const allStamps = shallowRef([])
const activeIndex = ref(null)
const suggestions = ref([])

// questionnaire
const title = ref('アンケート')
const pairs = ref([
  { stamp: 'yes', stampId: '', description: 'YES' },
  { stamp: 'no', stampId: '', description: 'NO' }
])

// logic for authorization
const login = () => {
  const authURL = `https://q.trap.jp/api/v3/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}`
  window.location.href = authURL
}
const fetchStamps = async () => {
  if (!accessToken.value) return
  try {
    const response = await fetch('https://q.trap.jp/api/v3/stamps', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    })

    if (response.status === 401) {
      accessToken.value = null
      localStorage.removeItem('traq_token')
      return
    }
    const data = await response.json()
    if (Array.isArray(data)) {
      allStamps.value = data.map(s => ({ n : s.name, i : s.id }))
      pairs.value.forEach((pair, index) => {
        const match = allStamps.value.find(s => s.n === pair.stamp)
        if (match) pair.stampId = match.i
      })
    }
  } catch (err) {
    console.error('Auth error:', err)
  }
}
// クリックされた場所を判定して閉じる関数
const handleClickOutside = (event) => {
  // クリックされた要素が .stamp-container の中身でなければ、リストを閉じる
  if (!event.target.closest('.stamp-container')) {
    activeIndex.value = null
    suggestions.value = []
  }
}
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code') //

  if (code) {
    // 1. コードをトークンに交換
    const res = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })

    const data = await res.json()
    if (data.access_token) { //
      accessToken.value = data.access_token
      localStorage.setItem('traq_token', data.access_token)
      
      // 2. URLからcodeを消す（reloadは不要です）
      window.history.replaceState({}, document.title, "/")
      
      // 3. トークンが取れたら即座にフェッチ
      await fetchStamps()
    }
  } else if (accessToken.value) {
    // すでにトークンがある場合もフェッチする
    await fetchStamps()
  }
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

// 検索ロジック：入力があるたびに実行
const handleInput = (query, index) => {
  activeIndex.value = index
  const q = (query || '').trim().toLowerCase()
  
  if (!q) {
    suggestions.value = []
    return
  }

  const matches = []
  const data = allStamps.value // 1万件のデータ
  
  // 計算量 O(N) ですが、15件見つかった時点で終了させることで描画負荷を下げる
  for (let i = 0; i < data.length; i++) {
    if (data[i].n.toLowerCase().includes(q)) {
      matches.push(data[i])
    }
  }
  suggestions.value = matches

  const exactMatch = data.find(s => s.n === q)
  if (exactMatch) {
    pairs.value[index].stampId = exactMatch.i // ID(i)をセット
  }
}

// スタンプを選択した時の処理
const selectStamp = (index, s) => {
  pairs.value[index].stamp = s.n
  // 必要であれば ID も保存して画像表示に使う
  pairs.value[index].stampId = s.i 
  suggestions.value = []
  activeIndex.value = null
}

const isValid = computed(() => {
  // 1. タイトルが空（または空白のみ）でないか
  const isTitleValid = title.value.trim() !== ''

  // 2. 全てのペアが入力されているか
  // everyメソッドを使って、全ての要素が条件を満たすかチェックします
  const arePairsValid = pairs.value.length > 0 && pairs.value.every(item => 
    item.stamp.trim() !== '' && item.description.trim() !== ''
  )

  return isTitleValid && arePairsValid
})

// 2. 項目の追加・削除
const addPair = () => {
  pairs.value.push({ stamp: '', description: '' })
}

const removePair = (index) => {
  if (pairs.value.length > 1) {
    pairs.value.splice(index, 1)
  }
}

// 3. コピー用文字列の生成
const generatedText = computed(() => {
  let text = `@BOT_SimplePoll /poll -D "${title.value}"\n`
  
  pairs.value.forEach(item => {
    if (item.stamp || item.description) {
      text += `-s :${item.stamp}: -o "${item.description}"\n`
    }
  })
  
  return text
})

// 4. クリップボードコピー
const copyStatus = ref('結果をコピーする')
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedText.value)
    copyStatus.value = 'コピーしました！'
    setTimeout(() => copyStatus.value = '結果をコピーする', 2000)
  } catch (err) {
    alert('コピーに失敗しました')
  }
}
</script>

<template>
  <div class="app-container">
    <div v-if="!accessToken" class="login-screen">
      <p>traQ スタンプを利用するにはログインが必要です</p>
      <button @click="login" class="login-btn">
        traQ でログイン
      </button>
    </div>
    <div v-else>
      <h1>Schedule-Poll</h1>

      <p>
        BOT_SimplePoll を用いて日程調整などのアンケートをするためのテキストを生成します。
      </p>

      <div class="section">
        <label>タイトル</label>
        <input v-model="title" placeholder="Title" class="main-input">
      </div>

      <div class="section">
        <label>選択肢</label>
        <div v-for="(item, index) in pairs" :key="index" class="pair-row">
          <div class="stamp-preview">
            <img v-if="item.stampId" 
              :src="`https://q.trap.jp/api/v3/stamps/${item.stampId}/image`"
              class="stamp-preview-icon" loading="lazy">
            <span v-else class="no-stamp-preview"></span>
          </div>
          <div class="stamp-container">
            <input
              v-model="item.stamp"
              @input="handleInput(item.stamp, index)"
              @focus="handleInput(item.stamp, index)"
              @click="handleInput(item.stamp, index)"
              @blur="window.setTimeout(() => {
                if(activeIndex === index) activeIndex = null
              }, 200)"
              placeholder="stamp name"
              class="stamp-input"
            >

            <div v-if="activeIndex === index && suggestions.length > 0" class="suggestion-list">
              <div
                v-for="s in suggestions"
                :key="s.i"
                class="suggestion-item"
                @mousedown="selectStamp(index, s)"
              >
                <img :src="`https://q.trap.jp/api/v3/stamps/${s.i}/image`" class="stamp-icon" loading="lazy">
                <span>{{ s.n }}</span>
              </div>
            </div>
          </div>
          <input v-model="item.description" placeholder="description" class="desc-input">
          <button @click="removePair(index)" class="btn-remove" title="削除">×</button>
        </div>
        <button @click="addPair" class="btn-add">+ 項目を追加</button>
      </div>

      <div class="preview-section">
        <h3>プレビュー</h3>
        <pre class="preview-area">{{ generatedText }}</pre>
        <button @click="copyToClipboard" :disabled="!isValid" class="btn-copy">
          {{ copyStatus }}
        </button>
        <p v-if="!isValid" class="hint">※ 全ての項目を入力する必要があります</p>
      </div>
    </div>  
  </div>
</template>

<style scoped>
.app-container {
  max-width: 600px;
  margin: 1rem auto; /* 余白を少し調整 */
  padding: 0 15px;    /* 左右に余白を追加して端に張り付かないようにする */
  font-family: sans-serif;
  color: #333;
  box-sizing: border-box;
}
.section { margin-bottom: 1.5rem; }
label { display: block; font-weight: bold; margin-bottom: 0.5rem; }

.main-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }

.pair-row {
  display: flex;
  gap: 8px; /* 少し広げてタップしやすく */
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: nowrap; /* デフォルトは一行 */
}
.stamp-input { width: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.desc-input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }

.btn-add { background: #f0f0f0; border: 1px dashed #999; width: 100%; padding: 8px; cursor: pointer; border-radius: 4px; }
.btn-remove { background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; line-height: 1; }

.preview-section { margin-top: 2rem; border-top: 2px solid #eee; pt: 1rem; }
.preview-area { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; font-size: 0.9rem; }

.btn-copy { width: 100%; padding: 12px; background: #42b883; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; margin-top: 10px; }
.btn-copy:active { opacity: 0.8; }

/* ボタンが無効(disabled)の時のスタイル */
.btn-copy:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.hint { color: #666; font-size: 0.8rem; text-align: center; margin-top: 8px; }

.stamp-container { position: relative; width: 100px; flex-shrink: 0; }
.suggestion-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 250px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  z-index: 1000;
}
.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
}
.suggestion-item:hover { background: #f0f7f4; }
.stamp-icon { width: 24px; height: 24px; margin-right: 10px; }
.stamp-preview {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stamp-preview-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

@media (max-width: 480px) {
  .pair-row {
    display: flex;
    flex-wrap: wrap;       /* 要素を折り返せるようにする */
    gap: 8px;
    padding: 16px;
    padding-right: 40px;    /* 右上の削除ボタンと重ならないよう余白を確保 */
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 12px;
    position: relative;    /* 削除ボタンの配置基準 */
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    align-items: center;   /* 1行目の要素（画像と入力欄）の縦中央を揃える */
  }

  .stamp-preview {
    width: 32px;
    height: 32px;
    flex-shrink: 0;        /* 潰れないように固定 */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .stamp-container {
    flex: 1;               /* 残りの横幅をすべて使う */
    min-width: 100px;
    position: relative;    /* サジェストリストの基準 */
  }

  /* 説明欄を次の行へ */
  .desc-input {
    width: 100%;
    flex-basis: 100%;      /* 強制的に一行占有 */
    margin-top: 4px;
  }

  .btn-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    margin: 0;
    z-index: 10;
    width: 24px;
    height: 24px;
  }
  
  .suggestion-list {
    width: calc(100vw - 80px); /* 画面幅に合わせて調整 */
    max-width: 300px;
  }
}
</style>