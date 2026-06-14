const _storage = {}
global.localStorage = {
  getItem: (k) => (k in _storage ? _storage[k] : null),
  setItem: (k, v) => { _storage[k] = String(v) },
  removeItem: (k) => { delete _storage[k] },
  clear: () => { Object.keys(_storage).forEach(k => delete _storage[k]) },
  key: (i) => Object.keys(_storage)[i] || null,
  get length() { return Object.keys(_storage).length }
}

const { getWorkshopService } = await import('./src/game/modules/WorkshopService.js')

localStorage.clear()

const service = getWorkshopService()
await service.ensureBackendReady()

console.log('\n=== 创意工坊闭环实测 ===')
console.log('后端类型:', service.getBackendType())

function makeLevel(name) {
  return {
    name,
    description: '测试关卡 - ' + name,
    hint: '',
    gridSize: { rows: 5, cols: 5 },
    start: { row: 0, col: 0 },
    end: { row: 4, col: 4 },
    obstacles: [],
    plants: [
      { row: 1, col: 1, type: 'moss' },
      { row: 2, col: 2, type: 'mushroom' },
      { row: 3, col: 3, type: 'flower' }
    ],
    correctPath: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 4 }
    ]
  }
}

function printLevels(list, title) {
  console.log(`\n--- ${title} ---`)
  list.forEach((l, i) => console.log(`  [${i + 1}] ${l.name}: likes=${l.likesCount} plays=${l.playsCount} hotScore=${l.hotScore}`))
}

console.log('\n--- 步骤1: 上传3个测试关卡 ---')
const lA = (await service.uploadWorkshopLevel(makeLevel('关卡Alpha'))).level
const lB = (await service.uploadWorkshopLevel(makeLevel('关卡Beta'))).level
const lG = (await service.uploadWorkshopLevel(makeLevel('关卡Gamma'))).level
console.log('Alpha:', lA.id.slice(0, 16))
console.log('Beta :', lB.id.slice(0, 16))
console.log('Gamma:', lG.id.slice(0, 16))

console.log('\n--- 步骤2: 初始列表（只看我们新上传的3个） ---')
let all = await service.getWorkshopLevels('newest')
let ours = all.filter(l => ['关卡Alpha', '关卡Beta', '关卡Gamma'].includes(l.name))
ours.forEach(l => console.log(`  ${l.name}: likes=${l.likesCount} plays=${l.playsCount} hotScore=${l.hotScore}`))

console.log('\n--- 步骤3: 点赞 - 模拟5个用户给Beta点、2个给Gamma点、0个给Alpha点 ---')
const nicknamesBeta = ['u1', 'u2', 'u3', 'u4', 'u5']
const nicknamesGamma = ['u6', 'u7']
const backend = service.backend
for (const n of nicknamesBeta) await backend.likeWorkshopLevel(lB.id, n)
for (const n of nicknamesGamma) await backend.likeWorkshopLevel(lG.id, n)

let hot = (await service.getWorkshopLevels('hot')).filter(l => ['关卡Alpha', '关卡Beta', '关卡Gamma'].includes(l.name))
printLevels(hot, '热门排序（点赞后）')

console.log('\n--- 步骤4: 试玩 - Alpha 6次、Beta 0次、Gamma 2次 ---')
for (let i = 0; i < 6; i++) await service.incrementPlayCount(lA.id)
for (let i = 0; i < 2; i++) await service.incrementPlayCount(lG.id)

hot = (await service.getWorkshopLevels('hot')).filter(l => ['关卡Alpha', '关卡Beta', '关卡Gamma'].includes(l.name))
printLevels(hot, '热门排序（试玩后）')

console.log('\n--- 验证热度公式 hotScore = likes * 3 + plays ---')
let allOk = true
hot.forEach(l => {
  const expected = l.likesCount * 3 + l.playsCount
  const ok = l.hotScore === expected
  if (!ok) allOk = false
  console.log(`  ${l.name}: expected=${expected} actual=${l.hotScore} ${ok ? '✅' : '❌'}`)
})

console.log('\n--- 验证热门排序: Beta(5赞,0玩=15) > Gamma(2赞,2玩=8) > Alpha(0赞,6玩=6) ---')
const orderOk = hot[0].name === '关卡Beta' && hot[1].name === '关卡Gamma' && hot[2].name === '关卡Alpha'
console.log('  顺序正确:', orderOk ? '✅' : '❌')
allOk = allOk && orderOk

const mostLiked = (await service.getWorkshopLevels('most_liked')).filter(l => ['关卡Alpha', '关卡Beta', '关卡Gamma'].includes(l.name))
printLevels(mostLiked, '点赞最多视图 (期望 Beta5 > Gamma2 > Alpha0)')
const likedOk = mostLiked[0].name === '关卡Beta' && mostLiked[1].name === '关卡Gamma' && mostLiked[2].name === '关卡Alpha'
console.log('  排序正确:', likedOk ? '✅' : '❌')
allOk = allOk && likedOk

const mostPlayed = (await service.getWorkshopLevels('most_played')).filter(l => ['关卡Alpha', '关卡Beta', '关卡Gamma'].includes(l.name))
printLevels(mostPlayed, '游玩最多视图 (期望 Alpha6 > Gamma2 > Beta0)')
const playedOk = mostPlayed[0].name === '关卡Alpha' && mostPlayed[1].name === '关卡Gamma' && mostPlayed[2].name === '关卡Beta'
console.log('  排序正确:', playedOk ? '✅' : '❌')
allOk = allOk && playedOk

console.log('\n--- 步骤5: 测试当前用户点赞 + 取消点赞（更新hotScore） ---')
const beforeLike = hot.find(l => l.name === '关卡Alpha')
console.log('  Alpha点赞前 likes=' + beforeLike.likesCount + ' hotScore=' + beforeLike.hotScore)
await service.likeWorkshopLevel(lA.id)
let afterLike = (await service.getWorkshopLevels('hot')).find(l => l.name === '关卡Alpha')
console.log('  Alpha点赞后 likes=' + afterLike.likesCount + ' hotScore=' + afterLike.hotScore + ' (期望 likes=1 hot=1*3+6=9)')
const likeOk = afterLike.likesCount === 1 && afterLike.hotScore === 9
console.log('  点赞后数据正确:', likeOk ? '✅' : '❌')
allOk = allOk && likeOk

await service.unlikeWorkshopLevel(lA.id)
let afterUnlike = (await service.getWorkshopLevels('hot')).find(l => l.name === '关卡Alpha')
console.log('  Alpha取消点赞后 likes=' + afterUnlike.likesCount + ' hotScore=' + afterUnlike.hotScore + ' (期望 likes=0 hot=0*3+6=6)')
const unlikeOk = afterUnlike.likesCount === 0 && afterUnlike.hotScore === 6
console.log('  取消点赞后数据正确:', unlikeOk ? '✅' : '❌')
allOk = allOk && unlikeOk

const myLiked = await service.getUserLikedLevels()
console.log('\n--- 步骤6: 当前用户点赞列表 ---')
console.log('  点赞数量: ' + myLiked.length + ' (取消后应为0) ' + (myLiked.length === 0 ? '✅' : '❌'))
allOk = allOk && myLiked.length === 0

console.log('\n==================')
console.log('所有测试结果:', allOk ? '✅ 全部通过' : '❌ 存在失败')
console.log('==================\n')

process.exit(allOk ? 0 : 1)
