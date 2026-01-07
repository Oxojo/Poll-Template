<script setup>
import { ref, shallowRef, computed, onMounted } from 'vue'

const currentUser = ref('')
const accessToken = ref('')

const title = ref('アンケート')
const pairs = ref([
  { stampName: 'yes', stampId: '298fdc24-71d8-43fe-b598-bb59361356da', description: 'YES' },
  { stampName: 'no', stampId: 'bb419562-f702-460c-8b16-8329e504951a', description: 'NO' }
])
const allStamps = shallowRef([])
const activeIndex = ref(null)
const suggestions = ref([])

const handleAuthCallback = () => {
  const hash = window.location.hash
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1))
    const token = params.get('access_token')
    if (token) {
      accessToken.value = token
      localStorage.setItem('traq_token', token)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }
}

const closeSuggestions = () => {
  setTimeout(() => {
    activeIndex.value = null
  }, 200)
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
      // トークン切れ
      accessToken.value = null
      localStorage.removeItem('traq_token')
      return
    }

    const data = await response.json()
    if (Array.isArray(data)) {
      allStamps.value = data.map(s => ({ n: s.name, i: s.id }))
    }
  } catch (err) {
    console.error('Auth error:', err)
  }
}

onMounted(async () => {
  try {
    // ユーザー名を取得
    const meRes = await fetch('/api/me')
    if (!meRes.ok) {
      console.error("Failed to fetch /api/me:", meRes.status, meRes.statusText)
      return
    }
    const meData = await meRes.json()
    currentUser.value = meData.userId
    title.value = `${currentUser.value}さんの日程調整`

    // スタンプ一覧を取得
    const stRes = await fetch('/api/stamps')
    if (!stRes.ok) {
      console.error("Failed to fetch /api/stamps:", stRes.status, stRes.statusText)
      return
    }
    const stData = await stRes.json()
    if (Array.isArray(stData)) {
      allStamps.value = stData
    }
  } catch (e) {
    console.error("初期化失敗", e)
  }
})

const updateSearch = (query, index) => {
  activeIndex.value = index
  const q = query.trim().toLowerCase()
  
  if (!q) {
    suggestions.value = []
    return
  }

  const res = []
  const data = allStamps.value
  const len = data.length
  
  // 1万件のループを途中で抜けることで計算量を $O(N)$ から大幅に削減
  for (let i = 0; i < len; i++) {
    if (data[i].n.toLowerCase().includes(q)) {
      res.push(data[i])
      if (res.length >= 20) break // 最大20件で打ち切り
    }
  }
  suggestions.value = res
}

const selectStamp = (index, stamp) => {
  pairs.value[index].stampName = stamp.n
  pairs.value[index].stampId = stamp.i
  activeIndex.value = null
}


const isValid = computed(() => {
  // 1. タイトルが空（または空白のみ）でないか
  const isTitleValid = title.value.trim() !== ''

  // 2. 全てのペアが入力されているか
  // everyメソッドを使って、全ての要素が条件を満たすかチェックします
  const arePairsValid = pairs.value.length > 0 && pairs.value.every(item => 
    item.stampName.trim() !== '' && item.description.trim() !== ''
  )

  return isTitleValid && arePairsValid
})

// 2. 項目の追加・削除
const addPair = () => {
  pairs.value.push({ stampName: '', stampId: '', description: '' })
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
      text += `-s :${item.stampName}: -o "${item.description}"\n`
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
      <h1>日程調整用 テンプレート作成</h1>

      <div class="section">
        <label>タイトル</label>
        <input v-model="title" placeholder="Title" class="main-input">
      </div>

      <div class="section">
        <label>選択肢</label>
        <div v-for="(item, index) in pairs" :key="index" class="pair-row">
          <div class="stamp-field">
            <div class="input-wrapper">
              <img v-if="item.stampId" :src="`https://q.trap.jp/api/v3/stamps/${item.stampId}/image`" class="stamp-icon">
              <input 
                v-model="item.stampName" 
                @input="updateSearch(item.stampName, index)"
                @focus="updateSearch(item.stampName, index)"
                @blur="closeSuggestions"
                placeholder="stamp name"
                class="stamp-input"
              >
              <input v-model="item.description" placeholder="description" class="desc-input">
              <button @click="removePair(index)" class="btn-remove" title="削除">×</button>
            </div>
            <div v-if="activeIndex === index && suggestions.length > 0" class="suggestions">
              <div 
                v-for="s in suggestions" 
                :key="s.i" 
                class="s-item"
                @mousedown="selectStamp(index, s)"
              >
                <img :src="`https://q.trap.jp/api/v3/stamps/${s.i}/image`" loading="lazy">
                <span>{{ s.n }}</span>
              </div>
            </div>
          </div>
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
</template>

<style scoped>
.app-container { max-width: 600px; margin: 2rem auto; font-family: sans-serif; color: #333; }
.section { margin-bottom: 1.5rem; }
label { display: block; font-weight: bold; margin-bottom: 0.5rem; }

.main-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }

.pair-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.stamp-input { width: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.desc-input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }

.btn-add { background: #f0f0f0; border: 1px dashed #999; width: 100%; padding: 8px; cursor: pointer; border-radius: 4px; }
.btn-remove { background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; line-height: 1; }

.preview-section { margin-top: 2rem; border-top: 2px solid #eee; padding-top: 1rem; }
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
</style>