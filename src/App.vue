<script setup>
import { ref, computed } from 'vue'

const title = ref('アンケート')
// 初期値として2つほど項目を入れておく
const pairs = ref([
  { stamp: 'yes', description: 'YES' },
  { stamp: 'no', description: 'NO' }
])

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
    <h1>日程調整用 テンプレート作成</h1>

    <div class="section">
      <label>タイトル</label>
      <input v-model="title" placeholder="Title" class="main-input">
    </div>

    <div class="section">
      <label>選択肢</label>
      <div v-for="(item, index) in pairs" :key="index" class="pair-row">
        <input v-model="item.stamp" placeholder="stamp name" class="stamp-input">
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
</style>